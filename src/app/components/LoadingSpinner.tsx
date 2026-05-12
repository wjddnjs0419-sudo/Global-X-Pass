import { useTheme } from "../ThemeContext";

interface Props {
  message?: string;
}

export function LoadingSpinner({ message = "불러오는 중입니다..." }: Props) {
  const { isDark } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "var(--space-md)" }}>
      <div style={{
        width: 36, height: 36,
        border: "3px solid var(--color-glass-border)",
        borderTop: "3px solid var(--color-accent-blue)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)", fontFamily: "'Pretendard', sans-serif" }}>
        {message}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorMessage({ message = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." }: { message?: string }) {
  const { isDark } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "var(--space-sm)" }}>
      <p style={{ margin: 0, fontSize: 32 }}>⚠️</p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.55)", fontFamily: "'Pretendard', sans-serif", textAlign: "center" }}>
        {message}
      </p>
    </div>
  );
}
