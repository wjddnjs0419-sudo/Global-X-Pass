DELETE FROM public.founders_club_applications fca
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = fca.user_id
)
OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = fca.user_id
);

DELETE FROM public.event_applications ea
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = ea.user_id
)
OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = ea.user_id
);

DELETE FROM public.consulting_reservations cr
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = cr.user_id
)
OR NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = cr.user_id
);

DELETE FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_auth_users_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_auth_users_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.founders_club_applications
  DROP CONSTRAINT IF EXISTS founders_club_applications_user_id_auth_fkey;

ALTER TABLE public.founders_club_applications
  ADD CONSTRAINT founders_club_applications_user_id_auth_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.event_applications
  DROP CONSTRAINT IF EXISTS event_applications_user_id_auth_fkey;

ALTER TABLE public.event_applications
  ADD CONSTRAINT event_applications_user_id_auth_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.consulting_reservations
  DROP CONSTRAINT IF EXISTS consulting_reservations_user_id_auth_fkey;

ALTER TABLE public.consulting_reservations
  ADD CONSTRAINT consulting_reservations_user_id_auth_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

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
  JOIN public.profiles p ON p.id = fca.user_id
  JOIN auth.users u ON u.id = fca.user_id
  GROUP BY fca.session_id;
$$;

REVOKE ALL ON FUNCTION public.get_founders_club_application_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_founders_club_application_counts() TO authenticated, service_role;
