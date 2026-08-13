import fincantieriLogo from "../../imports/fincantieri-logo.svg";
import { PageShell } from "../components/PageShell";
import { ProgramIntroSection } from "../components/ProgramIntroSection";
import { useTheme } from "../ThemeContext";

export function AroundXFincantieriProgramPage() {
  const { isDark } = useTheme();

  return (
    <PageShell
      title="핀칸티에리"
      subtitle="핀칸티에리와 함께 글로벌 성장을 준비하는 Around X 대표 프로그램을 소개합니다."
      accentColor="var(--color-accent-blue)"
      contentMaxWidth={980}
      contentPadding={0}
    >
      <ProgramIntroSection
        logoSrc={fincantieriLogo}
        logoAlt="핀칸티에리 로고"
        logoMaxWidth="clamp(220px, 32vw, 360px)"
        tagline="유럽 최대 조선·해양 그룹 핀칸티에리와 함께 국내 유망 기술기업의 글로벌 상용화를 지원합니다."
        description={
          <>
            중소벤처기업부, 창업진흥원, 핀칸티에리, 넥스트챌린지가 공동 운영하는 <strong>글로벌 진출 액셀러레이팅 프로그램</strong>입니다. 유럽 최대 조선·해양 그룹인 핀칸티에리의 글로벌 제조·해양 인프라를 활용하여, 국내 유망 기술기업의 글로벌 상용화 및 스케일업을 가속화합니다.
          </>
        }
        isDark={isDark}
      />
    </PageShell>
  );
}
