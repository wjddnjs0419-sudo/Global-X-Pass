-- 참여 기업 소속 프로그램명
-- 프론트엔드(types.ts·AdminCompaniesManagement·CompaniesPage)는 program_name 을
-- 사용하지만 대응 컬럼이 누락되어 insert/update 시 PostgREST schema cache 오류 발생.
-- 기본값/필터 칩 기준은 '창구 프로그램'.
--
-- ⚠️ 인코딩 주의: Windows 환경의 psql 클라이언트 인코딩(CP949 등)과 충돌하면
-- 한글 문자열 리터럴('창구 프로그램')이 적용 시 깨진다(U+FFFD 대체문자).
-- 따라서 한글 기본값/백필 값은 PostgreSQL 유니코드 이스케이프 U&'\XXXX'(순수 ASCII)로 기입한다.
-- U&'\CC3D\AD6C\0020\D504\B85C\ADF8\B7A8' = '창구 프로그램'.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS program_name text NOT NULL
    DEFAULT U&'\CC3D\AD6C\0020\D504\B85C\ADF8\B7A8';

-- 이미 컬럼이 존재(깨진 기본값)했던 경우를 대비해 기본값을 다시 못박는다.
ALTER TABLE public.companies
  ALTER COLUMN program_name SET DEFAULT U&'\CC3D\AD6C\0020\D504\B85C\ADF8\B7A8';

COMMENT ON COLUMN public.companies.program_name
  IS '참여 기업이 속한 프로그램명. 공개 기업 목록의 프로그램 필터 칩과 상세 모달에 표시된다.';

-- 백필: NULL/빈값 또는 깨진(U+FFFD 포함) 기존 행을 기본값으로 교정.
UPDATE public.companies
SET program_name = U&'\CC3D\AD6C\0020\D504\B85C\ADF8\B7A8',
    updated_at = now()
WHERE program_name IS NULL
   OR program_name = ''
   OR position(U&'\FFFD' IN program_name) > 0;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;
