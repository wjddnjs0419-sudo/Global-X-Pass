import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const ROLES = ["스타트업 대표", "투자자", "예비 창업자", "멘토/전문가", "기타"];

// 💡 문제 해결: Field 컴포넌트를 SignupPage 밖으로 빼내어 재렌더링 오류를 막았습니다.
const Field = ({ label, textMuted, children }: { label: string; textMuted: string; children: React.ReactNode }) => (
  <div>
    <div style={{ fontSize: 13, color: textMuted, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

// 💡 라우터 오류를 막기 위해 export default를 사용합니다.
export default function SignupPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
    company: "", role: ROLES[0],
  });
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: textMain, fontSize: 14, outline: "none",
    fontFamily: "'Pretendard', sans-serif", boxSizing: "border-box",
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const passwordMismatch = form.confirm.length > 0 && form.password !== form.confirm;
  const canSubmit = form.name && form.email && form.password && !passwordMismatch && agree.terms && agree.privacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          company: form.company,
          role: form.role,
        }
      }
    });

    if (error) {
      alert("회원가입 실패: " + error.message);
      setLoading(false);
    } else {
      alert("가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    }
  };

  return (
    <PageShell title="회원가입" subtitle="3분이면 가입 완료. NCF × Around X 네트워크에 합류하세요." accentColor="#4377F1">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%", maxWidth: 560,
            background: card, border: `1px solid ${border}`,
            borderRadius: 20, padding: "40px 36px",
            display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          {/* 💡 Field를 호출할 때 textMuted 값을 전달해줍니다. */}
          <Field label="이름" textMuted={textMuted}>
            <input value={form.name} onChange={update("name")} placeholder="홍길동" style={inputStyle} required />
          </Field>

          <Field label="이메일" textMuted={textMuted}>
            <input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" style={inputStyle} required />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
            <Field label="비밀번호" textMuted={textMuted}>
              <input type="password" value={form.password} onChange={update("password")} placeholder="8자 이상" style={inputStyle} required minLength={8} />
            </Field>
            <Field label="비밀번호 확인" textMuted={textMuted}>
              <input
                type="password" value={form.confirm} onChange={update("confirm")} placeholder="동일하게 입력"
                style={{ ...inputStyle, borderColor: passwordMismatch ? "#EF4444" : inputBorder }}
                required
              />
            </Field>
          </div>
          {passwordMismatch && (
            <div style={{ color: "#EF4444", fontSize: 12, marginTop: -8 }}>비밀번호가 일치하지 않습니다.</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
            <Field label="회사명 (선택)" textMuted={textMuted}>
              <input value={form.company} onChange={update("company")} placeholder="(주) 어라운드엑스" style={inputStyle} />
            </Field>
            <Field label="구분" textMuted={textMuted}>
              <select value={form.role} onChange={update("role") as any} style={inputStyle}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <div style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${border}`, borderRadius: 12,
            padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, marginTop: 4,
          }}>
            {[
              { key: "terms" as const, label: "[필수] 이용약관 동의" },
              { key: "privacy" as const, label: "[필수] 개인정보 처리방침 동의" },
              { key: "marketing" as const, label: "[선택] 마케팅 정보 수신 동의" },
            ].map((a) => (
              <label key={a.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: textMain, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={agree[a.key]}
                  onChange={(e) => setAgree((s) => ({ ...s, [a.key]: e.target.checked }))}
                />
                {a.label}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            style={{
              marginTop: 8, padding: "14px 0", borderRadius: 12, border: "none",
              background: canSubmit
                ? "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)"
                : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"),
              color: canSubmit ? "#fff" : textMuted,
              fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "'Pretendard', sans-serif",
              boxShadow: canSubmit ? "0 8px 24px rgba(67,119,241,0.3)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "처리 중..." : "가입하기"}
          </button>

          <p style={{ textAlign: "center", color: textMuted, fontSize: 13, margin: "8px 0 0" }}>
            이미 계정이 있으신가요?{" "}
            <Link to="/login" style={{ color: "#4377F1", fontWeight: 700, textDecoration: "none" }}>로그인</Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}