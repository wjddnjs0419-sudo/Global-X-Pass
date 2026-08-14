import renaultLogo from "../../imports/renault-logo.png";
import { PageShell } from "../components/PageShell";
import { ProgramIntroSection } from "../components/ProgramIntroSection";
import { useTheme } from "../ThemeContext";

export function AroundXRenaultProgramPage() {
  const { isDark } = useTheme();

  return (
    <PageShell
      title="르노"
      subtitle="르노와 함께 글로벌 성장을 준비하는 Around X 대표 프로그램을 소개합니다."
      accentColor="var(--color-accent-blue)"
      contentMaxWidth={980}
      contentPadding={0}
    >
      <ProgramIntroSection
        logoSrc={renaultLogo}
        logoAlt="르노코리아 로고"
        logoMaxWidth="clamp(210px, 34vw, 390px)"
        tagline="글로벌 모빌리티 기업과 함께 모빌리티 혁신 스타트업의 글로벌 진출을 지원합니다."
        description={
          <>
            중소벤처기업부, 창업진흥원, 르노코리아, 넥스트챌린지가 공동 운영하는 <strong>글로벌 진출 액셀러레이팅 프로그램</strong>입니다. 르노코리아 및 글로벌 르노그룹과의 기술 실증(PoC)을 바탕으로, 혁신 기술을 보유한 스타트업의 글로벌 시장 진출을 지원합니다.
          </>
        }
        isDark={isDark}
      />
    </PageShell>
  );
}
