import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface ResourceSectionProps { isDark?: boolean; }

export function ResourceSection({ isDark = false }: ResourceSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [resources, setResources] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "resources")
        .order("created_at", { ascending: false })
        .limit(4);
      setResources((data as Post[]) || []);
      setLoading(false);
    };
    fetchResources();
  }, []);

  if (!loading && resources.length === 0) return null;


  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)",
      background: "var(--color-bg-surface)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
          {loading ? (
            <>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </>
          ) : (
            <>
              <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px" }}>
                자료실
              </h2>
              <Button variant="outline" shape="pill" size="sm" asChild className={isDark ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : "border-blue-500/20 text-blue-600 hover:bg-blue-50"}>
                <Link to="/resources">
                  전체 자료 보기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </Button>
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "28px", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "24px" }}>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
            ))
          ) : (
            resources.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/post/${item.id}`)}
                style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "28px", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "24px", cursor: "pointer", transition: "all 0.25s ease", boxShadow: th.cardShadow }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 12px 24px rgba(0,0,0,0.4)" : "0 12px 24px rgba(67,119,241,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = th.cardShadow; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(67,119,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-brand-blue)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "12px", color: textMuted, fontWeight: 600 }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: textMain, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cleanText(item.content)}
                  </p>
                </div>
                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-brand-blue)", fontSize: "13px", fontWeight: 700 }}>
                  자료 확인하기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
