-- company-news(기업 뉴스) 페이지를 게시판 설정(post_categories)에 편입.
-- 목적: 어드민이 '게시판 관리'에서 기업 뉴스의 라벨/설명을 편집하면
--       nav 메뉴(category 연동)와 CompanyNewsPage 제목/부제에 즉시 반영되도록.
-- 데이터 출처는 여전히 articles 테이블(네이버 기사 파이프라인)이며, 이 행은
-- 표시용 라벨/설명 메타데이터일 뿐 게시물(posts)을 담지 않는다(kind='page').
INSERT INTO public.post_categories (id, label, description, is_public, is_locked, sort_order, access_level, kind)
VALUES
  ('company-news', '기업 뉴스', '참여기업의 최신 기사들을 확인해보세요.', true, false, 130, 'public', 'page')
ON CONFLICT (id) DO NOTHING;
