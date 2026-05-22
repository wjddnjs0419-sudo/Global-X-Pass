-- Program applications now use a first-come, auto-confirmed model.
-- Status values remain for compatibility, but new user submissions are confirmed immediately.

ALTER TABLE public.event_applications
  ALTER COLUMN status SET DEFAULT 'accepted';

ALTER TABLE public.founders_club_applications
  ALTER COLUMN status SET DEFAULT 'accepted';

ALTER TABLE public.consulting_reservations
  ALTER COLUMN status SET DEFAULT 'confirmed';

-- The previous approval-flow leftovers were intentionally cleared from operations.
-- Keep confirmed participation/reservation rows, and remove only non-confirmed residue.
DELETE FROM public.event_applications
WHERE status IN ('pending', 'rejected', 'cancelled');

DELETE FROM public.founders_club_applications
WHERE status IN ('pending', 'rejected', 'cancelled');

WITH removed_consulting_reservations AS (
  DELETE FROM public.consulting_reservations
  WHERE status IN ('pending', 'rejected', 'cancelled')
  RETURNING slot_id
)
UPDATE public.consulting_slots s
SET status = 'available'
WHERE s.id IN (SELECT slot_id FROM removed_consulting_reservations)
  AND s.status = 'booked'
  AND NOT EXISTS (
    SELECT 1
    FROM public.consulting_reservations r
    WHERE r.slot_id = s.id
      AND r.status = 'confirmed'
  );

DROP POLICY IF EXISTS "event_applications_insert_own" ON public.event_applications;
CREATE POLICY "event_applications_insert_own"
  ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'accepted'
    AND public.can_apply_to_event(post_id)
  );

DROP POLICY IF EXISTS "consulting_reservations_insert_own" ON public.consulting_reservations;
CREATE POLICY "consulting_reservations_insert_own"
  ON public.consulting_reservations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'confirmed'
    AND EXISTS (
      SELECT 1
      FROM public.consulting_slots s
      WHERE s.id = slot_id
        AND s.status = 'available'
        AND s.slot_date >= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS "fc_applications_insert_own" ON public.founders_club_applications;
CREATE POLICY "fc_applications_insert_own"
  ON public.founders_club_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'accepted'
    AND EXISTS (
      SELECT 1
      FROM public.founders_club_sessions s
      WHERE s.id = session_id
        AND s.status = 'recruiting'
        AND (
          SELECT count(*)::integer
          FROM public.founders_club_applications fca
          WHERE fca.session_id = s.id
            AND fca.status = 'accepted'
        ) < s.max_participants
    )
  );

COMMENT ON TABLE public.consulting_reservations
  IS 'Auto-confirmed consulting reservations. slot_id active UNIQUE prevents double booking. status remains pending/confirmed/rejected/cancelled for compatibility.';

COMMENT ON TABLE public.founders_club_applications
  IS 'Auto-confirmed Founder''s Club applications. Capacity is enforced by accepted count and session status.';

COMMENT ON TABLE public.event_applications
  IS 'Auto-confirmed event applications linked to posts.category = events. Capacity is enforced by accepted count.';
