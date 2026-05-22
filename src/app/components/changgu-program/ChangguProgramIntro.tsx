import changguSymbol from "../../../imports/changgu-symbol.png";
import { CHANGGU_PROGRAM_INFO, type ChangguProgramDescriptionSegment } from "../../content/changguProgramInfo";
import { useLanguage } from "../../LanguageContext";

interface ChangguProgramIntroProps {
  isDark?: boolean;
}

function ProgramDescription({
  segments,
  emphasisColor,
}: {
  segments: ChangguProgramDescriptionSegment[];
  emphasisColor: string;
}) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.emphasis ? (
          <strong key={`${segment.text}-${index}`} style={{ color: emphasisColor, fontWeight: 850 }}>
            {segment.text}
          </strong>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}

export function ChangguProgramIntro({ isDark = false }: ChangguProgramIntroProps) {
  const { lang } = useLanguage();
  const currentLang = lang as "ko" | "en";
  const textColor = isDark ? "rgba(236,242,255,0.82)" : "rgba(30,30,80,0.72)";
  const emphasisColor = isDark ? "#ffffff" : "#0D1117";

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto clamp(56px, 8vw, 84px)",
        padding: "clamp(20px, 5vw, 44px) clamp(20px, 5vw, 40px) 0",
        textAlign: "center",
      }}
    >
      <img
        src={changguSymbol}
        alt="창구 프로그램 로고"
        style={{
          display: "block",
          width: "clamp(190px, 26vw, 330px)",
          height: "auto",
          margin: "0 auto clamp(28px, 5vw, 44px)",
        }}
      />
      <p
        style={{
          margin: 0,
          color: textColor,
          fontSize: "clamp(14px, 1.4vw, 18px)",
          lineHeight: 1.85,
          fontWeight: 500,
          letterSpacing: 0,
          wordBreak: "keep-all",
        }}
      >
        <ProgramDescription segments={CHANGGU_PROGRAM_INFO.description[currentLang]} emphasisColor={emphasisColor} />
      </p>
    </div>
  );
}
