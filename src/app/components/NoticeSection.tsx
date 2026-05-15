import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { fetchPublicPostPreviews } from "../../utils/publicPostPreviews";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface NoticeSectionProps { isDark?: boolean; }

export function NoticeSection({ isDark = false }: NoticeSectionProps) {
  const th = getSectionTheme();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await fetchPublicPostPreviews("notice", 3);
      setNotices((data as Post[]) || []);
      setLoading(false);
    };
    fetchNotices();
  }, []);

  if (!loading && notices.length === 0) return null;


  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)",
      background: "var(--color-bg-base)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
          {loading ? (
            <>
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </>
          ) : (
            <>
              <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px" }}>
                공지사항
              </h2>
              <Button variant="outline" shape="pill" size="sm" asChild className={isDark ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-red-500/20 text-red-600 hover:bg-red-50"}>
                <Link to="/notice">
                  전체 공지 보기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </Button>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", padding: "var(--space-lg) var(--space-xl)", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "var(--radius-lg)" }}>
                <Skeleton className="h-12 w-14 shrink-0" />
                <div style={{ width: "1px", height: "30px", background: th.rowDivider, flexShrink: 0 }} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                    <Skeleton className="h-5 w-52" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-5 w-5 shrink-0" />
              </div>
            ))
          ) : (
            notices.map((notice) => {
              const date = new Date(notice.created_at);
              return (
                <div
                  key={notice.id}
                  onClick={() => navigate(`/post/${notice.id}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-lg) var(--space-xl)", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "var(--radius-lg)", cursor: "pointer", transition: "all 0.2s ease", boxShadow: th.cardShadow }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-danger-soft-border)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = th.cardBorder; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", flex: 1, minWidth: 0 }}>
                    <div style={{ flexShrink: 0, width: "60px", textAlign: "center" }}>
                      <div style={{ fontSize: "var(--text-body-lg)", fontWeight: 800, color: textMain }}>{date.getDate()}</div>
                      <div style={{ fontSize: "var(--text-label)", fontWeight: 600, color: textMuted, textTransform: "uppercase" }}>
                        {date.toLocaleString("en-US", { month: "short" })}
                      </div>
                    </div>
                    <div style={{ width: "1px", height: "30px", background: th.rowDivider, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <Badge variant="red" shape="pill" showDot>NOTICE</Badge>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {notice.title}
                        </h3>
                      </div>
                      <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cleanText(notice.content)}
                      </p>
                    </div>
                  </div>
                  <div style={{ color: textMuted, marginLeft: "20px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
