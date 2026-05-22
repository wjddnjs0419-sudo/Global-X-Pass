-- Users may hard-delete their own terminal-state application records (cancelled / rejected).
-- Active records (pending, confirmed, accepted) are intentionally excluded.

DROP POLICY IF EXISTS "consulting_reservations_delete_own_terminal" ON public.consulting_reservations;
CREATE POLICY "consulting_reservations_delete_own_terminal"
  ON public.consulting_reservations FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status IN ('cancelled', 'rejected'));

DROP POLICY IF EXISTS "fc_applications_delete_own_terminal" ON public.founders_club_applications;
CREATE POLICY "fc_applications_delete_own_terminal"
  ON public.founders_club_applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status IN ('cancelled', 'rejected'));

DROP POLICY IF EXISTS "event_applications_delete_own_terminal" ON public.event_applications;
CREATE POLICY "event_applications_delete_own_terminal"
  ON public.event_applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status IN ('cancelled', 'rejected'));
