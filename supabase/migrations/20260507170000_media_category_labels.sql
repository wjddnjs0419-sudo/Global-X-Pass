-- media_category_labels: 미디어 카테고리 표시명을 Supabase에 저장
-- localStorage(gxp_media_category_labels)를 대체

CREATE TABLE public.media_category_labels (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  CONSTRAINT valid_media_category_id CHECK (
    id IN ('report', 'issue-paper', 'trend-report', 'podcast', 'video', 'interview')
  )
);

ALTER TABLE public.media_category_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media category labels are publicly readable"
  ON public.media_category_labels FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify media category labels"
  ON public.media_category_labels FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 기본 표시명 시드
INSERT INTO public.media_category_labels (id, label) VALUES
  ('report',       '리포트'),
  ('issue-paper',  '이슈페이퍼'),
  ('trend-report', '트렌드리포트'),
  ('podcast',      '팟캐스트'),
  ('video',        '영상'),
  ('interview',    '인터뷰');
