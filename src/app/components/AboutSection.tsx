import type { ReactNode } from "react";
import { useLanguage } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { AROUND_X_BRAND_INFO } from "../content/aroundXBrandInfo";
import { getSectionTheme } from "../utils/sectionTheme";
import { ABOUT_VALUE_CARD_MIN_HEIGHT, AboutValueCard } from "./AboutValueCard";
import {
  HOME_SECTION_BODY_STYLE,
  HOME_SECTION_MAX_WIDTH,
  HOME_SECTION_PADDING,
} from "./homeSectionStyles";

const valueIcons: ReactNode[] = [
  <svg key="global" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 0 20" />
    <path d="M12 2a15.3 15.3 0 0 0 0 20" />
  </svg>,
  <svg key="collaboration" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg key="connection" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="3" />
    <circle cx="19" cy="5" r="3" />
    <circle cx="19" cy="19" r="3" />
    <path d="m8 11 8-5" />
    <path d="m8 13 8 5" />
  </svg>,
  <svg key="scale" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
    <path d="M5 21h14" />
  </svg>,
];

export function AboutSection() {
  const th = getSectionTheme();
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const currentLang = lang as "ko" | "en";

  return (
    <section
      aria-label="Around X 소개"
      style={{
        position: "relative",
        width: "100vw",
        maxWidth: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        padding: HOME_SECTION_PADDING,
        background: th.sectionBg,
        fontFamily: "'Pretendard', -apple-system, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
        transition: "background 0.4s ease",
      }}
    >
      <style>{`
        .about-section-layout {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: var(--space-2xl);
          align-items: stretch;
        }

        .about-brand-copy {
          min-height: calc(${ABOUT_VALUE_CARD_MIN_HEIGHT} * 2 + var(--space-lg));
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: var(--space-lg);
        }

        .about-values-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-lg);
        }

        .about-value-card:hover {
          transform: translateY(-2px);
          outline-color: var(--section-card-hover-border);
        }

        @media (max-width: 1024px) {
          .about-section-layout {
            grid-template-columns: 1fr;
          }

          .about-brand-copy {
            min-height: auto;
          }
        }

        @media (max-width: 640px) {
          .about-values-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: HOME_SECTION_MAX_WIDTH, margin: "0 auto" }}>
        <div className="about-section-layout">
          <div className="about-brand-copy">
            <img
              src={AROUND_X_BRAND_INFO.logo.src}
              alt={AROUND_X_BRAND_INFO.logo.alt[currentLang]}
              style={{
                display: "block",
                width: "min(520px, 100%)",
                height: "auto",
                filter: isDark ? "brightness(0) invert(1)" : "none",
                transition: "filter 0.2s ease",
              }}
            />
            <p
              style={{
                ...HOME_SECTION_BODY_STYLE,
                color: th.subText,
                whiteSpace: "pre-line",
              }}
            >
              {AROUND_X_BRAND_INFO.description[currentLang]}
            </p>

            <p
              style={{
                color: th.mutedText,
                fontSize: "var(--text-body-sm)",
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.7,
                margin: 0,
                wordBreak: "keep-all",
              }}
            >
              {AROUND_X_BRAND_INFO.slogan[currentLang]}
            </p>
          </div>

          <div className="about-values-grid">
            {AROUND_X_BRAND_INFO.values.map((value, index) => (
              <AboutValueCard
                key={value.title.ko}
                icon={valueIcons[index]}
                index={index}
                title={value.title[currentLang]}
                description={value.description[currentLang]}
                theme={th}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
