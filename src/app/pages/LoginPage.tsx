import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

export function LoginPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    // 💡 에러뿐만 아니라 유저 정보(data)도 함께 가져옵니다.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("로그인 실패: 이메일이나 비밀번호를 확인해주세요.");
      setLoading(false);
    } else {
      alert("환영합니다! 로그인이 완료되었습니다.");
      
      // 💡 핵심 보안 기능: 관리자 계정이면 관리자 페이지로, 아니면 홈으로 보냅니다!
      if (data.user?.email === "admin@test.com") {
        navigate("/admin");
      } else {
        navigate("/"); 
      }
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return alert("비밀번호를 찾을 이메일 주소를 위에 먼저 입력해 주세요.");
  
    setLoading(true);
    
    // 💡 window.location.origin을 사용하면 
    // localhost에서 보내면 localhost 주소가, 
    // netlify에서 보내면 netlify 주소가 자동으로 들어갑니다.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) {
      alert("비밀번호 찾기 실패: " + error.message);
    } else {
      alert("비밀번호 재설정 링크가 발송되었습니다! 이메일을 확인해 주세요.");
    }
    setLoading(false);
  };
  return (
    <PageShell title="로그인" subtitle="NCF × Around X 회원 전용 서비스를 이용하세요." accentColor="#20D6A2">
      <div className="flex justify-center">
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
            <a href="#" onClick={handleResetPassword} className="text-[#20D6A2] no-underline font-semibold">비밀번호 찾기</a>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`mt-2 py-[14px] rounded-xl border-none text-white text-[15px] font-bold font-['Pretendard',sans-serif] ${loading ? "bg-gray-500 cursor-not-allowed shadow-none" : "cursor-pointer shadow-[0_8px_24px_rgba(32,214,162,0.3)]"}`}
            style={{ background: loading ? undefined : "linear-gradient(135deg, #20D6A2 0%, #4377F1 100%)" }}
          >
            {loading ? "처리 중..." : "로그인"}
          </button>
          <p className="text-center text-[13px] m-0 mt-3" style={{ color: textMuted }}>
            아직 회원이 아니신가요? <Link to="/signup" className="text-[#20D6A2] font-bold no-underline">회원가입</Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
