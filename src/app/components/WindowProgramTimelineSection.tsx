import { WindowProgramIntro } from "./window-program/WindowProgramIntro";
import { WindowProgramTimeline } from "./window-program/WindowProgramTimeline";

interface WindowProgramTimelineSectionProps {
  isDark?: boolean;
}

export function WindowProgramTimelineSection({ isDark = false }: WindowProgramTimelineSectionProps) {
  return (
    <WindowProgramTimeline
      isDark={isDark}
      showHeader={false}
      beforeTimeline={<WindowProgramIntro isDark={isDark} />}
      sectionPadding="clamp(44px, 7vw, 76px) clamp(20px, 5vw, 40px) clamp(56px, 8vw, 84px)"
    />
  );
}
