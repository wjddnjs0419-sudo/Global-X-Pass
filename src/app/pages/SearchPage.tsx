import { useMemo, useState } from "react";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

type Result = { id: number; type: string; title: string; desc: string; to: string; color: string };

const ALL: Result[] = [
  { id: 1, type: "공지", title: "창구 프로그램 8기 모집 안내", desc: "2026년 8기 모집 공고 및 일정이 공개되었습니다.", to: "/notice", color: "#4285F4" },
  { id: 2, type: "행사", title: "NCF Spring Networking Night 2026", desc: "스타트업·투자자 200명 네트워킹 이벤트.", to: "/events", color: "#20D6A2" },
  { id: 3, type: "행사", title: "글로벌 진출 전략 워크숍 — 동남아 편", desc: "현지 전문가와 함께하는 반일 워크숍.", to: "/events", color: "#20D6A2" },
  { id: 4, type: "뉴스레터", title: "동남아 게임 앱 시장, Q2 성장률 23%", desc: "Vol.32 · 시장 분석", to: "/news", color: "#60A5FA" },
  { id: 5, type: "자료", title: "글로벌 IR 피칭 템플릿 v3", desc: "PDF · 다운로드 1,840회", to: "/resources", color: "#A78BFA" },
  { id: 6, type: "자료", title: "Google Play ASO 가이드 2026", desc: "최신 알고리즘 변경 분석", to: "/resources", color: "#A78BFA" },
  { id: 7, type: "블로그", title: "7기 수료 기업 A사 인터뷰", desc: "동남아 MAU 10만 달성 비결", to: "/blog", color: "#FBBF24" },
  { id: 8, type: "FAQ", title: "지원금은 언제 지급되나요?", desc: "선정 후 단계별 지급 일정 안내.", to: "/faq", color: "#F472B6" },
  { id: 9, type: "아카이브", title: "창구 프로그램 2기 데모데이", desc: "2026.03.28 · 280명 참가", to: "/events/archive", color: "#A78BFA" },
];

const FILTERS = ["전체", "공지", "행사", "뉴스레터", "자료", "블로그", "FAQ", "아카이브"];
const POPULAR = ["창구 프로그램", "데모데이", "IR 템플릿", "동남아", "Google Play"];

export function SearchPage() {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter((r) => filter === "전체" || r.type === filter)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
  }, [query, filter]);

  return (
    <PageShell title="통합 검색" subtitle="공지·행사·자료·뉴스레터를 한 번에 검색하세요." accentColor="#4377F1">
      {/* Search box */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          background: inputBg, border: `1px solid ${inputBorder}`,
          borderRadius: 16, padding: "8px 8px 8px 20px",
          boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.04)",
          marginBottom: 24,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요 (예: 데모데이, IR 템플릿, 동남아)"
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: textMain, fontSize: 15, padding: "14px 0",
            fontFamily: "'Pretendard', sans-serif",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: textMuted, fontSize: 18, padding: "0 8px",
            }}
          >
            ×
          </button>
        )}
        <button
          style={{
            padding: "12px 22px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Pretendard', sans-serif",
          }}
        >
          검색
        </button>
      </div>

      {/* Popular */}
      {!query && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
          <span style={{ fontSize: 12, color: textMuted, fontWeight: 700, letterSpacing: "0.06em" }}>인기 검색어</span>
          {POPULAR.map((p) => (
            <button
              key={p}
              onClick={() => setQuery(p)}
              style={{
                padding: "6px 14px", borderRadius: 100, border: `1px solid ${border}`,
                background: card, color: textMain,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "'Pretendard', sans-serif",
              }}
            >
              #{p}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 18px", borderRadius: 100, border: "none", cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 13, fontWeight: 600,
              background: filter === f ? "#4377F1" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: filter === f ? "#fff" : textMuted,
              transition: "all 0.2s ease",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Result count */}
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 14 }}>
        총 <strong style={{ color: textMain }}>{results.length}</strong>건의 결과
        {query && <> · 검색어 “<strong style={{ color: "#4377F1" }}>{query}</strong>”</>}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div
          style={{
            background: card, border: `1px solid ${border}`,
            borderRadius: 18, padding: "clamp(40px, 8vw, 60px) clamp(20px, 5vw, 32px)", textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: textMain, marginBottom: 6 }}>검색 결과가 없습니다</div>
          <div style={{ fontSize: 13, color: textMuted }}>다른 검색어 또는 필터를 시도해 보세요.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.map((r) => (
            <Link
              key={r.id}
              to={r.to}
              style={{
                display: "block", padding: "20px 24px", borderRadius: 14,
                background: card, border: `1px solid ${border}`,
                textDecoration: "none", color: "inherit",
                transition: "border-color 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = r.color;
                el.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = border;
                el.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 100,
                  background: `${r.color}1A`, color: r.color,
                  fontSize: 11, fontWeight: 700,
                }}>{r.type}</span>
                <span style={{ fontSize: 12, color: textMuted }}>{r.to}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: textMain, marginBottom: 4, letterSpacing: "-0.02em" }}>
                {highlight(r.title, query, r.color)}
              </div>
              <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
                {highlight(r.desc, query, r.color)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function highlight(text: string, q: string, color: string) {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.trim().toLowerCase());
  if (idx === -1) return text;
  const end = idx + q.trim().length;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: `${color}33`, color, padding: "0 2px", borderRadius: 4 }}>{text.slice(idx, end)}</mark>
      {text.slice(end)}
    </>
  );
}
