// ─── 뉴스레터 섹션 ────────────────────────────────────────────────
import { useState } from "react";
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";

interface NewsletterSectionProps { isDark?: boolean; }

const issues = [
  {
    vol: "Vol.32",
    date: "2026.04.14",
    tag: "시장 분석",
    tagColor: "#4377F1",
    title: "동남아 게임 앱 시장, Q2 성장률 23% 기록",
    desc: "인도네시아·베트남을 중심으로 하이퍼캐주얼 장르 급성장. 현지 결제 모듈 도입이 수익화의 핵심 변수로 부상.",
    readTime: "8분",
  },
  {
    vol: "Vol.31",
    date: "2026.04.07",
    tag: "IR 전략",
    tagColor: "#18A343",
    title: "글로벌 VC가 주목하는 AI 스타트업 IR 체크리스트",
    desc: "실리콘밸리·싱가포르 주요 VC 파트너 인터뷰 종합. AI 제품 평가 기준 상위 5가지와 피칭 구성 전략 안내.",
    readTime: "11분",
  },
  {
    vol: "Vol.30",
    date: "2026.03.31",
    tag: "스토어 최적화",
    tagColor: "#20D6A2",
    title: "Google Play ASO 2026: 알고리즘 변경 완전 분석",
    desc: "3월 Google Play 알고리즘 업데이트로 인한 키워드 가중치 변화와 스크린샷·프리뷰 영상 최적화 전략.",
    readTime: "9분",
  },
  {
    vol: "Vol.29",
    date: "2026.03.24",
    tag: "성공 사례",
    tagColor: "#FF4340",
    title: "7기 수료 기업 A사: 6개월 만에 동남아 MAU 10만 달성",
    desc: "창구 프로그램을 통해 Google Play 피처링 획득 후 바이럴 성장에 성공한 헬스케어 앱 스타트업 심층 인터뷰.",
    readTime: "14분",
  },
];

export function NewsletterSection({ isDark = false }: NewsletterSectionProps) {
  const th = getSectionTheme(isDark);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(72px, 12vw, 120px)",
      background: isDark
        ? "radial-gradient(circle at 20% 50%, rgba(255,67,64,0.06) 0%, transparent 50%), linear-gradient(180deg, #0a1020 0%, #070d1a 100%)"
        : "radial-gradient(circle at 20% 50%, rgba(255,67,64,0.04) 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #F4F6FB 100%)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        {/* Layout: Subscribe (left) + Issues (right) */}
        <div className="newsletter-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <style>{`
            @media (max-width: 900px) {
              .newsletter-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
            }
          `}</style>

          {/* ── Left: Subscribe ── */}
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,42px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
              주간 마켓 트렌드<br />뉴스레터
            </h2>
            <p style={{ color: th.subText, fontSize: "15px", margin: "0 0 32px", lineHeight: 1.75 }}>
              매주 월요일, 글로벌 앱·게임 시장 동향과 창구 프로그램 소식을 정리해 보내드립니다. 현재 <strong style={{ color: th.headingColor }}>2,840명</strong>이 구독 중입니다.
            </p>

            {/* Benefit list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
              {[
                { icon: "📊", text: "동남아·북미·유럽 주간 앱 시장 데이터" },
                { icon: "🎙️", text: "Google 전문가 & 창업자 인터뷰" },
                { icon: "📥", text: "회원 전용 PDF 리포트 무료 제공" },
                { icon: "🚀", text: "창구 프로그램 신규 공지 최우선 안내" },
              ].map((b) => (
                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>{b.icon}</span>
                  <span style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 500 }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* Subscribe form */}
            {!subscribed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    style={{
                      flex: 1,
                      background: th.inputBg,
                      border: `1px solid ${th.inputBorder}`,
                      borderRadius: "12px",
                      padding: "13px 16px",
                      fontSize: "14px",
                      color: th.inputText,
                      outline: "none",
                      fontFamily: "'Pretendard', sans-serif",
                    }}
                  />
                  <button
                    onClick={handleSubscribe}
                    style={{
                      background: "linear-gradient(135deg, #FF4340 0%, #FF7C44 100%)",
                      color: "#fff", border: "none",
                      borderRadius: "12px", padding: "13px 22px",
                      fontSize: "14px", fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(255,67,64,0.35)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    구독하기
                  </button>
                </div>
                <p style={{ color: th.mutedText, fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                  무료 구독이며, 언제든지 수신 거부할 수 있습니다. 개인정보는 뉴스레터 발송 목적으로만 사용됩니다.
                </p>
              </div>
            ) : (
              <div style={{
                background: "rgba(24,163,67,0.1)", border: "1px solid rgba(24,163,67,0.25)",
                borderRadius: "14px", padding: "20px 24px",
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <span style={{ fontSize: "24px" }}>🎉</span>
                <div>
                  <div style={{ color: "#18A343", fontSize: "15px", fontWeight: 800, marginBottom: "4px" }}>구독 완료!</div>
                  <div style={{ color: th.subText, fontSize: "13px" }}>다음 월요일 인사이트 레포트를 가장 먼저 받아보세요.</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Recent issues ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ color: th.mutedText, fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px" }}>
                최근 발행호
              </span>
              <Link to="/news" style={{
                color: "#FF4340", fontSize: "12px", fontWeight: 700, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: "4px",
              }}>
                전체보기 →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {issues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    background: th.cardBg, border: `1px solid ${th.cardBorder}`,
                    borderRadius: "16px", padding: "20px 22px",
                    boxShadow: th.cardShadow, cursor: "pointer",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = th.cardShadow;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ color: th.mutedText, fontSize: "12px", fontWeight: 700 }}>{issue.vol}</span>
                    <span style={{ color: th.mutedText, fontSize: "11px" }}>·</span>
                    <span style={{
                      fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px",
                      color: issue.tagColor,
                      background: `${issue.tagColor}15`,
                      border: `1px solid ${issue.tagColor}35`,
                      padding: "2px 8px", borderRadius: "5px",
                    }}>{issue.tag}</span>
                    <span style={{ color: th.mutedText, fontSize: "11px", marginLeft: "auto" }}>{issue.date}</span>
                  </div>
                  <div style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 700, marginBottom: "6px", lineHeight: 1.35 }}>
                    {issue.title}
                  </div>
                  <div style={{ color: th.itemDesc, fontSize: "12px", lineHeight: 1.55, marginBottom: "10px" }}>
                    {issue.desc}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: issue.tagColor }}>
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>읽기 ({issue.readTime})</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div style={{ marginTop: "80px", display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${th.dividerColor})` }} />
          <span style={{ color: th.footerText, fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
            NCF × GOOGLE PLAY × MSS × KISED
          </span>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${th.dividerColor})` }} />
        </div>
      </div>
    </section>
  );
}
