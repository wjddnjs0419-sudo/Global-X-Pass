import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { LAYERS } from "../../../lib/layers";

export function NotificationBell({ isDark }: { isDark: boolean }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(30);
      if (data) setLogs(data);
    };
    fetchLogs();

    const channel = supabase
      .channel('realtime-activity-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setLogs((prev) => [payload.new, ...prev].slice(0, 30));
          if (!isOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const bg = "var(--color-bg-elevated)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const text = "var(--color-text-primary)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const labelBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "#ffffff";

  return (
    <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: LAYERS.adminFloatingPopover }}>
      {isOpen && (
        <div style={{ 
          position: "absolute", bottom: "70px", right: 0, width: "360px", maxHeight: "450px",
          background: bg, borderRadius: "16px", border: `1px solid ${border}`,
          boxShadow: "0 18px 44px rgba(15,23,42,0.18)", overflow: "hidden",
          display: "flex", flexDirection: "column", animation: "fadeInUp 0.2s ease-out"
        }}>
          <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, fontWeight: 800, color: text, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            활동 로그
            <span style={{ fontSize: "12px", fontWeight: 700, color: textMuted, background: labelBg, border: `1px solid ${labelBorder}`, padding: "4px 8px", borderRadius: "8px" }}>최근 30건</span>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "10px" }}>
            {logs.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: textMuted, fontSize: "14px" }}>아직 기록된 활동이 없습니다.</div>
            ) : (
              logs.map((log) => {
                const isInsert = log.action === 'INSERT';
                const isUpdate = log.action === 'UPDATE';
                const title = isInsert ? "새 게시물 작성" : isUpdate ? "게시물 수정" : "게시물 삭제";
                const postTitle = log.new_data?.title || log.old_data?.title || "제목 없음";
                const worker = log.user_name || (log.user_email ? log.user_email.split('@')[0] : (log.email ? log.email.split('@')[0] : "알 수 없음"));
                const dotColor = isInsert ? "rgba(24,163,67,0.65)" : isUpdate ? "rgba(67,119,241,0.62)" : "rgba(234,67,53,0.65)";

                return (
                  <div key={log.id} style={{ display: "flex", padding: "12px", borderRadius: "12px", transition: "background 0.2s" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: dotColor, marginTop: "6px", marginRight: "12px", flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: text, marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                        <span>
                          {title} 
                          <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: 700, background: labelBg, border: `1px solid ${labelBorder}`, color: textMuted, padding: "2px 6px", borderRadius: "4px" }}>
                            by {worker}
                          </span>
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 500, color: textMuted }}>{formatTimeAgo(log.created_at)}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {postTitle}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "52px", height: "52px", borderRadius: "50%", background: selectedBg, border: `1px solid ${labelBorder}`,
          boxShadow: "0 12px 28px rgba(15,23,42,0.14)", cursor: "pointer", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.78">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: "0", right: "0", background: "#ef4444", color: "#fff",
            fontSize: "12px", fontWeight: 800, padding: "2px 6px", borderRadius: "20px",
            border: "2px solid #fff", minWidth: "18px", textAlign: "center"
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>
    </div>
  );
}
