// ⚠️ 아래 BOARD_PRESETS ID·태그 목록은
//    supabase/migrations/20260507190000_board_tag_presets.sql 시드와 반드시 동기화할 것.

export const BOARD_PRESETS: Record<string, string[]> = {
  events:           ["네트워킹","피칭","투자","글로벌","교육","IR","멘토링","데모데이","창업","커뮤니티","기술","정책"],
  "events-archive": ["네트워킹","피칭","투자","글로벌","교육","IR","멘토링","데모데이","창업","커뮤니티","기술","정책","영상"],
  notice:           ["공지","긴급","일정","안내","중요"],
  news:             ["뉴스","정책","기술","글로벌","투자"],
};

const DEFAULT_PRESETS = ["네트워킹","피칭","투자","글로벌","교육","IR","멘토링","데모데이","창업","커뮤니티","기술","정책","뉴스"];

/** Supabase 데이터 없을 때 사용하는 정적 폴백 */
export function getDefaultPresets(boardId: string): string[] {
  return BOARD_PRESETS[boardId] ?? DEFAULT_PRESETS;
}
