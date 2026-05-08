import { Link, useLocation } from "react-router";
import logoImg from "../../imports/Logo.png";
import { CONTACT_EMAIL, INSTAGRAM_URL, LINKEDIN_URL, WHISTLEBLOWING_URL, YOUTUBE_URL } from "../constants/contact";
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

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: LINKEDIN_URL, icon: "linkedin" },
  { label: "Instagram", href: INSTAGRAM_URL, icon: "instagram" },
  { label: "YouTube", href: YOUTUBE_URL, icon: "youtube" },
];

function SocialIcon({ type, isDark }: { type: string; isDark: boolean }) {
  const glyphFill = "var(--color-bg-surface)";

  if (type === "linkedin") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="3.5" fill="currentColor" />
        <path d="M6.2 9.6h3.1v8.2H6.2V9.6Zm1.6-3.9c1 0 1.7.7 1.7 1.5s-.7 1.5-1.7 1.5-1.7-.7-1.7-1.5.7-1.5 1.7-1.5Zm3.3 3.9h3v1.1c.5-.8 1.3-1.3 2.6-1.3 2 0 3.2 1.3 3.2 4v4.4h-3.1v-4c0-1.1-.4-1.8-1.3-1.8-.8 0-1.3.5-1.3 1.8v4h-3.1V9.6Z" fill={glyphFill} />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="3.7" />
        <circle cx="17.4" cy="6.6" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg width="22" height="16" viewBox="0 0 28 20" aria-hidden="true">
      <path d="M27.4 3.1A3.5 3.5 0 0 0 24.9.6C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9a3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5c.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9Z" fill="currentColor" />
      <path d="m11.2 14.2 7.2-4.2-7.2-4.2v8.4Z" fill={glyphFill} />
    </svg>
  );
}

export function FooterSection({ isDark = false }: FooterSectionProps) {
  const location = useLocation();
  const { lang } = useLanguage();

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(10,16,32,0.55)";
  const borderTop = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const divider = isDark ? "rgba(255,255,255,0.12)" : "rgba(10,16,32,0.12)";
  const footerBg = "var(--color-bg-surface)";
  const linkStyle: React.CSSProperties = {
    color: textMuted,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  };
  const socialLinkStyle: React.CSSProperties = {
    color: textMain,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    textDecoration: "none",
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer style={{ width: "100%", borderTop: `1px solid ${borderTop}`, background: footerBg, padding: "32px clamp(18px, 4vw, 40px)", boxSizing: "border-box" }}>
      <div className="mx-auto flex flex-col gap-8 md:flex-row md:items-end md:justify-between" style={{ maxWidth: 1200 }}>
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

        <div className="flex flex-col gap-8 md:items-end">
          <nav aria-label="footer social links" className="flex items-center gap-5 md:justify-end">
            {SOCIAL_LINKS.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={`Next Challenge Foundation ${social.label}`} style={socialLinkStyle}>
                <SocialIcon type={social.icon} isDark={isDark} />
              </a>
            ))}
          </nav>

          <nav aria-label="footer policy links" className="flex flex-wrap items-center gap-x-4 gap-y-3 md:justify-end">
            <Link to="/privacy-policy" style={linkStyle}>개인정보처리방침</Link>
            <span aria-hidden="true" style={{ width: 1, height: 12, background: divider }} />
            <Link to="/terms-of-use" style={linkStyle}>이용약관</Link>
            <span aria-hidden="true" style={{ width: 1, height: 12, background: divider }} />
            <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>Contact</a>
            <span aria-hidden="true" style={{ width: 1, height: 12, background: divider }} />
            <a href={WHISTLEBLOWING_URL} target="_blank" rel="noreferrer" style={linkStyle}>공익제보</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
