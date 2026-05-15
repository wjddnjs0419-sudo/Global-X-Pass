CREATE OR REPLACE FUNCTION public.get_founders_club_application_counts()
RETURNS TABLE(
  session_id uuid,
  total_count integer,
  active_count integer,
  pending_count integer,
  accepted_count integer,
  rejected_count integer,
  cancelled_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fca.session_id,
    count(*)::integer AS total_count,
    count(*) FILTER (WHERE fca.status IN ('pending', 'accepted'))::integer AS active_count,
    count(*) FILTER (WHERE fca.status = 'pending')::integer AS pending_count,
    count(*) FILTER (WHERE fca.status = 'accepted')::integer AS accepted_count,
    count(*) FILTER (WHERE fca.status = 'rejected')::integer AS rejected_count,
    count(*) FILTER (WHERE fca.status = 'cancelled')::integer AS cancelled_count
  FROM public.founders_club_applications fca
  GROUP BY fca.session_id;
$$;

REVOKE ALL ON FUNCTION public.get_founders_club_application_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_founders_club_application_counts() TO authenticated, service_role;
