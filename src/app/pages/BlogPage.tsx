import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const decodeFilename = (encoded: string) => {
  if (encoded.startsWith('b64-')) {
    try {
      let b64 = encoded.substring(4).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
      return decodeURIComponent(atob(b64));
    } catch { return encoded; }
  }
  return decodeURIComponent(encoded);
};

const getFileNameFromUrl = (url: string) => {
  try {
    const path = url.split('?')[0];
    let filename = path.split('/').pop() || "";
    if (filename.includes('---')) filename = filename.split('---').pop()!;
    else if (filename.match(/^\d+_[a-z0-9]+_/)) filename = filename.split('_').slice(2).join('_');
    return decodeFilename(filename);
  } catch { return ""; }
};

// 💡 [핵심 패치] 확장자가 없어도 외부 이미지 도메인이면 이미지로 판단합니다.
const isImage = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  if (fileName.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)$/i)) return true;
  if (url.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)(?:\?.*)?$/i)) return true;
  if (url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder.com')) return true;
  return false;
};

export function BlogPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('category', 'blog').order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="블로그" subtitle="NCF와 Around X가 전하는 다양한 인사이트와 비즈니스 이야기를 만나보세요.">
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 100 }}>
        {loading ? ( <p style={{ textAlign: "center", color: "gray", padding: "100px 0" }}>불러오는 중입니다...</p> ) : posts.length === 0 ? ( <p style={{ textAlign: "center", color: "gray", padding: "100px 0" }}>등록된 게시물이 없습니다.</p> ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 32 }}>
            {posts.map((post) => {
              const attachmentImages = post.image_url?.split(',').filter(isImage) || [];
              const thumbnailUrl = attachmentImages.length > 0 ? attachmentImages[0] : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];

              return (
                <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 24, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s ease" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ height: 200, width: "100%", background: "#f0f0f0", overflow: "hidden" }}><ImageWithFallback src={thumbnailUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  <div style={{ padding: 28 }}>
                    <div style={{ marginBottom: 16 }}><span style={{ padding: "6px 12px", background: "rgba(67, 119, 241, 0.1)", color: "#4377F1", fontSize: 12, fontWeight: 800, borderRadius: 8 }}>INSIGHT</span></div>
                    <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: textMain, lineHeight: "1.4", height: "2.8em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h2>
                    <p style={{ margin: "0 0 20px", fontSize: 15, color: "gray", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{(post.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}</p>
                    <div style={{ fontSize: 13, color: "rgba(128,128,128,0.6)", fontWeight: 500 }}>{new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}