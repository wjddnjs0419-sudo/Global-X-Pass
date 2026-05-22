export type MediaCategoryId =
  | "report"
  | "issue-paper"
  | "trend-report"
  | "podcast"
  | "video"
  | "interview";

export type MediaCategoryShape = "portrait" | "wide";

export interface MediaCategory {
  id: MediaCategoryId;
  defaultLabel: string;
  label: string;
  shape: MediaCategoryShape;
}

// ⚠️ 아래 ID 목록은 supabase/migrations/20260507170000_media_category_labels.sql의
//    CHECK 제약과 반드시 동기화할 것. 카테고리 추가·삭제 시 두 파일을 함께 수정해야 한다.
export const MEDIA_CATEGORY_DEFINITIONS: Omit<MediaCategory, "label">[] = [
  { id: "report",       defaultLabel: "마켓",  shape: "portrait" },
  { id: "issue-paper",  defaultLabel: "테크",  shape: "portrait" },
  { id: "trend-report", defaultLabel: "CEO",   shape: "portrait" },
  { id: "podcast",      defaultLabel: "팟캐스트",    shape: "wide" },
  { id: "video",        defaultLabel: "영상",        shape: "wide" },
  { id: "interview",    defaultLabel: "인터뷰",      shape: "wide" },
];

const isMediaCategoryId = (value: string): value is MediaCategoryId =>
  MEDIA_CATEGORY_DEFINITIONS.some((def) => def.id === value);

/** 정적 기본값만 반환 (IO 없음). Supabase 데이터 없는 초기 상태 폴백용. */
export const getMediaCategories = (): MediaCategory[] =>
  MEDIA_CATEGORY_DEFINITIONS.map((def) => ({ ...def, label: def.defaultLabel }));

/** Supabase `media_category_labels` 조회 결과를 definitions에 병합 */
export const buildMediaCategories = (
  rows: { id: string; label: string }[]
): MediaCategory[] => {
  const labelMap = new Map(rows.map((r) => [r.id, r.label]));
  return MEDIA_CATEGORY_DEFINITIONS.map((def) => ({
    ...def,
    label: labelMap.get(def.id)?.trim() || def.defaultLabel,
  }));
};

export const resolveMediaCategoryId = (value?: string | null): MediaCategoryId | null => {
  const raw = value?.trim();
  if (!raw) return null;
  if (isMediaCategoryId(raw)) return raw;

  const match = MEDIA_CATEGORY_DEFINITIONS.find(
    (def) => def.defaultLabel === raw
  );
  return match?.id ?? null;
};

export const getMediaCategory = (value?: string | null): Omit<MediaCategory, "label"> | null => {
  const id = resolveMediaCategoryId(value);
  if (!id) return null;
  return MEDIA_CATEGORY_DEFINITIONS.find((def) => def.id === id) ?? null;
};

/** defaultLabel 기반 순수 폴백. 컴포넌트는 Supabase 로드 후 state로 라벨을 관리할 것. */
export const getMediaCategoryLabel = (value?: string | null): string =>
  getMediaCategory(value)?.defaultLabel ?? value ?? "콘텐츠";

export const getMediaCategoryShape = (value?: string | null): MediaCategoryShape =>
  getMediaCategory(value)?.shape ?? "portrait";

export const isPortraitMediaCategory = (value?: string | null) =>
  getMediaCategoryShape(value) === "portrait";

export const isWideMediaCategory = (value?: string | null) =>
  getMediaCategoryShape(value) === "wide";

export const getMediaCategoryAspectRatio = (value?: string | null) =>
  isWideMediaCategory(value) ? "16 / 9" : "540 / 675";
