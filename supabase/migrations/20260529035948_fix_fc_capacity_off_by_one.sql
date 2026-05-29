-- Fix off-by-one race in founders_club check_fcfs_capacity.
-- Pre-existing bug since 20260514150000: `active_count > max_count` only fires when
-- the table is already past capacity. Under simultaneous INSERTs, two RLS checks both
-- pass against the pre-A snapshot, then trigger's `>` lets B sneak in as max+1.
-- Tightened to `>=` so the trigger blocks any INSERT that would push the active
-- count past the cap.

CREATE OR REPLACE FUNCTION public.check_fcfs_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
  max_count integer;
  current_status text;
BEGIN
  SELECT max_participants, status
    INTO max_count, current_status
  FROM public.founders_club_sessions
  WHERE id = NEW.session_id
  FOR UPDATE;

  SELECT count(*)::integer INTO active_count
  FROM public.founders_club_applications
  WHERE session_id = NEW.session_id
    AND status IN ('pending', 'accepted')
    AND id <> NEW.id;

  IF NEW.status IN ('pending', 'accepted') AND active_count >= max_count THEN
    RAISE EXCEPTION 'founders club capacity reached';
  END IF;

  UPDATE public.founders_club_sessions
  SET status = CASE
    WHEN active_count + 1 >= max_count THEN 'closed'
    WHEN current_status = 'completed' THEN 'completed'
    WHEN current_status = 'closed' THEN 'recruiting'
    ELSE current_status
  END
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;
