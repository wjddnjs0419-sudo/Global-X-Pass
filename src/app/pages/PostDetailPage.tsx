import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

// 💡 카테고리 정보
const BOARD_INFO: Record<string, { title: string; subtitle: string }> = {
  notice: { title: "공지사항", subtitle: "중요한 안내 사항을 확인하세요." },
  news: { title: "뉴스", subtitle: "새로운 소식을 확인하세요." },
  events: { title: "행사", subtitle: "NCF × Around X가 준비한 소식을 확인하세요." },
  "events-archive": { title: "행사 아카이브", subtitle: "지나간 행사의 기록을 확인하세요." },
  resources: { title: "자료실", subtitle: "필요한 서식과 자료를 다운로드하세요." },
  blog: { title: "블로그", subtitle: "다양한 인사이트와 이야기를 만나보세요." },
  faq: { title: "자주 묻는 질문", subtitle: "궁금한 점을 빠르게 찾아보세요." },
};

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  // ── 상태 관리 ──
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // 팝업 모달 상태
  const [showModal, setShowModal] = useState<{ show: boolean; type: 'save' | 'delete' | null }>({ show: false, type: null });

  // 스타일 변수
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'admin' || user.email === "admin@test.com");
      }
    };

    const fetchPost = async () => {
      if (!id) return;
      const { data } = await supabase.from('posts').select('*').eq('id', id).single();
      if (data) {
        setPost(data);
        setEditTitle(data.title);
        setEditContent(data.content);
      }
      setLoading(false);
    };

    checkAdmin();
    fetchPost();
  }, [id]);

  // ── 실행 로직 (에러 방지 적용) ──
  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    try {
      if (showModal.type === 'delete') {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) throw error;
        navigate(-1);
      } else if (showModal.type === 'save') {
        let imageUrl = post.image_url;
        
        if (editFile) {
          const fileName = `${Date.now()}.${editFile.name.split('.').pop()}`;
          const { error: upError } = await supabase.storage.from('images').upload(fileName, editFile);
          if (upError) throw upError;
          imageUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        }

        // 💡 .single() 대신 .select()를 사용하여 coerce 에러 방지
        const { data, error: updateError } = await supabase
          .from('posts')
          .update({ title: editTitle, content: editContent, image_url: imageUrl })
          .eq('id', id)
          .select();

        if (updateError) throw updateError;
        
        if (data && data.length > 0) {
          setPost(data[0]); // 수정된 데이터 즉시 반영
          setIsEditing(false);
        } else {
          throw new Error("수정 권한이 없거나 데이터를 업데이트할 수 없습니다.");
        }
      }
    } catch (err: any) {
      alert("오류 발생: " + err.message);
    } finally {
      setIsSubmitting(false);
      setShowModal({ show: false, type: null });
    }
  };

  if (loading) return <PageShell title="로딩 중..."><p>불러오는 중입니다.</p></PageShell>;
  if (!post && !isSubmitting) return <PageShell title="오류"><p>게시물을 찾을 수 없습니다.</p></PageShell>;

  const headerInfo = BOARD_INFO[post?.category] || { title: "게시판", subtitle: "상세 보기" };

  return (
    <PageShell title={headerInfo.title} subtitle={headerInfo.subtitle}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
        
        {/* 상단 네비게이션 & 관리자 버튼 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
           <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#4377F1", fontWeight: 700, cursor: "pointer" }}>← 목록으로 돌아가기</button>
           {isAdmin && (
             <div style={{ display: "flex", gap: 10 }}>
               {isEditing ? (
                 <>
                   <button onClick={() => setShowModal({ show: true, type: 'save' })} disabled={isSubmitting} style={{ padding: "8px 20px", borderRadius: 8, background: "#4377F1", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", opacity: isSubmitting ? 0.5 : 1 }}>
                     {isSubmitting ? "저장 중..." : "저장하기"}
                   </button>
                   <button onClick={() => setIsEditing(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${border}`, background: card, color: textMain, cursor: "pointer" }}>취소</button>
                 </>
               ) : (
                 <>
                   <button onClick={() => setIsEditing(true)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${border}`, background: card, color: "#4377F1", fontWeight: 700, cursor: "pointer" }}>수정</button>
                   <button onClick={() => setShowModal({ show: true, type: 'delete' })} style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(255,0,0,0.1)", color: "#ff4d4f", border: "none", fontWeight: 700, cursor: "pointer" }}>삭제</button>
                 </>
               )}
             </div>
           )}
        </div>

        {/* 메인 콘텐츠 영역 */}
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: "100%", padding: 16, borderRadius: 12, border: `1px solid ${border}`, background: card, color: textMain, fontSize: 24, fontWeight: 800, outline: "none" }} />
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ width: "100%", height: 450, padding: 20, borderRadius: 12, border: `1px solid ${border}`, background: card, color: textMain, fontSize: 16, lineHeight: 1.7, resize: "none", outline: "none" }} />
            <div style={{ padding: 20, border: `1px solid ${border}`, borderRadius: 12, background: card }}>
              <p style={{ margin: "0 0 10px 0", fontSize: 14, color: textMuted }}>이미지 교체 (선택사항)</p>
              <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: textMain, marginBottom: 12 }}>{post.title}</h1>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 40 }}>{new Date(post.created_at).toLocaleDateString()}</p>
            {post.image_url && (
              <div style={{ marginBottom: 40, borderRadius: 20, overflow: "hidden", border: `1px solid ${border}` }}>
                <img src={post.image_url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            )}
            <div style={{ fontSize: 17, lineHeight: 1.8, color: textMain, whiteSpace: "pre-wrap" }}>{post.content}</div>
          </>
        )}
      </div>

      {/* ── 최종 확인 팝업 (모달) ── */}
      {showModal.show && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: isDark ? "#1e293b" : "#fff", padding: "40px 32px", borderRadius: 24, textAlign: "center", maxWidth: 400, width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ color: textMain, marginBottom: 12, fontSize: 22 }}>{showModal.type === 'delete' ? '게시물 삭제' : '변경사항 저장'}</h2>
            <p style={{ color: textMuted, marginBottom: 32, lineHeight: 1.6 }}>
              {showModal.type === 'delete' 
                ? '정말로 이 게시물을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.' 
                : '수정한 내용을 게시판에 즉시 적용하시겠습니까?'}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleConfirmAction} disabled={isSubmitting} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: showModal.type === 'delete' ? "#ff4d4f" : "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {isSubmitting ? "처리 중..." : "확인"}
              </button>
              <button onClick={() => setShowModal({ show: false, type: null })} disabled={isSubmitting} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${border}`, background: "none", color: textMain, cursor: "pointer" }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}