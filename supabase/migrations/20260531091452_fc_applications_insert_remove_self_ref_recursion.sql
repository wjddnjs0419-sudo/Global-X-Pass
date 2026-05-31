-- Fix: infinite recursion in founders_club_applications INSERT policy.
-- The previous WITH CHECK embedded a self-referential count subquery
-- (SELECT count(*) FROM founders_club_applications ...) which re-triggered
-- RLS on the same table during INSERT evaluation -> infinite recursion.
-- Capacity is already enforced by the BEFORE INSERT trigger check_fcfs_capacity
-- (SECURITY DEFINER), so the count check in RLS is redundant. Remove it.
drop policy if exists fc_applications_insert_own on public.founders_club_applications;
create policy fc_applications_insert_own on public.founders_club_applications
  for insert to authenticated
  with check (
    (select public.is_admin())
    or (
      (select auth.uid()) = user_id
      and status = 'accepted'
      and exists (
        select 1 from public.founders_club_sessions s
        where s.id = session_id and s.status = 'recruiting'
      )
    )
  );
