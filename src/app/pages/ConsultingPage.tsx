import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { ConsultingBookingModal } from "../components/ConsultingBookingModal";
import { Skeleton } from "../components/ui/skeleton";
import type { Consultant } from "../../lib/types";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import {
  type ConsultingCategory,
  CONSULTING_CATEGORIES_TABLE,
  DEFAULT_CONSULTING_CATEGORIES,
} from "../constants/consultingCategories";

export function ConsultingPage() {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState<ConsultingCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Consultant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  // 카테고리 fetch + Realtime 구독
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      const { data, error: err } = await supabase
        .from(CONSULTING_CATEGORIES_TABLE)
        .select("*")
        .order("display_order");
      if (!isMounted) return;
      const cats = (data as ConsultingCategory[] | null) ?? DEFAULT_CONSULTING_CATEGORIES;
      setCategories(cats.length > 0 ? cats : DEFAULT_CONSULTING_CATEGORIES);
      setCategoriesLoading(false);
      if (err) console.error("consulting_categories fetch error:", err);
    };

    fetchCategories();

    const channel = supabase
      .channel("consulting_categories_page")
      .on("postgres_changes", { event: "*", schema: "public", table: CONSULTING_CATEGORIES_TABLE }, fetchCategories)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // 카테고리 변경 시 activeTab 유효성 유지
  useEffect(() => {
    if (categories.length === 0) return;
    setActiveTab(prev =>
      categories.some(c => c.id === prev) ? prev : categories[0].id
    );
  }, [categories]);

  // 전문가 fetch — isMounted로 Race Condition 방지
  useEffect(() => {
    if (!activeTab) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from("consultants")
      .select("*")
      .eq("category", activeTab)
      .eq("is_active", true)
      .order("display_order")
      .then(({ data, error: err }) => {
        if (!isMounted) return;
        if (err) {
          console.error("consultants fetch error:", err);
          setError(err.message);
        }
        setConsultants((data as Consultant[]) || []);
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeTab]);

  return (
    <PageShell title="1:1 컨설팅 지원" subtitle="분야별 전문가와 온디맨드 오피스 아워를 예약하세요" accentColor="var(--color-accent-blue)">
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 80 }}>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {categoriesLoading
            ? [0, 1, 2].map(i => (
                <div key={i} style={{ width: 110, height: 40, borderRadius: 12, background: "var(--color-skeleton-bg)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))
            : categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  style={getFilterTabStyle(isDark, activeTab === cat.id)}
                >
                  {cat.label}
                </button>
              ))
          }
        </div>

        {/* Error state */}
        {error && (
          <div style={{ background: "var(--color-danger-soft-bg)", border: "1px solid var(--color-danger-soft-border)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "var(--color-brand-red)", fontSize: 14, fontWeight: 600 }}>
            데이터 로드 오류: {error}
          </div>
        )}

        {/* Consultant grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : consultants.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>등록된 전문가가 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {consultants.map(c => (
              <div
                key={c.id}
                style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16, transition: "all 0.25s", boxShadow: "var(--shadow-card-rest)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-card-rest)"; }}
              >
                {/* Profile photo */}
                <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <span style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)" }}>{c.name[0]}</span>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: 18, marginBottom: 7 }}>{c.name}</div>
                  {c.bio && <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0, lineHeight: 1.65 }}>{c.bio}</p>}
                </div>

                {c.expertise.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {c.expertise.map(ex => (
                      <span key={ex} style={getMutedLabelStyle(isDark)}>{ex}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setSelected(c)}
                  style={{ marginTop: "auto", padding: "13px 14px", borderRadius: 12, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 700, cursor: "pointer", fontSize: 15, transition: "filter 0.2s" }}
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
