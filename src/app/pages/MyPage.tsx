import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { X, Trash2 } from "lucide-react";
import { LAYERS } from "../../lib/layers";
import { supabase, supabaseUrl, supabaseAnonKey } from "../../lib/supabaseClient";
import type { Profile } from "../../lib/types";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { EVENT_APPLICATION_STATUS } from "../../utils/eventApplication";
import { sanitizeSvgMarkup } from "../../utils/htmlSecurity";
import { challengeAndPersistTotpVerification, getTotpFactorSnapshot } from "../../utils/mfa";
import { formatStructuredLocation } from "../../utils/scheduleFields";
import { getStatusPillStyle } from "../components/contentListStyles";
import { formatOfficeHourMonth, getOfficeHourStatusConfig } from "../constants/officeHours";

export function MyPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string; id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [pwChangeMfaOtp, setPwChangeMfaOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultingReservations, setConsultingReservations] = useState<any[]>([]);
  const [officeHourApplications, setOfficeHourApplications] = useState<any[]>([]);
  const [clubApplications, setClubApplications] = useState<any[]>([]);
  const [eventApplications, setEventApplications] = useState<any[]>([]);

  // 회원탈퇴 모달
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [showDeleteAccountPassword, setShowDeleteAccountPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // MFA States
  const [mfaQr, setMfaQr] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaPendingFactorName, setMfaPendingFactorName] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(() => {
    const val = sessionStorage.getItem("mfa_setup_required") === "true";
    if (val) sessionStorage.removeItem("mfa_setup_required");
    return val;
  });

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const panelBg = isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const deleteBg = isDark ? "rgba(234,67,53,0.08)" : "rgba(234,67,53,0.06)";
  const deleteBorder = isDark ? "rgba(234,67,53,0.28)" : "rgba(234,67,53,0.22)";

  const inputDynamicStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textMain,
  };

  const requestCardStyle: React.CSSProperties = {
    position: "relative",
    padding: "16px 42px 16px 18px",
    borderRadius: 14,
    border: `1px solid ${border}`,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const cancelIconStyle: React.CSSProperties = {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "none",
    background: isDark ? "rgba(234,67,53,0.14)" : "rgba(234,67,53,0.1)",
    color: "var(--color-brand-red)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.55 : 1,
  };

  const deleteIconStyle: React.CSSProperties = {
    ...cancelIconStyle,
    background: isDark ? "rgba(234,67,53,0.10)" : "rgba(234,67,53,0.07)",
  };

  const modalCloseButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "var(--space-md)",
    right: "var(--space-md)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    color: "var(--color-text-muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const statusPill = (cfg: { label: string; color: string }) => (
    <span style={{ ...getStatusPillStyle(cfg.color, isDark), whiteSpace: "nowrap" }}>{cfg.label}</span>
  );

  const fetchConsultingReservations = async (userId: string) => {
    const { data: resData } = await supabase
      .from("consulting_reservations")
      .select("*, consulting_slots(slot_date, slot_time, location, consultants(name, category))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setConsultingReservations(resData || []);
  };

  const fetchOfficeHourApplications = async (userId: string) => {
    const { data } = await supabase
      .from("office_hour_applications")
      .select("*, office_hour_months(period_month)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setOfficeHourApplications(data || []);
  };

  const fetchClubApplications = async (userId: string) => {
    const { data: clubData } = await supabase
      .from("founders_club_applications")
      .select("*, founders_club_sessions(theme, session_date, session_time, location, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setClubApplications(clubData || []);
  };

  const fetchEventApplications = async (userId: string) => {
    const { data: eventData } = await supabase
      .from("event_applications")
      .select("*, posts(title, event_date, location, event_status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setEventApplications(eventData || []);
  };

  const syncMfaState = async () => {
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) {
      console.error("MFA factor 조회 오류:", factorError.message);
      return {
        verifiedTotpFactor: null,
        pendingTotpFactor: null,
        hasVerifiedTotpFactor: false,
        hasPendingTotpFactor: false,
      };
    }

    const snapshot = getTotpFactorSnapshot(factorData);
    setIsMfaEnabled(snapshot.hasVerifiedTotpFactor);
    setMfaPendingFactorName(snapshot.pendingTotpFactor?.friendly_name ?? null);

    if (snapshot.hasVerifiedTotpFactor) {
      setMfaFactorId(null);
      setMfaQr(null);
      setOtpCode("");
      setMfaSetupRequired(false);
    } else {
      setMfaFactorId(snapshot.pendingTotpFactor?.id ?? null);
    }

    return snapshot;
  };

  const beginMfaEnrollment = async (forceReset = false) => {
    if (!user) return;

    setLoading(true);
    const snapshot = await syncMfaState();
    if (snapshot.hasVerifiedTotpFactor) {
      setLoading(false);
      return;
    }

    if (snapshot.pendingTotpFactor && !forceReset) {
      setMfaQr(null);
      setLoading(false);
      return;
    }

    if (snapshot.pendingTotpFactor && forceReset) {
      const { error: resetError } = await supabase.auth.mfa.unenroll({ factorId: snapshot.pendingTotpFactor.id });
      if (resetError) {
        alert("기존 미완료 MFA 설정 초기화 실패: " + resetError.message);
        setLoading(false);
        return;
      }
      setMfaFactorId(null);
      setMfaPendingFactorName(null);
      setMfaQr(null);
      setOtpCode("");
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Global X Pass",
      friendlyName: user.email ?? "Admin",
    });

    if (error) {
      if (error.message.includes("friendly name")) {
        await syncMfaState();
        alert("이전에 시작한 MFA 설정이 남아 있습니다. 이미 OTP 앱에 추가했다면 아래 인증으로 마무리하고, 아니라면 초기화 후 다시 설정해 주세요.");
      } else {
        alert("MFA 설정 중 오류: " + error.message);
      }
      setLoading(false);
      return;
    }

    setMfaQr(data.totp.qr_code);
    setMfaFactorId(data.id);
    setMfaPendingFactorName(data.friendly_name ?? user.email ?? "Admin");
    setLoading(false);
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 페이지입니다.");
        navigate("/login");
      } else {
        setUser({ id: user.id, email: user.email ?? undefined });
        const { data, error } = await supabase.functions.invoke('decrypt-own-profile');
        if (error) {
          console.error("내 프로필 복호화 오류:", error.message);
        } else if (data) {
          setProfile(data as Profile);
        }
        setProfileLoaded(true);

        // MFA Factor check
        await syncMfaState();

        if (data?.role !== "admin") {
          await Promise.all([
            fetchConsultingReservations(user.id),
            fetchOfficeHourApplications(user.id),
            fetchClubApplications(user.id),
            fetchEventApplications(user.id),
          ]);
        }
      }
    };
    fetchUserAndProfile();
  }, [navigate]);

  const handleCancelConsultingReservation = async (reservation: any) => {
    if (!window.confirm("컨설팅 신청을 취소하시겠습니까?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("consulting_reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (error) {
      alert("취소 실패: " + error.message);
    } else if (user?.id) {
      await fetchConsultingReservations(user.id);
    }
    setLoading(false);
  };

  const handleCancelOfficeHourApplication = async (application: any) => {
    if (!window.confirm("오피스아워 신청을 취소하시겠습니까?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("office_hour_applications")
      .update({ status: "cancelled" })
      .eq("id", application.id);

    if (error) {
      alert("취소 실패: " + error.message);
    } else if (user?.id) {
      await fetchOfficeHourApplications(user.id);
    }
    setLoading(false);
  };

  const handleCancelClubApplication = async (application: any) => {
    if (!window.confirm("Founder's Club 신청을 취소하시겠습니까?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("founders_club_applications")
      .update({ status: "cancelled" })
      .eq("id", application.id);

    if (error) {
      alert("취소 실패: " + error.message);
    } else if (user?.id) {
      await fetchClubApplications(user.id);
    }
    setLoading(false);
  };

  const handleCancelEventApplication = async (application: any) => {
    if (!window.confirm("행사 신청을 취소하시겠습니까?")) return;

    setLoading(true);
    const { error } = await supabase
      .from("event_applications")
      .update({ status: "cancelled" })
      .eq("id", application.id);

    if (error) {
      alert("취소 실패: " + error.message);
    } else if (user?.id) {
      await fetchEventApplications(user.id);
    }
    setLoading(false);
  };

  const handleVerifyOldPassword = async () => {
    if (!oldPassword) return alert("현재 비밀번호를 입력해주세요.");
    setLoading(true);
    const noopStorage = {
      getItem: (_k: string): string | null => null,
      setItem: (_k: string, _v: string): void => {},
      removeItem: (_k: string): void => {},
    };
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storage: noopStorage, persistSession: false, autoRefreshToken: false },
    });
    const { error } = await tempClient.auth.signInWithPassword({ email: user?.email ?? "", password: oldPassword });
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
    try {
      if (isMfaEnabled && profile?.role === "admin") {
        // 관리자 + MFA: 챌린지로 AAL2 확보 후 updateUser
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp?.find(f => f.status === "verified");
        if (!factor) throw new Error("MFA factor를 찾을 수 없습니다.");
        const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
        if (challengeErr) throw challengeErr;
        const { error: verifyErr } = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challengeData.id,
          code: pwChangeMfaOtp,
        });
        if (verifyErr) { alert("OTP 코드가 올바르지 않습니다."); setLoading(false); return; }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      } else {
        // 일반 유저 또는 MFA 잔존 전 관리자: Edge Function으로 처리 (AAL2 무관)
        const { data, error } = await supabase.functions.invoke("change-password", {
          body: { oldPassword, newPassword },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }
      alert("비밀번호가 성공적으로 변경되었습니다!");
      setOldPassword(""); setNewPassword(""); setIsVerified(false); setPwChangeMfaOtp("");
    } catch (err: any) {
      alert("비밀번호 변경 실패: " + (err.message ?? "알 수 없는 오류"));
    }
    setLoading(false);
  };

  // MFA Functions
  const handleMfaEnroll = async () => {
    await beginMfaEnrollment(false);
  };

  const handleMfaResetPending = async () => {
    if (!window.confirm("기존에 시작한 MFA 설정을 초기화하고 새 QR 코드로 다시 설정하시겠습니까?")) return;
    await beginMfaEnrollment(true);
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || otpCode.length !== 6) return;
    setLoading(true);

    const { error: verifyError } = await challengeAndPersistTotpVerification(supabase, mfaFactorId, otpCode);
    if (verifyError) {
      if (verifyError.message.includes("Refresh Token")) {
        alert("MFA 세션 갱신에 실패했습니다. 다시 로그인한 뒤 다시 시도해 주세요.");
      } else {
        alert("인증 오류: " + verifyError.message);
      }
      setLoading(false);
      return;
    }

    await syncMfaState();
    setMfaSetupRequired(false);
    setMfaQr(null);
    setMfaFactorId(null);
    setOtpCode("");
    alert("MFA 설정이 완료되었습니다! 관리자 패널에 접근할 수 있습니다.");
    navigate("/admin");
    setLoading(false);
  };

  const handleDeleteConsultingReservation = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("consulting_reservations").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); }
    else { setConsultingReservations(prev => prev.filter(r => r.id !== id)); }
    setLoading(false);
  };

  const handleDeleteOfficeHourApplication = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("office_hour_applications").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); }
    else { setOfficeHourApplications(prev => prev.filter(a => a.id !== id)); }
    setLoading(false);
  };

  const handleDeleteClubApplication = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("founders_club_applications").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); }
    else { setClubApplications(prev => prev.filter(a => a.id !== id)); }
    setLoading(false);
  };

  const handleDeleteEventApplication = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("event_applications").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); }
    else { setEventApplications(prev => prev.filter(a => a.id !== id)); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-own-account", {
        body: { password: deleteAccountPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await supabase.auth.signOut();
      navigate("/");
    } catch (err: any) {
      alert("탈퇴 실패: " + (err.message ?? "알 수 없는 오류"));
      setIsDeletingAccount(false);
    }
  };

  const handleMfaUnenroll = async () => {
    if (profile?.role === "admin") {
      alert("관리자 계정은 보안 정책상 2단계 인증을 해제할 수 없습니다.");
      return;
    }
    if (!confirm("2단계 인증을 해제하시겠습니까? 관리자 계정 보안이 취약해질 수 있습니다.")) return;
    setLoading(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const { verifiedTotpFactor } = getTotpFactorSnapshot(factors);

    if (verifiedTotpFactor) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedTotpFactor.id });
      if (error) alert("해제 실패: " + error.message);
      else {
        alert("2단계 인증이 해제되었습니다.");
        setIsMfaEnabled(false);
      }
    }
    setLoading(false);
  };

  if (!user) return null;
  if (!profileLoaded) {
    return (
      <PageShell title="마이페이지" subtitle="내 정보 확인 및 설정" accentColor="#4377F1">
        <div className="flex justify-center pb-[60px]">
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-10 text-center" style={{ background: card, border: `1px solid ${border}`, color: textMuted }}>
            불러오는 중...
          </div>
        </div>
      </PageShell>
    );
  }

  const hasPendingMfaSetup = !isMfaEnabled && Boolean(mfaFactorId);
  const adminMfaEnrollmentLocked = profile?.role === "admin" && !isMfaEnabled;

  const getProfileText = (value?: string | null) => {
    if (!profileLoaded) return "불러오는 중...";
    return value?.trim() ? value : "미입력";
  };

  const eyeIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <PageShell
      title={adminMfaEnrollmentLocked ? "관리자 보안 설정" : "마이페이지"}
      subtitle={adminMfaEnrollmentLocked ? "관리자 권한 사용 전 2단계 인증을 완료해 주세요" : "내 정보 확인 및 설정"}
      accentColor="#4377F1"
    >
      <div className="flex flex-col items-center pb-[60px] gap-6">
        <div
          className="w-full max-w-[500px] rounded-[20px] px-9 py-10 flex flex-col gap-8"
          style={{ background: card, border: `1px solid ${border}` }}
        >
          {!adminMfaEnrollmentLocked && (
            <>
              <div>
                <h3 className="mb-5 text-[18px]" style={{ color: textMain }}>가입 정보</h3>
                <div className="text-[15px] mb-3" style={{ color: textMuted }}>이메일 : <span className="font-semibold" style={{ color: textMain }}>{getProfileText(profile?.email)}</span></div>
                <div className="text-[15px] mb-3" style={{ color: textMuted }}>이름 : <span className="font-semibold" style={{ color: textMain }}>{getProfileText(profile?.name)}</span></div>
                <div className="text-[15px] mb-3" style={{ color: textMuted }}>연락처 : <span className="font-semibold" style={{ color: textMain }}>{getProfileText(profile?.phone)}</span></div>
                <div className="text-[15px] mb-3" style={{ color: textMuted }}>소속 : <span className="font-semibold" style={{ color: textMain }}>{getProfileText(profile?.company)}</span></div>
                <div className="text-[15px]" style={{ color: textMuted }}>구분 : <span className="font-semibold" style={{ color: textMain }}>{getProfileText(profile?.user_type)}</span></div>
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
                    {isMfaEnabled && profile?.role === "admin" && (
                      <div className="mb-3">
                        <p className="text-[13px] mb-2" style={{ color: textMuted }}>OTP 인증 코드 확인 (보안 정책)</p>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={pwChangeMfaOtp} onChange={setPwChangeMfaOtp}>
                            <InputOTPGroup>
                              {[0,1,2,3,4,5].map(idx => (
                                <InputOTPSlot key={idx} index={idx} style={{ width: 40, height: 50, fontSize: 18, fontWeight: 700, background: inputBg, borderColor: inputBorder, color: textMain }} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading || (isMfaEnabled && profile?.role === "admin" && pwChangeMfaOtp.length !== 6)}
                      className={`w-full py-[14px] rounded-xl border-none text-white text-[15px] font-bold font-['Pretendard',sans-serif] mt-2 ${(loading || (isMfaEnabled && profile?.role === "admin" && pwChangeMfaOtp.length !== 6)) ? "cursor-not-allowed" : "cursor-pointer"}`}
                      style={{ background: (loading || (isMfaEnabled && profile?.role === "admin" && pwChangeMfaOtp.length !== 6)) ? "var(--color-disabled-bg)" : "var(--color-accent-blue)", boxShadow: "none" }}
                    >
                      {loading ? "변경 중..." : "새 비밀번호 저장"}
                    </button>
                  </form>
                )}
              </div>

              {profile?.role !== "admin" && (
                <>
                  <hr className="border-none m-0" style={{ borderTop: `1px solid ${border}` }} />
                  <div>
                    <h3 className="mb-2 text-[18px]" style={{ color: textMain }}>회원 탈퇴</h3>
                    <p className="text-[13px] mb-4" style={{ color: textMuted, lineHeight: 1.5 }}>
                      탈퇴 시 모든 신청 내역이 즉시 삭제되며 복구할 수 없습니다.
                    </p>
                    <button
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="w-full py-3 rounded-xl text-[14px] font-semibold"
                      style={{ background: deleteBg, border: `1px solid ${deleteBorder}`, color: "var(--color-brand-red)", cursor: "pointer" }}
                    >
                      회원 탈퇴
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {profile?.role === "admin" && (
            <>
              {!adminMfaEnrollmentLocked && <hr className="border-none mt-2 mb-0" style={{ borderTop: `1px solid ${border}` }} />}
              <div>
                <h3 className="mb-4 text-[18px]" style={{ color: textMain }}>관리자 보안 (MFA)</h3>

                {mfaSetupRequired && !isMfaEnabled && (
                  <div className="mb-4" style={{ padding: "16px 20px", borderRadius: 16, background: deleteBg, border: `1px solid ${deleteBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, opacity: 0.7 }}>🔒</span>
                      <p style={{ margin: 0, fontSize: 14, color: "var(--color-brand-red)", fontWeight: 750 }}>{hasPendingMfaSetup ? "관리자 패널 접근 전 MFA 설정 마무리가 필요합니다" : "관리자 패널 접근 전 MFA 설정이 필요합니다"}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                      보안 정책상 관리자 계정은 2단계 인증(MFA)을 반드시 설정해야 합니다. 아래에서 설정을 완료한 후 관리자 패널에 접근할 수 있습니다.
                    </p>
                  </div>
                )}

                {!isMfaEnabled && !hasPendingMfaSetup && (
                  <div style={{ padding: "20px", borderRadius: 16, background: panelBg, border: `1px solid ${labelBorder}` }}>
                    <p style={{ margin: "0 0 12px", fontSize: 14, color: textMain, fontWeight: 750 }}>2단계 인증(OTP)이 설정되어 있지 않습니다.</p>
                    <p style={{ margin: "0 0 20px", fontSize: 13, color: textMuted, lineHeight: 1.5 }}>보안 정책상 관리자 계정은 Google Authenticator 등 OTP 앱을 통한 2단계 인증을 반드시 설정해야 합니다.</p>
                    <button
                      onClick={handleMfaEnroll}
                      disabled={loading}
                      className="w-full py-3 rounded-xl border-none text-white text-[14px] font-bold cursor-pointer"
                      style={{ background: "var(--color-accent-blue)", boxShadow: "none", opacity: loading ? 0.65 : 1 }}
                    >
                      {loading ? "준비 중..." : "2단계 인증 설정하기"}
                    </button>
                  </div>
                )}

                {hasPendingMfaSetup && (
                  <div style={{ padding: "20px", borderRadius: 16, background: card, border: `1px solid ${border}`, textAlign: "center" }}>
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: textMain, fontWeight: 700 }}>
                      {mfaQr ? "OTP 앱으로 QR 코드를 스캔하세요" : "이전에 시작한 MFA 설정을 마무리하세요"}
                    </p>
                    {mfaQr ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: sanitizeSvgMarkup(mfaQr) }}
                        style={{ background: "#fff", padding: 12, borderRadius: 12, display: "inline-block", marginBottom: 20 }}
                      />
                    ) : (
                      <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: panelBg, border: `1px solid ${labelBorder}`, textAlign: "left" }}>
                        <p style={{ margin: "0 0 8px", fontSize: 13, color: textMain, fontWeight: 700 }}>이미 같은 MFA factor가 생성되어 있습니다.</p>
                        <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
                          {mfaPendingFactorName ? `"${mfaPendingFactorName}"` : "이 계정"}으로 시작한 MFA 등록이 아직 완료되지 않았습니다.
                          이미 OTP 앱에 추가했다면 아래 6자리 코드를 입력해 마무리하고, QR을 잃어버렸다면 초기화 후 다시 설정해 주세요.
                        </p>
                      </div>
                    )}
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
                        style={{ background: "var(--color-accent-blue)", boxShadow: "none", opacity: otpCode.length === 6 ? 1 : 0.5 }}
                      >
                        {loading ? "확인 중..." : "인증 완료 및 활성화"}
                      </button>
                      <button
                        onClick={handleMfaResetPending}
                        disabled={loading}
                        style={{ width: "100%", background: "none", border: "none", color: textMuted, fontSize: 13, marginTop: 12, cursor: loading ? "not-allowed" : "pointer", textDecoration: "underline", opacity: loading ? 0.6 : 1 }}
                      >
                        기존 설정 초기화 후 다시 설정
                      </button>
                      {mfaQr && (
                        <button
                          onClick={() => { setMfaQr(null); setOtpCode(""); }}
                          style={{ width: "100%", background: "none", border: "none", color: textMuted, fontSize: 13, marginTop: 10, cursor: "pointer", textDecoration: "underline" }}
                        >
                          QR 닫기
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isMfaEnabled && (
                  <div style={{ padding: "20px", borderRadius: 16, background: panelBg, border: `1px solid ${labelBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 18, opacity: 0.7 }}>🛡️</span>
                      <p style={{ margin: 0, fontSize: 14, color: textMain, fontWeight: 750 }}>2단계 인증(MFA)이 활성화되어 있습니다.</p>
                    </div>
                    <p style={{ margin: "0 0 20px", fontSize: 13, color: textMuted, lineHeight: 1.5 }}>현재 관리자 계정이 보호되고 있습니다. 보안 정책상 관리자 계정은 2단계 인증을 해제할 수 없습니다.</p>
                    <button
                      onClick={handleMfaUnenroll}
                      disabled
                      className="w-full py-3 rounded-xl border-none text-[13px] font-semibold cursor-pointer"
                      style={{ background: deleteBg, border: `1px solid ${deleteBorder}`, color: "var(--color-brand-red)", opacity: 0.55, cursor: "not-allowed" }}
                    >
                      관리자 계정은 MFA 해제 불가
                    </button>
                  </div>
                )}
              </div>

              {isMfaEnabled && (
                <>
                  <hr className="border-none mt-2 mb-0" style={{ borderTop: `1px solid ${border}` }} />
                  <div>
                    <h3 className="mb-4 text-[18px]" style={{ color: textMain }}>관리자 권한</h3>
                    <button
                      onClick={() => navigate("/admin")}
                      className="w-full py-[14px] rounded-xl text-[15px] font-bold cursor-pointer font-['Pretendard',sans-serif]"
                      style={{ background: selectedBg, border: `1px solid ${labelBorder}`, color: textMain, boxShadow: "none" }}
                    >
                      관리자 페이지(게시물 등록) 바로가기
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Consulting reservations — admin 제외 */}
        {profile?.role !== "admin" && consultingReservations.length > 0 && (
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-8 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 style={{ color: textMain, fontSize: 18, margin: 0 }}>나의 컨설팅 예약</h3>
            {consultingReservations.map((r: any) => {
              const slot = r.consulting_slots;
              const consultant = slot?.consultants;
              const statusCfg: Record<string, { label: string; color: string }> = {
                pending:   { label: "대기", color: "var(--color-brand-yellow)" },
                confirmed: { label: "확정",   color: "var(--color-accent-green)" },
                rejected:  { label: "거절",   color: "var(--color-brand-red)" },
                cancelled: { label: "취소",   color: "var(--color-neutral)" },
              };
              const cfg = statusCfg[r.status] ?? { label: r.status, color: "var(--color-text-muted)" };
              const canCancel = r.status === "pending" || r.status === "confirmed";
              const canDelete = r.status === "cancelled" || r.status === "rejected";
              return (
                <div key={r.id} style={requestCardStyle}>
                  {canCancel && (
                    <button type="button" aria-label="컨설팅 신청 취소" onClick={() => handleCancelConsultingReservation(r)} disabled={loading} style={cancelIconStyle}>
                      <X size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" aria-label="내역 삭제" onClick={() => handleDeleteConsultingReservation(r.id)} disabled={loading} style={deleteIconStyle}>
                      <Trash2 size={13} />
                    </button>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 14, marginBottom: 4 }}>{consultant?.name}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{slot?.slot_date} {slot?.slot_time?.slice(0, 5)}</div>
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{formatStructuredLocation(slot?.location)}</div>
                  </div>
                  {statusPill(cfg)}
                </div>
              );
            })}
          </div>
        )}

        {/* Office hour applications — admin 제외 */}
        {profile?.role !== "admin" && officeHourApplications.length > 0 && (
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-8 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 style={{ color: textMain, fontSize: 18, margin: 0 }}>나의 오피스아워 신청</h3>
            {officeHourApplications.map((a: any) => {
              const periodMonth = a.office_hour_months?.period_month as string | undefined;
              const cfg = getOfficeHourStatusConfig(a.status);
              const canCancel = a.status === "pending" || a.status === "matched";
              const canDelete = a.status === "cancelled" || a.status === "rejected";
              const hasMatch = !!a.matched_expert_name;
              return (
                <div key={a.id} style={requestCardStyle}>
                  {canCancel && (
                    <button type="button" aria-label="오피스아워 신청 취소" onClick={() => handleCancelOfficeHourApplication(a)} disabled={loading} style={cancelIconStyle}>
                      <X size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" aria-label="내역 삭제" onClick={() => handleDeleteOfficeHourApplication(a.id)} disabled={loading} style={deleteIconStyle}>
                      <Trash2 size={13} />
                    </button>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 14, marginBottom: 4 }}>
                      {periodMonth ? `${formatOfficeHourMonth(periodMonth)} 오피스아워` : "오피스아워"}
                    </div>
                    <div style={{ fontSize: 12, color: textMuted }}>희망 주제: {a.topic}</div>
                    {hasMatch && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 12, color: textMain, fontWeight: 600 }}>전문가: {a.matched_expert_name}</div>
                        <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{a.matched_date ?? "일정 조율 중"} {a.matched_time?.slice(0, 5) ?? ""}</div>
                        <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{formatStructuredLocation(a.matched_location)}</div>
                      </div>
                    )}
                  </div>
                  {statusPill(cfg)}
                </div>
              );
            })}
          </div>
        )}

        {/* Founder's Club applications — admin 제외 */}
        {profile?.role !== "admin" && clubApplications.length > 0 && (
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-8 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 style={{ color: textMain, fontSize: 18, margin: 0 }}>나의 Founder's Club 참여</h3>
            {clubApplications.map((a: any) => {
              const session = a.founders_club_sessions;
              const statusCfg: Record<string, { label: string; color: string }> = {
                pending:   { label: "대기",  color: "var(--color-brand-yellow)" },
                accepted:  { label: "확정",  color: "var(--color-accent-green)" },
                rejected:  { label: "거절됨",  color: "var(--color-brand-red)" },
                cancelled: { label: "취소",    color: "var(--color-neutral)" },
              };
              const cfg = statusCfg[a.status] ?? { label: a.status, color: "var(--color-text-muted)" };
              const canCancel = a.status === "pending" || a.status === "accepted";
              const canDelete = a.status === "cancelled" || a.status === "rejected";
              return (
                <div key={a.id} style={requestCardStyle}>
                  {canCancel && (
                    <button type="button" aria-label="Founder's Club 신청 취소" onClick={() => handleCancelClubApplication(a)} disabled={loading} style={cancelIconStyle}>
                      <X size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" aria-label="내역 삭제" onClick={() => handleDeleteClubApplication(a.id)} disabled={loading} style={deleteIconStyle}>
                      <Trash2 size={13} />
                    </button>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 14, marginBottom: 4 }}>{session?.theme}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{session?.session_date ?? "날짜 미정"} {session?.session_time?.slice(0, 5) ?? ""}</div>
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{formatStructuredLocation(session?.location)}</div>
                  </div>
                  {statusPill(cfg)}
                </div>
              );
            })}
          </div>
        )}

        {/* Event applications — admin 제외 */}
        {profile?.role !== "admin" && eventApplications.length > 0 && (
          <div className="w-full max-w-[500px] rounded-[20px] px-9 py-8 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
            <h3 style={{ color: textMain, fontSize: 18, margin: 0 }}>나의 행사 참가</h3>
            {eventApplications.map((a: any) => {
              const event = a.posts;
              const cfg = EVENT_APPLICATION_STATUS[a.status as keyof typeof EVENT_APPLICATION_STATUS] ?? { label: a.status, color: "#888" };
              const canCancel = a.status === "pending" || a.status === "accepted";
              const canDelete = a.status === "cancelled" || a.status === "rejected";
              return (
                <div key={a.id} style={requestCardStyle}>
                  {canCancel && (
                    <button type="button" aria-label="행사 신청 취소" onClick={() => handleCancelEventApplication(a)} disabled={loading} style={cancelIconStyle}>
                      <X size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" aria-label="내역 삭제" onClick={() => handleDeleteEventApplication(a.id)} disabled={loading} style={deleteIconStyle}>
                      <Trash2 size={13} />
                    </button>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: textMain, fontSize: 14, marginBottom: 4 }}>{event?.title}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{event?.event_date ?? "일시 미정"}</div>
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{formatStructuredLocation(event?.location)}</div>
                  </div>
                  {statusPill(cfg)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 회원탈퇴 모달 */}
      {showDeleteAccountModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--color-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowDeleteAccountModal(false); setDeleteAccountPassword(""); } }}
        >
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 420, position: "relative" }}>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => { setShowDeleteAccountModal(false); setDeleteAccountPassword(""); }}
              style={modalCloseButtonStyle}
            >
              <X size={16} />
            </button>

            <p style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: textMain }}>정말 탈퇴하시겠습니까?</p>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
              탈퇴 시 컨설팅 예약, Founder's Club 참여, 행사 신청 등 모든 데이터가 즉시 삭제되며 복구할 수 없습니다.
            </p>

            <p className="text-[13px] mb-2" style={{ color: textMuted }}>비밀번호를 입력해 탈퇴를 확인해 주세요</p>
            <div className="relative mb-5">
              <input
                type={showDeleteAccountPassword ? "text" : "password"}
                value={deleteAccountPassword}
                onChange={e => setDeleteAccountPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && deleteAccountPassword) handleDeleteAccount(); }}
                placeholder="현재 비밀번호"
                className="w-full pl-4 pr-10 py-3 rounded-xl text-[14px] outline-none font-['Pretendard',sans-serif] box-border"
                style={inputDynamicStyle}
                disabled={isDeletingAccount}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowDeleteAccountPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer"
                style={{ color: textMuted }}
              >
                {eyeIcon}
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowDeleteAccountModal(false); setDeleteAccountPassword(""); }}
                disabled={isDeletingAccount}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9", color: textMain, border: "none", cursor: isDeletingAccount ? "not-allowed" : "pointer" }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || !deleteAccountPassword}
                className="flex-1 py-3 rounded-xl text-[14px] font-bold"
                style={{
                  background: deleteAccountPassword && !isDeletingAccount ? "var(--color-brand-red)" : deleteBg,
                  border: `1px solid ${deleteBorder}`,
                  color: deleteAccountPassword && !isDeletingAccount ? "#fff" : "var(--color-brand-red)",
                  cursor: isDeletingAccount || !deleteAccountPassword ? "not-allowed" : "pointer",
                  opacity: isDeletingAccount ? 0.65 : 1,
                }}
              >
                {isDeletingAccount ? "탈퇴 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
