import { describe, it, expect } from "vitest";
import { computeBypassActive } from "./computeBypassActive.ts";

const NOW = new Date("2026-06-03T00:00:00.000Z").getTime();

describe("computeBypassActive", () => {
  it("enabled + 미래 만료 → 활성", () => {
    expect(computeBypassActive(true, "2026-06-04T00:00:00.000Z", NOW)).toBe(true);
  });

  it("enabled + expires_at=null → 무기한 활성", () => {
    expect(computeBypassActive(true, null, NOW)).toBe(true);
  });

  it("enabled + 과거 만료 → 비활성", () => {
    expect(computeBypassActive(true, "2026-06-02T00:00:00.000Z", NOW)).toBe(false);
  });

  it("disabled + null → 비활성 (해제 행은 무기한으로 새지 않음)", () => {
    expect(computeBypassActive(false, null, NOW)).toBe(false);
  });

  it("disabled + 미래 만료 → 비활성", () => {
    expect(computeBypassActive(false, "2026-06-04T00:00:00.000Z", NOW)).toBe(false);
  });
});
