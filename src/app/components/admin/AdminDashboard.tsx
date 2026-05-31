import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../../ThemeContext";
import { CATEGORIES, getLocalDateString } from "./adminConstants";
import { supabase } from "../../../lib/supabaseClient";
import { useBoardCategoryLabels } from "../../BoardCategoriesContext";
import type { Post } from "../../../lib/types";

interface AdminDashboardProps {
  refreshKey: number;
}

export function AdminDashboard({ refreshKey }: AdminDashboardProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const boardLabels = useBoardCategoryLabels();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, posts: 0, visitors: 0 });
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [chartData, setChartData] = useState<{ fullDate: string; label: string; views: number; cumulative: number }[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);

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

  const fetchAll = async () => {
    setLoading(true);
    const [{ count: v }, { count: p }, { data: uvCount, error: uvErr }, { data: posts }] = await Promise.all([
      supabase.from('page_views').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.rpc('count_distinct_visitors'),
      // 상위 게시물(조회수 5개)만 필요 → 본문(content) 등 미사용 컬럼 제외해 페이로드 최소화
      supabase.from('posts').select('id, title, views, created_at, category').order('created_at', { ascending: false }),
    ]);
    // RPC 미적용/권한 실패 시 0 으로 조용히 오염되지 않도록: 로깅 + 클라 distinct 폴백
    // (평소엔 RPC 가 서버에서 집계 → 6천행 전송 회피, 실패할 때만 폴백으로 정확도 보존)
    let visitors = (uvCount as number | null) || 0;
    if (uvErr) {
      console.error('방문자 수 집계 RPC 실패 → 클라 폴백(count_distinct_visitors):', uvErr.message);
      const { data: vd } = await supabase.from('page_views').select('visitor_id');
      visitors = new Set((vd ?? []).map((x: { visitor_id: string }) => x.visitor_id)).size;
    }
    setStats({ views: v || 0, posts: p || 0, visitors });
    if (posts) setTopPosts([...(posts as Post[])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5));
    await fetchChartData(chartPeriod);
    setLoading(false);
  };

  const fetchChartData = async (period: number) => {
    const today = new Date();
    const days = [...Array(period)].map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - ((period - 1) - i));
      let label = "";
      if (period === 7) {
        label = i === period - 1 ? "오늘" : `${d.getMonth() + 1}/${d.getDate()}`;
      } else {
        if (i === 0 || i === period - 1 || i % 7 === 0)
          label = i === period - 1 ? "오늘" : `${d.getMonth() + 1}/${d.getDate()}`;
      }
      return { fullDate: getLocalDateString(d), label, views: 0, cumulative: 0 };
    });

    const periodAgo = new Date();
    periodAgo.setDate(today.getDate() - (period - 1));
    periodAgo.setHours(0, 0, 0, 0);

    const [{ data }, { count: totalBefore }] = await Promise.all([
      supabase.from('page_views').select('created_at').gte('created_at', periodAgo.toISOString()),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).lt('created_at', periodAgo.toISOString()),
    ]);

    let running = totalBefore || 0;
    data?.forEach(view => {
      const dateStr = getLocalDateString(new Date(view.created_at));
      const day = days.find(d => d.fullDate === dateStr);
      if (day) day.views += 1;
    });
    days.forEach(day => { running += day.views; day.cumulative = running; });
    setChartData(days);
  };

  useEffect(() => { fetchAll(); }, [refreshKey]);

  useEffect(() => {
    if (!loading) fetchChartData(chartPeriod);
  }, [chartPeriod]);

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
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "22px", overflow: "hidden" }}>
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
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "calc(100% - 32px)", overflow: "visible" }}>
              {[0, 0.5, 1].map(t => (
                <line key={t} x1={0} y1={chartH * (1 - t)} x2={chartW} y2={chartH * (1 - t)} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="1" />
              ))}
              <text x="-8" y="8"      textAnchor="end"   fontSize="9" fill="var(--color-accent-blue)" fontWeight="700">{fmtNum(maxViews)}</text>
              <text x="-8" y={chartH} textAnchor="end"   fontSize="9" fill="var(--color-accent-blue)" opacity="0.5">0</text>
              <text x={chartW + 8} y="8"      textAnchor="start" fontSize="9" fill="var(--color-accent-ncf)" fontWeight="700">{fmtNum(maxCumul)}</text>
              <text x={chartW + 8} y={chartH} textAnchor="start" fontSize="9" fill="var(--color-accent-ncf)" opacity="0.5">0</text>
              <polyline fill="none" strokeWidth="3" strokeLinejoin="round" points={getPoints('views', maxViews)} style={{ stroke: "var(--color-accent-blue)", transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <polyline fill="none" strokeWidth="3" strokeLinejoin="round" points={getPoints('cumulative', maxCumul)} style={{ stroke: "var(--color-accent-ncf)", transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)", strokeDasharray: "6 3" }} />
            </svg>
            <div style={{ position: "relative", height: "20px", marginTop: "12px" }}>
              {chartData.map((d, i) => d.label && (
                <span key={d.fullDate} style={{ position: "absolute", left: `${(i / (chartPeriod - 1)) * 100}%`, transform: "translateX(-50%)", fontSize: "12px", color: textMuted, fontWeight: 700 }}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 24px 0", color: textMain, fontSize: "20px", fontWeight: 800 }}>인기 게시물 Top 5</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {topPosts.length === 0
              ? <div style={{ color: textMuted, fontSize: "15px", textAlign: "center", padding: "20px" }}>데이터가 없습니다.</div>
              : topPosts.map((post, i) => (
                <div key={post.id} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => navigate(`/post/${post.id}`)}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: i < 3 ? (isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)") : panelBg, border: `1px solid ${labelBorder}`, color: i < 3 ? textMain : textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
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
