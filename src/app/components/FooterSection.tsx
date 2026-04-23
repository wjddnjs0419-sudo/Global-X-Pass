import { Link, useLocation } from "react-router"; // 💡 경로 확인을 위한 기능 추가
import logoImg from "../../imports/Logo.png";

interface FooterSectionProps {
  isDark?: boolean;
}

export function FooterSection({ isDark = false }: FooterSectionProps) {
  const location = useLocation(); // 💡 현재 내가 어떤 페이지에 있는지 확인

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(10,16,32,0.55)";
  const borderTop = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const footerBg = isDark ? "#0a1020" : "#F7F8FC";

  // 💡 로고 클릭 시 동작하는 함수
  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      // 만약 이미 홈 화면이라면?
      e.preventDefault(); // 페이지 이동을 막고
      window.scrollTo({ top: 0, behavior: "smooth" }); // 부드럽게 맨 위로!
    }
  };

  return (
    <footer
      style={{
        width: "100%",
        borderTop: `1px solid ${borderTop}`,
        background: footerBg,
        padding: "32px clamp(12px, 3vw, 32px)", 
        fontFamily: "'Pretendard', sans-serif",
        display: "flex",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* 1. 로고 (클릭 기능 연결) */}
        <div>
          <Link 
            to="/" 
            onClick={handleLogoClick}
            style={{ display: "inline-block", cursor: "pointer", textDecoration: "none" }}
          >
            <img
              src={logoImg}
              alt="Next Challenge 로고"
              style={{
                height: 20,
                objectFit: "contain",
                filter: isDark ? "brightness(0) invert(1)" : "none",
                transition: "filter 0.3s ease",
              }}
            />
          </Link>
        </div>

        {/* 2. 회사명 & 주소 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ color: textMain, fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
            넥스트챌린지 글로벌 엑셀러레이팅본부
          </div>
          <div style={{ color: textMuted, fontSize: 13, fontWeight: 400 }}>
            서울특별시 서대문구 이화여대길 59, 2층 넥스트챌린지
          </div>
        </div>

        {/* 3. 카피라이트 */}
        <div style={{ marginTop: "8px", color: textMuted, fontSize: 12, fontWeight: 400 }}>
          Copyright Next Challenge. All rights reserved.
        </div>
        
      </div>
    </footer>
  );
}