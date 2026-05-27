import { supabase } from "../lib/supabaseClient";
import type { Post } from "../lib/types";

// 공개 게시판 미리보기는 list_public_post_previews RPC(본문 500자 strip)만 사용한다.
// 이전의 posts.select("*") fallback 은 preview-only 계약을 깨고 전체 본문을 반환할 수 있어
// 제거했다(gated 본문 노출 방어 심층화). RPC 실패 시 에러를 그대로 전달 → 호출부가 빈 목록/에러로 처리.
export async function fetchPublicPostPreviews(category: string | null, limit?: number) {
  const rpcResult = await supabase.rpc("list_public_post_previews", {
    p_category: category,
    p_limit: limit ?? null,
  });

  return rpcResult as unknown as { data: Post[] | null; error: Error | null };
}
