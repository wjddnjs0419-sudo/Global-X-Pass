-- 게시판 라벨을 네비게이션/페이지에 노출되던 기존 문구로 정렬한다.
-- 네비·페이지 제목이 이제 post_categories.label 을 단일 진실원천으로 읽으므로,
-- 시드 라벨과 화면 문구의 드리프트를 제거해 전환을 무손실로 만든다.
-- (잠금 카테고리 expenses 는 트리거 보호 대상이라 건드리지 않는다.)

UPDATE public.post_categories SET label = '행사'           WHERE id = 'events'         AND label <> '행사';
UPDATE public.post_categories SET label = '행사 아카이브'  WHERE id = 'events-archive' AND label <> '행사 아카이브';
UPDATE public.post_categories SET label = '자주 묻는 질문' WHERE id = 'faq'            AND label <> '자주 묻는 질문';

-- description 은 이제 게시판 페이지 부제(subtitle)로 노출되므로,
-- 기존 하드코딩 부제 문구를 그대로 옮겨 전환을 무손실로 만든다.
-- (잠금 카테고리 expenses 는 트리거 보호 대상이라 건드리지 않는다.)

UPDATE public.post_categories SET description = 'NCF의 새로운 소식과 안내 사항을 확인하세요.'
  WHERE id = 'notice'         AND description IS DISTINCT FROM 'NCF의 새로운 소식과 안내 사항을 확인하세요.';
UPDATE public.post_categories SET description = '뉴스레터와 언론보도를 한곳에서 확인하세요.'
  WHERE id = 'news'           AND description IS DISTINCT FROM '뉴스레터와 언론보도를 한곳에서 확인하세요.';
UPDATE public.post_categories SET description = 'NCF에서 진행하는 다양한 이벤트와 프로그램을 확인해 보세요.'
  WHERE id = 'events'         AND description IS DISTINCT FROM 'NCF에서 진행하는 다양한 이벤트와 프로그램을 확인해 보세요.';
UPDATE public.post_categories SET description = 'NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요.'
  WHERE id = 'events-archive' AND description IS DISTINCT FROM 'NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요.';
UPDATE public.post_categories SET description = '궁금하신 점을 카테고리별로 빠르게 찾아보세요.'
  WHERE id = 'faq'            AND description IS DISTINCT FROM '궁금하신 점을 카테고리별로 빠르게 찾아보세요.';
UPDATE public.post_categories SET description = 'NCF와 Around X가 제공하는 필수 서식과 가이드 자료를 다운로드하세요.'
  WHERE id = 'resources'      AND description IS DISTINCT FROM 'NCF와 Around X가 제공하는 필수 서식과 가이드 자료를 다운로드하세요.';
UPDATE public.post_categories SET description = 'Global X Pass가 직접 제작한 콘텐츠를 만나보세요.'
  WHERE id = 'media'          AND description IS DISTINCT FROM 'Global X Pass가 직접 제작한 콘텐츠를 만나보세요.';
UPDATE public.post_categories SET description = 'NCF와 Around X가 전하는 다양한 인사이트와 비즈니스 이야기를 만나보세요.'
  WHERE id = 'blog'           AND description IS DISTINCT FROM 'NCF와 Around X가 전하는 다양한 인사이트와 비즈니스 이야기를 만나보세요.';
