import { ChangguProgramTimelineSection } from "../components/ChangguProgramTimelineSection";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

export function AroundXChangguProgramPage() {
  const { isDark } = useTheme();

  return (
    <PageShell
      title="창구 프로그램"
      subtitle="구글플레이와 함께 글로벌 성장을 준비하는 Around X 대표 프로그램을 소개합니다."
      accentColor="var(--color-accent-blue)"
      contentMaxWidth="none"
      contentPadding={0}
    >
      <ChangguProgramTimelineSection isDark={isDark} />
    </PageShell>
  );
}
