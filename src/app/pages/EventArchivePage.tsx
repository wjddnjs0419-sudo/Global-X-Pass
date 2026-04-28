import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { Badge } from "../components/ui/badge";
import { cleanText } from "../../utils/text";

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
  const [error, setError] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const imgPlaceholder = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('category', 'events-archive')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(true);
        else if (data) setPosts(data);
        setLoading(false);
      });
  }, []);

  const years = [...new Set(posts.map(p => new Date(p.created_at).getFullYear()))].sort();
  const yearRange = years.length === 0 ? "-" : years.length === 1 ? String(years[0]) : `${years[0]} ~ ${years[years.length - 1]}`;

  const stats = [
    { label: "총 행사",      value: `${posts.length}건`, color: "#18A343" },
    { label: "누적 참가 인원", value: "집계 예정",          color: "#4377F1" },
    { label: "운영 기간",     value: yearRange,            color: "#A855F7" },
  ];

  return (
    <PageShell title="행사 아카이브" subtitle="NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요." accentColor="#18A343">
      <div className="max-w-[1280px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">등록된 아카이브가 없습니다.</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "28px 24px", textAlign: "center" }}
                >
                  <div style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 900, color: stat.color, letterSpacing: "-1px", lineHeight: 1.1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 14, color: textMuted, marginTop: 8, fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* 4-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {posts.map((post) => {
                const attachmentImages = post.image_url?.split(',').filter(isImage) || [];
                const thumbnailUrl =
                  attachmentImages.length > 0
                    ? attachmentImages[0]
                    : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
                const year = new Date(post.created_at).getFullYear();
                const dateStr = new Date(post.created_at)
                  .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
                  .replace(/ /g, "");
                const excerpt = cleanText(post.content);

                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="rounded-[20px] no-underline overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: card,
                      border: `1px solid ${border}`,
                      boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: imgPlaceholder, overflow: "hidden" }}>
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <span style={{
                        position: "absolute", bottom: 10, left: 10,
                        fontSize: 11, fontWeight: 700, color: "#fff",
                        background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)",
                        padding: "3px 9px", borderRadius: 99,
                      }}>
                        {year}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <Badge variant="green" shape="pill" style={{ fontSize: 11 }}>행사</Badge>
                        <span style={{ fontSize: 12, color: textMuted, flexShrink: 0 }}>{dateStr}</span>
                      </div>
                      <strong style={{
                        fontSize: 15, fontWeight: 800, color: textMain, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      } as React.CSSProperties}>
                        {post.title}
                      </strong>
                      {excerpt && (
                        <p style={{
                          margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.55,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        } as React.CSSProperties}>
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
