-- images 버킷 서버 측 제한 설정
-- file_size_limit: 10MB, allowed_mime_types: 주요 이미지 포맷만 허용
-- SVG는 XSS 위험으로 제외

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
