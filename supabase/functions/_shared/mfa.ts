import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type AuthAdminMfaClient = SupabaseClient["auth"]["admin"] & {
  mfa: {
    listFactors(params: { userId: string }): Promise<{
      data: { factors: Array<{ id: string; factor_type: string }> } | null;
      error: Error | null;
    }>;
    deleteFactor(params: { userId: string; id: string }): Promise<{
      data: { id: string } | null;
      error: Error | null;
    }>;
  };
};

export async function clearUserMfaFactors(
  adminClient: SupabaseClient,
  userId: string,
) {
  const authAdmin = adminClient.auth.admin as AuthAdminMfaClient;
  const { data, error } = await authAdmin.mfa.listFactors({ userId });
  if (error) {
    throw error;
  }

  const factors = data?.factors ?? [];
  for (const factor of factors) {
    const { error: deleteError } = await authAdmin.mfa.deleteFactor({ userId, id: factor.id });
    if (deleteError) {
      throw deleteError;
    }
  }

  return factors.length;
}
