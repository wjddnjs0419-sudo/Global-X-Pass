-- 회원가입 승인제: profiles.status 추가
-- pending(가입 대기) → approved(승인) / rejected(반려)
-- 자가가입(signup-profile)은 pending + auth ban 으로 로그인 차단,
-- 어드민 CSV 등록(bulk-register-users)·승인(update-user-status)은 approved.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 컬럼 추가 시점에 이미 존재하던 회원(기존 어드민·사용자)은 전원 승인 처리.
-- 신규 row 는 트리거가 status 를 지정하지 않으므로 기본값 'pending' 으로 생성된다.
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN public.profiles.status IS
  '회원 승인 상태. pending=가입 대기(auth ban으로 로그인 차단), approved=승인, rejected=반려. 기본 pending.';
