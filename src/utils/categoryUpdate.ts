// 게시판 카테고리 update 결과 해석 (순수함수)
//
// 배경: post_categories update 에 `.select()` 가 없으면 PostgREST 가 204 를 반환하고,
// RLS 가 0행으로 막아도 error=null 이라 "성공 위장" + 낙관적 갱신만 되어 DB 미반영 버그가 난다.
// `.select("id")` 를 붙여 반환 행을 받고, 이 함수로 error / 0행 / 1행 이상을 명확히 구분한다.

export interface CategoryUpdateResult {
  data: { id: string }[] | null;
  error: { message: string } | null;
}

export interface CategoryUpdateInterpretation {
  ok: boolean;
  errorText: string | null;
}

const ZERO_ROW_MESSAGE = "변경 권한이 없거나 세션이 만료되었습니다. 다시 로그인 후 시도하세요.";

export function interpretCategoryUpdate({ data, error }: CategoryUpdateResult): CategoryUpdateInterpretation {
  if (error) {
    return { ok: false, errorText: error.message };
  }
  if (!data || data.length === 0) {
    return { ok: false, errorText: ZERO_ROW_MESSAGE };
  }
  return { ok: true, errorText: null };
}
