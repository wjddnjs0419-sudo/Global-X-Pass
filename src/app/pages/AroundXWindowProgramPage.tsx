import { PageShell } from "../components/PageShell";
import { WindowProgramTimelineSection } from "../components/WindowProgramTimelineSection";
import { useTheme } from "../ThemeContext";

export function AroundXWindowProgramPage() {
  const { isDark } = useTheme();

  return (
    <PageShell
      title="창구 프로그램"
      subtitle="구글플레이와 함께 글로벌 성장을 준비하는 Around X 대표 프로그램을 소개합니다."
      accentColor="var(--color-accent-blue)"
      contentMaxWidth="none"
      contentPadding={0}
    >
      <WindowProgramTimelineSection isDark={isDark} />
    </PageShell>
  );
}
