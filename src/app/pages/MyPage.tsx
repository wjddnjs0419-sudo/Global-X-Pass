import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;

export function MyPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: textMain, fontSize: 14, outline: "none",
    fontFamily: "'Pretendard', sans-serif", boxSizing: "border-box", marginBottom: 12
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 페이지입니다.");
        navigate("/login");
      } else {
        setUser(user);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleVerifyOldPassword = async () => {
    if (!oldPassword) return alert("현재 비밀번호를 입력해주세요.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email, password: oldPassword,
    });
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

  if (!user) return null;

  return (
    <PageShell title="마이페이지" subtitle="내 정보 확인 및 설정" accentColor="#4377F1">
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 60 }}>
        <div style={{ width: "100%", maxWidth: 500, background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "40px 36px", display: "flex", flexDirection: "column", gap: 32 }}>
          
          <div>
            <h3 style={{ color: textMain, marginBottom: 20, fontSize: 18 }}>가입 정보</h3>
            <div style={{ color: textMuted, fontSize: 15, marginBottom: 12 }}>이메일 : <span style={{ color: textMain, fontWeight: 600 }}>{user.email}</span></div>
            <div style={{ color: textMuted, fontSize: 15, marginBottom: 12 }}>이름 : <span style={{ color: textMain, fontWeight: 600 }}>{user.user_metadata?.name || "미입력"}</span></div>
            <div style={{ color: textMuted, fontSize: 15, marginBottom: 12 }}>소속 : <span style={{ color: textMain, fontWeight: 600 }}>{user.user_metadata?.company || "미입력"}</span></div>
            <div style={{ color: textMuted, fontSize: 15 }}>구분 : <span style={{ color: textMain, fontWeight: 600 }}>{user.user_metadata?.role || "미입력"}</span></div>
          </div>

          <hr style={{ border: "none", borderTop: `1px solid ${border}` }} />

          <div>
            <h3 style={{ color: textMain, marginBottom: 16, fontSize: 18 }}>비밀번호 변경</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input type={showOldPassword ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="현재 비밀번호 확인" style={{ ...inputStyle, marginBottom: 0, paddingRight: 40 }} disabled={isVerified} />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: textMuted }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
              </div>
              {!isVerified && <button onClick={handleVerifyOldPassword} disabled={loading} style={{ padding: "0 16px", borderRadius: 12, background: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: textMain, border: "none", cursor: "pointer", fontWeight: 600 }}>확인</button>}
            </div>

            {isVerified && (
              <form onSubmit={handlePasswordUpdate}>
                <div style={{ position: "relative" }}>
                  <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 (8자 이상)" style={{ ...inputStyle, paddingRight: 40 }} required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: 12, top: "22px", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: textMuted }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: loading ? "gray" : "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Pretendard', sans-serif", marginTop: 8 }}>{loading ? "변경 중..." : "새 비밀번호 저장"}</button>
              </form>
            )}
          </div>

          {/* 💡 관리자 계정 전용 섹션 추가됨 */}
          {user.email === "admin@test.com" && (
            <>
              <hr style={{ border: "none", borderTop: `1px solid ${border}`, marginTop: 8 }} />
              <div>
                <h3 style={{ color: textMain, marginBottom: 16, fontSize: 18 }}>관리자 권한</h3>
                <button onClick={() => navigate("/admin")} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Pretendard', sans-serif", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>관리자 페이지(게시물 등록) 바로가기</button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}