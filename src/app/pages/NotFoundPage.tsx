import { Link } from "react-router";
import { useTheme } from "../ThemeContext";

export function NotFoundPage() {
  const { isDark } = useTheme();

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center font-['Pretendard',sans-serif] text-center px-6"
      style={{ background: "var(--color-bg-surface)" }}
    >
      <p className="text-[96px] font-black text-[#4377F1] m-0 leading-none">404</p>
      <h1 className="text-[28px] font-extrabold my-5 mb-3" style={{ color: textMain }}>
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-[16px] m-0 mb-10 leading-[1.6]" style={{ color: textMuted }}>
        주소가 잘못되었거나 삭제된 페이지예요.
      </p>
      <Link
        to="/"
        className="inline-block px-8 py-[14px] rounded-xl bg-[#4377F1] text-white font-bold text-[15px] no-underline"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
