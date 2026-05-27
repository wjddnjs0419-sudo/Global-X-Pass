-- Seed the seven YouTube videos requested for the event archive.
-- The external URL uses the same GXP_MEDIA_META format as the Insights video flow.

WITH seed(title, content, image_url, source_url, created_at) AS (
  VALUES
  ('[넥스트챌린지] Singapore (싱가포르) _ 2023 에셀론 아시아 써밋 (Echelon Asia Summit) ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRHlHRWJLZjFGQXo4JTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=yGEbKf1FAz8" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/yGEbKf1FAz8/hqdefault.jpg', 'https://www.youtube.com/watch?v=yGEbKf1FAz8', '2026-05-26 06:59:00+00'::timestamptz),
  ('[넥스트챌린지] Malaysia (말레이시아)_  2023 말레이시아 이머젼 위크 (Malaysia Immersion Week) ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRGg0a2lnVHFDQXZnJTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=h4kigTqCAvg" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/h4kigTqCAvg/hqdefault.jpg', 'https://www.youtube.com/watch?v=h4kigTqCAvg', '2026-05-26 06:58:00+00'::timestamptz),
  ('[넥스트챌린지] Vietnam (베트남)_ 2023 NEXT - V  WEEK ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRHhySVUyRW92SmRvJTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=xrIU2EovJdo" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/xrIU2EovJdo/hqdefault.jpg', 'https://www.youtube.com/watch?v=xrIU2EovJdo', '2026-05-26 06:57:00+00'::timestamptz),
  ('[넥스트챌린지] 2023 플레이그라운드 1차 ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRExNR1NnSHdxdjRnJTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=LMGSgHwqv4g" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/LMGSgHwqv4g/hqdefault.jpg', 'https://www.youtube.com/watch?v=LMGSgHwqv4g', '2026-05-26 06:56:00+00'::timestamptz),
  ('[넥스트챌린지] 2023 플레이그라운드 2차 ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRDl1dTNZeUxmMkFJJTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=9uu3YyLf2AI" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/9uu3YyLf2AI/hqdefault.jpg', 'https://www.youtube.com/watch?v=9uu3YyLf2AI', '2026-05-26 06:55:00+00'::timestamptz),
  ('[넥스트챌린지] 2023 플레이그라운드 3차 ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRGlrMVlHNVhnR0xVJTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=ik1YG5XgGLU" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/ik1YG5XgGLU/hqdefault.jpg', 'https://www.youtube.com/watch?v=ik1YG5XgGLU', '2026-05-26 06:54:00+00'::timestamptz),
  ('[넥스트챌린지] 2023 플레이그라운드 4차 ( with Google Play )', '<!--GXP_MEDIA_META:JTdCJTIyZXh0ZXJuYWxVcmwlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy55b3V0dWJlLmNvbSUyRndhdGNoJTNGdiUzRE1fRmtmX0lNNlA0JTIyJTdE--><p>넥스트챌린지 행사 아카이브 영상입니다.</p><p><a href="https://www.youtube.com/watch?v=M_Fkf_IM6P4" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기</a></p>', 'https://img.youtube.com/vi/M_Fkf_IM6P4/hqdefault.jpg', 'https://www.youtube.com/watch?v=M_Fkf_IM6P4', '2026-05-26 06:53:00+00'::timestamptz)
)
INSERT INTO public.posts (
  title,
  content,
  category,
  image_url,
  tags,
  is_public,
  created_at,
  updated_at
)
SELECT
  seed.title,
  seed.content,
  'events-archive',
  seed.image_url,
  '영상',
  true,
  seed.created_at,
  seed.created_at
FROM seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.posts p
  WHERE p.category = 'events-archive'
    AND p.content LIKE '%' || seed.source_url || '%'
);
