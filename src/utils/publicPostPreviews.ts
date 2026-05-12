import { supabase } from "../lib/supabaseClient";
import type { Post } from "../lib/types";

export async function fetchPublicPostPreviews(category: string | null, limit?: number) {
  const rpcResult = await supabase.rpc("list_public_post_previews", {
    p_category: category,
    p_limit: limit ?? null,
  });

  if (!rpcResult.error) {
    return rpcResult as unknown as { data: Post[] | null; error: Error | null };
  }

  console.warn("list_public_post_previews RPC failed; falling back to posts query:", rpcResult.error);

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (category) {
    query = query.eq("category", category);
  }

  return query as unknown as Promise<{ data: Post[] | null; error: Error | null }>;
}
