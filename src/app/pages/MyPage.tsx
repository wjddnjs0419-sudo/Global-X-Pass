import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import type { Profile } from "../../lib/types";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

export function MyPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string; id: string; user_metadata: Record<string, string> } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consultingReservations, setConsultingReservations] = useState<any[]>([]);
  const [clubApplications, setClubApplications] = useState<any[]>([]);

  // MFA States
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);

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

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 페이지입니다.");
        navigate("/login");
      } else {
        setUser(user as typeof user & { user_metadata: Record<string, string> });
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data as Profile);

        // MFA Factor check
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp?.some(f => f.status === "verified")) {
          setIsMfaEnabled(true);
        }

        if (data?.role !== "admin") {
          const { data: resData } = await supabase
            .from("consulting_reservations")
            .select("*, consulting_slots(slot_date, slot_time, consultants(name, category))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          setConsultingReservations(resData || []);

          const { data: clubData } = await supabase
            .from("founders_club_applications")
            .select("*, founders_club_sessions(theme, session_date, status)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          setClubApplications(clubData || []);
        }
      }
    };
    fetchUserAndProfile();
  }, [navigate]);

  const handleVerifyOldPassword = async () => {
    if (!oldPassword) return alert("현재 비밀번호를 입력해주세요.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: user?.email ?? "", password: oldPassword });
    if (error) {
      alert("현재 비밀번호가 일치하지 않습니다.");
      setOldPassword("");
    } else {
      alert("비밀번호가 확인되었습니다. 이제 새 비밀번호를 입력해주세요.");
      setIsVerified(true);
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return alert("새 비밀번호는 8자 이상 입력해주세요.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("비밀번호 변경 실패: " + error.message);
    else {
      alert("비밀번호가 성공적으로 변경되었습니다!");
      setOldPassword(""); setNewPassword(""); setIsVerified(false);
    }
    setLoading(false);
  };

  // MFA Functions
  const handleMfaEnroll = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Global X Pass",
      friendlyName: user?.email ?? "Admin",
    });

    if (error) {
      alert("MFA 설정 중 오류: " + error.message);
    } else {
      setMfaQr(data.totp.qr_code);
      setMfaFactorId(data.id);
    }
    setLoading(false);
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || !otpCode) return;
    setLoading(true);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeError) {
      alert("인증 오류: " + challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challengeData.id,
      code: otpCode,
    });

    if (verifyError) {
      alert("번호가 올바르지 않습니다.");
    } else {
      alert("MFA 설정이 완료되었습니다! 이제 다음 로그인부터 2단계 인증이 필요합니다.");
      setIsMfaEnabled(true);
      setMfaQr(null);
      setMfaFactorId(null);
      setOtpCode("");
    }
    setLoading(false);
  };

  const handleMfaUnenroll = async () => {
    if (!confirm("2단계 인증을 해제하시겠습니까? 관리자 계정 보안이 취약해질 수 있습니다.")) return;
    setLoading(true);
    
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factors?.totp?.find(f => f.status === "verified");
    
    if (verifiedFactor) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
      if (error) alert("해제 실패: " + error.message);
      else {
        alert("2단계 인증이 해제되었습니다.");
        setIsMfaEnabled(false);
      }
    }
    setLoading(false);
  };

  if (!user) return null;

  const eyeIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <PageShell title="마이페이지" subtitle="내 정보 확인 및 설정" accentColor="#4377F1">
      <div className="flex flex-col items-center pb-[60px] gap-6">
        <div
          className="w-full max-w-[500px] rounded-[20px] px-9 py-10 flex flex-col gap-8"
          style={{ background: card, border: `1px solid ${border}` }}
        >
          <div>
            <h3 className="mb-5 text-[18px]" style={{ color: textMain }}>가입 정보</h3>
            <div className="text-[15px] mb-3" style={{ color: textMuted }}>이메일 : <span className="font-semibold" style={{ color: textMain }}>{user.email}</span></div>
            <div className="text-[15px] mb-3" style={{ color: textMuted }}>이름 : <span className="font-semibold" style={{ color: textMain }}>{profile?.name || user.user_metadata?.name || "미입력"}</span></div>
            <div className="text-[15px] mb-3" style={{ color: textMuted }}>연락처 : <span className="font-semibold" style={{ color: textMain }}>{profile?.phone || user.user_metadata?.phone || "미입력"}</span></div>
            <div className="text-[15px] mb-3" style={{ color: textMuted }}>소속 : <span className="font-semibold" style={{ color: textMain }}>{profile?.company || user.user_metadata?.company || "미입력"}</span></div>
            <div className="text-[15px]" style={{ color: textMuted }}>구분 : <span className="font-semibold" style={{ color: textMain }}>{profile?.user_type || user.user_metadata?.user_type || "미입력"}</span></div>
          </div>

          <hr className="border-none m-0" style={{ borderTop: `1px solid ${border}` }} />

          <div>
            <h3 className="mb-4 text-[18px]" style={{ color: textMain }}>비밀번호 변경</h3>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input 
                  type={showOldPassword ? "text" : "password"} 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  placeholder="현재 비밀번호 확인" 
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-[14px] outline-none font-['Pretendard',sans-serif] box-border m-0" 
                  style={inputDynamicStyle} 
                  disabled={isVerified} 
                />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer" style={{ color: textMuted }}>
                  {eyeIcon}
                </button>
              </div>
              {!isVerified && (
                <button 
                  onClick={handleVerifyOldPassword} 
                  disabled={loading} 
                  className="px-4 rounded-xl border-none cursor-pointer font-semibold"
                  style={{ background: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: textMain }}
                >
                  확인
                </button>
              )}
            </div>

            {isVerified && (
              <form onSubmit={handlePasswordUpdate}>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="새 비밀번호 (8자 이상)" 
                    className="w-full pl-4 pr-10 py-3 rounded-xl text-[14px] outline-none font-['Pretendard',sans-serif] box-border mb-3" 
                    style={inputDynamicStyle} 
                    required 
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-[22px] -translate-y-1/2 bg-none border-none cursor-pointer" style={{ color: textMuted }}>
                    {eyeIcon}
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={`w-full py-[14px] rounded-xl border-none text-white text-[15px] font-bold font-['Pretendard',sans-serif] mt-2 ${loading ? "bg-gray-500 cursor-not-allowed" : "cursor-pointer"}`}
                  style={{ background: loading ? undefined : "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)" }}
                >
                  {loading ? "변경 중..." : "새 비밀번호 저장"}
                </button>
              </form>
            )}
          </div>

          {profile?.role === "admin" && (
            <>
              <hr className="border-none mt-2 mb-0" style={{ borderTop: `1px solid ${border}` }} />
              <div>
                <h3 className="mb-4 text-[18px]" style={{ color: textMain }}>관리자 보안 (MFA)</h3>
                {!isMfaEnabled && !mfaQr && (
                  <div style={{ padding: "20px", borderRadius: 16, background: isDark ? "rgba(32,214,162,0.08)" : "#f0fdf4", border: "1px solid rgba(32,214,162,0.2)" }}>
                    <p style={{ margin: "0 0 12px", fontSize: 14, color: textMain, fontWeight: 600 }}>2단계 인증(OTP)이 설정되어 있지 않습니다.</p>
                    <p style={{ margin: "0 0 20px", fontSize: 13, color: textMuted, lineHeight: 1.5 }}>관리자 계정 보안을 위해 Google Authenticator 등 OTP 앱을 통한 2단계 인증 설정을 강력히 권장합니다.</p>
                    <button
                      onClick={handleMfaEnroll}
                      disabled={loading}
                      className="w-full py-3 rounded-xl border-none text-white text-[14px] font-bold cursor-pointer"
                      style={{ background: "#20D6A2" }}
                    >
                      {loading ? "준비 중..." : "2단계 인증 설정하기"}
                    </button>
                  </div>
                )}

                {!isMfaEnabled && mfaQr && (
                  <div style={{ padding: "20px", borderRadius: 16, background: card, border: `1px solid ${border}`, textAlign: "center" }}>
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: textMain, fontWeight: 700 }}>OTP 앱으로 QR 코드를 스캔하세요</p>
                    <div 
                      dangerouslySetInnerHTML={{ __html: mfaQr }} 
                      style={{ background: "#fff", padding: 12, borderRadius: 12, display: "inline-block", marginBottom: 20 }}
                    />
                    <div className="text-left">
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: textMuted }}>인증 앱에 표시된 6자리 번호를 입력하세요</p>
                      <div className="flex justify-center mb-6">
                        <InputOTP
                          maxLength={6}
                          value={otpCode}
                          onChange={(val) => setOtpCode(val)}
                        >
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                              <InputOTPSlot 
                                key={idx} 
                                index={idx} 
                                style={{ width: 40, height: 50, fontSize: 18, fontWeight: 700, background: inputBg, borderColor: inputBorder, color: textMain }} 
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <button
                        onClick={handleMfaVerify}
                        disabled={loading || otpCode.length !== 6}
                        className="w-full py-3 rounded-xl border-none text-white text-[14px] font-bold cursor-pointer mt-4"
                        style={{ background: "#4377F1", opacity: otpCode.length === 6 ? 1 : 0.5 }}
                      >
                        {loading ? "확인 중..." : "인증 완료 및 활성화"}
                      </button>
                      <button
                        onClick={() => { setMfaQr(null); setMfaFactorId(null); setOtpCode(""); }}
                        style={{ width: "100%", background: "none", border: "none", color: textMuted, fontSize: 13, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {isMfaEnabled && (
                  <div style={{ padding: "20px", borderRadius: 16, background: isDark ? "rgba(67,119,241,0.08)" : "#eff6ff", border: "1px solid rgba(67,119,241,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>🛡️</span>
                      <p style={{ margin: 0, fontSize: 14, color: textMain, fontWeight: 600 }}>2단계 인증(MFA)이 활성화되어 있습니다.</p>
                    </div>
                    <p style={{ margin: "0 0 20px", fontSize: 13, color: textMuted, lineHeight: 1.5 }}>현재 관리자 계정이 보호되고 있습니다. 로그아웃 후 다시 로그인할 때 OTP 번호 입력이 필요합니다.</p>
                    <button
                      onClick={handleMfaUnenroll}
                      disabled={loading}
                      className="w-full py-3 rounded-xl border-none text-[#ea4335] text-[13px] font-semibold cursor-pointer"
                      style={{ background: isDark ? "rgba(234,67,53,0.1)" : "#fef2f2", border: "1px solid rgba(234,67,53,0.2)" }}
                    >
                      {loading ? "처리 중..." : "2단계 인증 해제하기"}
                    </button>
                  </div>
                )}
              </div>

              <hr className="border-none mt-2 mb-0" style={{ borderTop: `1px solid ${border}` }} />
              <div>
                <h3 className="mb-4 text-[18px]" style={{ color: textMain }}>관리자 권한</h3>
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full py-[14px] rounded-xl border-none text-white text-[15px] font-bold cursor-pointer font-['Pretendard',sans-serif] shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                  style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}
                >
                  관리자 페이지(게시물 등록) 바로가기
                </button>
              </div>
            </>
          )}
        </div>

        {/* Consulting reservations — admin 제외 */}
        {profile?.role !== "admin" && consultingReservations.length > 0 && (
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-8 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 style={{ color: textMain, fontSize: 18, margin: 0 }}>나의 컨설팅 신청</h3>
            {consultingReservations.map((r: any) => {
              const slot = r.consulting_slots;
              const consultant = slot?.consultants;
              const statusCfg: Record<string, { label: string; color: string }> = {
                pending: { label: "대기중", color: "#FBBC05" },
                confirmed: { label: "확정", color: "#18A343" },
                rejected: { label: "거절", color: "#EA4335" },
              };
              const cfg = statusCfg[r.status] ?? { label: r.status, color: "#888" };
              return (
                <div key={r.id} style={{ padding: "14px 18px", borderRadius: 14, border: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 14, marginBottom: 4 }}>{consultant?.name}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{slot?.slot_date} {slot?.slot_time?.slice(0, 5)}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.color + "22", padding: "3px 10px", borderRadius: 99 }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Founder's Club applications — admin 제외 */}
        {profile?.role !== "admin" && clubApplications.length > 0 && (
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-8 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 style={{ color: textMain, fontSize: 18, margin: 0 }}>나의 Founder's Club 신청</h3>
            {clubApplications.map((a: any) => {
              const session = a.founders_club_sessions;
              const statusCfg: Record<string, { label: string; color: string }> = {
                pending: { label: "검토중", color: "#FBBC05" },
                accepted: { label: "수락됨", color: "#18A343" },
                rejected: { label: "거절됨", color: "#EA4335" },
              };
              const cfg = statusCfg[a.status] ?? { label: a.status, color: "#888" };
              return (
                <div key={a.id} style={{ padding: "14px 18px", borderRadius: 14, border: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 14, marginBottom: 4 }}>{session?.theme}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{session?.session_date ?? "날짜 미정"}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.color + "22", padding: "3px 10px", borderRadius: 99 }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
