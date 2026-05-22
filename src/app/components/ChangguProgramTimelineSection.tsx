import { ChangguProgramIntro } from "./changgu-program/ChangguProgramIntro";
import { ChangguProgramTimeline } from "./changgu-program/ChangguProgramTimeline";

interface ChangguProgramTimelineSectionProps {
  isDark?: boolean;
}

export function ChangguProgramTimelineSection({ isDark = false }: ChangguProgramTimelineSectionProps) {
  return (
    <ChangguProgramTimeline
      isDark={isDark}
      showHeader={false}
      beforeTimeline={<ChangguProgramIntro isDark={isDark} />}
      sectionPadding="clamp(44px, 7vw, 76px) clamp(20px, 5vw, 40px) clamp(56px, 8vw, 84px)"
    />
  );
}
