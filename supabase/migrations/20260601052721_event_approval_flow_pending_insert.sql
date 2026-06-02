-- 승인제 전환: 신청은 pending으로 들어오고, 정원 점유는 accepted만 카운트(pending 무제한).
alter policy event_applications_insert_own on public.event_applications
  with check (
    (select is_admin()) or (
      (select auth.uid()) = user_id
      and status = 'pending'
      and can_apply_to_event(post_id)
    )
  );

create or replace function public.can_apply_to_event(target_post_id uuid)
  returns boolean
  language sql
  security definer
  set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.posts p
    where p.id = target_post_id
      and p.category = 'events'
      and p.event_status = any (array['접수중', '마감임박'])
      and (p.application_deadline is null or p.application_deadline > now())
      and (
        p.capacity is null
        or (
          select count(*)::integer
          from public.event_applications ea
          where ea.post_id = p.id
            and ea.status = 'accepted'
        ) < p.capacity
      )
  );
$function$;
