// ============================================================
//  NCF × GLOBAL X — 디자인 시스템 가이드
//  /src/app/components/DesignSystemPage.tsx
// ============================================================

interface ThemeTokens {
  pageBg: string;
  dotGrid: string;
  headerBorder: string;
  sectionTitleColor: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  rowDivider: string;
  codeColor: string;
  metaColor: string;
  footerBorder: string;
  footerText: string;
  footerLine: string;
  h1Color: string;
  h2Color: string;
  infoKey: string;
  infoVal: string;
  infoDivider: string;
  glassSwatchBorder: string;
  glassSwatchLabel: string;
  glassSwatchCode: string;
  glassSwatchValue: string;
  glassNote: string;
  buttonSecondaryColor: string;
  buttonSecondaryBorder: string;
  buttonTextLink: string;
  cardAnatomyDefault: string;
  cardAnatomyDefaultBorder: string;
  cardAnatomyHover: string;
  cardAnatomyHoverBorder: string;
  cardAnatomyHoverShadow: string;
  cardAnatomyLabelMuted: string;
  sectionLabelMuted: string;
}

function makeTheme(isDark: boolean): ThemeTokens {
  if (isDark) {
    return {
      pageBg: "linear-gradient(180deg, #070d1a 0%, #0a1020 100%)",
      dotGrid: "rgba(255,255,255,0.04)",
      headerBorder: "rgba(255,255,255,0.08)",
      sectionTitleColor: "#fff",
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(255,255,255,0.1)",
      cardShadow: "none",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.72)",
      textMuted: "rgba(255,255,255,0.42)",
      textDisabled: "rgba(255,255,255,0.22)",
      rowDivider: "rgba(255,255,255,0.05)",
      codeColor: "#FBBC05",
      metaColor: "rgba(255,255,255,0.3)",
      footerBorder: "rgba(255,255,255,0.08)",
      footerText: "rgba(255,255,255,0.2)",
      footerLine: "rgba(255,255,255,0.08)",
      h1Color: "#fff",
      h2Color: "#fff",
      infoKey: "rgba(255,255,255,0.3)",
      infoVal: "rgba(255,255,255,0.7)",
      infoDivider: "rgba(255,255,255,0.15)",
      glassSwatchBorder: "rgba(255,255,255,0.12)",
      glassSwatchLabel: "#fff",
      glassSwatchCode: "#FBBC05",
      glassSwatchValue: "rgba(255,255,255,0.4)",
      glassNote: "rgba(255,255,255,0.5)",
      buttonSecondaryColor: "#fff",
      buttonSecondaryBorder: "rgba(255,255,255,0.25)",
      buttonTextLink: "rgba(255,255,255,0.5)",
      cardAnatomyDefault: "rgba(255,255,255,0.04)",
      cardAnatomyDefaultBorder: "rgba(255,255,255,0.1)",
      cardAnatomyHover: "rgba(255,255,255,0.07)",
      cardAnatomyHoverBorder: "rgba(255,255,255,0.18)",
      cardAnatomyHoverShadow: "0 16px 40px rgba(0,0,0,0.3)",
      cardAnatomyLabelMuted: "rgba(255,255,255,0.3)",
      sectionLabelMuted: "rgba(255,255,255,0.4)",
    };
  }
  return {
    pageBg: "linear-gradient(180deg, #F0F2F8 0%, #F7F8FC 100%)",
    dotGrid: "rgba(0,0,0,0.04)",
    headerBorder: "rgba(0,0,0,0.08)",
    sectionTitleColor: "#0D1117",
    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 2px 16px rgba(0,0,0,0.06)",
    textPrimary: "#0D1117",
    textSecondary: "rgba(0,0,0,0.65)",
    textMuted: "rgba(0,0,0,0.42)",
    textDisabled: "rgba(0,0,0,0.25)",
    rowDivider: "rgba(0,0,0,0.06)",
    codeColor: "#B45309",   // amber-700 – readable on white
    metaColor: "rgba(0,0,0,0.35)",
    footerBorder: "rgba(0,0,0,0.08)",
    footerText: "rgba(0,0,0,0.3)",
    footerLine: "rgba(0,0,0,0.08)",
    h1Color: "#0D1117",
    h2Color: "#0D1117",
    infoKey: "rgba(0,0,0,0.38)",
    infoVal: "rgba(0,0,0,0.7)",
    infoDivider: "rgba(0,0,0,0.12)",
    glassSwatchBorder: "rgba(0,0,0,0.08)",
    glassSwatchLabel: "#0D1117",
    glassSwatchCode: "#B45309",
    glassSwatchValue: "rgba(0,0,0,0.4)",
    glassNote: "rgba(0,0,0,0.5)",
    buttonSecondaryColor: "#0D1117",
    buttonSecondaryBorder: "rgba(0,0,0,0.2)",
    buttonTextLink: "rgba(0,0,0,0.45)",
    cardAnatomyDefault: "#F7F8FC",
    cardAnatomyDefaultBorder: "rgba(0,0,0,0.08)",
    cardAnatomyHover: "#EEF2FF",
    cardAnatomyHoverBorder: "rgba(66,133,244,0.25)",
    cardAnatomyHoverShadow: "0 12px 32px rgba(66,133,244,0.1)",
    cardAnatomyLabelMuted: "rgba(0,0,0,0.32)",
    sectionLabelMuted: "rgba(0,0,0,0.4)",
  };
}

// ── Sub-components ────────────────────────────────────────────

function SectionTitle({ children, th }: { children: React.ReactNode; th: ThemeTokens }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.22)",
        borderRadius: "100px", padding: "4px 14px", marginBottom: "12px",
      }}>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4285F4", display: "inline-block" }} />
        <span style={{ color: "#4285F4", fontSize: "11px", fontWeight: 800, letterSpacing: "2px" }}>DESIGN SYSTEM</span>
      </div>
      <h2 style={{
        color: th.sectionTitleColor, fontSize: "28px", fontWeight: 800,
        letterSpacing: "-1px", margin: 0, lineHeight: 1.2,
      }}>
        {children}
      </h2>
    </div>
  );
}

function Card({ children, style = {}, th }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  th: ThemeTokens;
}) {
  return (
    <div style={{
      background: th.cardBg,
      border: `1px solid ${th.cardBorder}`,
      borderRadius: "20px",
      padding: "32px",
      boxShadow: th.cardShadow,
      transition: "background 0.4s ease, border-color 0.4s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

function TokenLabel({ name, value, th }: { name: string; value: string; th: ThemeTokens }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "12px", padding: "6px 0", borderBottom: `1px solid ${th.rowDivider}`,
    }}>
      <code style={{ color: th.codeColor, fontSize: "12px", fontFamily: "monospace" }}>{name}</code>
      <span style={{ color: th.metaColor, fontSize: "12px" }}>{value}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

interface DesignSystemPageProps {
  isDark?: boolean;
}

export function DesignSystemPage({ isDark = false }: DesignSystemPageProps) {
  const th = makeTheme(isDark);

  const brandGradients = [
    { name: "--gradient-ncf",    from: "#20D6A2", to: "#BEFFF9", gradient: "linear-gradient(135deg, #20D6A2 0%, #BEFFF9 100%)", label: "NCF 키컬러",  role: "NCF 브랜드 메인 컬러" },
    { name: "--gradient-green",  from: "#18A343", to: "#37AD9A", gradient: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)", label: "창구 Green", role: "창구 프로그램 Green" },
    { name: "--gradient-blue",   from: "#4377F1", to: "#16DBBB", gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)", label: "창구 Blue",  role: "창구 프로그램 Blue" },
    { name: "--gradient-yellow", from: "#FFEE56", to: "#FFC2B4", gradient: "linear-gradient(135deg, #FFEE56 0%, #FFC2B4 100%)", label: "창구 Yellow", role: "창구 프로그램 Yellow" },
    { name: "--gradient-red",    from: "#FF4340", to: "#FF7C44", gradient: "linear-gradient(135deg, #FF4340 0%, #FF7C44 100%)", label: "창구 Red",   role: "창구 프로그램 Red" },
  ];

  const bgColors = [
    { name: "--color-bg-base",     hex: "#070d1a", label: "BG Base",     role: "섹션 최하단 배경" },
    { name: "--color-bg-surface",  hex: "#0a1020", label: "BG Surface",  role: "기본 배경 (body)" },
    { name: "--color-bg-elevated", hex: "#0e1628", label: "BG Elevated", role: "카드 / 패널" },
    { name: "--color-bg-overlay",  hex: "#131d30", label: "BG Overlay",  role: "호버 / 강조 영역" },
  ];

  const textColors = isDark ? [
    { color: "#ffffff",               alpha: "100%", label: "Primary",   usage: "제목, 강조 텍스트" },
    { color: "rgba(255,255,255,0.72)", alpha: "72%",  label: "Secondary", usage: "본문, 설명 텍스트" },
    { color: "rgba(255,255,255,0.42)", alpha: "42%",  label: "Muted",     usage: "캡션, 메타 정보" },
    { color: "rgba(255,255,255,0.22)", alpha: "22%",  label: "Disabled",  usage: "비활성 요소" },
  ] : [
    { color: "#0D1117",               alpha: "100%", label: "Primary",   usage: "제목, 강조 텍스트" },
    { color: "rgba(0,0,0,0.65)",      alpha: "65%",  label: "Secondary", usage: "본문, 설명 텍스트" },
    { color: "rgba(0,0,0,0.42)",      alpha: "42%",  label: "Muted",     usage: "캡션, 메타 정보" },
    { color: "rgba(0,0,0,0.22)",      alpha: "22%",  label: "Disabled",  usage: "비활성 요소" },
  ];

  const typeScale = [
    { name: "Display",  size: "clamp(40px, 6vw, 72px)", weight: 800, sample: "글로벌 시장으로",        tracking: "-0.05em" },
    { name: "H1",       size: "clamp(32px, 4vw, 52px)", weight: 800, sample: "구글 창구 프로그램",     tracking: "-0.05em" },
    { name: "H2",       size: "clamp(26px, 3vw, 40px)", weight: 800, sample: "섹션 제목입니다",        tracking: "-0.05em" },
    { name: "H3",       size: "clamp(20px, 2vw, 28px)", weight: 700, sample: "카드 타이틀 영역",       tracking: "-0.02em" },
    { name: "H4",       size: "20px",   weight: 700, sample: "소항목 타이틀",          tracking: "-0.02em" },
    { name: "Body LG",  size: "18px",   weight: 400, sample: "주요 섹션의 본문 텍스트입니다.", tracking: "0" },
    { name: "Body",     size: "16px",   weight: 400, sample: "기본 본문 텍스트입니다.",     tracking: "0" },
    { name: "Body SM",  size: "14px",   weight: 400, sample: "보조 설명 텍스트입니다.",     tracking: "0" },
    { name: "Caption",  size: "12px",   weight: 500, sample: "캡션 및 메타 정보",          tracking: "0" },
    { name: "Label",    size: "11px",   weight: 800, sample: "BADGE LABEL",              tracking: "0.15em" },
  ];

  const radiusTokens = [
    { name: "--radius-sm",   value: "8px",   label: "Small" },
    { name: "--radius-md",   value: "14px",  label: "Medium" },
    { name: "--radius-lg",   value: "20px",  label: "Large" },
    { name: "--radius-xl",   value: "24px",  label: "XL (Card)" },
    { name: "--radius-2xl",  value: "32px",  label: "2XL" },
    { name: "--radius-pill", value: "100px", label: "Pill (Badge)" },
  ];

  const spacingTokens = [
    { name: "--space-2xs", value: "4px" },
    { name: "--space-xs",  value: "8px" },
    { name: "--space-sm",  value: "12px" },
    { name: "--space-md",  value: "16px" },
    { name: "--space-lg",  value: "24px" },
    { name: "--space-xl",  value: "36px" },
    { name: "--space-2xl", value: "48px" },
    { name: "--space-3xl", value: "64px" },
    { name: "--space-4xl", value: "100px" },
    { name: "--space-5xl", value: "120px" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: th.pageBg,
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      padding: "80px 40px",
      transition: "background 0.4s ease",
    }}>
      {/* Dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          marginBottom: "80px",
          borderBottom: `1px solid ${th.headerBorder}`,
          paddingBottom: "48px",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.22)",
            borderRadius: "100px", padding: "6px 18px", marginBottom: "20px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4285F4", display: "inline-block", boxShadow: "0 0 8px #4285F4" }} />
            <span style={{ color: "#4285F4", fontSize: "11px", fontWeight: 800, letterSpacing: "2px" }}>NCF × GLOBAL X</span>
          </div>
          <h1 style={{
            color: th.h1Color, fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900,
            letterSpacing: "-3px", lineHeight: 1.05, margin: "0 0 16px",
          }}>
            Design System
          </h1>
          <p style={{ color: th.textMuted, fontSize: "16px", margin: 0, lineHeight: 1.7 }}>
            2026 글로벌기업협업프로그램 — UI/UX 디자인 토큰 가이드
          </p>
          <div style={{ display: "flex", gap: "24px", marginTop: "28px", flexWrap: "wrap" }}>
            {[
              { k: "Font",    v: "Pretendard" },
              { k: "Theme",   v: isDark ? "Dark / Deep Space" : "Light / Clean White" },
              { k: "Version", v: "v1.0 · 2026" },
            ].map((item) => (
              <div key={item.k} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: th.infoKey, fontSize: "13px" }}>{item.k}</span>
                <span style={{ width: "1px", height: "12px", background: th.infoDivider }} />
                <span style={{ color: th.infoVal, fontSize: "13px", fontWeight: 600 }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 01 Color — Brand Gradients ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>01 · Color — Brand Gradients (키컬러)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {brandGradients.map((c) => (
              <Card key={c.name} th={th}>
                <div style={{
                  height: "80px", borderRadius: "12px",
                  background: c.gradient, marginBottom: "20px",
                  boxShadow: `0 8px 24px ${c.from}44`,
                }} />
                <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "10px", fontFamily: "monospace", fontWeight: 700,
                    background: `${c.from}18`, border: `1px solid ${c.from}44`,
                    color: th.textPrimary, padding: "3px 8px", borderRadius: "6px",
                  }}>{c.from}</span>
                  <span style={{ color: th.metaColor, fontSize: "11px", alignSelf: "center" }}>→</span>
                  <span style={{
                    fontSize: "10px", fontFamily: "monospace", fontWeight: 700,
                    background: `${c.to}18`, border: `1px solid ${c.to}44`,
                    color: th.textPrimary, padding: "3px 8px", borderRadius: "6px",
                  }}>{c.to}</span>
                </div>
                <div style={{ color: th.textPrimary, fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{c.label}</div>
                <div style={{ color: th.textMuted, fontSize: "12px", marginBottom: "10px" }}>{c.role}</div>
                <code style={{ color: th.codeColor, fontSize: "11px", fontFamily: "monospace" }}>{c.name}</code>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 02 Color — Background ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>02 · Color — Background Scale (Dark Mode)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {bgColors.map((c) => (
              <Card key={c.hex} th={th}>
                <div style={{
                  height: "56px", borderRadius: "10px", background: c.hex,
                  border: "1px solid rgba(255,255,255,0.12)", marginBottom: "16px",
                }} />
                <div style={{ color: th.textPrimary, fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{c.label}</div>
                <div style={{ color: th.textMuted, fontSize: "12px", marginBottom: "10px" }}>{c.role}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <code style={{ color: th.codeColor, fontSize: "11px", fontFamily: "monospace" }}>{c.name}</code>
                  <code style={{ color: th.metaColor, fontSize: "11px", fontFamily: "monospace" }}>{c.hex}</code>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 03 Color — Glass Surface ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>03 · Color — Glass Surface</SectionTitle>
          <Card th={th}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              {[
                { name: "--color-glass-bg",            value: "rgba(255,255,255,0.04)", label: "Glass Default" },
                { name: "--color-glass-bg-hover",      value: "rgba(255,255,255,0.07)", label: "Glass Hover" },
                { name: "--color-glass-border",        value: "rgba(255,255,255,0.10)", label: "Border" },
                { name: "--color-glass-border-strong", value: "rgba(255,255,255,0.18)", label: "Border Strong" },
              ].map((item) => (
                <div key={item.name} style={{
                  background: isDark ? item.value : "rgba(0,0,0,0.03)",
                  border: `1px solid ${th.glassSwatchBorder}`,
                  borderRadius: "12px", padding: "20px",
                }}>
                  <div style={{ color: th.glassSwatchLabel, fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>{item.label}</div>
                  <code style={{ color: th.glassSwatchCode, fontSize: "10px", fontFamily: "monospace", display: "block", marginBottom: "4px" }}>{item.name}</code>
                  <code style={{ color: th.glassSwatchValue, fontSize: "10px", fontFamily: "monospace" }}>{item.value}</code>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${th.rowDivider}`, paddingTop: "20px" }}>
              <p style={{ color: th.glassNote, fontSize: "13px", margin: 0 }}>
                💡 다크 모드 글래스 카드는 <code style={{ color: "#4285F4" }}>backdrop-filter: blur(16px)</code> + <code style={{ color: "#4285F4" }}>--color-glass-bg</code> + <code style={{ color: "#4285F4" }}>--color-glass-border</code> 를 기본으로 사용합니다.
              </p>
            </div>
          </Card>
        </section>

        {/* ── 04 Color — Text ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>04 · Color — Text Scale</SectionTitle>
          <Card th={th}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {textColors.map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "20px",
                  padding: "16px 0",
                  borderBottom: i < textColors.length - 1 ? `1px solid ${th.rowDivider}` : "none",
                }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: t.color, flexShrink: 0,
                    border: `1px solid ${th.cardBorder}`,
                    boxShadow: isDark ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: t.color, fontSize: "16px", fontWeight: 700 }}>
                      {t.label} — {t.usage}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ color: th.metaColor, fontSize: "12px" }}>Alpha {t.alpha}</span>
                    <code style={{ color: th.metaColor, fontSize: "11px", fontFamily: "monospace" }}>{t.color}</code>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── 05 Typography ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>05 · Typography — Pretendard</SectionTitle>
          <Card th={th}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {typeScale.map((t, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr auto",
                  alignItems: "center", gap: "24px",
                  padding: "20px 0",
                  borderBottom: i < typeScale.length - 1 ? `1px solid ${th.rowDivider}` : "none",
                }}>
                  <div>
                    <div style={{ color: th.textMuted, fontSize: "11px", fontWeight: 700, marginBottom: "2px" }}>{t.name}</div>
                    <div style={{ color: th.textDisabled, fontSize: "10px" }}>{t.size}</div>
                  </div>
                  <div style={{
                    fontSize: t.size, fontWeight: t.weight,
                    color: th.textPrimary,
                    letterSpacing: t.tracking, lineHeight: 1.2,
                    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  }}>
                    {t.sample}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: th.metaColor, fontSize: "11px" }}>W{t.weight}</div>
                    <div style={{ color: th.textDisabled, fontSize: "10px" }}>{t.tracking}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── 06 Spacing ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>06 · Spacing Scale</SectionTitle>
          <Card th={th}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {spacingTokens.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    height: "20px", width: s.value, maxWidth: "100%",
                    background: "linear-gradient(90deg, #4285F4, #34A853)",
                    borderRadius: "4px", flexShrink: 0,
                  }} />
                  <code style={{ color: th.codeColor, fontSize: "12px", fontFamily: "monospace", minWidth: "120px" }}>{s.name}</code>
                  <span style={{ color: th.metaColor, fontSize: "12px" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ── 07 Border Radius ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>07 · Border Radius</SectionTitle>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {radiusTokens.map((r) => (
              <div key={r.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "80px", height: "80px",
                  background: "rgba(66,133,244,0.08)",
                  border: "1px solid rgba(66,133,244,0.25)",
                  borderRadius: r.value,
                }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: th.textPrimary, fontSize: "12px", fontWeight: 600 }}>{r.label}</div>
                  <div style={{ color: th.textMuted, fontSize: "11px" }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 08 Components ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>08 · Components — 공통 패턴</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Badge variants */}
            <Card th={th}>
              <div style={{ color: th.sectionLabelMuted, fontSize: "12px", marginBottom: "16px", fontWeight: 700, letterSpacing: "1px" }}>BADGE / PILL</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { label: "BLUE",    color: "#4285F4" },
                  { label: "GREEN",   color: "#34A853" },
                  { label: "YELLOW",  color: "#FBBC05" },
                  { label: "RED",     color: "#EA4335" },
                  { label: "DEFAULT", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" },
                ].map((b) => (
                  <span key={b.label} style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: `${b.color}15`, border: `1px solid ${b.color}40`,
                    borderRadius: "100px", padding: "5px 14px",
                    color: b.color, fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px",
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: b.color }} />
                    {b.label}
                  </span>
                ))}
              </div>
            </Card>

            {/* Button variants */}
            <Card th={th}>
              <div style={{ color: th.sectionLabelMuted, fontSize: "12px", marginBottom: "16px", fontWeight: 700, letterSpacing: "1px" }}>BUTTON</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <button style={{
                  background: "#4285F4", color: "#fff", border: "none",
                  borderRadius: "100px", padding: "12px 28px",
                  fontSize: "14px", fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(66,133,244,0.35)",
                }}>Primary CTA</button>
                <button style={{
                  background: "transparent", color: th.buttonSecondaryColor,
                  border: `1px solid ${th.buttonSecondaryBorder}`,
                  borderRadius: "100px", padding: "12px 28px",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                }}>Secondary</button>
                <button style={{
                  background: "rgba(66,133,244,0.08)",
                  color: "#4285F4", border: "1px solid rgba(66,133,244,0.25)",
                  borderRadius: "100px", padding: "12px 28px",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                }}>Ghost Blue</button>
                <button style={{
                  background: "transparent", color: th.buttonTextLink,
                  border: "none", padding: "12px 4px",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  textDecoration: "underline", textUnderlineOffset: "3px",
                }}>Text Link</button>
              </div>
            </Card>

            {/* Glass Card Anatomy */}
            <Card th={th}>
              <div style={{ color: th.sectionLabelMuted, fontSize: "12px", marginBottom: "16px", fontWeight: 700, letterSpacing: "1px" }}>GLASS CARD ANATOMY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Default card */}
                <div style={{
                  background: th.cardAnatomyDefault,
                  border: `1px solid ${th.cardAnatomyDefaultBorder}`,
                  borderRadius: "24px", padding: "28px",
                  backdropFilter: isDark ? "blur(16px)" : "none",
                  position: "relative", overflow: "hidden",
                  boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: "rgba(66,133,244,0.10)", border: "1px solid rgba(66,133,244,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    </div>
                    <span style={{
                      color: "#4285F4", fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px",
                      background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.22)",
                      padding: "3px 10px", borderRadius: "100px",
                    }}>BADGE</span>
                  </div>
                  <h4 style={{ color: th.textPrimary, fontSize: "18px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>카드 제목</h4>
                  <p style={{ color: th.textSecondary, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>본문 텍스트는 Secondary 색상을 사용하며 line-height 1.6~1.75를 유지합니다.</p>
                  <div style={{ marginTop: "16px", fontSize: "12px", color: th.textMuted }}>Default State</div>
                </div>
                {/* Hover state */}
                <div style={{
                  background: th.cardAnatomyHover,
                  border: `1px solid ${th.cardAnatomyHoverBorder}`,
                  borderRadius: "24px", padding: "28px",
                  backdropFilter: isDark ? "blur(16px)" : "none",
                  position: "relative", overflow: "hidden",
                  transform: "translateY(-4px)",
                  boxShadow: th.cardAnatomyHoverShadow,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: "rgba(66,133,244,0.14)", border: "1px solid rgba(66,133,244,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    </div>
                    <span style={{
                      color: "#4285F4", fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px",
                      background: "rgba(66,133,244,0.12)", border: "1px solid rgba(66,133,244,0.3)",
                      padding: "3px 10px", borderRadius: "100px",
                    }}>BADGE</span>
                  </div>
                  <h4 style={{ color: th.textPrimary, fontSize: "18px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>카드 제목</h4>
                  <p style={{ color: th.textSecondary, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>호버 시 배경이 밝아지고, 테두리가 강해지며 위로 4px 이동합니다.</p>
                  <div style={{ marginTop: "16px", fontSize: "12px", color: "#4285F4" }}>Hover State ↑</div>
                </div>
              </div>
            </Card>

          </div>
        </section>

        {/* ── 09 Token Reference ── */}
        <section style={{ marginBottom: "80px" }}>
          <SectionTitle th={th}>09 · Token Quick Reference</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <Card th={th}>
              <div style={{ color: th.sectionLabelMuted, fontSize: "11px", fontWeight: 800, letterSpacing: "1px", marginBottom: "16px" }}>GRADIENT TOKENS (키컬러)</div>
              {[
                { name: "--gradient-ncf",    value: "#20D6A2 → #BEFFF9" },
                { name: "--gradient-green",  value: "#18A343 → #37AD9A" },
                { name: "--gradient-blue",   value: "#4377F1 → #16DBBB" },
                { name: "--gradient-yellow", value: "#FFEE56 → #FFC2B4" },
                { name: "--gradient-red",    value: "#FF4340 → #FF7C44" },
                { name: "--color-bg-surface",   value: "#0a1020" },
                { name: "--color-glass-bg",     value: "rgba(255,255,255,0.04)" },
                { name: "--color-glass-border", value: "rgba(255,255,255,0.10)" },
                { name: "--color-text-primary", value: "#ffffff" },
                { name: "--color-text-muted",   value: "rgba(255,255,255,0.42)" },
              ].map((t) => (
                <TokenLabel key={t.name} name={t.name} value={t.value} th={th} />
              ))}
            </Card>
            <Card th={th}>
              <div style={{ color: th.sectionLabelMuted, fontSize: "11px", fontWeight: 800, letterSpacing: "1px", marginBottom: "16px" }}>LAYOUT & MOTION TOKENS</div>
              {[
                { name: "--section-padding-y", value: "100px" },
                { name: "--section-padding-x", value: "40px" },
                { name: "--container-max",      value: "1280px" },
                { name: "--radius-xl",          value: "24px (Card)" },
                { name: "--radius-pill",        value: "100px (Badge)" },
                { name: "--blur-md",            value: "blur(16px)" },
                { name: "--ease-spring",        value: "cubic-bezier(0.34,1.56,0.64,1)" },
                { name: "--ease-out",           value: "cubic-bezier(0.19,1,0.22,1)" },
                { name: "--weight-extrabold",   value: "800 (제목)" },
                { name: "--weight-regular",     value: "400 (본문)" },
              ].map((t) => (
                <TokenLabel key={t.name} name={t.name} value={t.value} th={th} />
              ))}
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${th.footerBorder}`, paddingTop: "32px",
          display: "flex", alignItems: "center", gap: "24px",
        }}>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${th.footerLine})` }} />
          <span style={{ color: th.footerText, fontSize: "12px", whiteSpace: "nowrap" }}>
            NCF × GOOGLE PLAY × MSS × KISED · Design System v1.0 · 2026
          </span>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${th.footerLine})` }} />
        </div>

      </div>
    </div>
  );
}
