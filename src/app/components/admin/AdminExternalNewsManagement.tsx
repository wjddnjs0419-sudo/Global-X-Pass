import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useTheme } from "../../ThemeContext";
import { AppPagination } from "../AppPagination";
import { SearchInput } from "../SearchInput";
import { getFilterTabStyle } from "../contentListStyles";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { ExternalNewsItem } from "../../../lib/types";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { ExternalNewsPreviewComposer } from "./ExternalNewsPreviewComposer";

const PAGE_SIZE = 12;

type StatusFilter = "all" | ExternalNewsItem["status"];

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "published", label: "게시됨" },
  { id: "draft", label: "임시저장" },
];

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function sanitizeSearch(value: string): string {
  return value.trim().replace(/[,%]/g, " ");
}

export default function AdminExternalNewsManagement() {
  const { isDark } = useTheme();
  const [items, setItems] = useState<ExternalNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingItem, setEditingItem] = useState<ExternalNewsItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExternalNewsItem | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const queryText = sanitizeSearch(searchTerm);

    let query = supabase
      .from("external_news_items")
      .select("id, title, summary, source_name, external_url, published_at, status, created_at, updated_at", { count: "exact" })
      .range(from, to);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,summary.ilike.%${queryText}%,source_name.ilike.%${queryText}%,external_url.ilike.%${queryText}%`);
    }

    const { data, error, count } = await query
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setFetchError(error.message);
      setItems([]);
      setTotalCount(0);
    } else {
      setItems((data as ExternalNewsItem[] | null) ?? []);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const refreshItems = async () => {
    await fetchItems();
  };

  const handleStartEdit = (item: ExternalNewsItem) => {
    setEditingItem(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePatchStatus = async (item: ExternalNewsItem, status: ExternalNewsItem["status"]) => {
    setSavingIds((prev) => new Set(prev).add(item.id));
    const { error } = await supabase
      .from("external_news_items")
      .update({ status })
      .eq("id", item.id);
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });

    if (error) {
      setFetchError(error.message);
      return;
    }

    if (editingItem?.id === item.id) {
      setEditingItem({ ...item, status });
    }

    await fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSavingIds((prev) => new Set(prev).add(deleteTarget.id));
    const { error } = await supabase
      .from("external_news_items")
      .delete()
      .eq("id", deleteTarget.id);
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });

    if (error) {
      setFetchError(error.message);
      return;
    }

    if (editingItem?.id === deleteTarget.id) {
      setEditingItem(null);
    }

    setDeleteTarget(null);
    await fetchItems();
  };

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const skColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ExternalNewsPreviewComposer
        editingItem={editingItem}
        onCancelEditing={() => setEditingItem(null)}
        onSaved={refreshItems}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h2 className="text-[20px] sm:text-[24px]" style={{ margin: 0, fontWeight: 800, color: textMain }}>언론보도 목록</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: textMuted }}>
            저장된 초안과 게시된 언론보도를 관리합니다. 게시 상태가 아닌 항목은 공개 페이지에 보이지 않습니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button type="button" variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw size={14} />
            새로고침
          </Button>
        </div>
      </div>

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 18,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: textMuted }}>
              상태
            </span>
            <div role="group" aria-label="언론보도 상태 필터" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={statusFilter === tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={getFilterTabStyle(isDark, statusFilter === tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="제목 · 요약 · 출처 · 링크 검색"
          />
        </div>

        {fetchError && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 14,
              background: "var(--color-danger-soft-bg)",
              border: "1px solid var(--color-danger-soft-border)",
              color: "var(--color-brand-red)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <strong>데이터를 불러오지 못했습니다.</strong>
            <span style={{ display: "block", marginTop: 4, opacity: 0.8 }}>{fetchError}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              style={{
                height: 124,
                borderRadius: 18,
                background: skColor,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))
        ) : items.length === 0 ? (
          <div
            className="px-6 py-10 sm:p-[60px]"
            style={{
              textAlign: "center",
              color: textMuted,
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 18,
            }}
          >
            {searchTerm ? "검색 결과가 없습니다." : "등록된 언론보도가 없습니다."}
          </div>
        ) : (
          items.map((item) => {
            const isSaving = savingIds.has(item.id);
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5"
                style={{
                  background: card,
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4 sm:items-start">
                  <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                      <Badge variant={item.status === "published" ? "green" : "yellow"} shape="pill">
                        {item.status === "published" ? "게시됨" : "임시저장"}
                      </Badge>
                      <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
                        {item.source_name}
                      </span>
                    </div>
                    <strong style={{ display: "block", color: textMain, fontSize: 16, lineHeight: 1.45 }}>
                      {item.title}
                    </strong>
                    {item.summary && (
                      <p style={{ margin: "6px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.55 }}>
                        {item.summary}
                      </p>
                    )}
                  </div>
                  <div style={{ color: textMuted, fontSize: 12, whiteSpace: "nowrap" }}>
                    발행 {formatDateTime(item.published_at)}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--color-accent-blue)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
                  >
                    원문 보기 <ExternalLink size={13} />
                  </a>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.status !== "published" && (
                      <Button type="button" size="sm" disabled={isSaving} onClick={() => { void handlePatchStatus(item, "published"); }}>
                        게시 승인
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => handleStartEdit(item)}>
                      수정
                    </Button>
                    <Button type="button" variant="destructive" size="sm" disabled={isSaving} onClick={() => setDeleteTarget(item)}>
                      <Trash2 size={13} />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && totalPages > 1 && (
        <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {deleteTarget && (
        <AdminConfirmModal
          title="언론보도 삭제"
          description={`"${deleteTarget.title}" 항목을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          tone="danger"
          loading={savingIds.has(deleteTarget.id)}
          onConfirm={() => { void handleDelete(); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
