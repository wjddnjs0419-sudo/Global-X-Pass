-- 참여 기업 행사 참여 년도
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS participation_year integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_participation_year_check'
      AND conrelid = 'public.companies'::regclass
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_participation_year_check
        CHECK (
          participation_year IS NULL
          OR (participation_year BETWEEN 2000 AND 2100)
        );
  END IF;
END $$;

COMMENT ON COLUMN public.companies.participation_year
  IS '행사/프로그램 참여 년도. 공개 기업 카드와 상세 모달에 표시된다.';

UPDATE public.companies
SET participation_year = 2026,
    updated_at = now()
WHERE participation_year IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;
