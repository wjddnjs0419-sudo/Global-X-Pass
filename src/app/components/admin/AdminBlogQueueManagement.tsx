import { useTheme } from "../../ThemeContext";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { extractQueueLogNo, useBlogImportAdmin } from "../../../hooks/useBlogImportAdmin";

const STATUS_LABEL: Record<string, string> = {
  pending:  "대기중",
  approved: "승인됨",
  imported: "이관완료",
  skipped:  "건너뜀",
  failed:   "실패",
};

const STATUS_BADGE: Record<string, "yellow" | "blue" | "green" | "secondary" | "red"> = {
  pending:  "yellow",
  approved: "blue",
  imported: "green",
  skipped:  "secondary",
  failed:   "red",
};

const RUN_BADGE: Record<string, "green" | "red" | "blue" | "yellow" | "secondary"> = {
  success:   "green",
  failed:    "red",
  running:   "blue",
  queued:    "yellow",
  cancelled: "secondary",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${h}:${m}`;
}

export default function AdminBlogQueueManagement() {
  const { isDark } = useTheme();

  const card        = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border      = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain    = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted   = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const skColor     = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelBg     = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg  = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";

  const {
    items, runs, loading, fetchError, statusFilter, searchTerm, currentPage,
    tagDrafts, saving, saveErrors, showRuns, triggerLoading, triggerMsg,
    filterTabs, paginatedItems, totalPages,
    fetchAll, handleApprove, handleSkip, handleRetry, handleTriggerRun,
    setStatusFilter, setSearchTerm, setCurrentPage, updateTagDraft, clearSaveError, toggleRuns, setTriggerMsg
  } = useBlogImportAdmin();

  const tabStyle = (active: boolean) => ({
    padding: "11px 18px",
    borderRadius: 12,
    border: `1px solid ${active ? labelBorder : border}`,
    background: active ? selectedBg : "transparent",
    color: active ? textMain : textMuted,
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    lineHeight: 1.25,
    fontFamily: "inherit",
  });

  if (loading && items.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: textMain, margin: 0 }}>블로그 동기화</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ width: 80, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
        {[0, 1, 2, 3].map(i => <div key={i} style={{ height: 92, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: textMain, margin: 0 }}>블로그 동기화</h3>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto" style={{ gap: 8 }}>
          <Button type="button" variant="outline" size="sm" onClick={fetchAll}>새로고침</Button>
          <Button type="button" variant="default" size="sm" disabled={triggerLoading} onClick={handleTriggerRun}>
            {triggerLoading ? "실행 중..." : "즉시 동기화"}
          </Button>
        </div>
      </div>

      {/* 실행 결과 메시지 */}
      {triggerMsg && (
        <div style={{
          padding: "13px 16px", borderRadius: 12, fontSize: 14, lineHeight: 1.6,
          background: triggerMsg.type === "ok" ? labelBg : "var(--color-danger-soft-bg)",
          border: `1px solid ${triggerMsg.type === "ok" ? labelBorder : "var(--color-danger-soft-border)"}`,
          color: triggerMsg.type === "ok" ? textMain : "var(--color-brand-red)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <span>{triggerMsg.text}</span>
          <button
            onClick={() => setTriggerMsg(null)}
            aria-label="알림 닫기"
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0, opacity: 0.6 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 필터 탭 */}
      <div role="group" aria-label="상태 필터" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {filterTabs.map(tab => (
          <button key={tab.id} type="button" aria-pressed={statusFilter === tab.id} onClick={() => setStatusFilter(tab.id)} style={tabStyle(statusFilter === tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <input
        type="text"
        value={searchTerm}
        placeholder="제목 · 게시판 · logNo 검색"
        onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: "100%", maxWidth: 420, padding: "12px 15px", borderRadius: 12,
          border: `1px solid ${border}`, background: inputBg,
          color: textMain, fontSize: 14, outline: "none", fontFamily: "inherit",
        }}
      />

      {/* 에러 배너 */}
      {fetchError && (
        <div style={{
          padding: "16px 20px", borderRadius: 14,
          background: "var(--color-danger-soft-bg)",
          border: "1px solid var(--color-danger-soft-border)",
          color: "var(--color-brand-red)", fontSize: 14, lineHeight: 1.6,
        }}>
          <strong>데이터를 불러오지 못했습니다.</strong>
          <span style={{ display: "block", marginTop: 4, opacity: 0.8 }}>{fetchError}</span>
        </div>
      )}

      {/* 큐 목록 */}
      {!fetchError && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {paginatedItems.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted, background: card, border: `1px solid ${border}`, borderRadius: 18, fontSize: 15 }}>
              {searchTerm ? "검색 결과가 없습니다." : "해당 상태의 항목이 없습니다."}
            </div>
          ) : (
            paginatedItems.map(item => {
              const isSaving       = saving.has(item.id);
              const isEventsArchive = item.target_category === "events-archive";
              const isPending      = item.status === "pending";
              const isFailed       = item.status === "failed";
              const isImported     = item.status === "imported";
              const tagValue       = tagDrafts[item.id] ?? item.suggested_tag ?? "";
              const canApprove     = !isSaving && (isEventsArchive ? tagValue.trim().length > 0 : true);
              const displayTitle   = item.posts?.title ?? null;

              return (
                <div
                  key={item.id}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* 상단 */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4 sm:items-start">
                    <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                        <strong style={{ color: textMain, fontSize: 16, lineHeight: 1.4 }}>
                          {displayTitle ?? item.source_board ?? item.target_category}
                        </strong>
                        <Badge variant={STATUS_BADGE[item.status]} shape="pill">
                          {STATUS_LABEL[item.status]}
                        </Badge>
                      </div>
                      <div style={{ color: textMuted, fontSize: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {displayTitle && <span>{item.source_board ?? item.target_category}</span>}
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-accent-blue)", textDecoration: "none", fontFamily: "monospace", fontSize: 13 }}
                        >
                          #{extractQueueLogNo(item.source_url)} ↗
                        </a>
                        {item.suggested_tag && !isPending && (
                          <span>#{item.suggested_tag}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ color: textMuted, fontSize: 13, whiteSpace: "nowrap", paddingTop: 2 }}>
                      {fmtDate(item.created_at)}
                    </div>
                  </div>

                  {/* worker 에러 */}
                  {item.error && (
                    <div style={{ fontSize: 13, color: "var(--color-brand-red)", background: labelBg, border: `1px solid ${labelBorder}`, padding: "9px 12px", borderRadius: 10, lineHeight: 1.5 }}>
                      {item.error}
                    </div>
                  )}

                  {/* Admin UI 저장 실패 */}
                  {saveErrors[item.id] && (
                    <div style={{ fontSize: 13, color: "var(--color-brand-red)", background: labelBg, border: `1px solid ${labelBorder}`, padding: "9px 12px", borderRadius: 10, lineHeight: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span>저장 실패: {saveErrors[item.id]}</span>
                      <button
                        onClick={() => clearSaveError(item.id)}
                        aria-label="오류 메시지 닫기"
                        style={{ background: "none", border: "none", color: "var(--color-brand-red)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* 이관완료 링크 */}
                  {isImported && item.existing_post_id && (
                    <a
                      href={`/post/${item.existing_post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: "var(--color-accent-green)", textDecoration: "none", fontWeight: 700 }}
                    >
                      게시물 보기 →
                    </a>
                  )}

                  {/* 액션 (pending / failed) */}
                  {(isPending || isFailed) && (
                    <div className="flex flex-wrap gap-2 md:justify-end" style={{ alignItems: "center" }}>
                      {isEventsArchive ? (
                        <input
                          type="text"
                          value={tagValue}
                          placeholder="태그 (예: 구글, 삼성전자)"
                        onChange={e => updateTagDraft(item.id, e.target.value)}
                        style={{
                          flex: 1, minWidth: 160,
                          padding: "9px 12px", borderRadius: 10,
                          border: `1px solid ${border}`, background: inputBg,
                          color: textMain, fontSize: 14, outline: "none", fontFamily: "inherit",
                        }}
                      />
                    ) : (
                        <span style={{ flex: 1, fontSize: 13, color: textMuted }}>
                          태그: <strong style={{ color: textMain }}>#뉴스레터</strong> (자동)
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={!canApprove || isSaving}
                        onClick={() => isFailed ? handleRetry(item) : handleApprove(item)}
                      >
                        {isSaving ? "저장 중..." : isFailed ? "재시도" : "승인"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => handleSkip(item.id)}
                      >
                        건너뜀
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && !fetchError && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 4 }}>
          <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={{ color: textMain, borderColor: border }}>
            이전
          </Button>
          <span style={{ color: textMuted, fontSize: 13, fontWeight: 700 }}>
            {currentPage} / {totalPages}
          </span>
          <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ color: textMain, borderColor: border }}>
            다음
          </Button>
        </div>
      )}

      {/* 실행 기록 */}
      <div>
        <button
          onClick={toggleRuns}
          aria-expanded={showRuns}
          aria-controls="blog-runs-list"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 0", background: "transparent", border: "none",
            color: textMuted, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ display: "inline-block", transform: showRuns ? "rotate(90deg)" : "none", transition: "transform 0.15s", fontSize: 10 }}>
            ▶
          </span>
          실행 기록 (최근 20건)
        </button>

        {showRuns && (
          <div id="blog-runs-list" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {runs.length === 0 ? (
              <div style={{ color: textMuted, fontSize: 13 }}>실행 기록이 없습니다.</div>
            ) : (
              runs.map(run => (
                <div
                  key={run.id}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}
                >
                  <Badge variant={RUN_BADGE[run.status] ?? "secondary"} shape="pill">{run.status}</Badge>
                  <span style={{ color: textMuted }}>{run.trigger_source}</span>
                  <span style={{ color: textMuted }}>
                    발견 {run.discovered_count} · 삽입 {run.inserted_count} · 업데이트 {run.updated_count} · 실패 {run.failed_count}
                  </span>
                  {run.error && <span style={{ color: "var(--color-brand-red)", fontSize: 11 }}>{run.error}</span>}
                  <span style={{ marginLeft: "auto", color: textMuted, flexShrink: 0 }}>{fmtDate(run.created_at)}</span>
                  {run.github_run_id && (
                    <a
                      href={`https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/${run.github_run_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: "var(--color-accent-blue)", textDecoration: "none", fontWeight: 600, marginLeft: 6 }}
                    >
                      로그 보기 ↗
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
