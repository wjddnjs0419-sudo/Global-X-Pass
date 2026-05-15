import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTotpFactorSnapshot } from "../utils/mfa";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState<string>("aal1");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);

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

      // 2. MFA check
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setAal(aalData?.currentLevel || "aal1");

      // If admin and nextLevel is aal2, it means MFA is enrolled but not verified in this session
      if (isUserAdmin && aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
        setMfaRequired(true);
      } else {
        setMfaRequired(false);
      }

      // 3. Check if a verified TOTP factor exists
      if (isUserAdmin) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        setMfaEnrolled(getTotpFactorSnapshot(factors).hasVerifiedTotpFactor);
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
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, loading, aal, mfaRequired, mfaEnrolled };
}
