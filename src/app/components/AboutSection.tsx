import { WindowProgramTimeline } from "./window-program/WindowProgramTimeline";

interface AboutSectionProps {
  isDark?: boolean;
}

export function AboutSection({ isDark = false }: AboutSectionProps) {
  return <WindowProgramTimeline isDark={isDark} />;
}
