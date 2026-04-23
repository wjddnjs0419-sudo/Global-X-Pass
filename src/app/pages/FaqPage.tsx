import { useState } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

const CATEGORIES = ["전체", "멤버십", "프로그램", "행사", "플랫폼"];

const FAQS = [
  {
    id: 1, category: "멤버십",
    q: "NCF 멤버십은 어떻게 가입하나요?",
    a: "홈페이지 우측 상단의 '로그인' 버튼을 통해 회원가입 후 멤버십 신청 양식을 작성하시면 됩니다. 심사 후 3~5 영업일 내로 가입 승인 여부를 이메일로 안내드립니다.",
  },
  {
    id: 2, category: "멤버십",
    q: "멤버십 혜택에는 어떤 것들이 포함되나요?",
    a: "NCF 멤버십에는 ① 월간 네트워킹 행사 참가 우선권, ② 창구 프로그램 지원 자격, ③ 자료실 프리미엄 콘텐츠 무제한 열람, ④ 1:1 전문가 멘토링 세션, ⑤ 글로벌 파트너사 소개 등의 혜택이 포함됩니다.",
  },
  {
    id: 3, category: "프로그램",
    q: "창구 프로그램 지원 자격 조건이 어떻게 되나요?",
    a: "창구 프로그램은 ① 법인 설립 후 7년 이내의 스타트업, ② 정보통신기술(ICT) 기반 비즈니스 모델 보유, ③ NCF 멤버십 보유 기업을 대상으로 합니다. 세부 요건은 각 기수별 모집 공고에서 확인하실 수 있습니다.",
  },
  {
    id: 4, category: "프로그램",
    q: "글로벌 파트너십 프로그램과 창구 프로그램은 어떻게 다른가요?",
    a: "창구 프로그램은 국내 스타트업 성장을 위한 액셀러레이팅 프로그램이며, 글로벌 파트너십 프로그램(Global X)은 해외 파트너사와의 협력을 통해 글로벌 진출을 직접 지원하는 별도 프로그램입니다. 두 프로그램 중복 지원이 가능합니다.",
  },
  {
    id: 5, category: "행사",
    q: "행사 참가 신청은 어떻게 하나요?",
    a: "'행사' 메뉴에서 원하시는 행사를 선택 후 '신청하기' 버튼을 클릭하시면 됩니다. 멤버십 회원은 우선 신청 혜택이 있으며, 일부 행사는 별도 심사를 통해 참가자를 선발합니다.",
  },
  {
    id: 6, category: "행사",
    q: "행사 신청 후 취소가 가능한가요?",
    a: "행사 일자 기준 3일 전까지는 마이페이지에서 자유롭게 취소 가능합니다. 3일 이내 취소 시에는 사전에 고객센터(ncf@aroundx.kr)로 이메일 문의를 부탁드립니다.",
  },
  {
    id: 7, category: "플랫폼",
    q: "플랫폼 계정 정보 변경은 어디서 하나요?",
    a: "로그인 후 우측 상단 '마이페이지 → 계정 설정'에서 이름, 이메일, 비밀번호, 소속 기업 정보 등을 수정하실 수 있습니다.",
  },
  {
    id: 8, category: "플랫폼",
    q: "자료실 자료 다운로드에 제한이 있나요?",
    a: "비회원은 무료 공개 자료만 열람 가능하며, 멤버십 회원은 프리미엄 자료를 포함한 모든 자료를 무제한 다운로드할 수 있습니다. 단, 자료의 상업적 재배포는 금지됩니다.",
  },
];

export function FaqPage() {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openId, setOpenId] = useState<number | null>(1);

  const filtered = FAQS.filter((f) => activeCategory === "전체" || f.category === activeCategory);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)";

  return (
    <PageShell title="FAQ" subtitle="자주 묻는 질문들을 모았습니다. 원하시는 답변을 찾아보세요." accentColor="#FBBF24">
      {/* Contact banner */}
      <div
        style={{
          background: isDark ? "rgba(32,214,162,0.08)" : "rgba(32,214,162,0.06)",
          border: "1px solid rgba(32,214,162,0.2)",
          borderRadius: 16, padding: "20px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, marginBottom: 40,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: textMain, marginBottom: 4 }}>
            원하시는 답변을 못 찾으셨나요?
          </div>
          <div style={{ fontSize: 13, color: textMuted }}>
            고객센터(ncf@aroundx.kr)로 문의주시면 1 영업일 내로 답변드립니다.
          </div>
        </div>
        <button
          style={{
            padding: "10px 22px", borderRadius: 10, border: "none",
            background: "#20D6A2", color: "#0a1020",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Pretendard', sans-serif", flexShrink: 0,
          }}
        >
          문의하기
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "8px 20px", borderRadius: 100, border: "none", cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 14, fontWeight: 600,
              background: activeCategory === cat ? "#FBBF24" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: activeCategory === cat ? "#0a1020" : textMuted,
              transition: "all 0.2s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              style={{
                background: card,
                border: `1px solid ${isOpen ? "rgba(251,191,36,0.4)" : border}`,
                borderRadius: 16,
                overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}
            >
              {/* Question */}
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "20px 24px",
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span
                    style={{
                      flexShrink: 0, marginTop: 2,
                      width: 22, height: 22, borderRadius: 6,
                      background: isOpen ? "#FBBF24" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      color: isOpen ? "#0a1020" : textMuted,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800,
                      transition: "all 0.2s ease",
                    }}
                  >
                    Q
                  </span>
                  <span
                    style={{
                      fontSize: 16, fontWeight: 700,
                      color: isOpen ? (isDark ? "#fff" : "#0f172a") : textMain,
                      lineHeight: 1.4,
                    }}
                  >
                    {faq.q}
                  </span>
                </div>
                <span
                  style={{
                    flexShrink: 0, fontSize: 18, color: isOpen ? "#FBBF24" : textMuted,
                    transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.25s ease, color 0.2s ease",
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
              </button>

              {/* Answer */}
              {isOpen && (
                <div
                  style={{
                    padding: "0 24px 22px 58px",
                    fontSize: 14, color: textMuted, lineHeight: 1.8,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
