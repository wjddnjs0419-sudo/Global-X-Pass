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
    'application/x-hwp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admin full access for documents bucket" ON storage.objects;
CREATE POLICY "Admin full access for documents bucket"
  ON storage.objects
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ( bucket_id = 'documents' AND public.is_admin() )
  WITH CHECK ( bucket_id = 'documents' AND public.is_admin() );

DROP POLICY IF EXISTS "Public read access for documents bucket" ON storage.objects;
CREATE POLICY "Public read access for documents bucket"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ( bucket_id = 'documents' );