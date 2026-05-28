import { useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { PageShell } from "../components/PageShell";
import { useBoardCategoryDescription, useBoardCategoryLabel } from "../BoardCategoriesContext";
import { useTheme } from "../ThemeContext";
import { useAdmin } from "../../hooks/useAdmin";
import { usePostDetail } from "../../hooks/usePostDetail";
import { useMediaCategories } from "../../hooks/useMediaCategories";
import { buildPostDetailModel } from "../../utils/postDetailModel";
import { NaverImportDebugLogger } from "../components/content/NaverImportDebugLogger";
import { DetailHeader } from "./postDetail/DetailHeader";
import { WideVideoPostView } from "./postDetail/WideVideoPostView";
import { PortraitMediaPostView } from "./postDetail/PortraitMediaPostView";
import { StandardPostView } from "./postDetail/StandardPostView";

const BOARD_INFO: Record<string, { title: string; subtitle: string }> = {
  notice:           { title: "공지사항",       subtitle: "중요한 안내 사항을 확인하세요." },
  news:             { title: "뉴스",           subtitle: "새로운 소식을 확인하세요." },
  events:           { title: "행사",           subtitle: "NCF × Around X가 준비한 소식을 확인하세요." },
  "events-archive": { title: "행사 아카이브",   subtitle: "지나간 행사의 기록을 확인하세요." },
  resources:        { title: "자료실",          subtitle: "필요한 서식과 자료를 다운로드하세요." },
  media:            { title: "인사이트",        subtitle: "직접 제작한 콘텐츠를 확인하세요." },
  faq:              { title: "자주 묻는 질문",  subtitle: "궁금한 점을 빠르게 찾아보세요." },
};

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { isAdmin, loading: adminLoading, mfaRequired, mfaEnrolled } = useAdmin();
  const { post, loading, loadError } = usePostDetail(id);
  const mediaCategories = useMediaCategories();
  const contentRef = useRef<HTMLDivElement>(null);

  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const border = "var(--color-border-soft)";
  const card = "var(--color-surface-card)";
  const canRenderAdminControls = !adminLoading && isAdmin && !mfaRequired && mfaEnrolled;

  const fallbackHeaderInfo = BOARD_INFO[post?.category ?? ""] ?? { title: "게시판", subtitle: "상세 보기" };
  const headerTitle = useBoardCategoryLabel(post?.category ?? "", fallbackHeaderInfo.title);
  const headerSubtitle = useBoardCategoryDescription(post?.category ?? "", fallbackHeaderInfo.subtitle);

  const model = useMemo(
    () => (post ? buildPostDetailModel(post, mediaCategories) : null),
    [post, mediaCategories],
  );

  useEffect(() => {
    if (!post) return;
    if (new URLSearchParams(location.search).get("edit") !== "1") return;
    if (!canRenderAdminControls) return;
    navigate(`/admin?editPostId=${post.id}`, { replace: true });
  }, [canRenderAdminControls, location.search, navigate, post]);

  if (loading) return <PageShell title="로딩 중..."><p>불러오는 중입니다.</p></PageShell>;
  if (!post || !model) return <PageShell title="오류"><p>{loadError ?? "게시물을 찾을 수 없습니다."}</p></PageShell>;

  const { isArchiveVideoType, isWideVideoDetail } = model;
  const isMediaLayout = post.category === "media" || isArchiveVideoType;

  return (
    <PageShell title={headerTitle} subtitle={headerSubtitle}>
      <NaverImportDebugLogger post={post} model={model} contentRef={contentRef} />
      <div className={`${isMediaLayout ? "max-w-[1100px]" : "max-w-[900px]"} mx-auto pb-[100px]`}>
        <DetailHeader post={post} canRenderAdminControls={canRenderAdminControls} border={border} card={card} />

        {isMediaLayout ? (
          isWideVideoDetail ? (
            <WideVideoPostView post={post} model={model} isDark={isDark} textMain={textMain} textMuted={textMuted} border={border} />
          ) : (
            <PortraitMediaPostView post={post} model={model} isDark={isDark} textMain={textMain} textMuted={textMuted} border={border} />
          )
        ) : (
          <StandardPostView post={post} model={model} isDark={isDark} textMain={textMain} textMuted={textMuted} border={border} card={card} contentRef={contentRef} />
        )}
      </div>
    </PageShell>
  );
}
