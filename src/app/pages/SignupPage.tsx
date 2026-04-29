import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const ROLES = ["스타트업 대표", "투자자", "예비 창업자", "멘토/전문가", "기타"];

const Field = ({ label, textMuted, children }: { label: string; textMuted: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[13px] mb-1.5" style={{ color: textMuted }}>{label}</div>
    {children}
  </div>
);

export default function SignupPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
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

  const isPasswordMatch = form.password === form.confirm;

  const canSubmit =
    form.name.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password.length >= 8 &&
    isPasswordMatch &&
    form.company.trim() !== "" &&
    agree.terms &&
    agree.privacy;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordMatch) { alert("비밀번호가 일치하지 않습니다. 다시 입력해 주세요."); return; }
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name, phone: form.phone, company: form.company, user_type: form.role } },
      });
      if (authError) throw authError;

      if (authData.user) {
        // handle_new_user 트리거가 profiles 행을 자동 생성하므로 별도 upsert 불필요
        await supabase.auth.signOut();
        alert("회원가입이 완료되었습니다! 로그인해 주세요.");
        navigate("/login");
      }
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)) || "";
      if (msg.toLowerCase().includes("already registered")) {
        alert("이미 가입된 이메일 주소입니다.\n로그인 페이지에서 로그인하거나 '비밀번호 찾기'를 이용해주세요.");
      } else {
        alert(msg || "회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputDynamicStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${border}`,
    color: textMain,
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-colors duration-200 box-border";

  const blockKorean = (val: string) => val.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "");

  return (
    <PageShell>
      <div className="max-w-[420px] mx-auto my-[60px] px-5">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold mb-2 mt-0" style={{ color: textMain }}>회원가입</h1>
          <p className="text-[15px] m-0" style={{ color: textMuted }}>Global X Pass에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSignup} className="p-8 rounded-[24px] flex flex-col gap-5 m-0" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="이름 (실명)" textMuted={textMuted}>
              <input className={inputClasses} style={inputDynamicStyle} placeholder="홍길동" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="연락처" textMuted={textMuted}>
              <input type="tel" className={inputClasses} style={inputDynamicStyle} placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </Field>
          </div>

          <div>
            <Field label="이메일 주소" textMuted={textMuted}>
              <input type="email" className={inputClasses} style={inputDynamicStyle} placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: blockKorean(e.target.value) })} required />
            </Field>
            <div className="text-[11px] mt-1.5 ml-0.5" style={{ color: textMuted }}>영문 이메일 주소를 입력해주세요 (한글 입력 불가)</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Field label="비밀번호" textMuted={textMuted}>
                <input type="password" className={inputClasses} style={inputDynamicStyle} placeholder="8자 이상" value={form.password} onChange={(e) => setForm({ ...form, password: blockKorean(e.target.value) })} required />
              </Field>
              <div className="text-[11px] mt-1.5 ml-0.5" style={{ color: textMuted }}>영문·숫자·특수문자만 입력 가능</div>
            </div>
            <Field label="비밀번호 확인" textMuted={textMuted}>
              <input type="password" className={inputClasses} style={inputDynamicStyle} placeholder="다시 입력" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: blockKorean(e.target.value) })} required />
            </Field>
          </div>
          {form.confirm && !isPasswordMatch && (
            <div className="text-[#ef4444] text-[12px] -mt-3 ml-1">비밀번호가 일치하지 않습니다.</div>
          )}

          <Field label="소속 (회사/팀)" textMuted={textMuted}>
            <input className={inputClasses} style={inputDynamicStyle} placeholder="소속을 입력해주세요" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          </Field>

          <Field label="회원 구분" textMuted={textMuted}>
            <select className={inputClasses} style={inputDynamicStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <div className="flex flex-col gap-2.5 mt-2">
            {[
              { key: "terms", label: "(필수) 이용약관 동의" },
              { key: "privacy", label: "(필수) 개인정보 처리방침 동의" },
              { key: "marketing", label: "(선택) 마케팅 정보 수신 동의" },
            ].map((a) => (
              <label key={a.key} className="flex items-center gap-2.5 text-[13px] cursor-pointer" style={{ color: textMain }}>
                <input type="checkbox" checked={(agree as Record<string, boolean>)[a.key]} onChange={(e) => setAgree((s) => ({ ...s, [a.key]: e.target.checked }))} />
                {a.label}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="mt-2 py-[14px] rounded-xl border-none text-[15px] font-bold transition-all duration-200 ease-in-out"
            style={{
              background: canSubmit ? "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"),
              color: canSubmit ? "#fff" : textMuted,
              cursor: canSubmit ? "pointer" : "not-allowed",
              boxShadow: canSubmit ? "0 8px 24px rgba(67,119,241,0.3)" : "none",
            }}
          >
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center mt-6 text-[14px] mb-0" style={{ color: textMuted }}>
          이미 계정이 있으신가요? <Link to="/login" className="text-[#4377F1] no-underline font-semibold">로그인</Link>
        </p>
      </div>
    </PageShell>
  );
}
