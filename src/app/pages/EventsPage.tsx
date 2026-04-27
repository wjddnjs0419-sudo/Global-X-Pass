import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";

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

export function EventsPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('category', 'events').order('created_at', { ascending: false });
      if (error) setError(true);
      else if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="행사" subtitle="NCF에서 진행하는 다양한 이벤트와 프로그램을 확인해 보세요.">
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? ( <LoadingSpinner /> ) : error ? ( <ErrorMessage /> ) : posts.length === 0 ? ( <p className="text-center text-gray-500 py-[80px]">현재 진행 중인 행사가 없습니다.</p> ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const attachmentImages = post.image_url?.split(',').filter(isImage) || [];
              const thumbnailUrl = attachmentImages.length > 0 ? attachmentImages[0] : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];

              return (
                <Link 
                  key={post.id} 
                  to={`/post/${post.id}`} 
                  className="rounded-[20px] p-6 flex gap-6 no-underline transition-all duration-200 ease-out hover:-translate-y-1"
                  style={{ background: card, border: `1px solid ${border}` }}
                >
                  {thumbnailUrl && <img src={thumbnailUrl} alt="" className="w-[140px] h-[100px] object-cover rounded-xl" />}
                  <div className="flex-1 flex flex-col justify-center">
                    <strong className="block text-[19px] mb-2.5 font-bold" style={{ color: textMain }}>{post.title}</strong>
                    <p 
                      className="m-0 text-[15px] text-gray-500 leading-[1.6] overflow-hidden" 
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    >
                      {(post.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                    </p>
                    <div className="mt-[14px] text-[13px] text-gray-500/60">{new Date(post.created_at).toLocaleDateString()}</div>
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
