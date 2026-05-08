import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import { Skeleton } from "../components/ui/skeleton";
import type { Post } from "../../lib/types";

export function ExpensesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setUserRole(profile?.role ?? "user");
      }
      setAuthLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (userRole !== "admin" && userRole !== "participant")) { setPostsLoading(false); return; }

    supabase
      .from("posts")
      .select("*")
      .eq("category", "expenses")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as Post[]) || []);
        setPostsLoading(false);
      });
  }, [authLoading, user, userRole]);

  const isLoading = authLoading || postsLoading;

  const renderGate = () => {
    if (!user) return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: textMain, fontWeight: 800, marginBottom: 12 }}>로그인이 필요합니다</h2>
        <p style={{ color: textMuted, marginBottom: 24 }}>사업비 자료실은 프로그램 참여 기업 담당자만 열람할 수 있습니다.</p>
        <button onClick={() => navigate("/login")} style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
          로그인하기
        </button>
      </div>
    );

    if (userRole !== "admin" && userRole !== "participant") return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ color: textMain, fontWeight: 800, marginBottom: 12 }}>접근 권한이 없습니다</h2>
        <p style={{ color: textMuted }}>해당 자료실은 지정된 그룹 멤버만 열람할 수 있습니다.<br />담당 운영자에게 문의해주세요.</p>
      </div>
    );

    return null;
  };

  return (
    <PageShell title="사업비 자료실" subtitle="프로그램 참여 기업 전용 사업비 관련 자료" accentColor="#EA4335">
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 80 }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "24px 28px", display: "flex", gap: 16 }}>
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : renderGate() ?? (
          posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: textMuted }}>등록된 자료가 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 28px", background: card, border: `1px solid ${border}`, borderRadius: 20, cursor: "pointer", transition: "all 0.2s", boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#EA433555"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = border; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(234,67,53,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 16, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</div>
                    <div style={{ fontSize: 13, color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cleanText(post.content)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: textMuted, flexShrink: 0 }}>{new Date(post.created_at).toLocaleDateString()}</div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </PageShell>
  );
}
