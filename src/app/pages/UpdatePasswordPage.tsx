import { useState } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

export default function UpdatePasswordPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return alert("비밀번호는 8자 이상 입력해주세요.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      // 💡 2번 수정사항: 영어 에러 메시지를 감지해서 한국어로 번역
      if (error.message.includes("different from the old password")) {
        alert("기존과 동일한 비밀번호로는 변경할 수 없습니다. 다른 비밀번호를 입력해주세요.");
      } else {
        alert("비밀번호 변경 실패: " + error.message);
      }
    } else {
      alert("비밀번호가 성공적으로 변경되었습니다! 다시 로그인해주세요.");
      
      // 💡 3번 수정사항: 변경 성공 시, 남아있는 로그인 기록을 강제로 삭제(로그아웃)
      await supabase.auth.signOut();
      
      // 💡 홈이 아니라 다시 '로그인 페이지'로 돌려보냄
      navigate("/login"); 
    }
    setLoading(false);
  };

  return (
    <PageShell title="비밀번호 재설정" subtitle="새로운 비밀번호를 입력해주세요." accentColor="#4377F1">
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
            className={`mt-2 py-[14px] rounded-xl border-none text-white text-[15px] font-bold ${loading ? "bg-gray-500 cursor-not-allowed shadow-none" : "cursor-pointer shadow-[0_8px_24px_rgba(67,119,241,0.3)]"}`}
            style={{ background: loading ? undefined : "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)" }}
          >
            {loading ? "처리 중..." : "비밀번호 변경하기"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
