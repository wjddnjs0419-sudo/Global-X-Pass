import { useEffect, useMemo, useRef, useState } from "react";
import architectureMap from "@/generated/architectureMap.json";
import { Bell, LocateFixed, PlayCircle, Search } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { logActionFailure, logSupabaseFailure } from "../../../lib/uxTelemetry";
import { ArchitectureInboxPanel } from "./architecture/ArchitectureInboxPanel";
import { ArchitectureMapSidebar, NodeSidebar } from "./architecture/ArchitectureSidebars";
import { OperationsSidebar } from "./architecture/opsPipeline";
import { computeArchitectureMapDiff, type ArchitectureMapDiff } from "./architecture/mapDiff";
import { ACTIVE_ISSUE_STATUSES, BLOG_AI_DEFAULT_PROFILE_PATH, BLOG_AI_DEFAULT_SAMPLE_COUNT, COMPANY_NEWS_CRAWL_DEFAULT_OPTIONS, FILTERS, FLOATING_BELL_DRAG_THRESHOLD, FLOATING_BELL_SIZE, FLOATING_PANEL_EDGE_MARGIN, FLOATING_PANEL_GAP, FLOATING_PANEL_MAX_HEIGHT, FLOATING_PANEL_MIN_HEIGHT, FLOATING_PANEL_WIDTH, NAVER_BLOG_SYNC_WORKFLOW_URL, QA_SUITES, SEVERITY_COLOR, SEVERITY_RANK, STATUS_META, VISIBLE_ISSUE_STATUSES, WINDOW_OPTIONS } from "./architecture/constants";
import { extractCodeLocation, formatTime, formatTriggerSource, getBlogIncidentSeverity, getBlogRunSummary, getClusterPalette, getClusterStroke, getCompanyNewsOperationalRun, getFallbackNodePosition, getNodeStatus, getQaIncidentSeverity, getQaOperationalRun, getSearchTokens, highestStatus, isBlogRunTerminal, MAP_LAYOUT, MAP_VIEWBOX_PADDING, STATIC_MAP_SCALE, visibleForFilter } from "./architecture/mapUtils";
import { clamp, clampFloatingBellPosition, getDefaultFloatingBellPosition, readStoredBellPosition, readStoredInboxState, readStoredMapSnapshot, writeStoredBellPosition, writeStoredInboxState, writeStoredMapSnapshot } from "./architecture/storage";
import type { ArchitectureInboxItem, ArchitectureMap, BlogAiAnalyzeResult, BlogAiDraft, BlogAiGenerateResult, BlogAiGenerateSuccess, BlogAiInputMode, BlogAiReviseResult, BlogImportRun, BlogSyncResult, ClusterBounds, CompanyNewsCrawlOptions, CompanyNewsRun, CompanyNewsRunsResult, CompanyNewsRunTracker, CompanyNewsTriggerResult, ErrorIssue, ErrorLog, FilterId, FloatingAnchorPosition, MapNode, NodeStatus, PositionedNode, QaCredentialsInput, QaRun, QaRunsResult, QaRunTracker, QaSuiteId, QaTriggerResult, QaVisibleResult, Severity, SidebarTab } from "./architecture/types";

declare global {
  interface Window {
    electronAPI?: {
      openTerminal: (command?: string) => Promise<void>;
      readMapData: () => Promise<{ ok: boolean; data?: ArchitectureMap; error?: string }>;
      refreshMap: () => Promise<{ ok: boolean; output?: string; code?: number }>;
      analyzeBlogStyle: (payload: { sampleCount?: number | string; profilePath?: string }) => Promise<BlogAiAnalyzeResult>;
      generateBlogDraft: (payload: { inputMode: BlogAiInputMode; articleUrl?: string; articleText?: string; profilePath?: string }) => Promise<BlogAiGenerateResult>;
      reviseBlogDraft: (payload: { articleText: string; draft: BlogAiDraft; instruction: string; profilePath?: string }) => Promise<BlogAiReviseResult>;
      readQaRuns: () => Promise<QaRunsResult>;
      readCompanyNewsRuns: () => Promise<CompanyNewsRunsResult>;
      triggerQaRun: (suite: QaSuiteId) => Promise<QaTriggerResult>;
      runVisibleQa: (suite: QaSuiteId) => Promise<QaVisibleResult>;
      getQaCredentialsStatus: () => Promise<{ ok: boolean; connected: boolean }>;
      saveQaCredentials: (credentials: QaCredentialsInput) => Promise<{ ok: boolean; connected: boolean; error?: string }>;
      clearQaCredentials: () => Promise<{ ok: boolean; connected: boolean }>;
      getGithubTokenStatus: () => Promise<{ ok: boolean; connected: boolean }>;
      saveGithubToken: (token: string) => Promise<{ ok: boolean; connected: boolean; error?: string; statusCode?: number | null }>;
      clearGithubToken: () => Promise<{ ok: boolean; connected: boolean }>;
    };
  }
}

const initialMapData = architectureMap as ArchitectureMap;

function isUxTelemetryMessage(message: string | null | undefined) {
  if (!message) return false;
  return message.startsWith("UX layout issue:") || message.startsWith("UX action issue:");
}

function filterOperationalIssues(issues: ErrorIssue[]) {
  return issues.filter((issue) => !isUxTelemetryMessage(issue.message));
}

function filterOperationalLogs(logs: ErrorLog[]) {
  return logs.filter((log) => !isUxTelemetryMessage(log.message));
}

export function LiveArchitectureMap() {
  const [mapData, setMapData] = useState<ArchitectureMap>(initialMapData);
  const [mapDiff, setMapDiff] = useState<ArchitectureMapDiff | null>(null);
  const [mapRefreshStatus, setMapRefreshStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [issues, setIssues] = useState<ErrorIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("overview");
  const [windowMinutes, setWindowMinutes] = useState(WINDOW_OPTIONS[1].minutes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFingerprint, setSelectedFingerprint] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("map");
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const didPan = useRef(false);
  const qaPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blogPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const companyNewsPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const ASIDE_MIN = 220;
  const ASIDE_MAX = 600;
  const [asideWidth, setAsideWidth] = useState<number>(() => {
    const saved = window.localStorage.getItem("arch-aside-width");
    return saved ? Math.max(220, Math.min(600, Number(saved))) : 360;
  });
  const resizeState = useRef<{ startX: number; startWidth: number; lastWidth: number } | null>(null);
  const [isHoveringResizer, setIsHoveringResizer] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxSelectedIds, setInboxSelectedIds] = useState<Set<string>>(() => new Set());
  const [inboxReadIds, setInboxReadIds] = useState<Set<string>>(() => readStoredInboxState().readIds);
  const [inboxHiddenIds, setInboxHiddenIds] = useState<Set<string>>(() => readStoredInboxState().hiddenIds);
  const [viewportSize, setViewportSize] = useState<FloatingAnchorPosition>(() => (
    typeof window === "undefined"
      ? { x: 1440, y: 900 }
      : { x: window.innerWidth, y: window.innerHeight }
  ));
  const [floatingBellPosition, setFloatingBellPosition] = useState<FloatingAnchorPosition | null>(null);
  const [qaRuns, setQaRuns] = useState<QaRun[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [selectedQaSuite, setSelectedQaSuite] = useState<QaSuiteId>("smoke");
  const [qaTriggerLoading, setQaTriggerLoading] = useState(false);
  const [qaTriggerMessage, setQaTriggerMessage] = useState<string | null>(null);
  const [qaTriggerError, setQaTriggerError] = useState<string | null>(null);
  const [qaRunTracker, setQaRunTracker] = useState<QaRunTracker | null>(null);
  const [visibleQaLoading, setVisibleQaLoading] = useState(false);
  const [visibleQaMessage, setVisibleQaMessage] = useState<string | null>(null);
  const [visibleQaError, setVisibleQaError] = useState<string | null>(null);
  const [qaCredentialsConnected, setQaCredentialsConnected] = useState(false);
  const [qaCredentialsInput, setQaCredentialsInput] = useState<QaCredentialsInput>({ email: "", password: "", mfaSecret: "" });
  const [qaCredentialsSaving, setQaCredentialsSaving] = useState(false);
  const [qaCredentialsError, setQaCredentialsError] = useState<string | null>(null);
  const [githubTokenConnected, setGithubTokenConnected] = useState(false);
  const [blogRuns, setBlogRuns] = useState<BlogImportRun[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogSyncLoading, setBlogSyncLoading] = useState(false);
  const [blogSyncResult, setBlogSyncResult] = useState<BlogSyncResult | null>(null);
  const [blogSyncError, setBlogSyncError] = useState<string | null>(null);
  const [companyNewsCrawlOptions, setCompanyNewsCrawlOptions] = useState<CompanyNewsCrawlOptions>(COMPANY_NEWS_CRAWL_DEFAULT_OPTIONS);
  const [companyNewsRuns, setCompanyNewsRuns] = useState<CompanyNewsRun[]>([]);
  const [companyNewsLoading, setCompanyNewsLoading] = useState(false);
  const [companyNewsError, setCompanyNewsError] = useState<string | null>(null);
  const [companyNewsRunTracker, setCompanyNewsRunTracker] = useState<CompanyNewsRunTracker | null>(null);
  const [companyNewsTriggerLoading, setCompanyNewsTriggerLoading] = useState(false);
  const [companyNewsTriggerMessage, setCompanyNewsTriggerMessage] = useState<string | null>(null);
  const [companyNewsTriggerError, setCompanyNewsTriggerError] = useState<string | null>(null);
  const [blogAiInputMode, setBlogAiInputMode] = useState<BlogAiInputMode>("url");
  const [blogAiArticleUrl, setBlogAiArticleUrl] = useState("");
  const [blogAiArticleText, setBlogAiArticleText] = useState("");
  const [blogAiProfilePath, setBlogAiProfilePath] = useState(BLOG_AI_DEFAULT_PROFILE_PATH);
  const [blogAiSampleCount, setBlogAiSampleCount] = useState(BLOG_AI_DEFAULT_SAMPLE_COUNT);
  const [blogAiAnalyzeLoading, setBlogAiAnalyzeLoading] = useState(false);
  const [blogAiAnalyzeMessage, setBlogAiAnalyzeMessage] = useState<string | null>(null);
  const [blogAiAnalyzeError, setBlogAiAnalyzeError] = useState<string | null>(null);
  const [blogAiGenerateLoading, setBlogAiGenerateLoading] = useState(false);
  const [blogAiGenerateError, setBlogAiGenerateError] = useState<string | null>(null);
  const [blogAiDraftResult, setBlogAiDraftResult] = useState<BlogAiGenerateSuccess | null>(null);
  const [blogAiRevisionInstruction, setBlogAiRevisionInstruction] = useState("");
  const [blogAiRevisionLoading, setBlogAiRevisionLoading] = useState(false);
  const [blogAiRevisionError, setBlogAiRevisionError] = useState<string | null>(null);
  const floatingBellDragRef = useRef<{
    startX: number;
    startY: number;
    origin: FloatingAnchorPosition;
    dragging: boolean;
  } | null>(null);

  const openTerminal = (command?: string) => {
    window.electronAPI?.openTerminal(command);
  };

  const loadQaRuns = async () => {
    if (!window.electronAPI?.readQaRuns) {
      setQaError("아키텍처 앱에서만 QA 인박스를 불러올 수 있습니다.");
      return;
    }
    setQaLoading(true);
    setQaError(null);
    const result = await window.electronAPI.readQaRuns();
    if (result.ok === true) {
      setQaRuns(result.runs);
    } else {
      const tokenHint = result.statusCode === 404
        ? " qa-dispatch.yml이 아직 GitHub main 브랜치에 없거나, GitHub token에 repo/actions 권한이 부족할 수 있습니다."
        : result.needsToken
        ? " 로컬 환경 변수 GXP_GITHUB_TOKEN 또는 GITHUB_TOKEN이 필요합니다."
        : "";
      setQaError(`${result.error}.${tokenHint}`);
    }
    setQaLoading(false);
  };

  const loadCompanyNewsRuns = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!window.electronAPI?.readCompanyNewsRuns) {
      setCompanyNewsError("아키텍처 앱에서만 참여기업 뉴스 Actions 상태를 불러올 수 있습니다.");
      return null;
    }
    if (!silent) setCompanyNewsLoading(true);
    setCompanyNewsError(null);
    const result = await window.electronAPI.readCompanyNewsRuns();
    if (result.ok === true) {
      setCompanyNewsRuns(result.runs);
      if (!silent) setCompanyNewsLoading(false);
      return result.runs;
    }

    const tokenHint = result.statusCode === 404
      ? " company-news-crawl.yml이 아직 GitHub main 브랜치에 없거나, GitHub token에 repo/actions 권한이 부족할 수 있습니다."
      : result.needsToken
      ? " GitHub token 연결 또는 fallback env가 필요합니다."
      : "";
    setCompanyNewsError(`${result.error}.${tokenHint}`);
    if (!silent) setCompanyNewsLoading(false);
    return null;
  };

  const loadBlogRuns = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setBlogLoading(true);
    setBlogError(null);

    const { data, error } = await supabase
      .from("blog_import_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logSupabaseFailure("architecture-map", "load_blog_sync_alerts", error);
      setBlogError(error.message);
      if (!silent) setBlogLoading(false);
      return null;
    }

    const nextRuns = (data ?? []) as BlogImportRun[];
    setBlogRuns(nextRuns);
    if (!silent) setBlogLoading(false);
    return nextRuns;
  };

  const persistInboxState = (nextReadIds: Set<string>, nextHiddenIds: Set<string>) => {
    setInboxReadIds(nextReadIds);
    setInboxHiddenIds(nextHiddenIds);
    writeStoredInboxState(nextReadIds, nextHiddenIds);
  };

  const saveQaCredentials = async () => {
    if (!window.electronAPI?.saveQaCredentials) return;
    const email = qaCredentialsInput.email.trim();
    const password = qaCredentialsInput.password;
    const mfaSecret = qaCredentialsInput.mfaSecret.trim();
    if (!email || !password || !mfaSecret) {
      setQaCredentialsError("이메일, 비밀번호, MFA secret을 모두 입력해 주세요.");
      return;
    }

    setQaCredentialsSaving(true);
    setQaCredentialsError(null);
    const result = await window.electronAPI.saveQaCredentials({ email, password, mfaSecret });
    setQaCredentialsSaving(false);

    if (result.ok !== true) {
      setQaCredentialsConnected(false);
      setQaCredentialsError(result.error ?? "QA 계정 저장에 실패했습니다.");
      return;
    }

    setQaCredentialsConnected(true);
    setQaCredentialsInput({ email: "", password: "", mfaSecret: "" });
  };

  const clearQaCredentials = async () => {
    if (!window.electronAPI?.clearQaCredentials) return;
    await window.electronAPI.clearQaCredentials();
    setQaCredentialsConnected(false);
    setQaCredentialsInput({ email: "", password: "", mfaSecret: "" });
    setQaCredentialsError(null);
  };

  const QA_TERMINAL_STATUSES = new Set(["completed", "failure", "cancelled", "skipped", "timed_out", "action_required"]);

  const stopQaPolling = () => {
    if (qaPollingRef.current !== null) {
      clearInterval(qaPollingRef.current);
      qaPollingRef.current = null;
    }
  };

  const stopBlogPolling = () => {
    if (blogPollingRef.current !== null) {
      clearInterval(blogPollingRef.current);
      blogPollingRef.current = null;
    }
  };

  const stopCompanyNewsPolling = () => {
    if (companyNewsPollingRef.current !== null) {
      clearInterval(companyNewsPollingRef.current);
      companyNewsPollingRef.current = null;
    }
  };

  const startQaPolling = (tracker: QaRunTracker) => {
    stopQaPolling();
    let tick = 0;
    qaPollingRef.current = setInterval(() => {
      tick += 1;
      void (async () => {
        if (!window.electronAPI?.readQaRuns) { stopQaPolling(); return; }
        const result = await window.electronAPI.readQaRuns();
        if (result.ok === true) {
          setQaRuns(result.runs);
          const trackedRun = getQaOperationalRun(result.runs, tracker.suite, tracker);
          if ((trackedRun && QA_TERMINAL_STATUSES.has(trackedRun.status)) || tick >= 75) {
            stopQaPolling();
          }
        } else {
          stopQaPolling();
        }
      })();
    }, 8000);
  };

  const startBlogPolling = (runId: string) => {
    stopBlogPolling();
    let tick = 0;
    blogPollingRef.current = setInterval(() => {
      tick += 1;
      void (async () => {
        const runs = await loadBlogRuns({ silent: true });
        if (!runs) {
          stopBlogPolling();
          return;
        }
        const run = runs.find((item) => item.id === runId) ?? null;
        if ((run && isBlogRunTerminal(run)) || tick >= 75) {
          stopBlogPolling();
        }
      })();
    }, 8000);
  };

  const startCompanyNewsPolling = (tracker: CompanyNewsRunTracker) => {
    stopCompanyNewsPolling();
    let tick = 0;
    companyNewsPollingRef.current = setInterval(() => {
      tick += 1;
      void (async () => {
        const runs = await loadCompanyNewsRuns({ silent: true });
        if (!runs) {
          stopCompanyNewsPolling();
          return;
        }
        const trackedRun = getCompanyNewsOperationalRun(runs, tracker);
        if ((trackedRun && (trackedRun.status === "completed" || Boolean(trackedRun.conclusion))) || tick >= 100) {
          stopCompanyNewsPolling();
        }
      })();
    }, 6000);
  };

  const triggerQaRun = async (suite: QaSuiteId) => {
    if (!window.electronAPI?.triggerQaRun) {
      setQaTriggerError("아키텍처 앱에서만 QA 실행을 요청할 수 있습니다.");
      return;
    }
    setQaTriggerLoading(true);
    setQaTriggerError(null);
    setQaTriggerMessage(null);

    const result = await window.electronAPI.triggerQaRun(suite);
    setQaTriggerLoading(false);

    if (result.ok !== true) {
      const tokenHint = result.statusCode === 404
        ? " qa-dispatch.yml이 아직 GitHub main 브랜치에 없거나, GitHub token에 repo/actions 권한이 부족할 수 있습니다."
        : result.needsToken
        ? " GitHub token 연결 또는 fallback env가 필요합니다."
        : "";
      setQaTriggerError(`${result.error}.${tokenHint}`);
      return;
    }

    const suiteLabel = QA_SUITES.find((item) => item.id === result.suite)?.label ?? result.suite;
    const nextTracker = { suite: result.suite, requestedAt: result.triggeredAt };
    setQaRunTracker(nextTracker);
    setQaTriggerMessage(`${suiteLabel} QA를 main 브랜치 기준으로 실행 요청했습니다. ${formatTime(result.triggeredAt)}에 dispatch 완료.`);
    await loadQaRuns();
    startQaPolling(nextTracker);
  };

  const runVisibleQa = async (suite: QaSuiteId) => {
    if (!window.electronAPI?.runVisibleQa) {
      setVisibleQaError("아키텍처 앱에서만 로컬 Visible QA를 실행할 수 있습니다.");
      return;
    }

    setVisibleQaLoading(true);
    setVisibleQaError(null);
    setVisibleQaMessage(null);

    const result = await window.electronAPI.runVisibleQa(suite);
    setVisibleQaLoading(false);

    if (result.ok !== true) {
      setVisibleQaError(result.error);
      return;
    }

    const suiteLabel = QA_SUITES.find((item) => item.id === result.suite)?.label ?? result.suite;
    setVisibleQaMessage(`${suiteLabel} 로컬 화면 QA 터미널을 열었습니다. 이 실행은 GitHub Actions runner가 아니라 현재 Mac에서 도는 디버그용 실행입니다.`);
  };

  const triggerBlogSync = async () => {
    setBlogSyncLoading(true);
    setBlogSyncError(null);
    setBlogSyncResult(null);

    const { data, error } = await supabase.functions.invoke("sync-naver-blog", {
      body: { triggerSource: "manual" },
    });

    if (error) {
      let message = error.message ?? "블로그 동기화 요청에 실패했습니다.";
      try {
        const body = await (error as { context?: Response }).context?.json?.() as { error?: string } | undefined;
        message = body?.error ?? message;
      } catch {
        // Edge Function error bodies are not guaranteed to be JSON.
      }
      logSupabaseFailure("architecture-map", "trigger_manual_blog_sync", new Error(message));
      setBlogSyncError(message);
      setBlogSyncLoading(false);
      return;
    }

    const result = (data ?? {}) as BlogSyncResult;
    setBlogSyncResult(result);
    await loadBlogRuns();
    if (result.run?.id && result.dispatched) {
      startBlogPolling(result.run.id);
    }
    setBlogSyncLoading(false);
  };

  const triggerCompanyNewsCrawl = async () => {
    const requestedAt = new Date().toISOString();
    setCompanyNewsTriggerLoading(true);
    setCompanyNewsTriggerMessage(null);
    setCompanyNewsTriggerError(null);
    setCompanyNewsError(null);

    const { data, error } = await supabase.functions.invoke<CompanyNewsTriggerResult>("trigger-company-news-crawl", {
      body: companyNewsCrawlOptions,
    });

    setCompanyNewsTriggerLoading(false);

    if (error || !data?.dispatched) {
      const detail = data?.dispatchError || data?.error || error?.message;
      const message = detail
        ? `기업 뉴스 수집 요청에 실패했습니다. ${detail}`
        : "기업 뉴스 수집 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setCompanyNewsTriggerError(message);
      logSupabaseFailure("architecture-map", "trigger_manual_company_news_crawl", error ?? new Error(detail ?? message));
      return;
    }

    const nextTracker = { requestedAt };
    setCompanyNewsRunTracker(nextTracker);
    setCompanyNewsTriggerMessage(
      `기업 뉴스 수집 워크플로우를 실행했습니다. ${companyNewsCrawlOptions.batchSize}개사 × ${companyNewsCrawlOptions.resultsPerCompany}개 기준으로 GitHub Actions를 dispatch했습니다.`,
    );
    await loadCompanyNewsRuns();
    startCompanyNewsPolling(nextTracker);
  };

  const analyzeBlogStyle = async () => {
    if (!window.electronAPI?.analyzeBlogStyle) {
      setBlogAiAnalyzeError("아키텍처 앱에서만 스타일 분석을 실행할 수 있습니다.");
      return;
    }

    setBlogAiAnalyzeLoading(true);
    setBlogAiAnalyzeError(null);
    setBlogAiAnalyzeMessage(null);

    const result = await window.electronAPI.analyzeBlogStyle({
      sampleCount: blogAiSampleCount,
      profilePath: blogAiProfilePath,
    });
    setBlogAiAnalyzeLoading(false);

    if (result.ok !== true) {
      logActionFailure("architecture-map", "analyze_blog_style_profile", result.error, {
        context: { profilePath: blogAiProfilePath, sampleCount: blogAiSampleCount },
      });
      setBlogAiAnalyzeError(result.error);
      return;
    }

    setBlogAiAnalyzeMessage(
      `샘플 ${result.sampleCount}개로 스타일 프로파일을 다시 생성했습니다. JSON ${result.profilePath} · Guide ${result.guidePath}`,
    );
  };

  const generateBlogDraft = async () => {
    if (!window.electronAPI?.generateBlogDraft) {
      setBlogAiGenerateError("아키텍처 앱에서만 AI 블로그 초안을 생성할 수 있습니다.");
      return;
    }

    setBlogAiGenerateLoading(true);
    setBlogAiGenerateError(null);
    setBlogAiRevisionError(null);

    const result = await window.electronAPI.generateBlogDraft({
      inputMode: blogAiInputMode,
      articleUrl: blogAiArticleUrl,
      articleText: blogAiArticleText,
      profilePath: blogAiProfilePath,
    });
    setBlogAiGenerateLoading(false);

    if (result.ok !== true) {
      logActionFailure("architecture-map", "generate_blog_draft", result.error, {
        context: { inputMode: blogAiInputMode, profilePath: blogAiProfilePath },
      });
      setBlogAiGenerateError(result.error);
      return;
    }

    setBlogAiDraftResult(result);
    setBlogAiRevisionInstruction("");
  };

  const reviseBlogDraft = async () => {
    if (!window.electronAPI?.reviseBlogDraft) {
      setBlogAiRevisionError("아키텍처 앱에서만 초안 수정 요청을 실행할 수 있습니다.");
      return;
    }
    if (!blogAiDraftResult) {
      setBlogAiRevisionError("먼저 초안을 생성해 주세요.");
      return;
    }
    const instruction = blogAiRevisionInstruction.trim();
    if (!instruction) {
      setBlogAiRevisionError("수정 요청을 입력해 주세요.");
      return;
    }

    setBlogAiRevisionLoading(true);
    setBlogAiRevisionError(null);

    const result = await window.electronAPI.reviseBlogDraft({
      articleText: blogAiDraftResult.articleText,
      draft: blogAiDraftResult.draft,
      instruction,
      profilePath: blogAiProfilePath,
    });
    setBlogAiRevisionLoading(false);

    if (result.ok !== true) {
      logActionFailure("architecture-map", "revise_blog_draft", result.error, {
        context: { profilePath: blogAiProfilePath },
      });
      setBlogAiRevisionError(result.error);
      return;
    }

    setBlogAiDraftResult((current) =>
      current
        ? {
            ...current,
            articleText: result.articleText,
            articleTextLength: result.articleTextLength,
            profilePath: result.profilePath,
            draft: result.draft,
          }
        : current,
    );
    setBlogAiRevisionInstruction("");
  };

  useEffect(() => {
    if (!window.electronAPI?.readMapData) return;
    void window.electronAPI.readMapData().then((result) => {
      if (result.ok && result.data) {
        const previousSnapshot = readStoredMapSnapshot();
        setMapData(result.data);
        setMapDiff(computeArchitectureMapDiff(previousSnapshot, result.data));
        writeStoredMapSnapshot(result.data);
      }
    });
  }, []);

  useEffect(() => {
    void loadQaRuns();
    void loadCompanyNewsRuns();
    return () => {
      stopQaPolling();
      stopBlogPolling();
      stopCompanyNewsPolling();
    };
  }, []);

  useEffect(() => {
    void loadBlogRuns();
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.getGithubTokenStatus) return;
    void window.electronAPI.getGithubTokenStatus().then((result) => {
      if (result.ok) setGithubTokenConnected(result.connected);
    });
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.getQaCredentialsStatus) return;
    void window.electronAPI.getQaCredentialsStatus().then((result) => {
      if (result.ok) setQaCredentialsConnected(result.connected);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewport = () => {
      setViewportSize({ x: window.innerWidth, y: window.innerHeight });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const stored = readStoredBellPosition();
    const nextPosition = clampFloatingBellPosition(
      stored ?? getDefaultFloatingBellPosition(viewportSize),
      viewportSize,
    );
    setFloatingBellPosition(nextPosition);
  }, [viewportSize]);

  useEffect(() => {
    if (!floatingBellPosition) return;
    writeStoredBellPosition(floatingBellPosition);
  }, [floatingBellPosition]);

  useEffect(() => {
    if (!inboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInboxOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inboxOpen]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const state = floatingBellDragRef.current;
      if (!state) return;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (!state.dragging && Math.hypot(dx, dy) >= FLOATING_BELL_DRAG_THRESHOLD) {
        state.dragging = true;
      }
      if (!state.dragging) return;
      setFloatingBellPosition(clampFloatingBellPosition({
        x: state.origin.x + dx,
        y: state.origin.y + dy,
      }, viewportSize));
    };

    const onPointerUp = () => {
      const state = floatingBellDragRef.current;
      if (!state) return;
      floatingBellDragRef.current = null;
      if (!state.dragging) {
        setInboxOpen((current) => !current);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [viewportSize]);

  const handleMapRefresh = async () => {
    if (!window.electronAPI?.refreshMap) return;
    const previousMap = mapData;
    setMapRefreshStatus("loading");
    const result = await window.electronAPI.refreshMap();
    if (!result.ok) {
      setMapRefreshStatus("error");
      setTimeout(() => setMapRefreshStatus("idle"), 3000);
      return;
    }
    const readResult = await window.electronAPI.readMapData();
    if (readResult.ok && readResult.data) {
      setMapData(readResult.data);
      setMapDiff(computeArchitectureMapDiff(previousMap, readResult.data));
      writeStoredMapSnapshot(readResult.data);
    }
    setMapRefreshStatus("ok");
    setTimeout(() => setMapRefreshStatus("idle"), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    async function fetchLogs() {
      setLoading(true);
      setLoadError(null);
      const [issuesInvoke, logsInvoke] = await Promise.all([
        supabase.functions.invoke("decrypt-error-logs", {
          body: { type: "issues", statuses: VISIBLE_ISSUE_STATUSES, limit: 300 },
        }),
        supabase.functions.invoke("decrypt-error-logs", {
          body: { type: "logs", since, limit: 500 },
        }),
      ]);

      if (cancelled) return;

      const firstError = issuesInvoke.error ?? logsInvoke.error;
      if (firstError) {
        let errMsg = "에러 로그 조회 실패";
        try {
          const err = firstError as { context?: Response; message?: string };
          const body = await err.context?.json?.() as { error?: string } | null;
          errMsg = body?.error ?? err.message ?? errMsg;
        } catch {
          errMsg = (firstError as { message?: string }).message ?? errMsg;
        }
        if (cancelled) return;
        logSupabaseFailure("architecture-map", "fetch_error_issues_for_live_architecture_map", new Error(errMsg));
        setLoadError(errMsg);
        setIssues([]);
        setLogs([]);
      } else {
        setIssues(filterOperationalIssues((issuesInvoke.data?.data ?? []) as ErrorIssue[]));
        setLogs(filterOperationalLogs((logsInvoke.data?.data ?? []) as ErrorLog[]));
      }
      setLoading(false);
    }

    void fetchLogs();

    const MAX_RETRIES = 5;
    const BASE_RETRY_MS = 2_000;

    let activeIssuesChannel: ReturnType<typeof supabase.channel> | null = null;
    let activeLogsChannel: ReturnType<typeof supabase.channel> | null = null;
    const retryTimers: ReturnType<typeof setTimeout>[] = [];

    function subscribeIssuesChannel(attempt: number) {
      if (cancelled) return;
      const ch = supabase
        .channel(`realtime-error-issues-${windowMinutes}-${attempt}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "error_issues" },
          (payload) => {
            const next = payload.new as ErrorIssue;
            setIssues((prev) => {
              const rest = prev.filter((issue) => issue.fingerprint !== next.fingerprint);
              if (!VISIBLE_ISSUE_STATUSES.includes(next.status) || isUxTelemetryMessage(next.message)) return rest;
              return [next, ...rest].sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()).slice(0, 300);
            });
          },
        )
        .subscribe((status) => {
          if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return;
          if (cancelled) return;
          void supabase.removeChannel(ch);
          activeIssuesChannel = null;
          if (attempt < MAX_RETRIES) {
            const t = setTimeout(() => { subscribeIssuesChannel(attempt + 1); }, BASE_RETRY_MS * Math.pow(2, attempt));
            retryTimers.push(t);
          } else {
            logActionFailure("architecture-map", "subscribe_error_issues_realtime", `Realtime subscription ${status}`, {
              severity: "medium",
              context: { status, windowMinutes, attempt },
            });
          }
        });
      activeIssuesChannel = ch;
    }

    function subscribeLogsChannel(attempt: number) {
      if (cancelled) return;
      const ch = supabase
        .channel(`realtime-error-logs-history-${windowMinutes}-${attempt}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "error_logs" },
          (payload) => {
            const next = payload.new as ErrorLog;
            if (new Date(next.created_at).getTime() < new Date(since).getTime()) return;
            if (isUxTelemetryMessage(next.message)) return;
            setLogs((prev) => [next, ...prev].slice(0, 500));
          },
        )
        .subscribe((status) => {
          if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return;
          if (cancelled) return;
          void supabase.removeChannel(ch);
          activeLogsChannel = null;
          if (attempt < MAX_RETRIES) {
            const t = setTimeout(() => { subscribeLogsChannel(attempt + 1); }, BASE_RETRY_MS * Math.pow(2, attempt));
            retryTimers.push(t);
          } else {
            logActionFailure("architecture-map", "subscribe_error_logs_realtime", `Realtime subscription ${status}`, {
              severity: "medium",
              context: { status, windowMinutes, attempt },
            });
          }
        });
      activeLogsChannel = ch;
    }

    subscribeIssuesChannel(0);
    subscribeLogsChannel(0);

    return () => {
      cancelled = true;
      retryTimers.forEach(clearTimeout);
      if (activeIssuesChannel) void supabase.removeChannel(activeIssuesChannel);
      if (activeLogsChannel) void supabase.removeChannel(activeLogsChannel);
    };
  }, [windowMinutes]);

  const issuesBySource = useMemo(() => {
    const grouped = new Map<string, ErrorIssue[]>();
    for (const issue of issues) {
      grouped.set(issue.source, [...(grouped.get(issue.source) ?? []), issue]);
    }
    return grouped;
  }, [issues]);

  const activeIssues = useMemo(() => issues.filter((issue) => ACTIVE_ISSUE_STATUSES.has(issue.status)), [issues]);

  const activeIssuesBySource = useMemo(() => {
    const grouped = new Map<string, ErrorIssue[]>();
    for (const issue of activeIssues) {
      grouped.set(issue.source, [...(grouped.get(issue.source) ?? []), issue]);
    }
    return grouped;
  }, [activeIssues]);

  const logsBySource = useMemo(() => {
    const grouped = new Map<string, ErrorLog[]>();
    for (const log of logs) {
      grouped.set(log.source, [...(grouped.get(log.source) ?? []), log]);
    }
    return grouped;
  }, [logs]);

  const logsByFingerprint = useMemo(() => {
    const grouped = new Map<string, ErrorLog[]>();
    for (const log of logs) {
      grouped.set(log.fingerprint, [...(grouped.get(log.fingerprint) ?? []), log]);
    }
    return grouped;
  }, [logs]);

  const nodesById = useMemo(() => new Map(mapData.nodes.map((node) => [node.id, node])), [mapData]);
  const clustersById = useMemo(() => new Map(mapData.clusters.map((cluster) => [cluster.id, cluster])), [mapData]);
  const selectedNode = selectedId ? nodesById.get(selectedId) ?? null : null;
  const selectedIssue = selectedFingerprint ? issues.find((issue) => issue.fingerprint === selectedFingerprint) ?? null : null;
  const activeId = hoveredId ?? selectedId;

  const positioned = useMemo(() => {
    const clusterOrder = mapData.clusters.map((cluster) => cluster.id);
    const visibleNodes = mapData.nodes.filter((node) => visibleForFilter(node, filter, activeIssuesBySource.get(node.id)?.length ?? 0));
    const byCluster = new Map<string, MapNode[]>();
    for (const node of visibleNodes) {
      byCluster.set(node.cluster, [...(byCluster.get(node.cluster) ?? []), node]);
    }

    const positions = new Map<string, PositionedNode>();
    const clusterBounds: ClusterBounds[] = [];
    let maxRows = 1;

    clusterOrder.forEach((clusterId, columnIndex) => {
      const clusterNodes = byCluster.get(clusterId) ?? [];
      maxRows = Math.max(maxRows, clusterNodes.length);
      const cluster = mapData.clusters.find((item) => item.id === clusterId);
      const clusterColor = cluster?.color ?? "blue";
      const clusterStatuses: NodeStatus[] = [];
      clusterNodes.forEach((node, rowIndex) => {
        const status = getNodeStatus(node.id, issuesBySource, logsBySource);
        clusterStatuses.push(status);
        positions.set(node.id, {
          ...node,
          x: columnIndex * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap),
          y: MAP_LAYOUT.clusterHeaderHeight + rowIndex * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap),
          w: MAP_LAYOUT.columnWidth,
          h: MAP_LAYOUT.nodeHeight,
          color: clusterColor,
          status,
        });
      });
      const nodeRows = Math.max(clusterNodes.length, 1);
      clusterBounds.push({
        id: clusterId,
        label: cluster?.displayLabel ?? cluster?.label ?? clusterId,
        description: cluster?.description ?? "",
        x: columnIndex * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap) - 18,
        y: -22,
        w: MAP_LAYOUT.columnWidth + 36,
        h: MAP_LAYOUT.clusterHeaderHeight + nodeRows * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap) + 28,
        color: clusterColor,
        nodeCount: clusterNodes.length,
        status: highestStatus(clusterStatuses),
      });
    });

    const width = clusterOrder.length * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap) + 80;
    const height = MAP_LAYOUT.clusterHeaderHeight + maxRows * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap) + 120;
    return { positions, visibleNodes, clusterBounds, width, height };
  }, [activeIssuesBySource, filter, issuesBySource, logsBySource, mapData]);

  const visibleEdges = useMemo(
    () => mapData.edges.filter((edge) => positioned.positions.has(edge.from) && positioned.positions.has(edge.to)),
    [positioned.positions],
  );

  const connectedIds = useMemo(() => {
    if (!activeId) return new Set<string>();
    const ids = new Set([activeId]);
    for (const edge of mapData.edges) {
      if (edge.from === activeId) ids.add(edge.to);
      if (edge.to === activeId) ids.add(edge.from);
    }
    return ids;
  }, [activeId]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return mapData.nodes
      .filter((node) => getSearchTokens(node, clustersById.get(node.cluster)).includes(query))
      .slice(0, 8);
  }, [clustersById, searchTerm]);

  const selectedIssues = selectedId ? activeIssuesBySource.get(selectedId) ?? [] : [];
  const selectedIssueLogs = selectedIssue ? logsByFingerprint.get(selectedIssue.fingerprint) ?? [] : [];
  const errorNodes = Array.from(activeIssuesBySource.entries()).sort((a, b) => b[1].length - a[1].length);
  const watchNodes = mapData.nodes.filter((node) => getNodeStatus(node.id, issuesBySource, logsBySource) === "watch");
  const mapViewport = {
    width: positioned.width + MAP_VIEWBOX_PADDING * 2,
    height: positioned.height + MAP_VIEWBOX_PADDING * 2,
    displayWidth: Math.max(1320, (positioned.width + MAP_VIEWBOX_PADDING * 2) * STATIC_MAP_SCALE),
    displayHeight: Math.max(620, (positioned.height + MAP_VIEWBOX_PADDING * 2) * STATIC_MAP_SCALE),
  };
  const inboxItems = useMemo<ArchitectureInboxItem[]>(() => {
    const issueItems = issues.map((issue) => {
      const node = nodesById.get(issue.source);
      const location = extractCodeLocation(issue);
      return {
        id: `issue-${issue.fingerprint}-${issue.last_seen_at}`,
        kind: "issue" as const,
        severity: issue.severity,
        title: node?.label ?? issue.source,
        subtitle: issue.message,
        meta: `${issue.status} · ${issue.occurrence_count}회 · ${formatTime(issue.last_seen_at)}`,
        createdAt: issue.last_seen_at,
        nodeId: issue.source,
        issueFingerprint: issue.fingerprint,
        issue,
        locationLabel: location?.label ?? issue.path ?? undefined,
      };
    });

    const qaItems = qaRuns
      .filter((run) => run.status !== "completed" || run.conclusion !== "success")
      .map((run) => {
        const suiteLabel = run.suite ? QA_SUITES.find((suite) => suite.id === run.suite)?.label ?? run.suite : "Suite 미상";
        return {
          id: `qa-${run.id}`,
          kind: "qa" as const,
          severity: getQaIncidentSeverity(run),
          title: `${suiteLabel} QA`,
          subtitle: run.failedStep
            ? `${run.failedStep.job} / ${run.failedStep.step}`
            : `${run.status}${run.conclusion ? ` · ${run.conclusion}` : ""}`,
          meta: `#${run.runNumber} · ${formatTime(run.updatedAt)}`,
          createdAt: run.updatedAt,
          href: run.htmlUrl,
          qaRun: run,
        };
      });

    const blogItems = blogRuns
      .filter((run) => run.status !== "success" || run.failed_count > 0 || Boolean(run.error))
      .map((run) => ({
        id: `blog-${run.id}`,
        kind: "blog" as const,
        severity: getBlogIncidentSeverity(run),
        title: `${formatTriggerSource(run.trigger_source)} 블로그 동기화`,
        subtitle: run.error ?? getBlogRunSummary(run),
        meta: `${run.status} · ${formatTime(run.created_at)}`,
        createdAt: run.finished_at ?? run.started_at ?? run.created_at,
        href: run.github_run_id
          ? `https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/${run.github_run_id}`
          : NAVER_BLOG_SYNC_WORKFLOW_URL,
        blogRun: run,
      }));

    return [...issueItems, ...qaItems, ...blogItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [blogRuns, issues, nodesById, qaRuns]);

  const visibleInboxItems = useMemo(
    () => inboxItems.filter((item) => !inboxHiddenIds.has(item.id)),
    [inboxHiddenIds, inboxItems],
  );
  const unreadInboxCount = visibleInboxItems.filter((item) => !inboxReadIds.has(item.id)).length;
  const inboxCounts = useMemo(() => ({
    issue: visibleInboxItems.filter((item) => item.kind === "issue").length,
    qa: visibleInboxItems.filter((item) => item.kind === "qa").length,
    blog: visibleInboxItems.filter((item) => item.kind === "blog").length,
  }), [visibleInboxItems]);
  const floatingPanelLayout = useMemo(() => {
    const anchor = floatingBellPosition ?? getDefaultFloatingBellPosition(viewportSize);
    const left = clamp(
      anchor.x + FLOATING_BELL_SIZE - FLOATING_PANEL_WIDTH,
      FLOATING_PANEL_EDGE_MARGIN,
      Math.max(FLOATING_PANEL_EDGE_MARGIN, viewportSize.x - FLOATING_PANEL_WIDTH - FLOATING_PANEL_EDGE_MARGIN),
    );
    const bottom = Math.max(FLOATING_PANEL_EDGE_MARGIN, viewportSize.y - anchor.y + FLOATING_PANEL_GAP);
    const availableHeight = Math.max(
      FLOATING_PANEL_MIN_HEIGHT,
      viewportSize.y - bottom - FLOATING_PANEL_EDGE_MARGIN,
    );
    return {
      left,
      bottom,
      maxHeight: Math.min(FLOATING_PANEL_MAX_HEIGHT, availableHeight),
    };
  }, [floatingBellPosition, viewportSize]);

  const openExternalHref = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const focusNode = (nodeId: string) => {
    setSidebarTab("map");
    if (!positioned.positions.get(nodeId) && !getFallbackNodePosition(nodeId, mapData)) {
      setFilter("all");
      setSelectedId(nodeId);
      setSelectedFingerprint(null);
      setSearchOpen(false);
      return;
    }
    if (!positioned.positions.has(nodeId)) setFilter("all");
    setSelectedId(nodeId);
    setSelectedFingerprint(null);
    setSearchOpen(false);
  };

  const clearSelection = () => {
    setSidebarTab("map");
    setSelectedId(null);
    setSelectedFingerprint(null);
  };

  const toggleInboxSelection = (itemId: string) => {
    setInboxSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const setAllInboxSelected = (selected: boolean) => {
    setInboxSelectedIds(selected ? new Set(visibleInboxItems.map((item) => item.id)) : new Set());
  };

  const markInboxItemsRead = (ids: string[]) => {
    const nextReadIds = new Set(inboxReadIds);
    ids.forEach((id) => nextReadIds.add(id));
    persistInboxState(nextReadIds, inboxHiddenIds);
  };

  const hideInboxItems = (ids: string[]) => {
    const nextHiddenIds = new Set(inboxHiddenIds);
    ids.forEach((id) => nextHiddenIds.add(id));
    persistInboxState(inboxReadIds, nextHiddenIds);
    setInboxSelectedIds(new Set());
  };

  const refreshInbox = async () => {
    await Promise.all([loadQaRuns(), loadBlogRuns()]);
  };

  const handleBellPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!floatingBellPosition) return;
    event.preventDefault();
    floatingBellDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origin: floatingBellPosition,
      dragging: false,
    };
  };

  const updateIssueStatus = async (fingerprint: string, action: "monitoring" | "resolved" | "ignored") => {
    const rpcName = action === "monitoring"
      ? "mark_error_issue_monitoring"
      : action === "resolved"
      ? "resolve_error_issue"
      : "ignore_error_issue";

    setIssues((prev) => {
      if (action === "resolved") return prev.filter((issue) => issue.fingerprint !== fingerprint);
      return prev.map((issue) => (
        issue.fingerprint === fingerprint
          ? {
              ...issue,
              status: action,
              monitoring_at: action === "monitoring" ? new Date().toISOString() : issue.monitoring_at,
              ignored_at: action === "ignored" ? new Date().toISOString() : issue.ignored_at,
            }
          : issue
      ));
    });
    if (selectedFingerprint === fingerprint) setSelectedFingerprint(null);

    const { error } = await supabase.rpc(rpcName, { p_fingerprint: fingerprint, p_note: null });
    if (error) {
      logSupabaseFailure("architecture-map", `update_error_issue_${action}`, error, {
        context: { fingerprint, action },
      });
      setLoadError(error.message);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  return (
    <section style={{ height: "100vh", minHeight: 0, display: "flex", flexDirection: "column", background: "#0f0f0f", overflow: "hidden" }}>
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", borderBottom: "1px solid #2a2a2a", background: "#161616" }}>
        {/* 상위 탭 행 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
          <h3 style={{ margin: "0 12px 0 0", color: "#e8e8e8", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}>
            Global X Pass — Architecture Map
          </h3>
          {([
            { id: "map" as SidebarTab, label: "아키텍처 맵", icon: LocateFixed },
            { id: "ops" as SidebarTab, label: "Ops", icon: PlayCircle },
          ] as const).map((item) => {
            const Icon = item.icon;
            const active = sidebarTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-monitor-action={`main-tab-${item.id}`}
                onClick={() => setSidebarTab(item.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: `1px solid ${active ? "#4ea1ff" : "#2a2a2a"}`,
                  background: active ? "#1e2a3a" : "#1c1c1c",
                  color: active ? "#4ea1ff" : "#8a8a8a",
                  borderRadius: 999,
                  padding: "6px 13px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Icon size={13} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
        {/* 맵 탭 전용 컨트롤 행 */}
        {sidebarTab === "map" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderTop: "1px solid #2a2a2a", padding: "8px 14px" }}>
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-monitor-action={`live-map-filter-${item.id}`}
                onClick={() => {
                  setFilter(item.id);
                  clearSelection();
                }}
                style={{
                  border: `1px solid ${filter === item.id ? "#4ea1ff" : "#2a2a2a"}`,
                  background: filter === item.id ? "#1e2a3a" : "#1c1c1c",
                  color: filter === item.id ? "#4ea1ff" : "#8a8a8a",
                  borderRadius: 999,
                  padding: "5px 11px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            ))}
            {[
              `${mapData.nodes.length} nodes`,
              `${mapData.edges.length} wires`,
              `${loading ? "…" : errorNodes.length} issues`,
              `${watchNodes.length} watch`,
              `${visibleInboxItems.length} inbox`,
            ].map((label) => (
              <span key={label} style={{ border: "1px solid #2a2a2a", background: "#111", color: "#8a8a8a", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                {label}
              </span>
            ))}
        <div style={{ position: "relative", minWidth: 210, flex: "0 1 250px" }}>
          <Search size={13} aria-hidden style={{ position: "absolute", left: 10, top: 9, color: "#8a8a8a" }} />
          <input
            type="search"
            value={searchTerm}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search"
            style={{
              width: "100%",
              border: "1px solid #2a2a2a",
              background: "#1c1c1c",
              color: "#e8e8e8",
              borderRadius: 999,
              padding: "6px 10px 6px 30px",
              fontSize: 11,
              outline: "none",
            }}
          />
          {searchOpen && searchTerm.trim() && (
            <div style={{ position: "absolute", zIndex: 5, top: 36, left: 0, right: 0, border: "1px solid #2a2a2a", background: "#161616", borderRadius: 8, padding: 6, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", maxHeight: 290, overflow: "auto" }}>
              {searchResults.length === 0 ? (
                <div style={{ color: "#8a8a8a", fontSize: 11, padding: "9px 10px" }}>검색 결과가 없습니다.</div>
              ) : searchResults.map((node) => {
                const cluster = clustersById.get(node.cluster);
                const status = getNodeStatus(node.id, issuesBySource, logsBySource);
                return (
                  <button
                    key={node.id}
                    type="button"
                    data-monitor-action="live-map-search-result"
                    onClick={() => focusNode(node.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "10px minmax(0, 1fr)",
                      gap: 9,
                      width: "100%",
                      border: 0,
                      background: "transparent",
                      color: "#e8e8e8",
                      borderRadius: 6,
                      padding: "8px 9px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "999px", background: STATUS_META[status].color, marginTop: 5 }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.label}</span>
                      <span style={{ display: "block", color: "#8a8a8a", fontSize: 10, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cluster?.displayLabel ?? cluster?.label ?? node.cluster} · {node.path}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {window.electronAPI?.refreshMap && (
          <button
            type="button"
            data-monitor-action="live-map-refresh-structure"
            onClick={() => { void handleMapRefresh(); }}
            disabled={mapRefreshStatus === "loading"}
            style={{
              border: `1px solid ${mapRefreshStatus === "error" ? "#ea4335" : mapRefreshStatus === "ok" ? "#34a853" : "#2a2a2a"}`,
              background: mapRefreshStatus === "error" ? "#2a1010" : mapRefreshStatus === "ok" ? "#0f2a15" : "#1c1c1c",
              color: mapRefreshStatus === "error" ? "#ea4335" : mapRefreshStatus === "ok" ? "#34a853" : "#8a8a8a",
              borderRadius: 999,
              padding: "5px 13px",
              fontSize: 11,
              fontWeight: 700,
              cursor: mapRefreshStatus === "loading" ? "wait" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {mapRefreshStatus === "loading" ? "업데이트 중…" : mapRefreshStatus === "ok" ? "✓ 완료" : mapRefreshStatus === "error" ? "✗ 실패" : "구조 새로고침"}
          </button>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option.minutes}
              type="button"
              data-monitor-action={`live-map-window-${option.minutes}`}
              onClick={() => setWindowMinutes(option.minutes)}
              style={{
                border: `1px solid ${windowMinutes === option.minutes ? "#f5b942" : "#2a2a2a"}`,
                background: windowMinutes === option.minutes ? "#2b240f" : "#1c1c1c",
                color: windowMinutes === option.minutes ? "#f5b942" : "#8a8a8a",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        {sidebarTab === "ops" ? (
          <div style={{ flex: 1, overflow: "auto", background: "#161616", padding: "14px 18px" }}>
            <OperationsSidebar
              selectedQaSuite={selectedQaSuite}
              qaTriggerLoading={qaTriggerLoading}
              qaTriggerMessage={qaTriggerMessage}
              qaTriggerError={qaTriggerError}
              visibleQaLoading={visibleQaLoading}
              visibleQaMessage={visibleQaMessage}
              visibleQaError={visibleQaError}
              qaRuns={qaRuns}
              qaRunTracker={qaRunTracker}
              qaTokenConnected={githubTokenConnected}
              qaCredentialsConnected={qaCredentialsConnected}
              qaCredentialsInput={qaCredentialsInput}
              qaCredentialsSaving={qaCredentialsSaving}
              qaCredentialsError={qaCredentialsError}
              syncLoading={blogSyncLoading}
              syncResult={blogSyncResult}
              syncError={blogSyncError}
              companyNewsTriggerLoading={companyNewsTriggerLoading}
              companyNewsTriggerMessage={companyNewsTriggerMessage}
              companyNewsTriggerError={companyNewsTriggerError}
              companyNewsRuns={companyNewsRuns}
              companyNewsRunTracker={companyNewsRunTracker}
              companyNewsLoading={companyNewsLoading}
              companyNewsError={companyNewsError}
              companyNewsCrawlOptions={companyNewsCrawlOptions}
              blogAiInputMode={blogAiInputMode}
              blogAiArticleUrl={blogAiArticleUrl}
              blogAiArticleText={blogAiArticleText}
              blogAiProfilePath={blogAiProfilePath}
              blogAiSampleCount={blogAiSampleCount}
              blogAiAnalyzeLoading={blogAiAnalyzeLoading}
              blogAiAnalyzeMessage={blogAiAnalyzeMessage}
              blogAiAnalyzeError={blogAiAnalyzeError}
              blogAiGenerateLoading={blogAiGenerateLoading}
              blogAiGenerateError={blogAiGenerateError}
              blogAiDraftResult={blogAiDraftResult}
              blogAiRevisionInstruction={blogAiRevisionInstruction}
              blogAiRevisionLoading={blogAiRevisionLoading}
              blogAiRevisionError={blogAiRevisionError}
              onQaSuiteChange={(suite) => {
                setSelectedQaSuite(suite);
                setQaRunTracker(null);
              }}
              onQaCredentialsInputChange={(patch) => setQaCredentialsInput((current) => ({ ...current, ...patch }))}
              onBlogAiInputModeChange={setBlogAiInputMode}
              onBlogAiArticleUrlChange={setBlogAiArticleUrl}
              onBlogAiArticleTextChange={setBlogAiArticleText}
              onBlogAiProfilePathChange={setBlogAiProfilePath}
              onBlogAiSampleCountChange={setBlogAiSampleCount}
              onBlogAiRevisionInstructionChange={setBlogAiRevisionInstruction}
              onSaveQaCredentials={() => { void saveQaCredentials(); }}
              onClearQaCredentials={() => { void clearQaCredentials(); }}
              syncObservedRun={blogSyncResult?.run?.id
                ? (blogRuns.find((run) => run.id === blogSyncResult.run?.id) ?? null)
                : null}
              onTriggerQaRun={() => { void triggerQaRun(selectedQaSuite); }}
              onRunVisibleQa={() => { void runVisibleQa(selectedQaSuite); }}
              onTriggerBlogSync={() => { void triggerBlogSync(); }}
              onCompanyNewsCrawlOptionsChange={(patch) => setCompanyNewsCrawlOptions((current) => ({ ...current, ...patch }))}
              onTriggerCompanyNewsCrawl={() => { void triggerCompanyNewsCrawl(); }}
              onAnalyzeBlogStyle={() => { void analyzeBlogStyle(); }}
              onGenerateBlogDraft={() => { void generateBlogDraft(); }}
              onReviseBlogDraft={() => { void reviseBlogDraft(); }}
            />
          </div>
        ) : (
          <>
        <div
          style={{ flex: 1, minWidth: 0, position: "relative", overflow: "auto", background: "#0f0f0f", cursor: isPanning ? "grabbing" : "grab", userSelect: "none" }}
          onPointerDown={(e) => {
            if ((e.target as Element).closest("button")) return;
            didPan.current = false;
            panState.current = { startX: e.clientX, startY: e.clientY, scrollLeft: e.currentTarget.scrollLeft, scrollTop: e.currentTarget.scrollTop };
            setIsPanning(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!panState.current) return;
            const dx = e.clientX - panState.current.startX;
            const dy = e.clientY - panState.current.startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didPan.current = true;
            if (!didPan.current) return;
            e.currentTarget.scrollLeft = panState.current.scrollLeft - dx;
            e.currentTarget.scrollTop = panState.current.scrollTop - dy;
          }}
          onPointerUp={() => { panState.current = null; setIsPanning(false); }}
        >
          <svg
            width={mapViewport.displayWidth}
            height={mapViewport.displayHeight}
            viewBox={`${-MAP_VIEWBOX_PADDING} ${-MAP_VIEWBOX_PADDING} ${mapViewport.width} ${mapViewport.height}`}
            preserveAspectRatio="xMinYMin meet"
            onClick={(event) => {
              if (event.target === event.currentTarget) clearSelection();
            }}
            onMouseLeave={() => {
              setHoveredId(null);
            }}
            style={{ display: "block", cursor: "default" }}
          >
            <defs>
              <marker id="live-map-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="var(--color-text-muted)" />
              </marker>
            </defs>
            <g>
              {positioned.clusterBounds.map((cluster) => (
                <g key={cluster.id}>
                  <rect
                    x={cluster.x}
                    y={cluster.y}
                    width={cluster.w}
                    height={cluster.h}
                    rx="18"
                    fill={getClusterPalette(cluster.color).clusterFill}
                    stroke={getClusterStroke(cluster.color, cluster.status)}
                    strokeWidth={cluster.status === "safe" ? 0.8 : 1.6}
                    opacity={activeId ? 0.38 : 0.58}
                  />
                  <text x={cluster.x + 16} y={cluster.y + 28} fill="var(--color-text-primary)" fontSize={STATIC_MAP_SCALE < 0.62 ? 18 : 15} fontWeight="900">
                    {cluster.label}
                  </text>
                  {STATIC_MAP_SCALE > 0.62 && (
                    <>
                      <text x={cluster.x + 16} y={cluster.y + 48} fill="var(--color-text-secondary)" fontSize="10" fontWeight="700">
                        {STATUS_META[cluster.status].label} · {cluster.nodeCount}개 파일
                      </text>
                      <text x={cluster.x + 16} y={cluster.y + 64} fill="var(--color-text-muted)" fontSize="9">
                        {cluster.description.length > 28 ? `${cluster.description.slice(0, 27)}…` : cluster.description}
                      </text>
                    </>
                  )}
                </g>
              ))}

              {visibleEdges.map((edge) => {
                const from = positioned.positions.get(edge.from);
                const to = positioned.positions.get(edge.to);
                if (!from || !to) return null;
                const x1 = from.x + from.w;
                const y1 = from.y + from.h / 2;
                const x2 = to.x;
                const y2 = to.y + to.h / 2;
                const muted = activeId && !connectedIds.has(edge.from) && !connectedIds.has(edge.to);
                const edgeStatus = highestStatus([from.status, to.status]);
                const stroke = edge.kind === "critical" && edgeStatus === "safe" ? "var(--color-brand-red)" : STATUS_META[edgeStatus].color;
                return (
                  <path
                    key={`${edge.from}-${edge.to}-${edge.label}`}
                    d={`M ${x1} ${y1} C ${x1 + 42} ${y1}, ${x2 - 42} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={edgeStatus === "danger" ? 2.4 : edgeStatus === "watch" ? 1.8 : edge.kind === "critical" ? 1.5 : 1}
                    opacity={muted ? 0.08 : edgeStatus === "safe" ? 0.22 : 0.5}
                    markerEnd="url(#live-map-arrow)"
                  />
                );
              })}

              {Array.from(positioned.positions.values()).map((node) => {
                const nodeIssues = activeIssuesBySource.get(node.id) ?? [];
                const highest = nodeIssues.reduce<Severity | null>((acc, issue) => {
                  if (!acc) return issue.severity;
                  return SEVERITY_RANK[issue.severity] > SEVERITY_RANK[acc] ? issue.severity : acc;
                }, null);
                const dimmed = activeId && !connectedIds.has(node.id);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    onClick={(event) => {
                      if (didPan.current) return;
                      event.stopPropagation();
                      setSidebarTab("map");
                      setSelectedId(node.id);
                      setSelectedFingerprint(null);
                    }}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ cursor: "pointer", opacity: dimmed ? 0.22 : 1 }}
                  >
                    <rect
                      width={node.w}
                      height={node.h}
                      rx="10"
                      fill={getClusterPalette(node.color).nodeFill}
                      stroke={highest ? SEVERITY_COLOR[highest] : getClusterStroke(node.color, node.status)}
                      strokeWidth={node.critical || node.status !== "safe" ? 2.4 : 1.2}
                    />
                    <rect x="0" y="0" width={node.w} height="8" rx="10" fill={getClusterPalette(node.color).accentFill} />
                    <circle cx="14" cy="14" r="4" fill={STATUS_META[node.status].color} />
                    {node.dead && (
                      <rect x="8" y="8" width="36" height="16" rx="8" fill="var(--color-brand-yellow)" opacity="0.16" />
                    )}
                    {STATIC_MAP_SCALE > 0.5 ? (
                      <>
                        <text x="14" y="31" fill="var(--color-text-primary)" fontSize="12" fontWeight="800">
                          {node.label.length > 24 ? `${node.label.slice(0, 23)}…` : node.label}
                        </text>
                        <text x="14" y="52" fill="var(--color-text-secondary)" fontSize="10">
                          {node.sub.length > 32 ? `${node.sub.slice(0, 31)}…` : node.sub}
                        </text>
                      </>
                    ) : (
                      <text x="14" y="42" fill="var(--color-text-primary)" fontSize="12" fontWeight="900">
                        {STATUS_META[node.status].label}
                      </text>
                    )}
                    {nodeIssues.length > 0 && (
                      <g transform={`translate(${node.w - 30}, -8)`}>
                        <circle r="13" cx="13" cy="13" fill={highest ? SEVERITY_COLOR[highest] : "var(--color-brand-red)"} />
                        <text x="13" y="17" fill="var(--color-on-primary)" fontSize="11" fontWeight="900" textAnchor="middle">
                          {nodeIssues.length > 99 ? "99+" : nodeIssues.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        <div
          style={{ width: 6, flex: "0 0 6px", cursor: "col-resize", background: "transparent", borderLeft: `2px solid ${isHoveringResizer ? "#4ea1ff" : "#2a2a2a"}`, position: "relative", zIndex: 1, transition: "border-color 0.15s" }}
          onPointerEnter={() => setIsHoveringResizer(true)}
          onPointerLeave={() => { if (!resizeState.current) setIsHoveringResizer(false); }}
          onPointerDown={(e) => {
            resizeState.current = { startX: e.clientX, startWidth: asideWidth, lastWidth: asideWidth };
            setIsHoveringResizer(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!resizeState.current) return;
            const delta = resizeState.current.startX - e.clientX;
            const next = Math.max(ASIDE_MIN, Math.min(ASIDE_MAX, resizeState.current.startWidth + delta));
            resizeState.current.lastWidth = next;
            setAsideWidth(next);
          }}
          onPointerUp={() => {
            if (resizeState.current) {
              window.localStorage.setItem("arch-aside-width", String(resizeState.current.lastWidth));
            }
            resizeState.current = null;
            setIsHoveringResizer(false);
          }}
        />
        <aside style={{ width: asideWidth, flex: `0 0 ${asideWidth}px`, background: "#161616", overflow: "auto", padding: "14px 14px 18px" }}>
          {loadError && (
            <div style={{ color: "#ff3860", borderLeft: "3px solid #ff3860", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginBottom: 14 }}>
              error_issues 조회 실패: {loadError}
            </div>
          )}
          {selectedNode ? (
            <NodeSidebar
              node={selectedNode}
              status={getNodeStatus(selectedNode.id, issuesBySource, logsBySource)}
              issues={selectedIssues}
              selectedIssue={selectedIssue}
              selectedIssueLogs={selectedIssueLogs}
              edges={mapData.edges}
              onSelectIssue={setSelectedFingerprint}
              onUpdateIssueStatus={updateIssueStatus}
              onOpenTerminal={openTerminal}
            />
          ) : (
            <ArchitectureMapSidebar
              generatedAt={mapData.generatedAt}
              mapDiff={mapDiff}
              nodesById={nodesById}
              onFocusNode={focusNode}
            />
          )}
        </aside>
          </>
        )}
        {floatingBellPosition && (
          <>
            {inboxOpen && (
              <div
                role="presentation"
                onClick={() => setInboxOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.12)", zIndex: 39 }}
              />
            )}
            <button
              type="button"
              data-monitor-action="toggle-architecture-inbox"
              aria-label="이슈 인박스 열기"
              onPointerDown={handleBellPointerDown}
              style={{
                position: "fixed",
                left: floatingBellPosition.x,
                top: floatingBellPosition.y,
                width: FLOATING_BELL_SIZE,
                height: FLOATING_BELL_SIZE,
                borderRadius: "999px",
                background: "var(--color-tab-selected-bg)",
                border: "1px solid var(--color-border-soft)",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.28)",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                zIndex: 41,
                touchAction: "none",
              }}
            >
              <Bell size={22} aria-hidden opacity={0.82} />
              {unreadInboxCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                  border: "2px solid #fff",
                }}>
                  {unreadInboxCount > 99 ? "99+" : unreadInboxCount}
                </span>
              )}
            </button>
            {inboxOpen && (
              <ArchitectureInboxPanel
                items={visibleInboxItems}
                selectedIds={inboxSelectedIds}
                readIds={inboxReadIds}
                qaLoading={qaLoading}
                qaError={qaError}
                blogLoading={blogLoading}
                blogError={blogError}
                counts={inboxCounts}
                layout={floatingPanelLayout}
                onClose={() => setInboxOpen(false)}
                onOpenOps={() => setSidebarTab("ops")}
                onRefresh={() => { void refreshInbox(); }}
                onToggleSelection={toggleInboxSelection}
                onSelectAll={setAllInboxSelected}
                onMarkRead={markInboxItemsRead}
                onHide={hideInboxItems}
                onFocusNode={focusNode}
                onOpenHref={openExternalHref}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
