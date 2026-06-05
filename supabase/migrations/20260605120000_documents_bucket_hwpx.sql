-- documents 버킷 allowed_mime_types에 HWP/HWPX 변종 추가.
-- HWP는 브라우저 file.type이 빈 문자열인 경우가 많아 업로드 시 정규 MIME을 명시하며,
-- HWPX(한컴 최신 zip 기반 포맷)도 지원하기 위해 버킷 허용 MIME을 확장한다.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/x-hwp',
    'application/haansoft-hwp',
    'application/vnd.hancom.hwp',
    'application/hwp+zip',
    'application/vnd.hancom.hwpx'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
