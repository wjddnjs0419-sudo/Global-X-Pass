CREATE OR REPLACE FUNCTION public.get_event_archive_participant_stats()
RETURNS TABLE(unique_participant_count integer, participation_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(DISTINCT ea.user_id)::integer AS unique_participant_count,
    count(*)::integer AS participation_count
  FROM public.event_applications ea
  JOIN public.posts p ON p.id = ea.post_id
  WHERE ea.status = 'accepted'
    AND p.category = 'events';
$$;

GRANT EXECUTE ON FUNCTION public.get_event_archive_participant_stats() TO anon, authenticated;
