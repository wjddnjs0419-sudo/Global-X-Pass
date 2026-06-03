import { describe, it, expect } from "vitest";
import { resolveBypassMutation } from "./resolveBypassMutation.ts";

const NOW = new Date("2026-06-03T00:00:00.000Z");

describe("resolveBypassMutation", () => {
  it("days=-1 → 무기한 활성 (enabled, expiresAt=null)", () => {
    const r = resolveBypassMutation(-1, NOW);
    expect(r.enabled).toBe(true);
    expect(r.expiresAt).toBeNull();
    expect(r.enabledAt).toBe(NOW.toISOString());
  });

  it("days=0 → 해제 (enabled=false, 만료/활성시각 null)", () => {
    const r = resolveBypassMutation(0, NOW);
    expect(r.enabled).toBe(false);
    expect(r.expiresAt).toBeNull();
    expect(r.enabledAt).toBeNull();
  });

  it("days=1 → 1일 후 만료", () => {
    const r = resolveBypassMutation(1, NOW);
    expect(r.enabled).toBe(true);
    expect(r.expiresAt).toBe(new Date("2026-06-04T00:00:00.000Z").toISOString());
    expect(r.enabledAt).toBe(NOW.toISOString());
  });

  it("days=3 → 3일 후 만료", () => {
    const r = resolveBypassMutation(3, NOW);
    expect(r.enabled).toBe(true);
    expect(r.expiresAt).toBe(new Date("2026-06-06T00:00:00.000Z").toISOString());
    expect(r.enabledAt).toBe(NOW.toISOString());
  });

  it("days=7 → 7일 후 만료", () => {
    const r = resolveBypassMutation(7, NOW);
    expect(r.enabled).toBe(true);
    expect(r.expiresAt).toBe(new Date("2026-06-10T00:00:00.000Z").toISOString());
  });
});
