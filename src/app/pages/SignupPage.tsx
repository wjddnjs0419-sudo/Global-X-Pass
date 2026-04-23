import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const ROLES = ["스타트업 대표", "투자자", "예비 창업자", "멘토/전문가", "기타"];

// 💡 Field 컴포넌트: 레이아웃 유지를 위해 분리
const Field = ({ label, textMuted, children }: { label: string; textMuted: string; children: React.ReactNode }) => (
  <div>
    <div style={{ fontSize: 13, color: textMuted, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

export default function SignupPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", 
    email: "", 
    password: "", 
    confirm: "",
    company: "", 
    role: ROLES[0],
  });
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "#ffffff" : "#1d1d1f";
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "#86868b";
  const inputBg = isDark ? "rgba(255,255,255,0.03)" : "#f5f5f7";

  // 💡 수정된 핵심 로직: 모든 필드가 채워졌는지 확인 (필수 입력 구현)
  const canSubmit = 
    form.name.trim() !== "" &&           // 이름 필수
    form.email.trim() !== "" &&          // 이메일 필수
    form.password.length >= 6 &&         // 비밀번호 최소 6자
    form.password === form.confirm &&    // 비밀번호 확인 일치
    form.company.trim() !== "" &&        // 소속 필수
    agree.terms &&                       // 이용약관 동의 필수
    agree.privacy;                       // 개인정보 동의 필수

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      // 1. Supabase Auth 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. profiles 테이블에 추가 정보 저장 (SQL에서 만든 profiles 테이블 기준)
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              email: form.email,
              role: "user", // 기본값은 user, 관리자가 DB에서 admin으로 변경 가능
              // 추가 필드가 필요하다면 여기에 name, company 등을 추가 (DB 컬럼 먼저 생성 필요)
            }
          ]);

        if (profileError) throw profileError;
        
        alert("회원가입이 완료되었습니다! 로그인해 주세요.");
        navigate("/login");
      }
    } catch (err: any) {
      alert(err.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: inputBg,
    color: textMain,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  };

  return (
    <PageShell>
      <div style={{ maxWidth: 420, margin: "60px auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: textMain, marginBottom: 8 }}>회원가입</h1>
          <p style={{ color: textMuted, fontSize: 15 }}>Global X Pass에 오신 것을 환영합니다</p>
        </div>

        <form 
          onSubmit={handleSignup}
          style={{ 
            background: card, 
            padding: 32, 
            borderRadius: 24, 
            border: `1px solid ${border}`,
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}
        >
          <Field label="이름 (실명)" textMuted={textMuted}>
            <input
              style={inputStyle}
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>

          <Field label="이메일 주소" textMuted={textMuted}>
            <input
              type="email"
              style={inputStyle}
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="비밀번호" textMuted={textMuted}>
              <input
                type="password"
                style={inputStyle}
                placeholder="6자 이상"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </Field>
            <Field label="비밀번호 확인" textMuted={textMuted}>
              <input
                type="password"
                style={inputStyle}
                placeholder="다시 입력"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </Field>
          </div>

          <Field label="소속 (회사/팀)" textMuted={textMuted}>
            <input
              style={inputStyle}
              placeholder="소속을 입력해주세요"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
            />
          </Field>

          <Field label="회원 구분" textMuted={textMuted}>
            <select
              style={inputStyle}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {[
              { key: "terms", label: "(필수) 이용약관 동의" },
              { key: "privacy", label: "(필수) 개인정보 처리방침 동의" },
              { key: "marketing", label: "(선택) 마케팅 정보 수신 동의" },
            ].map((a) => (
              <label key={a.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: textMain, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={(agree as any)[a.key]}
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
              boxShadow: canSubmit ? "0 8px 24px rgba(67,119,241,0.3)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: textMuted }}>
          이미 계정이 있으신가요? <Link to="/login" style={{ color: "#4377F1", textDecoration: "none", fontWeight: 600 }}>로그인</Link>
        </p>
      </div>
    </PageShell>
  );
}