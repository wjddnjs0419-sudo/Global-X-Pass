import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../../ThemeContext";
import { CATEGORIES, getLocalDateString } from "./adminConstants";
import { supabase } from "../../../lib/supabaseClient";
import { logSupabaseFailure } from "../../../lib/uxTelemetry";
import { useBoardCategoryLabels } from "../../BoardCategoriesContext";
import type { Post } from "../../../lib/types";

interface AdminDashboardProps {
  refreshKey: number;
}

type DashboardTopPost = Pick<Post, "id" | "title" | "category" | "views" | "created_at">;

type DashboardPageViewSeriesRow = {
  view_date: string;
  view_count: number;
  cumulative_before: number;
};

export function AdminDashboard({ refreshKey }: AdminDashboardProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const boardLabels = useBoardCategoryLabels();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, posts: 0, visitors: 0 });
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [chartData, setChartData] = useState<{ fullDate: string; label: string; views: number; cumulative: number }[]>([]);
  const [topPosts, setTopPosts] = useState<DashboardTopPost[]>([]);
  const chartPeriodRef = useRef(chartPeriod);
  const hasLoadedDashboardRef = useRef(false);

  const card     = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted= isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const skBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const panelBg = isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.035)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "#ffffff";
  const labelBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";

  const Sk = ({ w = "100%", h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: skBg, animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  const getChartLabel = useCallback((fullDate: string, index: number, period: number) => {
    const d = new Date(`${fullDate}T00:00:00`);
    if (period === 7) {
      return index === period - 1 ? "오늘" : `${d.getMonth() + 1}/${d.getDate()}`;
    }
    if (index === 0 || index === period - 1 || index % 7 === 0) {
      return index === period - 1 ? "오늘" : `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return "";
  }, []);

  const applyChartRows = useCallback((rows: DashboardPageViewSeriesRow[], period: number) => {
    let running = rows[0]?.cumulative_before ?? 0;
    setChartData(
      rows.map((row, index) => {
        running += row.view_count ?? 0;
        return {
          fullDate: row.view_date,
          label: getChartLabel(row.view_date, index, period),
          views: row.view_count ?? 0,
          cumulative: running,
        };
      }),
    );
  }, [getChartLabel]);

  const fetchChartDataFallback = useCallback(async (period: number) => {
    const today = new Date();
    const days = [...Array(period)].map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - ((period - 1) - i));
      return { fullDate: getLocalDateString(d), label: "", views: 0, cumulative: 0 };
    });

    const periodAgo = new Date();
    periodAgo.setDate(today.getDate() - (period - 1));
    periodAgo.setHours(0, 0, 0, 0);

    const [{ data }, { count: totalBefore, error: beforeError }] = await Promise.all([
      supabase.from('page_views').select('created_at').gte('created_at', periodAgo.toISOString()),
      supabase.from('page_views').select('id', { count: 'exact', head: true }).lt('created_at', periodAgo.toISOString()),
    ]);

    if (beforeError) {
      logSupabaseFailure("admin-page", "page_views.before_count_fallback", beforeError, {
        severity: "low",
        context: { period },
      });
    }

    let running = totalBefore || 0;
    data?.forEach((view) => {
      const dateStr = getLocalDateString(new Date(view.created_at));
      const day = days.find((entry) => entry.fullDate === dateStr);
      if (day) day.views += 1;
    });
    days.forEach((day, index) => {
      running += day.views;
      day.cumulative = running;
      day.label = getChartLabel(day.fullDate, index, period);
    });
    setChartData(days);
  }, [getChartLabel]);

  const fetchChartData = useCallback(async (period: number) => {
    const { data, error } = await supabase.rpc('admin_dashboard_page_view_series', { p_days: period });
    if (error || !data) {
      if (error) {
        logSupabaseFailure("admin-page", "admin_dashboard_page_view_series", error, {
          severity: "low",
          context: { period },
        });
      }
      await fetchChartDataFallback(period);
      return;
    }

    applyChartRows(data as DashboardPageViewSeriesRow[], period);
  }, [applyChartRows, fetchChartDataFallback]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      { count: totalViews, error: viewsError },
      { count: totalPosts, error: postsError },
      { data: visitorCount, error: visitorError },
      { data: topPostsData, error: topPostsError },
    ] = await Promise.all([
      supabase.from('page_views').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.rpc('count_distinct_visitors'),
      supabase
        .from('posts')
        .select('id, title, views, created_at, category')
        .order('views', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(5),
    ]);

    if (viewsError) {
      logSupabaseFailure("admin-page", "page_views.total_count", viewsError, { severity: "low" });
    }
    if (postsError) {
      logSupabaseFailure("admin-page", "posts.total_count", postsError, { severity: "low" });
    }
    if (visitorError) {
      logSupabaseFailure("admin-page", "count_distinct_visitors", visitorError, { severity: "low" });
    }
    if (topPostsError) {
      logSupabaseFailure("admin-page", "posts.top_five", topPostsError, { severity: "low" });
    }

    setStats({
      views: totalViews || 0,
      posts: totalPosts || 0,
      visitors: (visitorCount as number | null) || 0,
    });
    setTopPosts((topPostsData as DashboardTopPost[] | null) ?? []);
    await fetchChartData(chartPeriodRef.current);
    hasLoadedDashboardRef.current = true;
    setLoading(false);
  }, [fetchChartData]);

  useEffect(() => {
    chartPeriodRef.current = chartPeriod;
  }, [chartPeriod]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll, refreshKey]);

  useEffect(() => {
    if (!hasLoadedDashboardRef.current) return;
    void fetchChartData(chartPeriod);
  }, [chartPeriod, fetchChartData]);

  const maxViews = Math.max(...chartData.map(d => d.views), 1);
  const maxCumul = Math.max(...chartData.map(d => d.cumulative), 1);
  const chartW = 400, chartH = 150;
  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const getCategoryLabel = (id: string) => {
    const fallback = CATEGORIES.find(c => c.id === id)?.label ?? id;
    return id === "expenses" ? fallback : boardLabels[id] ?? fallback;
  };
  const getPoints = (key: 'views' | 'cumulative', max: number) =>
    chartData.map((d, i) => `${(i * (chartW / (chartPeriod - 1)))},${chartH - (d[key] / max * chartH)}`).join(" ");

  if (loading) return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mb-[28px]">
        {[0, 1, 2].map(i => (
          <div key={i} style={{ background: card, padding: "24px", borderRadius: "16px", border: `1px solid ${border}` }}>
            <Sk w="60%" h={14} r={6} />
            <div style={{ marginTop: 14 }}><Sk w="40%" h={36} r={8} /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[18px] mb-[48px]">
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "24px", height: "300px", boxSizing: "border-box" }}>
          <Sk w="30%" h={20} r={6} />
          <div style={{ marginTop: 32, display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
            {[...Array(12)].map((_, i) => <Sk key={i} w="6%" h={30 + Math.random() * 120} r={6} />)}
          </div>
        </div>
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "24px", height: "300px", boxSizing: "border-box" }}>
          <Sk w="50%" h={20} r={6} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 32 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Sk w={24} h={24} r={6} />
                <Sk w="70%" h={16} r={4} />
                <Sk w={40} h={16} r={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        {[{ label: "누적 접속량", value: stats.views }, { label: "누적 방문자", value: stats.visitors }, { label: "전체 게시물", value: stats.posts }].map((item) => (
          <div key={item.label} style={{ background: card, padding: "22px", borderRadius: "16px", border: `1px solid ${border}` }}>
            <div style={{ color: textMuted, fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>{item.label}</div>
            <div style={{ fontSize: "clamp(30px, 6vw, 34px)", fontWeight: 850, color: textMain }}>{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[18px] mb-[48px]">
        <div className="min-w-0" style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "22px", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, color: textMain, fontSize: "20px", fontWeight: 800 }}>방문 및 누적 추이</h3>
              <div style={{ display: "flex", background: panelBg, padding: "4px", borderRadius: "8px", border: `1px solid ${border}` }}>
                <button onClick={() => setChartPeriod(7)}  style={{ padding: "5px 12px", fontSize: "13px", fontWeight: 750, borderRadius: "7px", border: `1px solid ${chartPeriod === 7 ? labelBorder : "transparent"}`, cursor: "pointer", background: chartPeriod === 7  ? selectedBg : "transparent", color: chartPeriod === 7  ? textMain : textMuted, boxShadow: "none", transition: "all 0.2s" }}>7일</button>
                <button onClick={() => setChartPeriod(30)} style={{ padding: "5px 12px", fontSize: "13px", fontWeight: 750, borderRadius: "7px", border: `1px solid ${chartPeriod === 30 ? labelBorder : "transparent"}`, cursor: "pointer", background: chartPeriod === 30 ? selectedBg : "transparent", color: chartPeriod === 30 ? textMain : textMuted, boxShadow: "none", transition: "all 0.2s" }}>30일</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", fontSize: "12px", flexWrap: "wrap" }}>
              <span style={{ color: isDark ? "rgba(147,180,248,0.78)" : "rgba(67,119,241,0.72)" }}>● 일간 (좌축)</span>
              <span style={{ color: isDark ? "rgba(76,214,180,0.72)" : "rgba(15,163,127,0.68)" }}>--- 누적 (우축)</span>
            </div>
          </div>
          <div style={{ width: "100%", height: "180px", position: "relative", paddingLeft: "32px", paddingRight: "40px", boxSizing: "border-box" }}>
            {/* 축 값 숫자는 HTML 오버레이로 — preserveAspectRatio="none" SVG에 두면 글자가 가로로 늘어나기 때문 */}
            <span style={{ position: "absolute", left: 0, top: 0, width: 28, textAlign: "right", fontSize: "9px", fontWeight: 700, color: "var(--color-accent-blue)" }}>{fmtNum(maxViews)}</span>
            <span style={{ position: "absolute", left: 0, top: "140px", width: 28, textAlign: "right", fontSize: "9px", color: "var(--color-accent-blue)", opacity: 0.5 }}>0</span>
            <span style={{ position: "absolute", right: 0, top: 0, width: 36, textAlign: "left", fontSize: "9px", fontWeight: 700, color: "var(--color-accent-ncf)" }}>{fmtNum(maxCumul)}</span>
            <span style={{ position: "absolute", right: 0, top: "140px", width: 36, textAlign: "left", fontSize: "9px", color: "var(--color-accent-ncf)", opacity: 0.5 }}>0</span>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" style={{ width: "100%", height: "calc(100% - 32px)", overflow: "visible" }}>
              {[0, 0.5, 1].map(t => (
                <line key={t} x1={0} y1={chartH * (1 - t)} x2={chartW} y2={chartH * (1 - t)} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              <polyline fill="none" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={getPoints('views', maxViews)} style={{ stroke: "var(--color-accent-blue)", transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <polyline fill="none" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={getPoints('cumulative', maxCumul)} style={{ stroke: "var(--color-accent-ncf)", transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)", strokeDasharray: "6 3" }} />
            </svg>
            <div style={{ position: "relative", height: "20px", marginTop: "12px" }}>
              {chartData.map((d, i) => d.label && (
                <span key={d.fullDate} style={{ position: "absolute", left: `${(i / (chartPeriod - 1)) * 100}%`, transform: `translateX(${i === 0 ? "0" : i === chartPeriod - 1 ? "-100%" : "-50%"})`, whiteSpace: "nowrap", fontSize: "12px", color: textMuted, fontWeight: 700 }}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0" style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 24px 0", color: textMain, fontSize: "20px", fontWeight: 800 }}>인기 게시물 Top 5</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {topPosts.length === 0
              ? <div style={{ color: textMuted, fontSize: "15px", textAlign: "center", padding: "20px" }}>데이터가 없습니다.</div>
              : topPosts.map((post, i) => (
                <div key={post.id} className="flex min-w-0 items-center gap-3" style={{ cursor: "pointer" }} onClick={() => navigate(`/post/${post.id}`)}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: i < 3 ? (isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)") : panelBg, border: `1px solid ${labelBorder}`, color: i < 3 ? textMain : textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <span style={{ fontSize: "11px", background: labelBg, border: `1px solid ${labelBorder}`, color: textMuted, padding: "4px 7px", borderRadius: "7px", fontWeight: 700, whiteSpace: "nowrap" }}>{getCategoryLabel(post.category)}</span>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: textMain, fontSize: "15px", fontWeight: 600 }}>{post.title}</div>
                  </div>
                  <div style={{ fontSize: "13px", color: textMuted, fontWeight: 700, flexShrink: 0 }}>{post.views || 0}회</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
