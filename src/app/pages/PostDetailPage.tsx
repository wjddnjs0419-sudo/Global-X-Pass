import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

// 💡 카테고리별 헤더에 표시할 이름과 부제 설정
const BOARD_INFO: Record<string, { title: string; subtitle: string }> = {
  notice: { title: "공지사항", subtitle: "중요한 안내 사항을 확인하세요." },
  news: { title: "뉴스", subtitle: "새로운 소식을 확인하세요." },
  events: { title: "행사", subtitle: "NCF × Around X가 준비한 소식을 확인하세요." },
  "events-archive": { title: "행사 아카이브", subtitle: "지나간 행사의 기록을 확인하세요." },
  resources: { title: "자료실", subtitle: "필요한 서식과 자료를 다운로드하세요." },
  blog: { title: "블로그", subtitle: "다양한 인사이트와 이야기를 만나보세요." },
  faq: { title: "자주 묻는 질문", subtitle: "궁금한 점을 빠르게 찾아보세요." },
};

// 💡 여기가 문제였을 겁니다! 이 이름이 routes.tsx와 정확히 일치해야 합니다.
export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        alert("존재하지 않는 게시물입니다.");
        navigate(-1);
      } else {
        setPost(data);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id, navigate]);

  if (loading) return <PageShell title="로딩 중..."><p>내용을 불러오고 있습니다.</p></PageShell>;
  if (!post) return null;

  const headerInfo = BOARD_INFO[post.category] || { title: "게시판", subtitle: "게시물 상세 보기" };

  return (
    <PageShell title={headerInfo.title} subtitle={headerInfo.subtitle}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100, position: "relative" }}>
        
        <div style={{ marginBottom: 32, textAlign: "left" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: textMain, margin: "0 0 8px 0" }}>
            {post.title}
          </h1>
          <div style={{ fontSize: 14, color: textMuted }}>
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>

        {post.image_url && (
          <div style={{ width: "100%", borderRadius: 20, overflow: "hidden", marginBottom: 32, border: `1px solid ${border}` }}>
            <ImageWithFallback src={post.image_url} alt={post.title} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}

        <div style={{ fontSize: 16, lineHeight: 1.7, color: textMain, whiteSpace: "pre-wrap", marginBottom: 60 }}>
          {post.content}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa", color: textMain, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            ← 목록으로 돌아가기
          </button>
        </div>
      </div>
    </PageShell>
  );
}