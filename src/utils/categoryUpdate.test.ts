import { describe, expect, it } from "vitest";
import { interpretCategoryUpdate } from "./categoryUpdate";

describe("interpretCategoryUpdate", () => {
  it("error 가 있으면 실패 + 메시지를 그대로 노출한다", () => {
    const r = interpretCategoryUpdate({ data: null, error: { message: "boom" } });
    expect(r.ok).toBe(false);
    expect(r.errorText).toContain("boom");
  });

  it("error 가 없고 0행이면 실패로 본다 (RLS 거부/세션 만료 위장 방지)", () => {
    const r = interpretCategoryUpdate({ data: [], error: null });
    expect(r.ok).toBe(false);
    expect(r.errorText).toBeTruthy();
  });

  it("error 도 없고 data 도 null 이면 실패로 본다 (204/무-바디 위장 방지)", () => {
    const r = interpretCategoryUpdate({ data: null, error: null });
    expect(r.ok).toBe(false);
    expect(r.errorText).toContain("권한");
  });

  it("1행 이상 반환되면 성공이다", () => {
    const r = interpretCategoryUpdate({ data: [{ id: "notice" }], error: null });
    expect(r.ok).toBe(true);
    expect(r.errorText).toBeNull();
  });
});
