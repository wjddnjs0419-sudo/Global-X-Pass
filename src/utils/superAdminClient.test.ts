import { describe, expect, it } from "vitest";
import { isSuperAdminClient, parseSuperAdminUids } from "./superAdminClient";

// 클라이언트 측 super admin 판정. 서버 _shared/superAdmin.ts 와 동일 로직(쉼표 구분 UID 리스트).
// 게이트가 EF(get-admin-mfa-bypass-state) 콜드스타트/실패에 묶이지 않도록 super 여부를
// VITE_SUPER_ADMIN_UIDS + user.id 로 직접 판정한다. UID 노출은 무해(서버 RLS/AAL 이 실경계).
describe("parseSuperAdminUids", () => {
  it("쉼표 구분 UID 리스트를 trim 해서 배열로", () => {
    expect(parseSuperAdminUids("a, b ,c")).toEqual(["a", "b", "c"]);
  });

  it("빈 문자열/undefined → 빈 배열", () => {
    expect(parseSuperAdminUids("")).toEqual([]);
    expect(parseSuperAdminUids(undefined)).toEqual([]);
  });

  it("빈 토큰(연속 쉼표·trailing)은 제거", () => {
    expect(parseSuperAdminUids("a,,b, ,")).toEqual(["a", "b"]);
  });
});

describe("isSuperAdminClient", () => {
  it("리스트에 포함된 user.id → true", () => {
    expect(isSuperAdminClient("uid-1", "uid-1,uid-2")).toBe(true);
  });

  it("리스트에 없는 user.id → false", () => {
    expect(isSuperAdminClient("uid-3", "uid-1,uid-2")).toBe(false);
  });

  it("user.id 없음(null/undefined/빈값) → false", () => {
    expect(isSuperAdminClient(null, "uid-1")).toBe(false);
    expect(isSuperAdminClient(undefined, "uid-1")).toBe(false);
    expect(isSuperAdminClient("", "uid-1")).toBe(false);
  });

  it("UID 리스트 비어있음 → false (env 미설정 fail-safe)", () => {
    expect(isSuperAdminClient("uid-1", "")).toBe(false);
    expect(isSuperAdminClient("uid-1", undefined)).toBe(false);
  });

  it("주변 공백이 있어도 매칭", () => {
    expect(isSuperAdminClient("uid-1", " uid-1 , uid-2 ")).toBe(true);
  });
});
