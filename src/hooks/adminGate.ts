import type { AdminMfaBypassState } from "./useAdmin";

// 권한 게이트가 다루는 전체 상태 묶음. useAdmin 의 개별 useState 를 한 스냅샷으로 모아
// "전부 커밋 / 아무것도 안 함" 중 하나로만 결정되게 한다(부분 갱신·중간 mutate 금지).
export type AdminGateSnapshot = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mfaBypass: AdminMfaBypassState | null;
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  aal: string;
};

// 외부 I/O(profiles role / bypass EF / AAL / TOTP factor)를 전부 주입받아 순수하게 평가한다.
// supabase 직접 의존을 제거 → 테스트는 가짜 fetcher 만 넘기면 되고, 결과는 반환값으로만 표현.
export type AdminGateDeps = {
  fetchRole: () => Promise<{ ok: boolean; role: string | null }>;
  fetchBypass: () => Promise<{ ok: boolean; isSuperAdmin: boolean; state: AdminMfaBypassState | null }>;
  fetchAal: () => Promise<{ ok: boolean; currentLevel: string | null; nextLevel: string | null }>;
  fetchFactors: () => Promise<{ ok: boolean; hasVerifiedTotpFactor: boolean }>;
};

// commit = 이 스냅샷을 그대로 반영. keep = 아무 상태도 건드리지 말 것(silent 일시 실패).
export type AdminGateDecision =
  | { kind: "keep" }
  | { kind: "commit"; snapshot: AdminGateSnapshot };

export type AdminGateOptions = {
  // false(초기/만료/토글) = fail-closed: 조회 실패 시 권한 박탈·MFA 재게이트.
  // true(탭복귀·토큰갱신·동일사용자) = fail-open: 일시 실패는 keep 으로 기존 상태 유지.
  silent: boolean;
  // 실패 분기에서 원본 코드가 건드리지 않던 필드(예: aal)를 그대로 이어가기 위한 직전 스냅샷.
  prev: AdminGateSnapshot;
};

// check() 결과를 상태에 커밋할지 판정하는 순수 가드. 단일 monotonic seq 의 last-wins 만으로는
// 부족한 두 레이스를 막는다:
//  (1) fail-closed(만료/토글) 우선권: 나중에 시작된 silent 검사가 seq 를 올려 먼저 시작된
//      fail-closed 결과를 드롭시키면, 그 silent 가 transient 실패로 keep 을 반환할 때 옛 admin 이
//      살아남는다. → fail-closed 는 "더 새 fail-closed" 에게만 밀린다(silent 에는 안 밀림).
//  (2) 사용자 식별 게이트: sign-out(currentUserId=null)/사용자 전환 시, 그 전 시작된 in-flight
//      검사 결과가 옛 admin 스냅샷을 재커밋하지 못하게 한다.
export type CommitGuard = {
  mySeq: number;            // 이 검사가 받은 seq
  silent: boolean;          // silent(fail-open) 검사 여부
  capturedUserId: string | null; // 검사 시작 시점의 대상 사용자
  currentUserId: string | null;  // 커밋 시점의 현재 사용자(ref)
  seqRef: number;           // 현재까지 발급된 최신 seq
  lastFailClosedSeq: number; // 마지막으로 시작된 fail-closed 검사의 seq
  authoritativeInFlight: number; // 아직 끝나지 않은 fail-closed 검사 수(자기 포함)
};

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ok 플래그를 가진 비동기 조회를 bounded 재시도. fail-closed 경로(특히 OTP 검증 직후)에서
// 단 한 번의 일시 probe 실패가 즉시 권한 박탈/리다이렉트로 이어지지 않게 한다(Codex #9).
// delayMs>0 이면 재시도 사이 대기해 MFA/AAL 전파 창을 준다(같은 tick 즉시 재시도는 동일 stale
// 상태만 반복 관측 — Codex #12). sleep 은 테스트 주입용. 영구 실패는 마지막 결과로 deny.
export async function withRetry<T extends { ok: boolean }>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs = 0,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<T> {
  let last = await fn();
  for (let i = 1; i < attempts && !last.ok; i++) {
    if (delayMs > 0) await sleep(delayMs);
    last = await fn();
  }
  return last;
}

// bypass 에 기대는 세션(is_active)은 refocus 시 무조건 fail-closed 로 재게이트한다. 캐시된
// expires_at 만 보면 슈퍼관리자 조기 해제·클럭 스큐 시 silent 로 stale admin 이 유지된다(Codex #14).
// 시한제 우회는 보안 민감 상태라 탭 복귀 시 짧은 로딩을 감수하고 권위 있게 재확인. 일반 MFA
// 관리자(bypass 없음)는 silent 유지(깜빡임 방지).
export function shouldRefocusAuthoritative(mfaBypass: AdminMfaBypassState | null): boolean {
  return Boolean(mfaBypass?.is_active);
}

// fail-closed(authoritative) 재검증은 시작 시 loading 을 올려 라우트 가드(AdminRoute)가 비동기
// 창(withRetry 재시도 포함) 동안 옛 스냅샷으로 리다이렉트하지 않게 한다. silent 는 깜빡임 방지로
// loading 을 건드리지 않는다(Codex #10: OTP 후 /admin 튕김 + 만료/토글 시 admin 잔존 차단).
export function shouldRaiseLoading(silent: boolean): boolean {
  return !silent;
}

// AdminRoute 가 loading 동안 어드민 트리를 hidden 게이트로 가려야 하는지. 초기 진입(아직 admin
// 미확정)에만 가려 옛 스냅샷 라우팅을 막고, 이미 admin 인 상태의 authoritative 재검증(bypass
// refocus 등)에는 화면을 유지해 unmount/재fetch 깜빡임을 없앤다. 강등은 커밋 후 isAdmin=false 가
// 되어 다음 렌더에서 Navigate 로 퇴출되므로 보안 게이트는 유지된다(완화: 만료 직후 재검증 창 동안
// 짧은 stale 노출).
export function shouldGateAdminRender(loading: boolean, isAdmin: boolean): boolean {
  return loading && !isAdmin;
}

// 권한을 "상승"시키는 auth 이벤트. 동일 사용자라도 authoritative(fail-closed) 재평가한다.
// SIGNED_IN 은 Supabase 가 탭 refocus/세션 재확립에도 빈번히 발화 → 제외(silent 유지, Codex #9).
// OTP 검증(MFA_CHALLENGE_VERIFIED)만 명시적 권한 상승이라 authoritative.
const AUTHORITATIVE_EVENTS = new Set(["MFA_CHALLENGE_VERIFIED"]);

// 이 auth 이벤트(또는 가상 이벤트)에서 check 를 silent(fail-open)로 돌릴지 결정.
// - 신규 사용자: fail-closed 게이트(스피너 + 일시 실패 시 박탈).
// - 동일 사용자 + 권한 상승 이벤트: authoritative(fail-closed) — 상승을 일시 실패로 무시 금지.
// - 그 외 동일 사용자 routine(TOKEN_REFRESHED·탭복귀 등): silent(깜빡임 방지).
export function shouldCheckSilently(event: string, isSameUser: boolean): boolean {
  if (!isSameUser) return false;
  if (AUTHORITATIVE_EVENTS.has(event)) return false;
  return true;
}

export function shouldCommitGate(g: CommitGuard): boolean {
  // sign-out / 사용자 전환: 대상이 바뀌었으면 옛 결과 폐기.
  if (g.currentUserId !== g.capturedUserId) return false;
  // 더 새 fail-closed 검사가 시작됐으면 누구든(나 포함) 밀린다.
  if (g.lastFailClosedSeq > g.mySeq) return false;
  // silent 는 진행 중 authoritative 가 있으면 커밋/로딩해제 금지 — 권위 검사가 raise 한 loading
  // 창을 먼저 끝난 silent(특히 keep)가 닫아 stale admin 을 재노출하지 못하게 한다(Codex #15).
  // (자신이 fail-closed 면 카운트에 자기 포함이라 이 분기를 안 탄다.)
  if (g.silent && g.authoritativeInFlight > 0) return false;
  // silent 는 더 새 검사(silent/fail-closed 불문)에 밀린다. fail-closed 는 여기서 안 밀림.
  if (g.silent && g.mySeq !== g.seqRef) return false;
  return true;
}

// 권한 게이트 전체 재평가(role → bypass → MFA/AAL → factor)를 부수효과 없이 수행한다.
// 원본 useAdmin.check() 의 setter 호출 순서를 그대로 모사하되, setState 대신 next 스냅샷을
// 누적하고 마지막에 하나의 decision 으로 반환한다. 호출부(useAdmin)는 시퀀스 가드를 통과한
// 뒤에만 commit 스냅샷을 적용하므로, 늦게 끝난 stale 결과가 최신 상태를 덮어쓰지 못한다(#2).
// dep 호출이 reject/throw 해도 {ok:false} fallback 으로 정규화 → evaluate 가 throw 를 밖으로
// 흘리지 않아 호출부(check)의 loading 이 영구 wedge 되지 않는다(Codex #12).
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function evaluateAdminGate(
  deps: AdminGateDeps,
  { silent, prev }: AdminGateOptions,
): Promise<AdminGateDecision> {
  const next: AdminGateSnapshot = { ...prev };

  // 1. Role — 조회 실패는 silent 면 keep, 아니면 fail-closed 로 전 권한 해제.
  const role = await safe(deps.fetchRole, { ok: false, role: null });
  if (!role.ok) {
    if (silent) return { kind: "keep" };
    next.isAdmin = false;
    next.mfaBypass = null;
    next.isSuperAdmin = false;
    next.mfaRequired = false;
    next.mfaEnrolled = false;
    return { kind: "commit", snapshot: next };
  }
  const isUserAdmin = role.role === "admin";
  next.isAdmin = isUserAdmin;

  // 2. Bypass state — admin 일 때만 조회. EF 실패는 silent 면 keep,
  //    아니면(만료/토글/초기) 우회 비활성으로 간주하고 MFA 경로로 진행(fail-closed).
  let bypassActive = false;
  if (isUserAdmin) {
    const bypass = await safe(deps.fetchBypass, { ok: false, isSuperAdmin: false, state: null });
    if (!bypass.ok) {
      if (silent) return { kind: "keep" };
      // fail-closed: 우회를 못 믿으므로 옛 active bypass 를 비활성화한다. 그대로 두면 만료 타이머가
      // is_active=true+과거 expires_at 을 보고 setTimeout(0) 무한 재검증 루프를 돌고, stale 슈퍼/배너가
      // 살아남는다(Codex #11). 비운 뒤 MFA 재게이트로 진행. 회복 시 다음 성공 조회가 복원한다.
      next.isSuperAdmin = false;
      next.mfaBypass = null;
    } else {
      next.isSuperAdmin = bypass.isSuperAdmin;
      next.mfaBypass = bypass.state;
      bypassActive = Boolean(bypass.state?.is_active);
    }
  } else {
    next.mfaBypass = null;
    next.isSuperAdmin = false;
  }

  // 3. Bypass 활성 → MFA 스킵.
  if (bypassActive) {
    next.mfaRequired = false;
    next.mfaEnrolled = true;
    next.aal = "aal1";
    return { kind: "commit", snapshot: next };
  }

  // 4. AAL — 실패는 silent 면 keep, 아니면 fail-closed 로 admin 에 MFA 요구.
  const aal = await safe(deps.fetchAal, { ok: false, currentLevel: null, nextLevel: null });
  if (!aal.ok) {
    if (silent) return { kind: "keep" };
    next.mfaRequired = isUserAdmin;
    next.mfaEnrolled = false;
    return { kind: "commit", snapshot: next };
  }
  next.aal = aal.currentLevel || "aal1";
  next.mfaRequired = isUserAdmin && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2";

  // 5. TOTP factor — admin 만 확인. 실패는 silent 면 keep, 아니면 fail-closed.
  if (isUserAdmin) {
    const factors = await safe(deps.fetchFactors, { ok: false, hasVerifiedTotpFactor: false });
    if (!factors.ok) {
      if (silent) return { kind: "keep" };
      next.mfaEnrolled = false;
      next.mfaRequired = true;
      return { kind: "commit", snapshot: next };
    }
    next.mfaEnrolled = factors.hasVerifiedTotpFactor;
  } else {
    next.mfaEnrolled = false;
  }

  return { kind: "commit", snapshot: next };
}
