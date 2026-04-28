import { useTheme } from "../ThemeContext";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { ProgramSection } from "./ProgramSection";
import { NoticeSection } from "./NoticeSection";
import { EventSection } from "./EventSection";
import { CommunitySection } from "./CommunitySection";
import { ResourceSection } from "./ResourceSection";
import { NewsletterSection } from "./NewsletterSection";
import { FoundersClubCalendarWidget } from "./FoundersClubCalendarWidget";

export function HomePage() {
  const { isDark } = useTheme();
  return (
    <>
      <HeroSection />
      <AboutSection isDark={isDark} />
      <ProgramSection isDark={isDark} />
      <NoticeSection isDark={isDark} />
      <EventSection isDark={isDark} />
      <CommunitySection isDark={isDark} />
      <FoundersClubCalendarWidget isDark={isDark} />
      <ResourceSection isDark={isDark} />
      <NewsletterSection isDark={isDark} />
    </>
  );
}
