CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pii_pending boolean := lower(COALESCE(new.raw_user_meta_data->>'pii_encryption_pending', 'false')) = 'true';
BEGIN
  INSERT INTO public.profiles (id, email, name, role, phone, company, user_type)
  VALUES (
    new.id,
    CASE
      WHEN pii_pending THEN NULL
      ELSE new.email
    END,
    CASE
      WHEN pii_pending THEN NULL
      ELSE COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
    END,
    'user',
    CASE
      WHEN pii_pending THEN NULL
      ELSE new.raw_user_meta_data->>'phone'
    END,
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'user_type'
  );
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profiles rows after auth signup. When pii_encryption_pending=true, PII columns remain null until signup-profile writes encrypted values.';
