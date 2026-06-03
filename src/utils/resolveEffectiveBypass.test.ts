import { describe, expect, it } from "vitest";
import { decideLoginBypass, resolveEffectiveBypass } from "./resolveEffectiveBypass";

// 무기한 MFA 우회 영구락 방지: 우회가 켜져 있어도 슈퍼어드민은 OTP를 통과해야
// AAL2에 도달해 토글(noBypass)을 다시 끌 수 있다. 슈퍼어드민에게는 우회를 무효화한다.
describe("resolveEffectiveBypass", () => {
  it("우회 OFF면 누구든 우회 없음", () => {
    expect(resolveEffectiveBypass(false, false)).toBe(false);
    expect(resolveEffectiveBypass(false, true)).toBe(false);
  });

  it("우회 ON + 일반 어드민 → 우회 적용(OTP skip)", () => {
    expect(resolveEffectiveBypass(true, false)).toBe(true);
  });

  it("우회 ON + 슈퍼어드민 → 우회 무효화(OTP 강제)", () => {
    expect(resolveEffectiveBypass(true, true)).toBe(false);
  });
});

// 로그인 시 최종 MFA 우회 결정: RPC 활성 여부 + 클라 super 판정을 합성.
// super 판정은 EF 가 아니라 클라(VITE_SUPER_ADMIN_UIDS + user.id)에서 오므로 EF 콜드스타트/
// 실패가 일반 admin 우회를 깨뜨리지 않는다([[superAdminClient]]).
describe("decideLoginBypass", () => {
  it("RPC 비활성이면 super 여부 무관하게 우회 없음", () => {
    expect(decideLoginBypass({ rpcBypassed: false, isSuperAdmin: false })).toBe(false);
    expect(decideLoginBypass({ rpcBypassed: false, isSuperAdmin: true })).toBe(false);
  });

  it("RPC 활성 + 일반 어드민 → 우회 적용", () => {
    expect(decideLoginBypass({ rpcBypassed: true, isSuperAdmin: false })).toBe(true);
  });

  it("RPC 활성 + 슈퍼어드민 → 우회 무효(OTP 강제)", () => {
    expect(decideLoginBypass({ rpcBypassed: true, isSuperAdmin: true })).toBe(false);
  });
});
