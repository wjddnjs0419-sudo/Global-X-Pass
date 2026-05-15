type ListedFactor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_challenged_at?: string;
};

type ListedFactorCollection = {
  all?: ListedFactor[] | null;
} | null | undefined;

type MfaVerificationData = {
  access_token?: string;
  refresh_token?: string;
};

type MfaClient = {
  auth: {
    mfa: {
      challengeAndVerify(params: { factorId: string; code: string }): Promise<{
        data: MfaVerificationData | null;
        error: Error | null;
      }>;
    };
    setSession(params: { access_token: string; refresh_token: string }): Promise<{
      error: Error | null;
    }>;
  };
};

export type TotpFactor = ListedFactor & {
  factor_type: "totp";
};

export function getTotpFactorSnapshot(factors: ListedFactorCollection) {
  const allTotpFactors = (factors?.all ?? []).filter((factor): factor is TotpFactor => factor.factor_type === "totp");
  const verifiedTotpFactor = allTotpFactors.find((factor) => factor.status === "verified") ?? null;
  const pendingTotpFactor = allTotpFactors.find((factor) => factor.status !== "verified") ?? null;

  return {
    allTotpFactors,
    verifiedTotpFactor,
    pendingTotpFactor,
    hasVerifiedTotpFactor: Boolean(verifiedTotpFactor),
    hasPendingTotpFactor: Boolean(pendingTotpFactor),
  };
}

export async function challengeAndPersistTotpVerification(
  client: MfaClient,
  factorId: string,
  code: string,
) {
  const { data, error } = await client.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    return { data: null, error };
  }

  if (data?.access_token && data?.refresh_token) {
    const { error: sessionError } = await client.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError) {
      return { data: null, error: sessionError };
    }
  }

  return { data, error: null };
}
