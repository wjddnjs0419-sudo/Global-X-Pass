import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { challengeAndPersistTotpVerification, getTotpFactorSnapshot } from "../../utils/mfa";

const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" x2="23" y2="23"></line></svg>;

export function LoginPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const logoutReason = sessionStorage.getItem("logout_reason");
  if (logoutReason) sessionStorage.removeItem("logout_reason");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // MFA States
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [tempProfile, setTempProfile] = useState<any>(null);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const inputDynamicStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textMain,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // 가입 승인제: 미승인(pending)·반려(rejected) 계정은 auth ban 상태라 'user_banned' 코드로 거부된다.
      if (error.code === "user_banned") {
        alert("아직 로그인할 수 없는 계정입니다.\n관리자 승인이 완료되면 로그인하실 수 있습니다.");
      } else {
        alert("로그인 실패: 이메일이나 비밀번호를 확인해주세요.");
      }
      setLoading(false);
      return;
    }

    // Get profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user!.id)
      .single();

    // MFA 우회 토글이 활성·미만료면 OTP 챌린지·factor 등록 강제 및 MFA API 호출 자체를 모두 skip
    let mfaBypassed = false;
    if (profile?.role === "admin") {
      const { data: bypassed } = await supabase.rpc("is_admin_mfa_bypassed");
      mfaBypassed = bypassed === true;
    }

    if (!mfaBypassed && profile?.role === "admin") {
      // Check MFA (aal2 requirement) — bypass 비활성 admin만
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

      // MFA API 호출 실패 → admin은 fail-close (로그인 거부)
      if (aalError || factorsError || !aalData || !factors) {
        await supabase.auth.signOut();
        alert("관리자 인증 상태를 확인할 수 없어 로그인을 중단했습니다. 잠시 후 다시 시도해 주세요.");
        setLoading(false);
        return;
      }

      const { verifiedTotpFactor } = getTotpFactorSnapshot(factors);

      if (aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2" && verifiedTotpFactor) {
        // Admin with MFA enrolled but not yet verified this session — show OTP challenge
        setMfaFactorId(verifiedTotpFactor.id);
        setTempProfile(profile);
        setLoading(false);
        return;
      }

      if (!verifiedTotpFactor) {
        // Admin without a verified factor — force enrollment or recovery before granting access
        sessionStorage.setItem("mfa_setup_required", "true");
        navigate("/mypage");
        return;
      }
    }

    alert("환영합니다! 로그인이 완료되었습니다.");
    if (profile?.role === "admin") {
      navigate(from ?? "/admin");
    } else {
      navigate(from ?? "/");
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || otpCode.length !== 6) return;

    setLoading(true);
    const { error: verifyError } = await challengeAndPersistTotpVerification(supabase, mfaFactorId, otpCode);

    if (verifyError) {
      alert("인증 오류: " + verifyError.message);
      setLoading(false);
      return;
    }

    alert("2단계 인증이 완료되었습니다.");
    if (tempProfile?.role === "admin") {
      navigate(from ?? "/admin");
    } else {
      navigate(from ?? "/");
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return alert("비밀번호를 찾을 이메일 주소를 위에 먼저 입력해 주세요.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) alert("비밀번호 찾기 실패: " + error.message);
    else alert("비밀번호 재설정 링크가 발송되었습니다! 이메일을 확인해 주세요.");
    setLoading(false);
  };

  return (
    <PageShell 
      title={mfaFactorId ? "2단계 인증" : "로그인"} 
      subtitle={mfaFactorId ? "보안을 위해 OTP 번호를 입력해주세요." : "NCF × Around X 회원 전용 서비스를 이용하세요."} 
      accentColor={mfaFactorId ? "#4377F1" : "#20D6A2"}
    >
      <div className="flex justify-center flex-col items-center gap-4">
        {logoutReason && !mfaFactorId && (
          <div className="w-full max-w-[460px] rounded-[14px] px-5 py-3 text-[13px] font-semibold text-center"
            style={{ background: "var(--color-warning-soft-bg)", border: "1px solid var(--color-warning-soft-border)", color: "var(--color-brand-yellow)" }}>
            30분 동안 활동이 없어 자동 로그아웃되었습니다. 다시 로그인해 주세요.
          </div>
        )}

        {mfaFactorId ? (
          <form
            onSubmit={handleMfaVerify}
            className="w-full max-w-[460px] rounded-[20px] px-9 py-10 flex flex-col gap-6"
            style={{ background: card, border: `1px solid ${border}` }}
          >
            <div className="text-center">
              <div className="text-[40px] mb-4">🛡️</div>
              <h3 className="m-0 mb-2 text-[18px]" style={{ color: textMain }}>OTP 인증</h3>
              <p className="text-[13px] m-0" style={{ color: textMuted, lineHeight: 1.5 }}>
                인증 앱에 표시된 6자리 코드를<br />입력해 주세요.
              </p>
            </div>

            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(val) => setOtpCode(val)}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot 
                      key={idx} 
                      index={idx} 
                      style={{ width: 45, height: 55, fontSize: 20, fontWeight: 800, background: inputBg, borderColor: inputBorder, color: textMain }} 
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button 
              type="submit" 
              disabled={loading || otpCode.length !== 6} 
              className={`py-[14px] rounded-xl border-none text-white text-[15px] font-bold font-['Pretendard',sans-serif] ${loading || otpCode.length !== 6 ? "bg-gray-500 cursor-not-allowed shadow-none" : "cursor-pointer shadow-none"}`}
              style={{ background: loading || otpCode.length !== 6 ? undefined : "#4377F1" }}
            >
              {loading ? "인증 중..." : "인증 및 로그인"}
            </button>

            <button
              type="button"
              onClick={() => { setMfaFactorId(null); setOtpCode(""); }}
              className="bg-none border-none underline text-[12px] cursor-pointer"
              style={{ color: textMuted }}
            >
              로그인 화면으로 돌아가기
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSubmit} 
            className="w-full max-w-[460px] rounded-[20px] px-9 py-10 flex flex-col gap-4"
            style={{ background: card, border: `1px solid ${border}` }}
          >
            <div className="mb-2">
              <div className="text-[13px] mb-1.5" style={{ color: textMuted }}>이메일</div>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                className="w-full px-4 py-[14px] rounded-xl text-[14px] outline-none font-['Pretendard',sans-serif] box-border"
                style={inputDynamicStyle} 
                required 
              />
            </div>

            <div>
              <div className="text-[13px] mb-1.5" style={{ color: textMuted }}>비밀번호</div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full pl-4 pr-10 py-[14px] rounded-xl text-[14px] outline-none font-['Pretendard',sans-serif] box-border"
                  style={inputDynamicStyle} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer flex items-center p-0"
                  style={{ color: textMuted }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: textMuted }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                로그인 유지
              </label>
              <a href="#" onClick={handleResetPassword} className="text-[#4377F1] no-underline font-semibold">비밀번호 찾기</a>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`mt-2 py-[14px] rounded-xl border-none text-white text-[15px] font-bold font-['Pretendard',sans-serif] ${loading ? "bg-gray-500 cursor-not-allowed shadow-none" : "cursor-pointer shadow-none"}`}
              style={{ background: loading ? undefined : "#4377F1" }}
            >
              {loading ? "처리 중..." : "로그인"}
            </button>
            <p className="text-center text-[13px] m-0 mt-3" style={{ color: textMuted }}>
              아직 회원이 아니신가요? <Link to="/signup" className="text-[#4377F1] font-bold no-underline">회원가입</Link>
            </p>
          </form>
        )}
      </div>
    </PageShell>
  );
}
