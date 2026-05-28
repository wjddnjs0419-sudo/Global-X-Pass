import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTotpFactorSnapshot } from "../utils/mfa";

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

export function useAdmin(): UseAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState<string>("aal1");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mfaBypass, setMfaBypass] = useState<AdminMfaBypassState | null>(null);

  const fetchBypassState = async (): Promise<AdminMfaBypassState | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("get-admin-mfa-bypass-state");
      if (error || !data) return null;
      setIsSuperAdmin(Boolean(data.is_super_admin));
      const state = (data.bypass ?? null) as AdminMfaBypassState | null;
      setMfaBypass(state);
      return state;
    } catch {
      return null;
    }
  };

  // bypass 토글 변경/만료 후 인가 상태가 stale로 남지 않도록 AAL/factor도 함께 재계산
  // MFA API 호출 실패 시 admin은 fail-close (mfaRequired=true, mfaEnrolled=false)
  const refreshBypassState = async () => {
    const state = await fetchBypassState();
    const bypassActive = Boolean(state?.is_active);

    if (bypassActive) {
      setMfaRequired(false);
      setMfaEnrolled(true);
      return;
    }

    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError || !aalData) {
      if (isAdmin) {
        setMfaRequired(true);
        setMfaEnrolled(false);
      }
      return;
    }
    setAal(aalData.currentLevel || "aal1");

    if (isAdmin && aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
      setMfaRequired(true);
    } else {
      setMfaRequired(false);
    }

    if (isAdmin) {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError || !factors) {
        setMfaEnrolled(false);
        setMfaRequired(true);
        return;
      }
      setMfaEnrolled(getTotpFactorSnapshot(factors).hasVerifiedTotpFactor);
    }
  };

  useEffect(() => {
    const check = async (userId: string) => {
      // 1. Role check
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      const isUserAdmin = profile?.role === "admin";
      setIsAdmin(isUserAdmin);

      // 2. Bypass state — 어드민이면 먼저 조회
      let bypassActive = false;
      if (isUserAdmin) {
        const state = await fetchBypassState();
        bypassActive = Boolean(state?.is_active);
      } else {
        setMfaBypass(null);
        setIsSuperAdmin(false);
      }

      // 3. MFA check — bypass 활성이면 스킵, 비활성에서 에러나면 fail-close
      if (bypassActive) {
        setMfaRequired(false);
        setMfaEnrolled(true);
        setAal("aal1");
        setLoading(false);
        return;
      }

      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError || !aalData) {
        if (isUserAdmin) {
          // admin인데 MFA API 실패 → 가드 닫고 재로그인 유도
          setMfaRequired(true);
          setMfaEnrolled(false);
        } else {
          setMfaRequired(false);
          setMfaEnrolled(false);
        }
        setLoading(false);
        return;
      }
      setAal(aalData.currentLevel || "aal1");

      if (isUserAdmin && aalData.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
        setMfaRequired(true);
      } else {
        setMfaRequired(false);
      }

      if (isUserAdmin) {
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError || !factors) {
          setMfaEnrolled(false);
          setMfaRequired(true);
          setLoading(false);
          return;
        }
        setMfaEnrolled(getTotpFactorSnapshot(factors).hasVerifiedTotpFactor);
      } else {
        setMfaEnrolled(false);
      }

      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) check(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        check(session.user.id);
      } else {
        setIsAdmin(false);
        setAal("aal1");
        setMfaRequired(false);
        setMfaEnrolled(false);
        setIsSuperAdmin(false);
        setMfaBypass(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
