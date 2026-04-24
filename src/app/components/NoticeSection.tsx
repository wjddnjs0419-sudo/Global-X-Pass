import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";

interface NoticeSectionProps { isDark?: boolean; }

export function NoticeSection({ isDark = false }: NoticeSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 💡 테마별 색상 설정
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchNotices = async () => {
      // 💡 최신 공지사항 3개만 가져오기
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'notice')
        .order('created_at', { ascending: false })
        .limit(3);
      
      setNotices(data || []);
      setLoading(false);
    };
    fetchNotices();
  }, []);

  if (loading || notices.length === 0) return null;

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)",
      background: isDark ? "#070d1a" : "#ffffff",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px" }}>
              공지사항
            </h2>
          </div>
          <Link to="/notice" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "#ef4444", fontSize: "13px", fontWeight: 700, textDecoration: "none",
            padding: "8px 16px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "100px",
          }}>
            전체 공지 보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Notice List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {notices.map((notice) => (
            <div 
              key={notice.id}
              onClick={() => navigate(`/post/${notice.id}`)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "24px 32px", background: th.cardBg, border: `1px solid ${th.cardBorder}`,
                borderRadius: "20px", cursor: "pointer", transition: "all 0.2s ease",
                boxShadow: th.cardShadow
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "#ef444455";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = th.cardBorder;
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "24px", flex: 1, minWidth: 0 }}>
                {/* 💡 날짜 영역 */}
                <div style={{ flexShrink: 0, width: "60px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: textMain }}>
                    {new Date(notice.created_at).getDate()}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: textMuted, textTransform: "uppercase" }}>
                    {new Date(notice.created_at).toLocaleString('en-US', { month: 'short' })}
                  </div>
                </div>

                <div style={{ width: "1px", height: "30px", background: th.rowDivider, flexShrink: 0 }} />

                {/* 💡 텍스트 영역 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                      NOTICE
                    </span>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {notice.title}
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {(notice.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                  </p>
                </div>
              </div>

              {/* 💡 우측 아이콘 */}
              <div style={{ color: textMuted, marginLeft: "20px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}