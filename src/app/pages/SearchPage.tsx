import { useMemo, useState } from "react";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";

type Result = { id: number; type: string; title: string; desc: string; to: string; color: string };

const TYPE_COLOR: Record<string, string> = {
  공지: "var(--color-brand-blue)",
  행사: "var(--color-accent-ncf)",
  미디어: "var(--color-brand-blue)",
  자료: "var(--color-accent-purple)",
  블로그: "var(--color-brand-yellow)",
  FAQ: "var(--color-accent-purple)",
  아카이브: "var(--color-accent-purple)",
};

const ALL: Result[] = [
  { id: 1, type: "공지", title: "창구 프로그램 8기 모집 안내", desc: "2026년 8기 모집 공고 및 일정이 공개되었습니다.", to: "/notice", color: TYPE_COLOR["공지"] },
  { id: 2, type: "행사", title: "NCF Spring Networking Night 2026", desc: "스타트업·투자자 200명 네트워킹 이벤트.", to: "/events", color: TYPE_COLOR["행사"] },
  { id: 3, type: "행사", title: "글로벌 진출 전략 워크숍 — 동남아 편", desc: "현지 전문가와 함께하는 반일 워크숍.", to: "/events", color: TYPE_COLOR["행사"] },
  { id: 4, type: "미디어", title: "동남아 게임 앱 시장, Q2 성장률 23%", desc: "Vol.32 · 시장 분석", to: "/media", color: TYPE_COLOR["미디어"] },
  { id: 5, type: "자료", title: "글로벌 IR 피칭 템플릿 v3", desc: "PDF · 다운로드 1,840회", to: "/resources", color: TYPE_COLOR["자료"] },
  { id: 6, type: "자료", title: "Google Play ASO 가이드 2026", desc: "최신 알고리즘 변경 분석", to: "/resources", color: TYPE_COLOR["자료"] },
  { id: 7, type: "블로그", title: "7기 수료 기업 A사 인터뷰", desc: "동남아 MAU 10만 달성 비결", to: "/blog", color: TYPE_COLOR["블로그"] },
  { id: 8, type: "FAQ", title: "지원금은 언제 지급되나요?", desc: "선정 후 단계별 지급 일정 안내.", to: "/faq", color: TYPE_COLOR["FAQ"] },
  { id: 9, type: "아카이브", title: "창구 프로그램 2기 데모데이", desc: "2026.03.28 · 280명 참가", to: "/events/archive", color: TYPE_COLOR["아카이브"] },
];

const FILTERS = ["전체", "공지", "행사", "미디어", "자료", "블로그", "FAQ", "아카이브"];
const POPULAR = ["창구 프로그램", "데모데이", "IR 템플릿", "동남아", "Google Play"];

export function SearchPage() {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");


  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter((r) => filter === "전체" || r.type === filter)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
  }, [query, filter]);

  return (
    <PageShell title="통합 검색" subtitle="공지·행사·자료·미디어를 한 번에 검색하세요." accentColor="var(--color-accent-blue)">
      {/* Search box */}
      <div
        className="flex items-center gap-3 rounded-2xl py-2 pl-5 pr-2 mb-6"
        style={{
          background: "var(--color-field-bg)", border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-card-rest)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요 (예: 데모데이, IR 템플릿, 동남아)"
          className="flex-1 bg-transparent border-none outline-none text-[15px] py-[14px] font-['Pretendard',sans-serif]"
          style={{ color: "var(--color-text-primary)" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="bg-transparent border-none cursor-pointer text-[18px] px-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            ×
          </button>
        )}
        <button
          className="px-[22px] py-3 rounded-xl border-none text-white text-[14px] font-bold cursor-pointer font-['Pretendard',sans-serif]"
          style={{ background: "var(--color-accent-blue)" }}
        >
          검색
        </button>
      </div>

      {/* Popular */}
      {!query && (
        <div className="flex items-center gap-2.5 flex-wrap mb-7">
          <span className="text-[12px] font-bold tracking-[0.06em]" style={{ color: "var(--color-text-muted)" }}>인기 검색어</span>
          {POPULAR.map((p) => (
            <button
              key={p}
              onClick={() => setQuery(p)}
              className="px-3.5 py-1.5 rounded-[9px] text-[13px] font-medium cursor-pointer font-['Pretendard',sans-serif]"
              style={{ border: "1px solid var(--color-border-soft)", background: "var(--color-surface-card)", color: "var(--color-text-primary)" }}
            >
              #{p}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-[18px] py-[7px] rounded-full border-none cursor-pointer font-['Pretendard',sans-serif] text-[13px] font-semibold transition-all duration-200 ease-in-out"
            style={getFilterTabStyle(isDark, filter === f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Result count */}
      <div className="text-[13px] mb-3.5" style={{ color: "var(--color-text-muted)" }}>
        총 <strong style={{ color: "var(--color-text-primary)" }}>{results.length}</strong>건의 결과
        {query && <> · 검색어 “<strong style={{ color: "var(--color-text-primary)" }}>{query}</strong>”</>}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div
          className="rounded-[18px] text-center"
          style={{
            background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)",
            padding: "clamp(40px, 8vw, 60px) clamp(20px, 5vw, 32px)",
          }}
        >
          <div className="text-[40px] mb-3">🔍</div>
          <div className="text-[16px] font-bold mb-1.5" style={{ color: "var(--color-text-primary)" }}>검색 결과가 없습니다</div>
          <div className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>다른 검색어 또는 필터를 시도해 보세요.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <Link
              key={r.id}
              to={r.to}
              className="block px-6 py-5 rounded-[14px] no-underline text-inherit transition-all duration-200 ease-in-out hover:translate-x-[3px]"
              style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--color-glass-border-strong)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--color-border-soft)";
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span style={getMutedLabelStyle(isDark)}>{r.type}</span>
                <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{r.to}</span>
              </div>
              <div className="text-[16px] font-bold mb-1 tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>
                {highlight(r.title, query, r.color)}
              </div>
              <div className="text-[13px] leading-[1.6]" style={{ color: "var(--color-text-muted)" }}>
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
      <mark className="px-0.5 rounded-[4px]" style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>{text.slice(idx, end)}</mark>
      {text.slice(end)}
    </>
  );
}
