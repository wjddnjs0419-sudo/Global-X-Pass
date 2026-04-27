import { Link, useLocation } from "react-router";
import logoImg from "../../imports/Logo.png";
import { useLanguage } from "../LanguageContext";

interface FooterSectionProps {
  isDark?: boolean;
}

const CONTENT = {
  company: {
    ko: "넥스트챌린지 글로벌 엑셀러레이팅본부",
    en: "Next Challenge Global Accelerating HQ",
  },
  address: {
    ko: "서울특별시 서대문구 이화여대길 59, 2층 넥스트챌린지",
    en: "2F, 59, Ewhayeodae-gil, Seodaemun-gu, Seoul, Republic of Korea",
  },
};

export function FooterSection({ isDark = false }: FooterSectionProps) {
  const location = useLocation();
  const { lang } = useLanguage();

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(10,16,32,0.55)";
  const borderTop = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const footerBg = isDark ? "#0a1020" : "#F7F8FC";

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer style={{ width: "100%", borderTop: `1px solid ${borderTop}`, background: footerBg, padding: "32px clamp(12px, 3vw, 32px)", display: "flex", boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <Link to="/" onClick={handleLogoClick} style={{ display: "inline-block", textDecoration: "none" }}>
            <img src={logoImg} alt="Logo" style={{ height: 20, filter: isDark ? "brightness(0) invert(1)" : "none" }} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ color: textMain, fontSize: 14, fontWeight: 700 }}>{CONTENT.company[lang]}</div>
          <div style={{ color: textMuted, fontSize: 13 }}>{CONTENT.address[lang]}</div>
        </div>

        <div style={{ marginTop: "8px", color: textMuted, fontSize: 12 }}>
          Copyright Next Challenge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
