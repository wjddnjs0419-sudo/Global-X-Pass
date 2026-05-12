ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_crop jsonb;
