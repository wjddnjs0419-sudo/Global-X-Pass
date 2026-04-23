import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const CATEGORIES = [
  { id: "notice", label: "공지사항" },
  { id: "news", label: "뉴스" },
  { id: "events", label: "행사" },
  { id: "events-archive", label: "행사 아카이브" },
  { id: "resources", label: "자료실" },
  { id: "blog", label: "블로그" },
  { id: "faq", label: "FAQ" },
];

export default function AdminPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); // 💡 쫓아낼 때 쓸 네비게이션
  
  const [category, setCategory] = useState("notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 💡 화면이 진짜 켜지기 전인지 확인 (쫓아내는 중이면 화면을 안 보여주기 위해)
  const [isChecking, setIsChecking] = useState(true);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 12,
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: textMain, fontSize: 14, outline: "none", boxSizing: "border-box" as const,
    fontFamily: "'Pretendard', sans-serif",
  };

  // 💡 철통 보안 검문소: 페이지가 열릴 때 즉시 실행
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 로그인을 안 했거나, 이메일이 'admin@test.com'이 아니면 즉시 홈으로 추방!
      if (!user || user.email !== "admin@test.com") {
        alert("관리자만 접근할 수 있는 페이지입니다.");
        navigate("/");
      } else {
        setIsChecking(false); // 관리자가 맞으면 화면을 보여줌
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert("제목과 내용을 모두 입력해주세요.");
    
    setLoading(true);
    let imageUrl = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) {
        alert("사진 업로드 실패: " + uploadError.message);
        setLoading(false);
        return;
      }
      
      if (data) {
        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase.from('notices').insert([
      { category, title, content, image_url: imageUrl }
    ]);
    
    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("게시물이 성공적으로 등록되었습니다!");
      setTitle(""); 
      setContent("");
      setFile(null);
    }
    setLoading(false);
  };

  // 💡 검사 중일 때는 빈 화면을 보여주어 데이터 노출 방지
  if (isChecking) return null;

  return (
    <PageShell title="관리자 페이지" subtitle="원하는 게시판을 선택하고 글과 사진을 등록하세요." accentColor="#4377F1">
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 60 }}>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 700, background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "40px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: textMain, marginBottom: 8, fontWeight: 600 }}>게시판 위치</div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 14, color: textMain, marginBottom: 8, fontWeight: 600 }}>게시물 제목</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" style={inputStyle} required />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, color: textMain, marginBottom: 8, fontWeight: 600 }}>대표 이미지 첨부 (선택)</div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: "10px 16px" }} />
          </div>

          <div>
            <div style={{ fontSize: 14, color: textMain, marginBottom: 8, fontWeight: 600 }}>게시물 내용</div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." style={{ ...inputStyle, minHeight: 250, resize: "vertical", lineHeight: 1.6 }} required />
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: 12, padding: "16px 0", borderRadius: 12, border: "none", background: loading ? "gray" : "linear-gradient(135deg, #4377F1 0%, #20D6A2 100%)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}>
            {loading ? "등록 중..." : "게시물 등록하기"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}