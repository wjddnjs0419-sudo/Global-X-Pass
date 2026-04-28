import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import { isImage } from "../../utils/file";

const EVENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  "접수예정": { label: "접수예정", color: "#4377F1", bg: "rgba(67,119,241,0.12)" },
  "접수중":   { label: "접수중",   color: "#0FA37F", bg: "rgba(15,163,127,0.12)" },
  "마감임박": { label: "마감임박", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "마감":     { label: "마감",     color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
};

export function EventsPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const divider = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const panelBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)";
  const imgPlaceholder = isDark ? "rgb(30,40,60)" : "#f1f5f9";

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("category", "events")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(true);
        else if (data) setPosts(data);
        setLoading(false);
      });
  }, []);

  return (
    <PageShell title="행사" subtitle="NCF에서 진행하는 다양한 이벤트와 프로그램을 확인해 보세요." accentColor="#18A343">
      <div className="max-w-[1100px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">현재 진행 중인 행사가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {posts.map((post) => {
              const attachmentImages = post.image_url?.split(",").filter(isImage) || [];
              const thumbnailUrl =
                attachmentImages.length > 0
                  ? attachmentImages[0]
                  : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
              const excerpt = cleanText(post.content);
              const tags = post.tags
                ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : [];
              const statusCfg = post.event_status ? EVENT_STATUS[post.event_status] : null;
              const isClosed = post.event_status === "마감";
              const cardBorderColor = statusCfg ? statusCfg.color + "40" : borderColor;

              return (
                <div
                  key={post.id}
                  className="rounded-3xl overflow-hidden flex flex-col sm:flex-row transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: card,
                    border: `1px solid ${cardBorderColor}`,
                    boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full sm:w-[260px] shrink-0 h-52 sm:h-auto"
                    style={{ background: imgPlaceholder }}
                  >
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Center: content */}
                  <div
                    className="flex-1 p-6 sm:p-7 flex flex-col gap-3"
                    style={{ borderRight: `1px solid ${divider}` }}
                  >
                    {/* Status + type badges */}
                    <div className="flex flex-wrap gap-2">
                      {statusCfg && (
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ color: statusCfg.color, background: statusCfg.bg }}
                        >
                          {statusCfg.label}
                        </span>
                      )}
                      {tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{
                            color: textMuted,
                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2
                      className="m-0 font-extrabold leading-snug"
                      style={{
                        fontSize: "clamp(17px,2vw,21px)",
                        color: isClosed ? textMuted : textMain,
                      }}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {excerpt && (
                      <p
                        className="m-0 text-sm leading-relaxed line-clamp-2"
                        style={{ color: textMuted }}
                      >
                        {excerpt}
                      </p>
                    )}

                    {/* Hashtag pills */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs font-medium"
                            style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: info panel */}
                  <div
                    className="w-full sm:w-[220px] shrink-0 p-5 sm:p-6 flex flex-col gap-4 justify-between"
                    style={{ background: panelBg }}
                  >
                    <div className="flex flex-col gap-3">
                      {post.event_date && (
                        <div>
                          <p className="m-0 text-[11px] font-bold tracking-wide mb-1" style={{ color: textMuted }}>일시</p>
                          <p className="m-0 text-sm font-semibold leading-snug" style={{ color: textMain }}>{post.event_date}</p>
                        </div>
                      )}
                      {post.location && (
                        <div>
                          <p className="m-0 text-[11px] font-bold tracking-wide mb-1" style={{ color: textMuted }}>장소</p>
                          <p className="m-0 text-sm font-semibold leading-snug" style={{ color: textMain }}>{post.location}</p>
                        </div>
                      )}
                      {post.capacity != null && (
                        <div>
                          <p className="m-0 text-[11px] font-bold tracking-wide mb-1" style={{ color: textMuted }}>정원</p>
                          <p className="m-0 text-sm font-semibold" style={{ color: textMain }}>
                            {post.capacity}명
                            {post.slots_remaining != null && (
                              <span
                                className="ml-1.5 text-xs font-bold"
                                style={{ color: post.slots_remaining <= 5 ? "#F59E0B" : "#0FA37F" }}
                              >
                                / 잔여 {post.slots_remaining}석
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/post/${post.id}`}
                      className="block text-center rounded-xl text-sm font-bold no-underline py-3"
                      style={{
                        background: isClosed
                          ? (isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9")
                          : "linear-gradient(135deg, #0FA37F 0%, #18A343 100%)",
                        color: isClosed ? textMuted : "#fff",
                        pointerEvents: isClosed ? "none" : "auto",
                      }}
                    >
                      {isClosed ? "마감됨" : "신청하기 →"}
                    </Link>
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
