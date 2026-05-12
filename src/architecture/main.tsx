import { type FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LiveArchitectureMap } from "../app/components/admin/LiveArchitectureMap";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../app/components/ui/input-otp";
import { supabase } from "../lib/supabaseClient";
import { challengeAndPersistTotpVerification, getTotpFactorSnapshot } from "../utils/mfa";
import "../styles/index.css";

document.documentElement.classList.add("dark");
document.body.style.background = "#05070f";

type Step = "checking" | "login" | "otp" | "denied" | "ready";

// ── 아이콘 ────────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ── 다크 테마 토큰 (항상 다크) ────────────────────────────────────────────────
const T = {
  bg:          "#05070f",
  card:        "rgba(255,255,255,0.03)",
  border:      "rgba(255,255,255,0.08)",
  inputBg:     "rgba(255,255,255,0.05)",
  inputBorder: "rgba(255,255,255,0.12)",
  textMain:    "rgba(255,255,255,0.92)",
  textMuted:   "rgba(255,255,255,0.4)",
  accent:      "#4377F1",
  errorBg:     "rgba(234,67,53,0.1)",
  errorBorder: "rgba(234,67,53,0.25)",
  errorText:   "#ff6b5b",
};

// ── 공통 스타일 ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: T.inputBg,
  border: `1px solid ${T.inputBorder}`,
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 14,
  color: T.textMain,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Pretendard', sans-serif",
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  background: disabled ? "rgba(255,255,255,0.1)" : T.accent,
  border: "none",
  borderRadius: 12,
  padding: "14px",
  fontSize: 15,
  fontWeight: 700,
  color: disabled ? "rgba(255,255,255,0.35)" : "#fff",
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "'Pretendard', sans-serif",
  transition: "background 0.15s, opacity 0.15s",
});

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.errorText, lineHeight: 1.55 }}>
      {msg}
    </div>
  );
}

// ── 로그인 폼 ─────────────────────────────────────────────────────────────────
function LoginCard({
  onLogin, error, busy,
}: {
  onLogin: (email: string, password: string) => void;
  error: string | null;
  busy: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <form
      onSubmit={(e: FormEvent) => { e.preventDefault(); if (!busy) onLogin(email, password); }}
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      {error && <ErrorBox msg={error} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 13, color: T.textMuted }}>이메일</span>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com" autoComplete="email" required
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 13, color: T.textMuted }}>비밀번호</span>
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password" required
            style={{ ...inputStyle, paddingRight: 46 }}
          />
          <button
            type="button" onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", alignItems: "center", padding: 0 }}
          >
            {showPw ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={busy} style={{ ...btnStyle(busy), marginTop: 4 }}>
        {busy ? "로그인 중…" : "로그인"}
      </button>

      <p style={{ margin: 0, textAlign: "center", fontSize: 12, color: T.textMuted }}>
        관리자 계정 + MFA 인증이 필요합니다
      </p>
    </form>
  );
}

// ── OTP 폼 ────────────────────────────────────────────────────────────────────
function OtpCard({
  onVerify, onBack, error, busy,
}: {
  onVerify: (code: string) => void;
  onBack: () => void;
  error: string | null;
  busy: boolean;
}) {
  const [otp, setOtp] = useState("");

  const slotStyle: React.CSSProperties = {
    width: 48,
    height: 58,
    fontSize: 22,
    fontWeight: 800,
    background: T.inputBg,
    borderColor: T.inputBorder,
    color: T.textMain,
    borderRadius: 10,
  };

  const handleChange = (val: string) => {
    setOtp(val);
    if (val.length === 6 && !busy) onVerify(val);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: T.textMain }}>OTP 인증</h3>
        <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
          인증 앱에 표시된 6자리 코드를<br />입력해 주세요.
        </p>
      </div>

      {error && <ErrorBox msg={error} />}

      <div style={{ padding: "8px 0" }}>
        <InputOTP maxLength={6} value={otp} onChange={handleChange} autoFocus disabled={busy}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <InputOTPSlot key={idx} index={idx} style={slotStyle} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <button
        type="button" disabled={busy || otp.length !== 6}
        onClick={() => otp.length === 6 && onVerify(otp)}
        style={{ ...btnStyle(busy || otp.length !== 6), maxWidth: 320, width: "100%" }}
      >
        {busy ? "인증 중…" : "인증 및 진입"}
      </button>

      <button
        type="button" onClick={onBack}
        style={{ background: "none", border: "none", fontSize: 12, color: T.textMuted, cursor: "pointer", textDecoration: "underline", padding: 0 }}
      >
        로그인 화면으로 돌아가기
      </button>
    </div>
  );
}

// ── 거부 상태 ─────────────────────────────────────────────────────────────────
function DeniedCard({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", padding: "12px 0" }}>
      <div style={{ fontSize: 44 }}>🚫</div>
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: T.textMain }}>접근 권한 없음</h3>
        <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.7 }}>
          관리자 계정 + MFA 인증이 필요합니다.<br />
          권한이 있다면 관리자에게 문의하세요.
        </p>
      </div>
      <button type="button" onClick={onBack} style={{ ...btnStyle(false), maxWidth: 240 }}>다시 시도</button>
    </div>
  );
}

// ── 앱 루트 ───────────────────────────────────────────────────────────────────
function ArchitectureMapApp() {
  const [step, setStep] = useState<Step>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void checkSession(); }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setStep("login"); return; }
    await checkAal();
  }

  async function checkAal() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel === "aal2") { await checkAdmin(); return; }
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const snap = getTotpFactorSnapshot(factorsData);
    if (snap.verifiedTotpFactor) {
      setFactorId(snap.verifiedTotpFactor.id);
      setStep("otp");
    } else {
      setStep("denied");
    }
  }

  async function checkAdmin() {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    setStep(isAdmin ? "ready" : "denied");
  }

  const handleLogin = async (email: string, password: string) => {
    setBusy(true); setLoginError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoginError("이메일 또는 비밀번호가 맞지 않습니다."); setBusy(false); return; }
    await checkAal();
    setBusy(false);
  };

  const handleOtp = async (code: string) => {
    if (!factorId) return;
    setBusy(true); setOtpError(null);
    const result = await challengeAndPersistTotpVerification(supabase, factorId, code);
    if (result.error) { setOtpError("OTP 코드가 맞지 않습니다. 다시 확인해 주세요."); setBusy(false); return; }
    await checkAdmin();
    setBusy(false);
  };

  const handleBack = async () => {
    await supabase.auth.signOut();
    setFactorId(null); setLoginError(null); setOtpError(null);
    setStep("login");
  };

  // ── 맵 진입 ────────────────────────────────────────────────────────────────
  if (step === "ready") {
    return (
      <div style={{ height: "100vh", overflow: "hidden", background: "#0f0f0f", color: "var(--color-text-primary)" }}>
        <main style={{ width: "100%", height: "100%" }}>
          <LiveArchitectureMap />
        </main>
      </div>
    );
  }

  // ── 로그인 오버레이 ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 38%, rgba(67,119,241,0.08) 0%, ${T.bg} 64%)`,
      padding: 24,
    }}>
      {/* 카드 */}
      <div style={{
        width: "100%",
        maxWidth: 460,
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: "40px 36px",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(67,119,241,0.06)",
        backdropFilter: "blur(24px)",
      }}>

        {/* 헤더 */}
        {step !== "otp" && step !== "denied" && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(67,119,241,0.15)", border: "1px solid rgba(67,119,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                🗺️
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Global X Pass
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.textMain, marginTop: 1 }}>
                  Architecture Map
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        {step === "checking" && (
          <p style={{ color: T.textMuted, fontSize: 13, textAlign: "center", margin: 0 }}>세션 확인 중…</p>
        )}
        {step === "login" && (
          <LoginCard onLogin={handleLogin} error={loginError} busy={busy} />
        )}
        {step === "otp" && (
          <OtpCard onVerify={handleOtp} onBack={handleBack} error={otpError} busy={busy} />
        )}
        {step === "denied" && (
          <DeniedCard onBack={handleBack} />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("architecture-root")!).render(
  <ArchitectureMapApp />,
);
