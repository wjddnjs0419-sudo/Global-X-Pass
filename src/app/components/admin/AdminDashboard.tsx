import { useNavigate } from "react-router";
import { useTheme } from "../../ThemeContext";
import { CATEGORIES } from "./adminConstants";

interface AdminDashboardProps {
  stats: { views: number; posts: number; visitors: number };
  chartPeriod: 7 | 30;
  setChartPeriod: (period: 7 | 30) => void;
  chartData: { fullDate: string; label: string; views: number; cumulative: number }[];
  topPosts: any[];
}

export function AdminDashboard({ stats, chartPeriod, setChartPeriod, chartData, topPosts }: AdminDashboardProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";

  const maxViews = Math.max(...chartData.map(d => d.views), 1);
  const maxCumul = Math.max(...chartData.map(d => d.cumulative), 1);
  const chartW = 400, chartH = 150;
  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const getPoints = (key: 'views' | 'cumulative', max: number) =>
    chartData.map((d, i) => `${(i * (chartW / (chartPeriod - 1)))},${chartH - (d[key] / max * chartH)}`).join(" ");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mb-[40px]">
        {[{ label: "누적 접속량", value: stats.views }, { label: "누적 방문자", value: stats.visitors }, { label: "전체 게시물", value: stats.posts }].map((item) => (
          <div key={item.label} style={{ background: card, padding: "32px", borderRadius: "24px", border: `1px solid ${border}` }}>
            <div style={{ color: textMuted, fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{item.label}</div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: textMain }}>{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[24px] mb-[60px]">
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "24px", padding: "32px", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, color: textMain, fontSize: "18px", fontWeight: 800 }}>방문 및 누적 추이</h3>
              <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                <button onClick={() => setChartPeriod(7)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: chartPeriod === 7 ? "#fff" : "transparent", color: chartPeriod === 7 ? "#4377F1" : textMuted, boxShadow: chartPeriod === 7 ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>7일</button>
                <button onClick={() => setChartPeriod(30)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: chartPeriod === 30 ? "#fff" : "transparent", color: chartPeriod === 30 ? "#4377F1" : textMuted, boxShadow: chartPeriod === 30 ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>30일</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
              <span style={{ color: "#4377F1" }}>● 일간 (좌축)</span>
              <span style={{ color: "#20D6A2" }}>--- 누적 (우축)</span>
            </div>
          </div>
          <div style={{ width: "100%", height: "180px", position: "relative", paddingLeft: "32px", paddingRight: "40px", boxSizing: "border-box" }}>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "calc(100% - 32px)", overflow: "visible" }}>
              {/* 수평 가이드라인 */}
              {[0, 0.5, 1].map((t) => (
                <line key={t} x1={0} y1={chartH * (1 - t)} x2={chartW} y2={chartH * (1 - t)}
                  stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="1" />
              ))}
              {/* 좌축 레이블 (일간) */}
              <text x="-8" y="8" textAnchor="end" fontSize="9" fill="#4377F1" fontWeight="700">{fmtNum(maxViews)}</text>
              <text x="-8" y={chartH} textAnchor="end" fontSize="9" fill="#4377F1" opacity="0.5">0</text>
              {/* 우축 레이블 (누적) */}
              <text x={chartW + 8} y="8" textAnchor="start" fontSize="9" fill="#20D6A2" fontWeight="700">{fmtNum(maxCumul)}</text>
              <text x={chartW + 8} y={chartH} textAnchor="start" fontSize="9" fill="#20D6A2" opacity="0.5">0</text>
              {/* 데이터 라인 */}
              <polyline fill="none" stroke="#4377F1" strokeWidth="3" strokeLinejoin="round" points={getPoints('views', maxViews)} style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <polyline fill="none" stroke="#20D6A2" strokeWidth="3" strokeLinejoin="round" points={getPoints('cumulative', maxCumul)} style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)", strokeDasharray: "6 3" }} />
            </svg>
            <div style={{ position: "relative", height: "20px", marginTop: "12px" }}>
              {chartData.map((d, i) => d.label && (
                <span key={d.fullDate} style={{ position: "absolute", left: `${(i / (chartPeriod - 1)) * 100}%`, transform: "translateX(-50%)", fontSize: "11px", color: textMuted, fontWeight: 700 }}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "24px", padding: "32px" }}>
          <h3 style={{ margin: "0 0 24px 0", color: textMain, fontSize: "18px", fontWeight: 800 }}>인기 게시물 Top 5</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {topPosts.length === 0 ? <div style={{ color: textMuted, fontSize: "14px", textAlign: "center", padding: "20px" }}>데이터가 없습니다.</div> : topPosts.map((post, i) => (
                <div key={post.id} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => navigate(`/post/${post.id}`)}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: i < 3 ? "#4377F1" : border, color: i < 3 ? "#fff" : textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <span style={{ fontSize: "10px", background: isDark ? "rgba(67, 119, 241, 0.15)" : "#eef2ff", color: "#4377F1", padding: "3px 6px", borderRadius: "6px", fontWeight: 700, whiteSpace: "nowrap" }}>{CATEGORIES.find(c => c.id === post.category)?.label}</span>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: textMain, fontSize: "14px", fontWeight: 600 }}>{post.title}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#4377F1", fontWeight: 700, flexShrink: 0 }}>{post.views || 0}회</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
