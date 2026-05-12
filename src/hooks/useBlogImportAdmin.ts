import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type QueueStatus = "pending" | "approved" | "imported" | "skipped" | "failed";
export type FilterId = "all" | QueueStatus;

type TriggerMessage = { type: "ok" | "err"; text: string } | null;

export interface QueueItem {
  id: string;
  source_url: string;
  source_log_no: string | null;
  source_board: string | null;
  target_category: "news" | "events-archive";
  suggested_tag: string | null;
  status: QueueStatus;
  error: string | null;
  existing_post_id: string | null;
  created_at: string;
  updated_at: string | null;
  imported_at: string | null;
  posts: { id: string; title: string } | null;
}

export interface RunItem {
  id: string;
  trigger_source: string;
  status: string;
  discovered_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  github_run_id?: string | null;
}

type FilterTab = { id: FilterId; label: string };

const ITEMS_PER_PAGE = 10;

export function extractQueueLogNo(url: string): string {
  const match = url.match(/(?:logNo=|nextchallenge\/)(\d{8,})/);
  return match ? match[1] : url.split("/").pop() ?? url;
}

function buildTagDrafts(items: QueueItem[], previous: Record<string, string>, editedIds: Set<string>) {
  const next: Record<string, string> = {};
  for (const item of items) {
    next[item.id] = editedIds.has(item.id)
      ? (previous[item.id] ?? item.suggested_tag ?? "")
      : (item.suggested_tag ?? "");
  }
  return next;
}

function useBlogImportAdminData() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<TriggerMessage>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const [{ data: queueData, error: queueErr }, { data: runsData, error: runsErr }] = await Promise.all([
      supabase
        .from("blog_import_queue")
        .select("*, posts(id, title)")
        .order("created_at", { ascending: false }),
      supabase
        .from("blog_import_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (queueErr || runsErr) {
      setFetchError((queueErr ?? runsErr)?.message ?? "알 수 없는 오류");
      setLoading(false);
      return;
    }

    setItems((queueData as QueueItem[] | null) ?? []);
    setRuns((runsData as RunItem[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const patchItem = useCallback(async (id: string, payload: Partial<QueueItem>) => {
    setSaving(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSaveErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const { error } = await supabase.from("blog_import_queue").update(payload).eq("id", id);

    setSaving(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (error) {
      setSaveErrors(prev => ({ ...prev, [id]: error.message }));
      return;
    }

    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...payload } : item)));
  }, []);

  const triggerRun = useCallback(async () => {
    setTriggerLoading(true);
    setTriggerMsg(null);

    const { data, error } = await supabase.functions.invoke("sync-naver-blog", {
      body: { triggerSource: "manual" },
    });

    setTriggerLoading(false);

    if (error) {
      setTriggerMsg({ type: "err", text: `요청 실패: ${error.message}` });
      return;
    }

    if (data?.dispatched) {
      setTriggerMsg({ type: "ok", text: "GitHub Actions가 실행되었습니다. 수분 내로 이관이 시작됩니다." });
    } else {
      const reason = data?.dispatchError ? ` (${data.dispatchError})` : "";
      setTriggerMsg({
        type: "err",
        text: `run은 등록됐지만 GitHub Actions 트리거에 실패했습니다.${reason} 03:00 KST에 자동 처리됩니다.`,
      });
    }

    await fetchAll();
  }, [fetchAll]);

  const clearSaveError = useCallback((id: string) => {
    setSaveErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return {
    items,
    runs,
    loading,
    fetchError,
    saving,
    saveErrors,
    triggerLoading,
    triggerMsg,
    fetchAll,
    patchItem,
    triggerRun,
    clearSaveError,
    setTriggerMsg,
  };
}

function useBlogImportAdminControls(items: QueueItem[]) {
  const [statusFilter, setStatusFilter] = useState<FilterId>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [showRuns, setShowRuns] = useState(false);
  const editedTagIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setTagDrafts(prev => buildTagDrafts(items, prev, editedTagIdsRef.current));
  }, [items]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const pendingCount = useMemo(
    () => items.filter(item => item.status === "pending").length,
    [items],
  );
  const failedCount = useMemo(
    () => items.filter(item => item.status === "failed").length,
    [items],
  );

  const filterTabs = useMemo<FilterTab[]>(
    () => [
      { id: "all", label: `전체 (${items.length})` },
      { id: "pending", label: pendingCount > 0 ? `대기중 (${pendingCount})` : "대기중" },
      { id: "approved", label: "승인됨" },
      { id: "imported", label: "이관완료" },
      { id: "failed", label: failedCount > 0 ? `실패 (${failedCount})` : "실패" },
      { id: "skipped", label: "건너뜀" },
    ],
    [failedCount, items.length, pendingCount],
  );

  const filteredItems = useMemo(() => {
    const statusFiltered = statusFilter === "all"
      ? items
      : items.filter(item => item.status === statusFilter);

    if (!searchTerm.trim()) {
      return statusFiltered;
    }

    const query = searchTerm.toLowerCase();
    return statusFiltered.filter(item => (
      (item.posts?.title ?? "").toLowerCase().includes(query)
      || (item.source_board ?? "").toLowerCase().includes(query)
      || extractQueueLogNo(item.source_url).includes(query)
    ));
  }, [items, searchTerm, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE)),
    [filteredItems.length],
  );

  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [currentPage, filteredItems],
  );

  const updateTagDraft = useCallback((id: string, value: string) => {
    editedTagIdsRef.current.add(id);
    setTagDrafts(prev => ({ ...prev, [id]: value }));
  }, []);

  const toggleRuns = useCallback(() => {
    setShowRuns(prev => !prev);
  }, []);

  return {
    statusFilter,
    searchTerm,
    currentPage,
    tagDrafts,
    showRuns,
    pendingCount,
    failedCount,
    filterTabs,
    filteredItems,
    paginatedItems,
    totalPages,
    setStatusFilter,
    setSearchTerm,
    setCurrentPage,
    setTagDrafts,
    updateTagDraft,
    toggleRuns,
  };
}

export function useBlogImportAdmin() {
  const data = useBlogImportAdminData();
  const controls = useBlogImportAdminControls(data.items);
  const tagDraftsRef = useRef(controls.tagDrafts);

  useEffect(() => {
    tagDraftsRef.current = controls.tagDrafts;
  }, [controls.tagDrafts]);

  const handleApprove = useCallback((item: QueueItem) => {
    const tag = (tagDraftsRef.current[item.id] ?? "").trim() || (item.suggested_tag ?? "");
    data.patchItem(item.id, { status: "approved", suggested_tag: tag || null });
  }, [data.patchItem]);

  const handleSkip = useCallback((id: string) => {
    data.patchItem(id, { status: "skipped" });
  }, [data.patchItem]);

  const handleRetry = useCallback((item: QueueItem) => {
    const tag = (tagDraftsRef.current[item.id] ?? "").trim() || (item.suggested_tag ?? "");
    data.patchItem(item.id, { status: "approved", suggested_tag: tag || null, error: null });
  }, [data.patchItem]);

  return {
    items: data.items,
    runs: data.runs,
    loading: data.loading,
    fetchError: data.fetchError,
    statusFilter: controls.statusFilter,
    searchTerm: controls.searchTerm,
    currentPage: controls.currentPage,
    tagDrafts: controls.tagDrafts,
    saving: data.saving,
    saveErrors: data.saveErrors,
    showRuns: controls.showRuns,
    triggerLoading: data.triggerLoading,
    triggerMsg: data.triggerMsg,
    filterTabs: controls.filterTabs,
    filteredItems: controls.filteredItems,
    paginatedItems: controls.paginatedItems,
    totalPages: controls.totalPages,
    fetchAll: data.fetchAll,
    handleApprove,
    handleSkip,
    handleRetry,
    handleTriggerRun: data.triggerRun,
    setStatusFilter: controls.setStatusFilter,
    setSearchTerm: controls.setSearchTerm,
    setCurrentPage: controls.setCurrentPage,
    updateTagDraft: controls.updateTagDraft,
    clearSaveError: data.clearSaveError,
    toggleRuns: controls.toggleRuns,
    setTriggerMsg: data.setTriggerMsg,
  };
}
