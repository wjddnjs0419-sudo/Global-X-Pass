import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryState, setRecoveryState] = useState<'loading' | 'valid' | 'invalid'>('loading');

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const inputBg = "var(--color-field-bg)";
  const inputBorder = "var(--color-border-subtle)";

  useEffect(() => {
    const hasRecoveryParams =
      window.location.search.includes('code=') ||
      window.location.hash.includes('type=recovery');

    if (!hasRecoveryParams) {
      setRecoveryState('invalid');
      return;
    }

    let recoveryReceived = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryReceived = true;
        setRecoveryState('valid');
      }
    });

    const timer = setTimeout(() => {
      if (!recoveryReceived) setRecoveryState('invalid');
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return alert("비밀번호는 8자 이상 입력해주세요.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      if (error.message.includes("different from the old password")) {
        alert("기존과 동일한 비밀번호로는 변경할 수 없습니다. 다른 비밀번호를 입력해주세요.");
      } else {
        alert("비밀번호 변경 실패: " + error.message);
      }
    } else {
      alert("비밀번호가 성공적으로 변경되었습니다! 다시 로그인해주세요.");
      await supabase.auth.signOut();
      window.history.replaceState(null, '', '/login');
      navigate("/login", { replace: true });
    }
    setLoading(false);
  };

  if (recoveryState === 'loading') {
    return (
      <PageShell title="비밀번호 재설정" subtitle="확인 중..." accentColor="var(--color-accent-blue)">
        <div className="flex justify-center">
          <div className="text-[14px]" style={{ color: textMuted }}>잠시만 기다려주세요.</div>
        </div>
      </PageShell>
    );
  }

  if (recoveryState === 'invalid') {
    return (
      <PageShell title="링크 만료" subtitle="비밀번호 재설정 링크가 유효하지 않습니다." accentColor="var(--color-accent-blue)">
        <div className="flex justify-center">
          <div className="w-full max-w-[460px] rounded-[20px] px-9 py-10 flex flex-col gap-4 text-center" style={{ background: card, border: `1px solid ${border}` }}>
            <p className="text-[14px] leading-relaxed" style={{ color: textMuted }}>
              이미 사용된 링크이거나 만료된 링크입니다.<br />비밀번호 재설정을 다시 요청해주세요.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-2 py-[14px] rounded-xl border-none text-[15px] font-bold cursor-pointer shadow-[var(--shadow-primary)]"
              style={{ background: "var(--gradient-blue)", color: "var(--color-on-primary)" }}
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="비밀번호 재설정" subtitle="새로운 비밀번호를 입력해주세요." accentColor="var(--color-accent-blue)">
      <div className="flex justify-center">
        <form onSubmit={handleUpdate} className="w-full max-w-[460px] rounded-[20px] px-9 py-10 flex flex-col gap-4 m-0" style={{ background: card, border: `1px solid ${border}` }}>

          <div>
            <div className="text-[13px] mb-1.5" style={{ color: textMuted }}>새 비밀번호 (8자 이상)</div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-[14px] rounded-xl text-[14px] outline-none box-border"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textMain }}
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

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 py-[14px] rounded-xl border-none text-[15px] font-bold ${loading ? "cursor-not-allowed shadow-none" : "cursor-pointer shadow-[var(--shadow-primary)]"}`}
            style={{ background: loading ? "var(--color-disabled-bg)" : "var(--gradient-blue)", color: "var(--color-on-primary)" }}
          >
            {loading ? "처리 중..." : "비밀번호 변경하기"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
