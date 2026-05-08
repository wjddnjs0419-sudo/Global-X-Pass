import { useTheme } from "../ThemeContext";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { ProgramSection } from "./ProgramSection";
import { EventSection } from "./EventSection";
import { CommunitySection } from "./CommunitySection";
import { NoticeResourceSection } from "./NoticeResourceSection";
import { MediaSection } from "./MediaSection";

export function HomePage() {
  const { isDark } = useTheme();
  return (
    <>
      <HeroSection />
      <AboutSection isDark={isDark} />
      <ProgramSection isDark={isDark} />
      <CommunitySection isDark={isDark} />
      <EventSection isDark={isDark} />
      <NoticeResourceSection isDark={isDark} />
      <MediaSection isDark={isDark} />
    </>
  );
}
