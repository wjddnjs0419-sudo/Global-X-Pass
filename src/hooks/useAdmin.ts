import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTotpFactorSnapshot } from "../utils/mfa";
import {
  evaluateAdminGate,
  shouldCommitGate,
  shouldCheckSilently,
  shouldRaiseLoading,
  shouldRefocusAuthoritative,
  withRetry,
  type AdminGateSnapshot,
} from "./adminGate";

// 게이트 조회 1회 일시 실패가 즉시 deny/redirect 로 굳지 않게 하는 재시도 횟수(Codex #9).
const GATE_FETCH_ATTEMPTS = 3;
// 재시도 사이 대기(ms) — MFA/AAL 전파 창 확보(같은 tick 즉시 재시도 무력화 방지, Codex #12).
const GATE_RETRY_DELAY_MS = 200;

export type AdminMfaBypassState = {
  enabled: boolean;
  is_active: boolean;
  expires_at: string | null;
  enabled_at: string | null;
  enabled_by: string | null;
  enabled_by_email: string | null;
  reason: string | null;
  updated_at: string | null;
};

export type UseAdminResult = {
  isAdmin: boolean;
  loading: boolean;
  aal: string;
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  isSuperAdmin: boolean;
  mfaBypass: AdminMfaBypassState | null;
  refreshBypassState: () => Promise<void>;
};

const EMPTY_SNAPSHOT: AdminGateSnapshot = {
  isAdmin: false,
  isSuperAdmin: false,
  mfaBypass: null,
  mfaRequired: false,
  mfaEnrolled: false,
  aal: "aal1",
};

export function useAdmin(): UseAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState<string>("aal1");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mfaBypass, setMfaBypass] = useState<AdminMfaBypassState | null>(null);

  // 현재 인가된 사용자 id. 토큰 자동갱신/탭 포커스 복귀로 onAuthStateChange가 재발화해도
  // 동일 사용자면 게이트 전체(EF+MFA)를 다시 돌리지 않기 위한 식별자.
  const currentUserIdRef = useRef<string | null>(null);

  // check() 동시 실행(탭복귀·토큰이벤트·만료타이머) 경쟁 방지: 최신 호출 결과만 상태에 반영해
  // 늦게 끝난 stale async 가 옛 admin 상태를 되살리지 못하게 한다.
  const checkSeqRef = useRef(0);

  // 마지막으로 시작된 fail-closed(silent=false) 검사의 seq. fail-closed(만료/토글)가 나중
  // silent 검사에 밀려 드롭되면 옛 admin 이 생존하므로, fail-closed 는 "더 새 fail-closed"
  // 에게만 양보하도록 shouldCommitGate 가 이 값을 사용한다(Codex #6-2 high).
  const lastFailClosedSeqRef = useRef(0);

  // 아직 끝나지 않은 fail-closed 검사 수. fail-closed 가 loading 을 올린 채 in-flight 인 동안
  // 먼저 끝난 silent(특히 keep)가 loading 을 닫아 stale admin 을 재노출하지 못하게 막는다(Codex #15).
  const authoritativeInFlightRef = useRef(0);

  // 직전에 커밋된 게이트 스냅샷. evaluateAdminGate 의 fail-closed 분기가 원본 코드처럼
  // "건드리지 않는 필드"(예: aal)를 이어가도록 prev 로 넘긴다. 시퀀스 가드 통과 후에만 갱신.
  const snapshotRef = useRef<AdminGateSnapshot>(EMPTY_SNAPSHOT);

  const applySnapshot = useCallback((s: AdminGateSnapshot) => {
    setIsAdmin(s.isAdmin);
    setIsSuperAdmin(s.isSuperAdmin);
    setMfaBypass(s.mfaBypass);
    setMfaRequired(s.mfaRequired);
    setMfaEnrolled(s.mfaEnrolled);
    setAal(s.aal);
    snapshotRef.current = s;
  }, []);

  // 권한 게이트 전체 재평가: role → bypass → MFA/AAL → factor. 외부 I/O 는 evaluateAdminGate
  // 에 주입하고, 평가는 부수효과 없이 decision 으로만 받는다. 시퀀스 가드를 통과한 경우에만
  // commit 스냅샷을 적용해, 늦게 끝난 stale 결과가 최신 bypass/role 상태를 덮어쓰지 못하게 한다(#2).
  // silent=false(초기/만료/토글): 조회 실패 시 fail-closed 로 권한 박탈·MFA 재게이트.
  // silent=true(탭복귀·토큰갱신·동일사용자): 일시 실패는 keep 으로 기존 상태 유지(깜빡임 방지).
  const check = useCallback(
    async (userId: string, silent = false) => {
      const mySeq = ++checkSeqRef.current;
      // fail-closed 검사는 시작 시점에 우선권 마킹(이전 in-flight silent 를 무효화) + in-flight 카운트.
      if (!silent) {
        lastFailClosedSeqRef.current = mySeq;
        authoritativeInFlightRef.current += 1;
      }
      // fail-closed 는 즉시 로딩 게이트 → AdminRoute 가 비동기 창(retry 포함) 동안 옛 스냅샷으로
      // 라우팅하지 않게 한다(신규 사용자·OTP 검증·만료/토글 모두 커버). silent 는 깜빡임 방지로 미변경.
      if (shouldRaiseLoading(silent)) setLoading(true);

      try {
      // 각 inner 는 throw 도 {ok:false} 로 잡아 withRetry 가 재시도하게 한다(전파 race 회복).
      // evaluate 의 safe() 와 이중 방어 — 어떤 경우에도 throw 가 밖으로 새지 않는다(Codex #12).
      let decision: Awaited<ReturnType<typeof evaluateAdminGate>>;
      try {
        decision = await evaluateAdminGate(
          {
            fetchRole: () =>
              withRetry(async () => {
                try {
                  const { data, error } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", userId)
                    .single();
                  if (error) return { ok: false, role: null };
                  return { ok: true, role: (data?.role as string | null) ?? null };
                } catch {
                  return { ok: false, role: null };
                }
              }, GATE_FETCH_ATTEMPTS, GATE_RETRY_DELAY_MS),
            fetchBypass: () =>
              withRetry(async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("get-admin-mfa-bypass-state");
                  if (error || !data) return { ok: false, isSuperAdmin: false, state: null };
                  return {
                    ok: true,
                    isSuperAdmin: Boolean(data.is_super_admin),
                    state: (data.bypass ?? null) as AdminMfaBypassState | null,
                  };
                } catch {
                  return { ok: false, isSuperAdmin: false, state: null };
                }
              }, GATE_FETCH_ATTEMPTS, GATE_RETRY_DELAY_MS),
            fetchAal: () =>
              withRetry(async () => {
                try {
                  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                  if (error || !data) return { ok: false, currentLevel: null, nextLevel: null };
                  return { ok: true, currentLevel: data.currentLevel ?? null, nextLevel: data.nextLevel ?? null };
                } catch {
                  return { ok: false, currentLevel: null, nextLevel: null };
                }
              }, GATE_FETCH_ATTEMPTS, GATE_RETRY_DELAY_MS),
            fetchFactors: () =>
              withRetry(async () => {
                try {
                  const { data, error } = await supabase.auth.mfa.listFactors();
                  if (error || !data) return { ok: false, hasVerifiedTotpFactor: false };
                  return { ok: true, hasVerifiedTotpFactor: getTotpFactorSnapshot(data).hasVerifiedTotpFactor };
                } catch {
                  return { ok: false, hasVerifiedTotpFactor: false };
                }
              }, GATE_FETCH_ATTEMPTS, GATE_RETRY_DELAY_MS),
          },
          { silent, prev: snapshotRef.current },
        );
      } catch {
        // evaluate 는 throw-safe 지만 만일을 대비: silent 는 keep, fail-closed 는 deny 로 정규화.
        decision = silent
          ? { kind: "keep" }
          : {
              kind: "commit",
              snapshot: {
                ...snapshotRef.current,
                isAdmin: false,
                isSuperAdmin: false,
                mfaBypass: null,
                mfaRequired: false,
                mfaEnrolled: false,
              },
            };
      }

      // 커밋 가드: 시퀀스 + fail-closed 우선권 + 사용자 식별 + in-flight authoritative 를 한 번에 판정.
      const commitOk = shouldCommitGate({
        mySeq,
        silent,
        capturedUserId: userId,
        currentUserId: currentUserIdRef.current,
        seqRef: checkSeqRef.current,
        lastFailClosedSeq: lastFailClosedSeqRef.current,
        authoritativeInFlight: authoritativeInFlightRef.current,
      });
      if (!commitOk) return;
      if (decision.kind === "commit") applySnapshot(decision.snapshot);
      setLoading(false);
      } finally {
        // 모든 종료 경로에서 in-flight 카운트 해제(early-return·throw 포함).
        if (!silent) authoritativeInFlightRef.current -= 1;
      }
    },
    [applySnapshot],
  );

  // bypass 토글 변경/만료 후 재평가. 만료·토글은 fail-closed(silent=false): EF/조회 일시 실패가
  // 겹쳐도 admin 이 열린 채 남지 않고 role+bypass+MFA 전체를 다시 평가해 재게이트한다(#1 high).
  const refreshBypassState = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (userId) await check(userId, false);
  }, [check]);

  useEffect(() => {
    // 권한 원본(profiles.role, admin_mfa_bypass)은 auth 이벤트를 발생시키지 않으므로,
    // 동일 사용자라도 재검증을 충분히 자주 돌려 강등/우회해제가 반영되게 한다.
    // silent 여부는 (이벤트, 동일사용자)로 결정: 신규 사용자·권한 상승 이벤트(MFA_CHALLENGE_VERIFIED)
    // 는 fail-closed(authoritative), routine(SIGNED_IN refocus·TOKEN_REFRESHED·탭복귀)은 silent
    // (작성 중 폼/화면 끊김·깜빡임 방지). 로딩 게이트는 check 내부에서 silent 여부로 일괄 처리.
    const ensureChecked = (userId: string, event: string) => {
      const isSameUser = currentUserIdRef.current === userId;
      currentUserIdRef.current = userId;
      check(userId, shouldCheckSilently(event, isSameUser));
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) ensureChecked(session.user.id, "INITIAL_SESSION");
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // 초기 세션은 위 getSession()에서 이미 처리 → 중복 호출(특히 EF) 방지
      if (event === "INITIAL_SESSION") return;
      if (session?.user) {
        // 권한 상승 이벤트(SIGNED_IN·MFA_CHALLENGE_VERIFIED)는 authoritative 재평가,
        // 그 외(USER_UPDATED·TOKEN_REFRESHED 등)는 silent. shouldCheckSilently 가 분기.
        ensureChecked(session.user.id, event);
      } else {
        // sign-out: 진행 중이던 check() 결과가 로그아웃 후 옛 admin 을 재커밋하지 못하게
        // seq 를 올려 무효화하고 대상 사용자를 비운다(shouldCommitGate 식별 게이트와 이중 차단).
        checkSeqRef.current += 1;
        lastFailClosedSeqRef.current = checkSeqRef.current;
        currentUserIdRef.current = null;
        applySnapshot(EMPTY_SNAPSHOT);
        setLoading(false);
      }
    });

    // 탭 복귀 시 재검증 → 백그라운드 동안 강등/우회해제된 경우 즉시 admin UI 퇴출.
    // bypass 에 기대는 세션이면(is_active) 만료/조기해제/클럭 스큐 무관하게 fail-closed 로 즉시
    // 재게이트(보안 민감 시한제 우회, Codex #14). 일반 관리자는 silent 유지(깜빡임 방지).
    const onVisible = () => {
      if (document.visibilityState === "visible" && currentUserIdRef.current) {
        const authoritative = shouldRefocusAuthoritative(snapshotRef.current.mfaBypass);
        check(currentUserIdRef.current, !authoritative);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check, applySnapshot]);

  // MFA 우회는 시한제 → 만료 시각에 맞춰 전체 재평가(refreshBypassState → check: role+bypass+MFA).
  // 만료 순간 강등까지 함께 반영되도록 부분 갱신이 아니라 전체 경로를 다시 탄다.
  useEffect(() => {
    if (!mfaBypass?.is_active || !mfaBypass.expires_at) return;
    const ms = new Date(mfaBypass.expires_at).getTime() - Date.now();
    // 이미 만료(ms<=0)면 즉시, 그 외엔 만료 시각에. setTimeout 상한(~24.8일) 초과면 보류.
    if (ms > 2_147_483_647) return;
    const timer = setTimeout(() => { void refreshBypassState(); }, Math.max(0, ms));
    return () => clearTimeout(timer);
  }, [mfaBypass?.is_active, mfaBypass?.expires_at, refreshBypassState]);

  return {
    isAdmin,
    loading,
    aal,
    mfaRequired,
    mfaEnrolled,
    isSuperAdmin,
    mfaBypass,
    refreshBypassState,
  };
}
