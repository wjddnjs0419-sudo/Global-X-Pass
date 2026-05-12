import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { supabase } from "../../../lib/supabaseClient";
import type { EventApplication, Post } from "../../../lib/types";
import { EVENT_APPLICATION_STATUS, mergeEventFormConfig } from "../../../utils/eventApplication";

type SubTab = "overview" | "pending" | "history";
type HistoryStatusFilter = "all" | "accepted" | "rejected" | "cancelled";

const PAGE_SIZE = 10;

export function AdminEventManagement() {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const [events, setEvents] = useState<Post[]>([]);
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>("all");
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const skColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const deleteBg = isDark ? "rgba(234,67,53,0.08)" : "rgba(234,67,53,0.06)";
  const deleteBorder = isDark ? "rgba(234,67,53,0.28)" : "rgba(234,67,53,0.22)";

  const eventById = useMemo(() => new Map(events.map(event => [event.id, event])), [events]);

  const eventFilteredApplications = useMemo(
    () => applications.filter(application => selectedEventId === "all" || application.post_id === selectedEventId),
    [applications, selectedEventId]
  );

  const pendingApplications = useMemo(
    () => eventFilteredApplications.filter(application => application.status === "pending"),
    [eventFilteredApplications]
  );

  const historyApplications = useMemo(
    () => eventFilteredApplications.filter(application =>
      (application.status === "accepted" || application.status === "rejected" || application.status === "cancelled") &&
      (historyStatusFilter === "all" || application.status === historyStatusFilter)
    ),
    [eventFilteredApplications, historyStatusFilter]
  );

  const countsByEvent = useMemo(() => {
    const map = new Map<string, { accepted: number; total: number }>();
    applications.forEach(application => {
      const next = map.get(application.post_id) ?? { accepted: 0, total: 0 };
      next.total += 1;
      if (application.status === "accepted") next.accepted += 1;
      map.set(application.post_id, next);
    });
    return map;
  }, [applications]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: eventData }, { data: applicationData }] = await Promise.all([
      supabase.from("posts").select("*").eq("category", "events").order("created_at", { ascending: false }),
      supabase.from("event_applications").select("*").order("created_at", { ascending: false }),
    ]);
    setEvents((eventData as Post[] | null) ?? []);
    setApplications((applicationData as EventApplication[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPendingPage(1);
    setHistoryPage(1);
  }, [selectedEventId, subTab]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyStatusFilter]);

  const handleStatus = async (application: EventApplication, status: EventApplication["status"]) => {
    setUpdatingId(application.id);
    const { error } = await supabase
      .from("event_applications")
      .update({ status })
      .eq("id", application.id);
    if (error) {
      alert(error.message.includes("event capacity reached") ? "정원이 마감되어 더 이상 승인할 수 없습니다." : "처리 실패: " + error.message);
    } else {
      await fetchData();
    }
    setUpdatingId(null);
  };

  const getPageItems = (items: EventApplication[], page: number) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return {
      currentPage: safePage,
      totalPages,
      pageItems: items.slice(start, start + PAGE_SIZE),
    };
  };

  const pendingPageData = getPageItems(pendingApplications, pendingPage);
  const historyPageData = getPageItems(historyApplications, historyPage);

  const tabStyle = (active: boolean) => ({
    padding: "10px 20px",
    borderRadius: 12,
    border: `1px solid ${active ? labelBorder : border}`,
    background: active ? selectedBg : "transparent",
    color: active ? textMain : textMuted,
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
  });

  const selectStyle = {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: inputBg,
    color: textMain,
    fontWeight: 700,
  };

  const renderPagination = (
    totalItems: number,
    currentPage: number,
    totalPages: number,
    setPage: (nextPage: number) => void
  ) => {
    if (totalItems <= PAGE_SIZE) return null;

    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 4 }}>
        <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
          이전
        </Button>
        <span style={{ color: textMuted, fontSize: 13, fontWeight: 700 }}>
          {currentPage} / {totalPages}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
          다음
        </Button>
      </div>
    );
  };

  const renderStatusButton = (application: EventApplication, status: EventApplication["status"]) => {
    if (application.status === status) return null;

    const actionCfg = {
      accepted: { label: "승인", bg: selectedBg, border: labelBorder, color: textMain },
      rejected: { label: "거절", bg: deleteBg, border: deleteBorder, color: "var(--color-brand-red)" },
      cancelled: { label: "취소", bg: labelBg, border: labelBorder, color: textMuted },
      pending: { label: "대기로", bg: labelBg, border: labelBorder, color: textMuted },
    }[status] ?? { label: status, bg: labelBg, border: labelBorder, color: textMuted };

    return (
      <button
        key={status}
        type="button"
        disabled={updatingId === application.id}
        onClick={() => handleStatus(application, status)}
        style={{ padding: "6px 12px", borderRadius: 99, border: `1px solid ${actionCfg.border}`, background: actionCfg.bg, color: actionCfg.color, fontSize: 12, fontWeight: 800, cursor: updatingId === application.id ? "not-allowed" : "pointer", opacity: updatingId === application.id ? 0.55 : 1 }}
      >
        {actionCfg.label}
      </button>
    );
  };

  const renderEditLink = (event: Post | undefined) => {
    if (!event) return null;

    return (
      <Button asChild variant="outline" size="sm" className="h-8 min-w-[82px] justify-center rounded-[10px] px-3 text-[13px]">
        <Link to={`/events/${event.id}/apply`}><ExternalLink size={14} />편집</Link>
      </Button>
    );
  };

  const renderActionRow = (
    application: EventApplication,
    actionStatuses: EventApplication["status"][],
    event?: Post
  ) => {
    const actionItems = actionStatuses
      .filter(status => application.status !== status)
      .map(status => renderStatusButton(application, status));

    if (!event && actionItems.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 md:justify-end">
        {renderEditLink(event)}
        {actionItems}
      </div>
    );
  };

  const getBadgeVariant = (status: EventApplication["status"]) => {
    if (status === "accepted") return "green";
    if (status === "rejected") return "red";
    if (status === "cancelled") return "secondary";
    return "yellow";
  };

  const renderApplicationCard = (application: EventApplication, actionStatuses: EventApplication["status"][]) => {
    const event = eventById.get(application.post_id);
    const cfg = EVENT_APPLICATION_STATUS[application.status];
    const eventConfig = mergeEventFormConfig(event?.event_form_config);
    const answers = application.answers ?? {};
    const knownAnswerIds = new Set(eventConfig.customQuestions.map(question => question.id));
    const unknownAnswers = Object.entries(answers).filter(([questionId, answer]) => !knownAnswerIds.has(questionId) && String(answer).trim());
    const badgeVariant = getBadgeVariant(application.status);
    const createdDate = new Date(application.created_at).toLocaleDateString("ko-KR");
    const actionRow = renderActionRow(application, actionStatuses, event);

    return (
      <div key={application.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
              <strong style={{ color: textMain, fontSize: 16 }}>{application.applicant_name}</strong>
              <span style={{ color: textMuted, fontSize: 13 }}>{application.company_tech}</span>
              <Badge variant={badgeVariant} shape="pill">{cfg.label}</Badge>
            </div>
            <div style={{ color: textMuted, fontSize: 13 }}>
              {event?.title ?? "행사 없음"} · {application.email} · {application.phone || "연락처 없음"}
            </div>
          </div>
          <div style={{ color: textMuted, fontSize: 12, whiteSpace: "nowrap", paddingTop: 2 }}>{createdDate}</div>
        </div>

        <div style={{ color: textMain, background: labelBg, border: `1px solid ${labelBorder}`, padding: "12px 16px", borderRadius: 10, display: "grid", gap: 10 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <strong style={{ fontSize: 12 }}>직책</strong>
              <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{application.position || "없음"}</p>
            </div>
            <div>
              <strong style={{ fontSize: 12 }}>관심 분야</strong>
              <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{application.interests.join(", ") || "없음"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <strong style={{ fontSize: 12 }}>기대하는 부분</strong>
              <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{application.expectation || "없음"}</p>
            </div>
            <div>
              <strong style={{ fontSize: 12 }}>사전 질문</strong>
              <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{application.speaker_question || "없음"}</p>
            </div>
          </div>
          {(eventConfig.customQuestions.length > 0 || unknownAnswers.length > 0) && (
            <div style={{ display: "grid", gap: 8 }}>
              <strong style={{ fontSize: 12 }}>추가 질문 답변</strong>
            {eventConfig.customQuestions.map(question => {
              const answer = answers[question.id];
              return (
                <div key={question.id}>
                  <strong style={{ fontSize: 12 }}>{question.label}</strong>
                  <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{answer || "응답 없음"}</p>
                </div>
              );
            })}
            {unknownAnswers.map(([questionId, answer]) => (
              <div key={questionId}>
                <strong style={{ fontSize: 12 }}>삭제된 질문</strong>
                <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{String(answer)}</p>
              </div>
            ))}
            </div>
          )}
        </div>

        {actionRow}
      </div>
    );
  };

  if (loading && events.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: textMain }}>행사 관리</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 100, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
        {[0, 1, 2, 3].map(i => <div key={i} style={{ height: 92, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: textMain, margin: 0 }}>행사 관리</h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {([
          ["overview", "행사 현황"],
          ["pending", `신청 승인 ${pendingApplications.length ? `(${pendingApplications.length})` : ""}`],
          ["history", "처리 내역"],
        ] as [SubTab, string][]).map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setSubTab(tab)} style={tabStyle(subTab === tab)}>
            {label}
          </button>
        ))}
      </div>

      {subTab !== "overview" && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={selectStyle}>
            <option value="all">전체 행사</option>
            {events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
          {subTab === "history" && (
            <select value={historyStatusFilter} onChange={e => setHistoryStatusFilter(e.target.value as HistoryStatusFilter)} style={selectStyle}>
              <option value="all">전체 상태</option>
              <option value="accepted">승인</option>
              <option value="rejected">거절</option>
              <option value="cancelled">취소</option>
            </select>
          )}
        </div>
      )}

      {subTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {events.map(event => {
            const counts = countsByEvent.get(event.id) ?? { accepted: 0, total: 0 };
            const remaining = event.capacity == null ? null : Math.max(event.capacity - counts.accepted, 0);
            return (
              <Link key={event.id} to={`/events/${event.id}/apply`} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 18, textDecoration: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                <strong style={{ color: textMain, fontSize: 14, lineHeight: 1.4 }}>{event.title}</strong>
                <span style={{ color: textMuted, fontSize: 12 }}>{event.event_date || "일시 미정"}</span>
                <span style={{ alignSelf: "flex-start", color: textMuted, background: labelBg, border: `1px solid ${labelBorder}`, borderRadius: 8, padding: "4px 8px", fontSize: 12, fontWeight: 800 }}>
                  승인 {counts.accepted}명{remaining != null ? ` · 잔여 ${remaining}석` : ""}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {subTab === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pendingApplications.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted, background: card, border: `1px solid ${border}`, borderRadius: 18 }}>승인 대기 중인 신청이 없습니다.</div>
          ) : (
            <>
              {pendingPageData.pageItems.map(application => renderApplicationCard(application, ["accepted", "rejected", "cancelled"]))}
              {renderPagination(pendingApplications.length, pendingPageData.currentPage, pendingPageData.totalPages, setPendingPage)}
            </>
          )}
        </div>
      )}

      {subTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {historyApplications.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted, background: card, border: `1px solid ${border}`, borderRadius: 18 }}>처리된 신청 내역이 없습니다.</div>
          ) : (
            <>
              {historyPageData.pageItems.map(application => renderApplicationCard(application, ["pending", "accepted", "rejected", "cancelled"]))}
              {renderPagination(historyApplications.length, historyPageData.currentPage, historyPageData.totalPages, setHistoryPage)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminEventManagement;
