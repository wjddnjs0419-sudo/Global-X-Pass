import { useNavigate } from "react-router";
import type { Post } from "../../../lib/types";
import { getBackLinkStyle } from "../../components/contentListStyles";

type DetailHeaderProps = {
  post: Post;
  canRenderAdminControls: boolean;
  border: string;
  card: string;
};

export function DetailHeader({ post, canRenderAdminControls, border, card }: DetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-8">
      <button
        onClick={() => post.category === "media" ? navigate("/insights") : navigate(-1)}
        style={getBackLinkStyle()}
      >
        ← 목록으로 돌아가기
      </button>
      {canRenderAdminControls && (
        <button
          type="button"
          onClick={() => navigate(`/admin?editPostId=${post.id}`)}
          className="px-5 py-2 rounded-lg font-bold cursor-pointer"
          style={{ border: `1px solid ${border}`, background: card, color: "var(--color-accent-blue)" }}
        >
          수정
        </button>
      )}
    </div>
  );
}
