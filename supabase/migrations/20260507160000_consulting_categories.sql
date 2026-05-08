-- consulting_categories 테이블 생성
CREATE TABLE IF NOT EXISTS public.consulting_categories (
  id            text        PRIMARY KEY,
  label         text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_categories ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용 (공개 페이지용)
CREATE POLICY "consulting_categories_public_read"
  ON public.consulting_categories FOR SELECT
  USING (true);

-- 관리자만 추가/수정/삭제
CREATE POLICY "consulting_categories_admin_insert"
  ON public.consulting_categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "consulting_categories_admin_update"
  ON public.consulting_categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "consulting_categories_admin_delete"
  ON public.consulting_categories FOR DELETE
  USING (public.is_admin());

-- 기본 카테고리 데이터
INSERT INTO public.consulting_categories (id, label, display_order) VALUES
  ('legal',  '법률/특허/회계', 0),
  ('global', '글로벌 진출',    1),
  ('tech',   '기술 자문',      2)
ON CONFLICT (id) DO NOTHING;
