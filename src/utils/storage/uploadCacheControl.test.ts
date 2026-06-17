import { describe, expect, it } from "vitest";

// Supabase 무료 한도(cached egress 5.5GB) 초과 재발 방지 가드.
// storage upload 시 cacheControl 을 길게(1년) 주지 않으면 기본 max-age=3600 으로
// 재방문마다 이미지를 재다운로드해 egress 가 폭증한다(2026-06-17 사고). 파일명이
// 유니크(타임스탬프+랜덤)라 내용이 불변이므로 장기 캐시가 안전하다.
// 새 upload 호출 site 를 추가할 때 이 glob 대상에 포함되도록 경로를 맞출 것.
const sources = import.meta.glob(
  [
    "/src/utils/thumbnail/editor.ts",
    "/src/app/components/admin/AdminConsultingManagement.tsx",
    "/src/app/components/admin/AdminPostCreate.tsx",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

describe("storage upload cacheControl 회귀 가드", () => {
  it.each(Object.entries(sources))("%s 는 .upload( 호출 수만큼 cacheControl 을 지정한다", (_path, raw) => {
    // 주석에 적힌 cacheControl 이 카운트를 부풀리지 않도록 주석을 먼저 제거한다.
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    // cacheControl 은 인라인 옵션 또는 uploadOptions 변수로 줄 수 있으므로 호출별
    // 리터럴 검사 대신 "upload 호출 수 ≤ cacheControl 등장 수" 로 누락을 가드한다.
    const uploadCount = (src.match(/\.upload\(/g) ?? []).length;
    const cacheControlCount = (src.match(/cacheControl/g) ?? []).length;
    expect(uploadCount).toBeGreaterThan(0);
    expect(cacheControlCount).toBeGreaterThanOrEqual(uploadCount);
  });
});
