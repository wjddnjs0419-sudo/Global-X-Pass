import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { ConsultingBookingModal } from "../components/ConsultingBookingModal";
import { Skeleton } from "../components/ui/skeleton";
import type { Consultant } from "../../lib/types";

type Category = "legal" | "global" | "tech";

const TABS: { id: Category; label: string; color: string }[] = [
  { id: "legal",  label: "법률/특허/회계", color: "#EA4335" },
  { id: "global", label: "글로벌 진출",    color: "#18A343" },
  { id: "tech",   label: "기술 자문",      color: "#4377F1" },
];

export function ConsultingPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Category>("legal");
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Consultant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const skCls = isDark ? "bg-white/[0.07]" : "bg-black/[0.07]";

  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase
      .from("consultants")
      .select("*")
      .eq("category", activeTab)
      .eq("is_active", true)
      .order("display_order")
      .then(({ data, error: err }) => {
        if (err) {
          console.error("consultants fetch error:", err);
          setError(err.message);
        }
        setConsultants((data as Consultant[]) || []);
        setLoading(false);
      });
  }, [activeTab]);

  const activeColor = TABS.find(t => t.id === activeTab)?.color ?? "#4377F1";

  return (
    <PageShell title="1:1 컨설팅 지원" subtitle="분야별 전문가와 온디맨드 오피스 아워를 예약하세요" accentColor="#4377F1">
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 80 }}>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 22px", borderRadius: 99, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s",
                background: activeTab === tab.id ? tab.color : (isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
                color: activeTab === tab.id ? "#fff" : textMuted,
                boxShadow: activeTab === tab.id ? `0 4px 14px ${tab.color}44` : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div style={{ background: "#EA433518", border: "1px solid #EA433540", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#EA4335", fontSize: 13, fontWeight: 600 }}>
            데이터 로드 오류: {error}
          </div>
        )}

        {/* Consultant grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                <Skeleton className={`h-16 w-16 rounded-full ${skCls}`} />
                <Skeleton className={`h-5 w-2/3 ${skCls}`} />
                <Skeleton className={`h-4 w-full ${skCls}`} />
                <Skeleton className={`h-4 w-4/5 ${skCls}`} />
                <Skeleton className={`h-10 w-full rounded-xl ${skCls}`} />
              </div>
            ))}
          </div>
        ) : consultants.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: textMuted }}>등록된 전문가가 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {consultants.map(c => (
              <div
                key={c.id}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 14, transition: "all 0.25s", boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${activeColor}18`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isDark ? "none" : "0 2px 16px rgba(0,0,0,0.05)"; }}
              >
                {/* Profile photo */}
                <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: `${activeColor}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 800, color: activeColor }}>{c.name[0]}</span>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: textMain, fontSize: 17, marginBottom: 6 }}>{c.name}</div>
                  {c.bio && <p style={{ color: textMuted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{c.bio}</p>}
                </div>

                {c.expertise.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {c.expertise.map(ex => (
                      <span key={ex} style={{ fontSize: 11, fontWeight: 700, color: activeColor, background: activeColor + "18", padding: "3px 10px", borderRadius: 99 }}>{ex}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { if (!userId) { alert("로그인이 필요합니다."); return; } setSelected(c); }}
                  style={{ marginTop: "auto", padding: "12px", borderRadius: 12, border: "none", background: activeColor, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "filter 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.1)")}
                  onMouseLeave={e => (e.currentTarget.style.filter = "none")}
                >
                  예약 신청
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <ConsultingBookingModal consultant={selected} isDark={isDark} onClose={() => setSelected(null)} />}
    </PageShell>
  );
}
