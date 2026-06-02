import { describe, it, expect } from "vitest";
import {
  evaluateAdminGate,
  shouldCommitGate,
  shouldCheckSilently,
  withRetry,
  shouldRaiseLoading,
  shouldRefocusAuthoritative,
  shouldGateAdminRender,
  type AdminGateDeps,
  type AdminGateSnapshot,
  type CommitGuard,
} from "./adminGate";
import type { AdminMfaBypassState } from "./useAdmin";

const activeBypass: AdminMfaBypassState = {
  enabled: true,
  is_active: true,
  expires_at: "2099-01-01T00:00:00.000Z",
  enabled_at: "2026-01-01T00:00:00.000Z",
  enabled_by: "uid-1",
  enabled_by_email: "a@b.com",
  reason: "event",
  updated_at: "2026-01-01T00:00:00.000Z",
};

// "이전 상태": 직전까지 admin 으로 통과해 있던 스냅샷. silent fail-open(keep) 의미 확인용.
const prevAdmin: AdminGateSnapshot = {
  isAdmin: true,
  isSuperAdmin: true,
  mfaBypass: activeBypass,
  mfaRequired: false,
  mfaEnrolled: true,
  aal: "aal2",
};

// 기본 deps = admin + bypass 비활성 + aal2 + 검증된 TOTP (정상 통과 경로).
function makeDeps(over: Partial<AdminGateDeps> = {}): AdminGateDeps {
  return {
    fetchRole: async () => ({ ok: true, role: "admin" }),
    fetchBypass: async () => ({ ok: true, isSuperAdmin: false, state: null }),
    fetchAal: async () => ({ ok: true, currentLevel: "aal2", nextLevel: "aal2" }),
    fetchFactors: async () => ({ ok: true, hasVerifiedTotpFactor: true }),
    ...over,
  };
}

describe("evaluateAdminGate — 기존 동작 보존", () => {
  it("비-admin role 이면 admin/슈퍼/우회 전부 해제 커밋", async () => {
    const d = await evaluateAdminGate(makeDeps({ fetchRole: async () => ({ ok: true, role: "user" }) }), {
      silent: false,
      prev: prevAdmin,
    });
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.isAdmin).toBe(false);
    expect(d.snapshot.isSuperAdmin).toBe(false);
    expect(d.snapshot.mfaBypass).toBeNull();
    expect(d.snapshot.mfaRequired).toBe(false);
    expect(d.snapshot.mfaEnrolled).toBe(false);
  });

  it("admin + bypass 활성 → MFA 스킵, mfaRequired=false / aal1", async () => {
    const d = await evaluateAdminGate(
      makeDeps({ fetchBypass: async () => ({ ok: true, isSuperAdmin: true, state: activeBypass }) }),
      { silent: false, prev: prevAdmin },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.isAdmin).toBe(true);
    expect(d.snapshot.isSuperAdmin).toBe(true);
    expect(d.snapshot.mfaBypass).toEqual(activeBypass);
    expect(d.snapshot.mfaRequired).toBe(false);
    expect(d.snapshot.mfaEnrolled).toBe(true);
    expect(d.snapshot.aal).toBe("aal1");
  });

  it("admin + bypass 비활성 + aal2 + 검증 TOTP → mfaRequired=false", async () => {
    const d = await evaluateAdminGate(makeDeps(), { silent: false, prev: prevAdmin });
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.isAdmin).toBe(true);
    expect(d.snapshot.mfaRequired).toBe(false);
    expect(d.snapshot.mfaEnrolled).toBe(true);
    expect(d.snapshot.aal).toBe("aal2");
  });

  it("admin + bypass 비활성 + aal1(nextLevel aal2) → mfaRequired=true", async () => {
    const d = await evaluateAdminGate(
      makeDeps({ fetchAal: async () => ({ ok: true, currentLevel: "aal1", nextLevel: "aal2" }) }),
      { silent: false, prev: prevAdmin },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.mfaRequired).toBe(true);
  });
});

describe("evaluateAdminGate — #1 트리거별 fail-open/closed", () => {
  it("silent=true + role 조회 실패 → keep (기존 권한 유지)", async () => {
    const d = await evaluateAdminGate(makeDeps({ fetchRole: async () => ({ ok: false, role: null }) }), {
      silent: true,
      prev: prevAdmin,
    });
    expect(d.kind).toBe("keep");
  });

  it("silent=false + role 조회 실패 → commit 으로 admin 박탈(fail-closed)", async () => {
    const d = await evaluateAdminGate(makeDeps({ fetchRole: async () => ({ ok: false, role: null }) }), {
      silent: false,
      prev: prevAdmin,
    });
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.isAdmin).toBe(false);
  });

  it("silent=true + bypass EF 실패 → keep", async () => {
    const d = await evaluateAdminGate(
      makeDeps({ fetchBypass: async () => ({ ok: false, isSuperAdmin: false, state: null }) }),
      { silent: true, prev: prevAdmin },
    );
    expect(d.kind).toBe("keep");
  });

  // 핵심 high 버그: bypass 만료/토글(fail-closed) 시 EF 일시 실패가 겹쳐도
  // admin 이 열린 채 남지 않고 MFA 재게이트(mfaRequired)로 막아야 한다.
  it("silent=false + bypass EF 실패(admin, aal1) → commit, mfaRequired=true 재게이트", async () => {
    const d = await evaluateAdminGate(
      makeDeps({
        fetchBypass: async () => ({ ok: false, isSuperAdmin: false, state: null }),
        fetchAal: async () => ({ ok: true, currentLevel: "aal1", nextLevel: "aal2" }),
      }),
      { silent: false, prev: prevAdmin },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.mfaRequired).toBe(true);
  });

  // Codex #11 high: fail-closed 에서 bypass EF 가 (retry 소진 후) 실패하면 옛 active bypass 를
  // 비활성화해야 한다. 그러지 않으면 만료 타이머가 is_active=true+과거 expires_at 을 보고
  // setTimeout(0) 무한 재검증 루프 + stale 슈퍼/배너 잔존.
  it("silent=false + bypass EF 실패 → 옛 active bypass 비활성화(isSuper=false, mfaBypass=null)", async () => {
    const d = await evaluateAdminGate(
      makeDeps({
        fetchBypass: async () => ({ ok: false, isSuperAdmin: false, state: null }),
        fetchAal: async () => ({ ok: true, currentLevel: "aal1", nextLevel: "aal2" }),
      }),
      { silent: false, prev: { ...prevAdmin } },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.isSuperAdmin).toBe(false);
    expect(d.snapshot.mfaBypass).toBeNull();
    expect(d.snapshot.mfaRequired).toBe(true);
  });

  it("silent=true + aal 조회 실패 → keep", async () => {
    const d = await evaluateAdminGate(
      makeDeps({ fetchAal: async () => ({ ok: false, currentLevel: null, nextLevel: null }) }),
      { silent: true, prev: prevAdmin },
    );
    expect(d.kind).toBe("keep");
  });

  it("silent=false + aal 조회 실패(admin) → commit, mfaRequired=true", async () => {
    const d = await evaluateAdminGate(
      makeDeps({ fetchAal: async () => ({ ok: false, currentLevel: null, nextLevel: null }) }),
      { silent: false, prev: prevAdmin },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.mfaRequired).toBe(true);
  });
});

describe("evaluateAdminGate — #2 부수효과 없음(순수)", () => {
  it("bypass 값은 반환 스냅샷으로만 흘러나온다(즉시 mutate 금지)", async () => {
    const d = await evaluateAdminGate(
      makeDeps({ fetchBypass: async () => ({ ok: true, isSuperAdmin: true, state: activeBypass }) }),
      { silent: false, prev: prevAdmin },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    // fetchBypass 의 결과는 오직 decision.snapshot 에만 반영
    expect(d.snapshot.isSuperAdmin).toBe(true);
    expect(d.snapshot.mfaBypass).toEqual(activeBypass);
  });

  it("prev 스냅샷을 변형하지 않는다", async () => {
    const prev: AdminGateSnapshot = { ...prevAdmin, mfaBypass: { ...activeBypass } };
    const snapshot = JSON.parse(JSON.stringify(prev));
    await evaluateAdminGate(makeDeps({ fetchRole: async () => ({ ok: true, role: "user" }) }), {
      silent: false,
      prev,
    });
    expect(prev).toEqual(snapshot);
  });
});

const baseGuard: CommitGuard = {
  mySeq: 1,
  silent: false,
  capturedUserId: "X",
  currentUserId: "X",
  seqRef: 1,
  lastFailClosedSeq: 1,
  authoritativeInFlight: 0,
};

describe("shouldCommitGate — 커밋 시퀀스/우선순위 가드", () => {
  it("단일 fail-closed 검사는 커밋", () => {
    expect(shouldCommitGate(baseGuard)).toBe(true);
  });

  it("단일 silent 검사는 커밋", () => {
    expect(shouldCommitGate({ ...baseGuard, silent: true, lastFailClosedSeq: 0 })).toBe(true);
  });

  // Codex #6-2 high: fail-closed(만료/토글)가 먼저 시작되고 나중에 silent 검사가 seq 를 올려도
  // fail-closed 결과가 드롭되지 않아야 한다(나중 silent keep 으로 옛 admin 생존 방지).
  it("나중에 시작된 silent 가 먼저 시작된 fail-closed 커밋을 취소하지 못한다", () => {
    expect(shouldCommitGate({ ...baseGuard, silent: false, mySeq: 1, seqRef: 2, lastFailClosedSeq: 1 })).toBe(true);
  });

  it("silent 는 더 새 검사가 있으면 드롭", () => {
    expect(shouldCommitGate({ ...baseGuard, silent: true, mySeq: 1, seqRef: 2, lastFailClosedSeq: 0 })).toBe(false);
  });

  it("fail-closed 는 더 새 fail-closed 가 있으면 드롭", () => {
    expect(shouldCommitGate({ ...baseGuard, silent: false, mySeq: 1, seqRef: 2, lastFailClosedSeq: 2 })).toBe(false);
  });

  it("먼저 시작된 silent 는 나중 fail-closed 에 의해 드롭(fail-closed 우선)", () => {
    expect(shouldCommitGate({ ...baseGuard, silent: true, mySeq: 1, seqRef: 2, lastFailClosedSeq: 2 })).toBe(false);
  });

  // Codex #6-2 medium: 로그아웃/세션 소실 후(currentUserId=null) in-flight 결과는 재커밋 금지.
  it("sign-out 후 currentUserId=null 이면 in-flight 결과 드롭", () => {
    expect(shouldCommitGate({ ...baseGuard, currentUserId: null })).toBe(false);
  });

  it("사용자 전환(captured≠current) 시 옛 사용자 결과 드롭", () => {
    expect(shouldCommitGate({ ...baseGuard, capturedUserId: "X", currentUserId: "Y" })).toBe(false);
  });

  // Codex #15 high: fail-closed 가 loading 올린 채 in-flight 인데 나중 silent 가 먼저 끝나
  // setLoading(false)/commit 하면 권위 결과 전에 loading 창이 닫혀 stale admin 재노출.
  it("silent 은 진행 중 authoritative 가 있으면 드롭(loading 창 보존)", () => {
    expect(
      shouldCommitGate({ ...baseGuard, silent: true, mySeq: 2, seqRef: 2, lastFailClosedSeq: 1, authoritativeInFlight: 1 }),
    ).toBe(false);
  });

  it("fail-closed 자신은 in-flight 카운트(자기 포함)에 막히지 않는다", () => {
    expect(shouldCommitGate({ ...baseGuard, silent: false, authoritativeInFlight: 1 })).toBe(true);
  });
});

describe("shouldCheckSilently — 이벤트별 fail-open/closed 분기", () => {
  it("신규 사용자는 어떤 이벤트든 fail-closed(silent=false)", () => {
    expect(shouldCheckSilently("TOKEN_REFRESHED", false)).toBe(false);
    expect(shouldCheckSilently("MFA_CHALLENGE_VERIFIED", false)).toBe(false);
  });

  // Codex #8 high: OTP 검증(MFA_CHALLENGE_VERIFIED)만 동일 사용자라도 authoritative 재평가.
  it("동일 사용자 + MFA_CHALLENGE_VERIFIED → authoritative(silent=false)", () => {
    expect(shouldCheckSilently("MFA_CHALLENGE_VERIFIED", true)).toBe(false);
  });

  // Codex #9 high: Supabase 는 탭 refocus/세션 재확립에도 SIGNED_IN 을 빈번히 발화하므로
  // 동일 사용자 SIGNED_IN 은 silent 유지(일시 실패로 admin 튕김 방지).
  it("동일 사용자 + SIGNED_IN → silent(refocus/재확립 잦음)", () => {
    expect(shouldCheckSilently("SIGNED_IN", true)).toBe(true);
  });

  it("동일 사용자 + TOKEN_REFRESHED → silent(깜빡임 방지)", () => {
    expect(shouldCheckSilently("TOKEN_REFRESHED", true)).toBe(true);
  });

  it("동일 사용자 + USER_UPDATED → silent", () => {
    expect(shouldCheckSilently("USER_UPDATED", true)).toBe(true);
  });

  it("동일 사용자 + VISIBILITY(가상 이벤트) → silent", () => {
    expect(shouldCheckSilently("VISIBILITY", true)).toBe(true);
  });
});

// Codex #13/#14 high: bypass 에 기대는 세션은 refocus 시 무조건 fail-closed 재게이트해야 한다.
// 캐시된 expires_at(Date.now) 만 보면 조기 해제·클럭 스큐 시 여전히 silent 로 stale admin 유지됨.
// → is_active bypass 면 만료 여부 무관하게 authoritative.
describe("shouldRefocusAuthoritative — bypass 기대 세션 refocus 판정", () => {
  const mk = (over: Partial<NonNullable<AdminGateSnapshot["mfaBypass"]>> = {}): AdminGateSnapshot["mfaBypass"] => ({
    enabled: true,
    is_active: true,
    expires_at: "2099-01-01T00:00:00.000Z",
    enabled_at: null,
    enabled_by: null,
    enabled_by_email: null,
    reason: null,
    updated_at: null,
    ...over,
  });

  it("active bypass(만료 미래여도) → fail-closed(true)", () => {
    expect(shouldRefocusAuthoritative(mk())).toBe(true);
  });

  it("active bypass(만료 과거) → fail-closed(true)", () => {
    expect(shouldRefocusAuthoritative(mk({ expires_at: "2000-01-01T00:00:00.000Z" }))).toBe(true);
  });

  it("비활성 bypass → silent(false)", () => {
    expect(shouldRefocusAuthoritative(mk({ is_active: false }))).toBe(false);
  });

  it("bypass 없음(null) → silent(false)", () => {
    expect(shouldRefocusAuthoritative(null)).toBe(false);
  });
});

describe("withRetry — 일시 실패 bounded 재시도", () => {
  it("첫 호출 성공이면 1회만 호출", async () => {
    let calls = 0;
    const r = await withRetry(async () => {
      calls++;
      return { ok: true, v: 1 };
    }, 3);
    expect(calls).toBe(1);
    expect(r.ok).toBe(true);
  });

  it("일시 실패 후 성공이면 재시도해 ok 반환", async () => {
    let calls = 0;
    const r = await withRetry(async () => {
      calls++;
      return { ok: calls >= 2 };
    }, 3);
    expect(calls).toBe(2);
    expect(r.ok).toBe(true);
  });

  it("attempts 만큼 모두 실패하면 마지막 !ok 반환", async () => {
    let calls = 0;
    const r = await withRetry(async () => {
      calls++;
      return { ok: false };
    }, 3);
    expect(calls).toBe(3);
    expect(r.ok).toBe(false);
  });

  // Codex #12 high: 같은 tick 즉시 재시도는 전파 race 를 못 막으므로 재시도 사이 delay 필요.
  it("delayMs>0 이면 재시도 사이 sleep(전파 창 확보)", async () => {
    const sleeps: number[] = [];
    let calls = 0;
    const r = await withRetry(
      async () => {
        calls++;
        return { ok: calls >= 3 };
      },
      3,
      50,
      async (ms) => {
        sleeps.push(ms);
      },
    );
    expect(calls).toBe(3);
    expect(sleeps).toEqual([50, 50]);
    expect(r.ok).toBe(true);
  });

  it("첫 호출 성공이면 sleep 하지 않음", async () => {
    const sleeps: number[] = [];
    await withRetry(async () => ({ ok: true }), 3, 50, async (ms) => {
      sleeps.push(ms);
    });
    expect(sleeps).toEqual([]);
  });
});

// Codex #12 high: probe 가 reject/throw 해도 evaluate 가 {ok:false} 로 정규화해 deny/keep 으로
// 결정론적 처리(throw 가 evaluate 밖으로 새어 check 의 loading 을 영구 wedge 시키지 않게).
describe("evaluateAdminGate — probe throw 정규화", () => {
  it("fetchAal throw + fail-closed → mfaRequired=true(deny)", async () => {
    const d = await evaluateAdminGate(
      makeDeps({
        fetchAal: async () => {
          throw new Error("net");
        },
      }),
      { silent: false, prev: prevAdmin },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.mfaRequired).toBe(true);
  });

  it("fetchRole throw + silent → keep", async () => {
    const d = await evaluateAdminGate(
      makeDeps({
        fetchRole: async () => {
          throw new Error("net");
        },
      }),
      { silent: true, prev: prevAdmin },
    );
    expect(d.kind).toBe("keep");
  });
});

// Codex #10: fail-closed(authoritative) 재검증은 시작 시 loading 을 올려 비동기 창(withRetry 포함)
// 동안 옛 스냅샷으로 라우팅(OTP 후 /admin 튕김, 만료 시 admin 잔존)되지 않게 즉시 게이트 블록.
describe("shouldRaiseLoading — fail-closed 시 즉시 게이트 블록", () => {
  it("fail-closed(silent=false) → loading 올림", () => {
    expect(shouldRaiseLoading(false)).toBe(true);
  });

  it("silent(기회적 재검증) → loading 안 건드림(깜빡임 방지)", () => {
    expect(shouldRaiseLoading(true)).toBe(false);
  });
});

// Codex #9 high: OTP 성공(MFA_CHALLENGE_VERIFIED, authoritative) 직후 AAL probe 가 한 번
// 일시 실패해도 withRetry 가 재시도해 회복 → mfaRequired=false 로 /admin 접근 가능해야 한다.
describe("evaluateAdminGate + withRetry — OTP 직후 일시 probe 실패 회복", () => {
  it("authoritative 경로에서 AAL 한 번 실패→재시도 성공 시 mfaRequired=false", async () => {
    let aalCalls = 0;
    const d = await evaluateAdminGate(
      makeDeps({
        fetchAal: () =>
          withRetry(async () => {
            aalCalls++;
            if (aalCalls < 2) return { ok: false, currentLevel: null, nextLevel: null };
            return { ok: true, currentLevel: "aal2", nextLevel: "aal2" };
          }, 3),
      }),
      { silent: false, prev: { ...prevAdmin, mfaRequired: true } },
    );
    expect(d.kind).toBe("commit");
    if (d.kind !== "commit") return;
    expect(d.snapshot.mfaRequired).toBe(false);
    expect(d.snapshot.mfaEnrolled).toBe(true);
  });
});

describe("shouldGateAdminRender — 재검증 중 화면 유지 vs 초기 게이트", () => {
  // 초기 진입(아직 admin 확정 전): 옛 스냅샷 없음 → hidden 게이트로 라우팅 보류.
  it("loading + 아직 admin 아님 → 게이트(true)", () => {
    expect(shouldGateAdminRender(true, false)).toBe(true);
  });

  // bypass refocus 등 authoritative 재검증: 이미 admin 이면 화면 유지(unmount/깜빡임 방지).
  // 강등은 커밋 후 isAdmin=false 가 되어 다음 렌더에서 Navigate 로 퇴출되므로 여기선 통과시킨다.
  it("loading + 이미 admin → 게이트 안 함(false, 화면 유지)", () => {
    expect(shouldGateAdminRender(true, true)).toBe(false);
  });

  // 검증 완료: loading=false 면 게이트 불필요(이후 isAdmin 분기가 라우팅).
  it("loading 아님 → 게이트 안 함(false)", () => {
    expect(shouldGateAdminRender(false, true)).toBe(false);
    expect(shouldGateAdminRender(false, false)).toBe(false);
  });
});
