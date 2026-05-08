-- board_tag_presets: 게시판별 태그 프리셋을 Supabase에 저장
-- localStorage(ncf_hidden_tags__*, ncf_custom_tags__*)를 대체

CREATE TABLE public.board_tag_presets (
  board_id   TEXT    NOT NULL,
  tag        TEXT    NOT NULL,
  is_hidden  BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT     NOT NULL DEFAULT 999,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, tag)
);

ALTER TABLE public.board_tag_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board tag presets are publicly readable"
  ON public.board_tag_presets FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert board tag presets"
  ON public.board_tag_presets FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update board tag presets"
  ON public.board_tag_presets FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete board tag presets"
  ON public.board_tag_presets FOR DELETE
  USING (public.is_admin());

-- 기본 태그 시드 (sort_order로 원래 순서 보존, is_default = true)
INSERT INTO public.board_tag_presets (board_id, tag, is_hidden, is_default, sort_order) VALUES
  ('events', '네트워킹',  false, true,  1),
  ('events', '피칭',     false, true,  2),
  ('events', '투자',     false, true,  3),
  ('events', '글로벌',   false, true,  4),
  ('events', '교육',     false, true,  5),
  ('events', 'IR',       false, true,  6),
  ('events', '멘토링',   false, true,  7),
  ('events', '데모데이', false, true,  8),
  ('events', '창업',     false, true,  9),
  ('events', '커뮤니티', false, true, 10),
  ('events', '기술',     false, true, 11),
  ('events', '정책',     false, true, 12),

  ('events-archive', '네트워킹',  false, true,  1),
  ('events-archive', '피칭',     false, true,  2),
  ('events-archive', '투자',     false, true,  3),
  ('events-archive', '글로벌',   false, true,  4),
  ('events-archive', '교육',     false, true,  5),
  ('events-archive', 'IR',       false, true,  6),
  ('events-archive', '멘토링',   false, true,  7),
  ('events-archive', '데모데이', false, true,  8),
  ('events-archive', '창업',     false, true,  9),
  ('events-archive', '커뮤니티', false, true, 10),
  ('events-archive', '기술',     false, true, 11),
  ('events-archive', '정책',     false, true, 12),

  ('blog', '창업',     false, true, 1),
  ('blog', '기술',     false, true, 2),
  ('blog', '글로벌',   false, true, 3),
  ('blog', '커뮤니티', false, true, 4),
  ('blog', '투자',     false, true, 5),
  ('blog', '멘토링',   false, true, 6),

  ('notice', '공지', false, true, 1),
  ('notice', '긴급', false, true, 2),
  ('notice', '일정', false, true, 3),
  ('notice', '안내', false, true, 4),
  ('notice', '중요', false, true, 5),

  ('news', '뉴스', false, true, 1),
  ('news', '정책', false, true, 2),
  ('news', '기술', false, true, 3),
  ('news', '글로벌', false, true, 4),
  ('news', '투자',   false, true, 5);
