-- Supabase cached egress(무료 한도 5.5GB) 초과 대응.
-- images/documents 버킷에 INSERT 되는 객체의 cacheControl 을 1년으로 강제한다.
-- 목적: 프론트 배포(Netlify)가 막혀 있어도 신규 업로드가 서버단에서 장기 캐시되도록 보장.
--       (런타임 업로드 파일명은 타임스탬프+랜덤이라 내용 불변 → 장기 캐시 안전)
-- 정책: INSERT 만 대상. upsert(=UPDATE) 로 덮어쓰는 시드/임포트 스크립트
--       (scripts/seed-media-demo.mjs, scripts/import-blog-posts.mjs)는 의도적으로 제외.

create or replace function public.set_storage_long_cache_control()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.bucket_id in ('images', 'documents') then
    new.metadata := jsonb_set(
      coalesce(new.metadata, '{}'::jsonb),
      '{cacheControl}',
      '"max-age=31536000"'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_storage_long_cache_control on storage.objects;
create trigger trg_storage_long_cache_control
  before insert on storage.objects
  for each row
  execute function public.set_storage_long_cache_control();
