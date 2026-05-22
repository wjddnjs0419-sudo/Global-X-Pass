import { ChangguProgramTimeline } from "./changgu-program/ChangguProgramTimeline";

interface AboutSectionProps {
  isDark?: boolean;
}

export function AboutSection({ isDark = false }: AboutSectionProps) {
  return <ChangguProgramTimeline isDark={isDark} />;
}
