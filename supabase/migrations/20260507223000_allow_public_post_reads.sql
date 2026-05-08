-- Allow anonymous visitors to read public board posts.
-- `expenses` remains protected by the existing authenticated role-based policy.

DROP POLICY IF EXISTS "posts_select_public_non_expenses" ON public.posts;

CREATE POLICY "posts_select_public_non_expenses"
  ON public.posts
  FOR SELECT
  TO anon
  USING (category <> 'expenses');
