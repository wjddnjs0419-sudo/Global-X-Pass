-- 블로그 게시판 완전 삭제: 게시판 자체와 데모 게시물/태그 프리셋 제거.
-- 네이버 블로그 크롤링 자동화(sync-naver-blog 등)는 news/events-archive 대상이라 별개이며 건드리지 않는다.

-- 1. 블로그 게시물 삭제 (전부 비공개 AI 데모 글). posts.category 는 post_categories FK 가 아니므로 명시 삭제.
delete from public.posts where category = 'blog';

-- 2. 블로그 게시판 태그 프리셋 삭제
delete from public.board_tag_presets where board_id = 'blog';

-- 3. 블로그 게시판(post_categories) 행 삭제
delete from public.post_categories where id = 'blog';
