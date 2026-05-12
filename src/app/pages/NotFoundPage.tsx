import { Link } from "react-router";

export function NotFoundPage() {
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center font-['Pretendard',sans-serif] text-center px-6"
      style={{ background: "var(--color-bg-surface)" }}
    >
      <p className="text-[96px] font-black m-0 leading-none" style={{ color: "var(--color-accent-blue)" }}>404</p>
      <h1 className="text-[28px] font-extrabold my-5 mb-3" style={{ color: textMain }}>
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-[16px] m-0 mb-10 leading-[1.6]" style={{ color: textMuted }}>
        주소가 잘못되었거나 삭제된 페이지예요.
      </p>
      <Link
        to="/"
        className="inline-block px-8 py-[14px] rounded-xl font-bold text-[15px] no-underline"
        style={{ background: "var(--color-accent-blue)", color: "var(--color-on-primary)" }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
