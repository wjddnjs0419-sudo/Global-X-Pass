import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export type QueueStatus = "pending" | "approved" | "imported" | "skipped" | "failed";
export type FilterId = "all" | QueueStatus;

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

export function useBlogImportAdmin() {
  const [items, setItems]               = useState<QueueItem[]>([]);
  const [runs, setRuns]                 = useState<RunItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterId>("pending");
  const [searchTerm, setSearchTerm]     = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [tagDrafts, setTagDrafts]       = useState<Record<string, string>>({});
  const [saving, setSaving]             = useState<Set<string>>(new Set());
  const [saveErrors, setSaveErrors]     = useState<Record<string, string>>({});
  const [showRuns, setShowRuns]         = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

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
      setFetchError((queueErr ?? runsErr)!.message);
      setLoading(false);
      return;
    }
    if (queueData) {
      setItems(queueData as QueueItem[]);
      const drafts: Record<string, string> = {};
      for (const item of queueData) {
        drafts[item.id] = item.suggested_tag ?? "";
      }
      setTagDrafts(drafts);
    }
    if (runsData) setRuns(runsData as RunItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm]);

  const patchItem = async (id: string, payload: Partial<QueueItem>) => {
    setSaving(prev => new Set(prev).add(id));
    setSaveErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
    const { error } = await supabase.from("blog_import_queue").update(payload).eq("id", id);
    setSaving(prev => { const next = new Set(prev); next.delete(id); return next; });
    if (error) {
      setSaveErrors(prev => ({ ...prev, [id]: error.message }));
    } else {
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...payload } : it));
    }
  };

  const handleApprove = (item: QueueItem) => {
    const tag = (tagDrafts[item.id] ?? "").trim() || (item.suggested_tag ?? "");
    patchItem(item.id, { status: "approved", suggested_tag: tag || null });
  };

  const handleSkip  = (id: string) => patchItem(id, { status: "skipped" });

  const handleRetry = (item: QueueItem) => {
    const tag = (tagDrafts[item.id] ?? "").trim() || (item.suggested_tag ?? "");
    patchItem(item.id, { status: "approved", suggested_tag: tag || null, error: null });
  };

  const handleTriggerRun = async () => {
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
      setTriggerMsg({ type: "err", text: `run은 등록됐지만 GitHub Actions 트리거에 실패했습니다.${reason} 03:00 KST에 자동 처리됩니다.` });
    }
    await fetchAll();
  };

  return {
    items,
    runs,
    loading,
    fetchError,
    statusFilter,
    searchTerm,
    currentPage,
    tagDrafts,
    saving,
    saveErrors,
    showRuns,
    triggerLoading,
    triggerMsg,
    fetchAll,
    patchItem,
    handleApprove,
    handleSkip,
    handleRetry,
    handleTriggerRun,
    setStatusFilter,
    setSearchTerm,
    setCurrentPage,
    setTagDrafts,
    setSaveErrors,
    setShowRuns,
    setTriggerMsg,
  };
}
