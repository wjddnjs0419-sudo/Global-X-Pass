import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

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

const isImage = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  if (fileName.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)$/i)) return true;
  if (url.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)(?:\?.*)?$/i)) return true;
  if (url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder.com')) return true;
  return false;
};

export function EventArchivePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('category', 'events-archive').order('created_at', { ascending: false });
      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="행사 아카이브" subtitle="NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요.">
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
        {loading ? ( <p style={{ textAlign: "center", color: "gray", padding: "80px 0" }}>데이터를 불러오는 중입니다...</p> ) : posts.length === 0 ? ( <p style={{ textAlign: "center", color: "gray", padding: "80px 0" }}>등록된 아카이브가 없습니다.</p> ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {posts.map((post) => {
              const attachmentImages = post.image_url?.split(',').filter(isImage) || [];
              const thumbnailUrl = attachmentImages.length > 0 ? attachmentImages[0] : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];

              return (
                <Link key={post.id} to={`/post/${post.id}`} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "24px", display: "flex", gap: 24, textDecoration: "none", transition: "all 0.2s ease" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                  {thumbnailUrl && <img src={thumbnailUrl} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 12 }} />}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <strong style={{ display: "block", fontSize: "19px", color: textMain, marginBottom: 10, fontWeight: 700 }}>{post.title}</strong>
                    <p style={{ margin: 0, fontSize: "15px", color: "gray", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{(post.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}</p>
                    <div style={{ marginTop: 14, fontSize: "13px", color: "rgba(128,128,128,0.6)" }}>{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}