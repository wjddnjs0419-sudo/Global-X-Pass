-- ════════════════════════════════════════════════════════════════════════
--  Global X Pass — 팀 발표용 데모 데이터
--  Supabase SQL Editor에 그대로 붙여넣기 후 실행하세요
--  실행 순서: 위에서 아래로 (순서 중요)
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 1. 사업비 자료실 (RBAC)
--   - 멤버 그룹 2개 생성
--   - 현재 DB의 첫 번째 유저(어드민)를 2기 그룹에 추가
--   - 4개의 사업비 자료 게시물 등록
-- ────────────────────────────────────────────────────────────────────────

-- 1-1. 멤버 그룹 생성
INSERT INTO member_groups (id, name, description)
VALUES
  ('aaaaaaaa-1111-1111-1111-000000000001',
   'Global X Pass 2기',
   '2024년도 Google Play 창구 프로그램 2기 참여 기업 그룹'),
  ('aaaaaaaa-1111-1111-1111-000000000002',
   'Global X Pass 3기',
   '2025년도 Google Play 창구 프로그램 3기 참여 기업 그룹')
ON CONFLICT (id) DO NOTHING;


-- 1-2. 현재 DB의 첫 번째 유저(어드민)를 2기 그룹에 추가
--      → 이 유저로 로그인하면 사업비 자료실이 보입니다
INSERT INTO group_members (group_id, user_id, added_at)
SELECT
  'aaaaaaaa-1111-1111-1111-000000000001',
  id,
  NOW()
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (group_id, user_id) DO NOTHING;


-- 1-3. 사업비 자료실 게시물 (2기 그룹 전용)
INSERT INTO posts (id, title, content, category, image_url, views, allowed_group_id, created_at)
VALUES
  (gen_random_uuid(),
   '[2기] 2025년도 사업화 지원금 정산 가이드라인',
   '<h2>사업화 지원금 정산 안내</h2>
<p>2025년도 Google Play 창구 프로그램 사업화 지원금 정산 절차 및 증빙 서류 제출 방법을 안내드립니다.</p>
<h3>정산 일정</h3>
<ul>
  <li>1차 중간 정산: 2025년 9월 30일</li>
  <li>2차 최종 정산: 2025년 12월 31일</li>
</ul>
<h3>제출 서류</h3>
<ul>
  <li>세금계산서 / 영수증 원본</li>
  <li>사업비 집행내역서 (양식 첨부)</li>
  <li>법인 통장 사본</li>
</ul>
<p>문의: gxpass-ops@google.com</p>',
   'expenses', NULL, 24,
   'aaaaaaaa-1111-1111-1111-000000000001',
   NOW() - INTERVAL '3 days'),

  (gen_random_uuid(),
   '[2기] Google Play UA 광고비 집행 기준 및 증빙 방법',
   '<h2>UA 광고비 집행 기준</h2>
<p>Google Play 콘솔 UA(User Acquisition) 광고비 집행 시 아래 기준을 반드시 준수해 주세요.</p>
<h3>인정 채널</h3>
<ul>
  <li>Google UAC (Universal App Campaign)</li>
  <li>Meta Ads (Facebook / Instagram)</li>
  <li>TikTok for Business</li>
  <li>Apple Search Ads (iOS 병행 출시 시)</li>
</ul>
<h3>증빙 방법</h3>
<p>광고 대시보드 지출 스크린샷 + 세금계산서(또는 신용카드 매출전표) 첨부 필수.</p>',
   'expenses', NULL, 17,
   'aaaaaaaa-1111-1111-1111-000000000001',
   NOW() - INTERVAL '8 days'),

  (gen_random_uuid(),
   '[공통] 지식재산권(IP) 출원 비용 처리 Q&A',
   '<h2>IP 비용 처리 FAQ</h2>
<h3>Q1. 상표 출원 비용도 지원금으로 처리 가능한가요?</h3>
<p>A. 가능합니다. 특허청 접수증 + 출원 대행사 세금계산서를 반드시 첨부해야 합니다.</p>
<h3>Q2. 해외 특허 출원은 어떻게 처리하나요?</h3>
<p>A. PCT 국제출원 한정으로 인정됩니다. 현지 대리인 영수증(번역본 포함) 제출.</p>
<h3>Q3. 디자인 등록 비용도 포함되나요?</h3>
<p>A. 네, 소프트웨어 UI/UX 디자인 등록 출원은 인정됩니다.</p>',
   'expenses', NULL, 11,
   'aaaaaaaa-1111-1111-1111-000000000001',
   NOW() - INTERVAL '15 days'),

  (gen_random_uuid(),
   '[2기] 현지화(Localization) 외주 용역 계약서 작성 가이드',
   '<h2>현지화 외주 계약서 가이드</h2>
<p>외주 현지화 용역 계약 시 아래 항목이 계약서에 명시되어야 사업비 심사가 원활합니다.</p>
<h3>필수 기재 항목</h3>
<ul>
  <li>언어쌍 명시 (예: Korean → Vietnamese, English → Indonesian)</li>
  <li>단어/글자 수 기준 단가</li>
  <li>납기일 및 수정 횟수</li>
  <li>계약 기간 및 총 용역 금액</li>
</ul>
<p>템플릿 파일은 Google Drive 공유 폴더에 업로드 예정입니다.</p>',
   'expenses', NULL, 6,
   'aaaaaaaa-1111-1111-1111-000000000001',
   NOW() - INTERVAL '22 days');


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 2. 1:1 전문가 컨설팅
--   - 법률/특허/회계, 글로벌 진출, 기술 자문 각 3명
--   - 5월 예약 슬롯 20+ 개 등록
-- ────────────────────────────────────────────────────────────────────────

-- 2-1. 전문가 등록: 법률/특허/회계 카테고리
INSERT INTO consultants (id, name, category, bio, expertise, image_url, is_active, display_order)
VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001',
   '김지원', 'legal',
   'IP 전문 변호사 출신. Google Play 앱·게임 분야 상표·특허 출원 200건+ 처리 경험. 동남아 현지 IP 전략 수립 전문.',
   ARRAY['앱 상표 출원', '특허 포트폴리오', '해외 IP 전략', '저작권 분쟁'],
   NULL, true, 1),

  ('bbbbbbbb-1111-1111-1111-000000000002',
   '박성호', 'legal',
   '전 Big4 회계법인 파트너. 스타트업 세무·회계 전문. 정부 지원금 정산 및 R&D 세액공제 컨설팅 경력 12년.',
   ARRAY['세무 전략', 'R&D 세액공제', '지원금 정산', '재무제표 검토'],
   NULL, true, 2),

  ('bbbbbbbb-1111-1111-1111-000000000003',
   '이수연', 'legal',
   '기업법무 전문 변호사. SaaS 서비스약관, 개인정보처리방침, B2B 계약서 검토 및 글로벌 법인 설립 자문.',
   ARRAY['서비스 약관', '개인정보보호법', 'B2B 계약', '법인 설립'],
   NULL, true, 3)
ON CONFLICT (id) DO NOTHING;


-- 2-2. 전문가 등록: 글로벌 진출 카테고리
INSERT INTO consultants (id, name, category, bio, expertise, image_url, is_active, display_order)
VALUES
  ('bbbbbbbb-1111-1111-1111-000000000004',
   '최준혁', 'global',
   'Google Play 파트너십 전 매니저. 동남아(베트남·인도네시아·태국) 앱 마켓 진출 전략 수립. 현지 퍼블리셔 네트워크 보유.',
   ARRAY['동남아 시장 진출', 'ASO 최적화', '현지 퍼블리셔 연계', 'UA 전략'],
   NULL, true, 1),

  ('bbbbbbbb-1111-1111-1111-000000000005',
   '정유나', 'global',
   '전 카카오게임즈 글로벌 사업팀. 일본·북미 게임 런칭 전문. 스토어 최적화(ASO)와 크리에이티브 현지화 전략 다수 경험.',
   ARRAY['일본 시장', '북미 론칭', '게임 현지화', '스토어 최적화'],
   NULL, true, 2),

  ('bbbbbbbb-1111-1111-1111-000000000006',
   '한동훈', 'global',
   '글로벌 VC 심사역 출신. 해외 IR 덱 작성, 투자자 미팅 준비, 크로스보더 파트너십 딜 클로징 경험.',
   ARRAY['해외 IR', '투자 유치 전략', '파트너십 딜', '유럽 시장'],
   NULL, true, 3)
ON CONFLICT (id) DO NOTHING;


-- 2-3. 전문가 등록: 기술 자문 카테고리
INSERT INTO consultants (id, name, category, bio, expertise, image_url, is_active, display_order)
VALUES
  ('bbbbbbbb-1111-1111-1111-000000000007',
   '오민준', 'tech',
   'Google Android 엔지니어 출신. Play 정책 준수, 앱 품질 심사 통과 전략, Crash·ANR 개선 기술 지원 전문.',
   ARRAY['Android 최적화', 'Play 정책 대응', 'Crash/ANR 개선', '앱 품질 향상'],
   NULL, true, 1),

  ('bbbbbbbb-1111-1111-1111-000000000008',
   '서채원', 'tech',
   'ML/AI 엔지니어. 모바일 앱 내 추천 알고리즘, 개인화, On-device AI 적용 전문. Google ML Kit 기술 자문 가능.',
   ARRAY['ML/AI 적용', '추천 알고리즘', 'On-device AI', 'Google ML Kit'],
   NULL, true, 2),

  ('bbbbbbbb-1111-1111-1111-000000000009',
   '임재혁', 'tech',
   '백엔드·클라우드 아키텍처 전문. GCP 기반 스케일러블 인프라 설계, Firebase 최적화, API 퍼포먼스 자문.',
   ARRAY['GCP 아키텍처', 'Firebase 최적화', 'API 설계', '서버 확장성'],
   NULL, true, 3)
ON CONFLICT (id) DO NOTHING;


-- 2-4. 5월 예약 슬롯 등록 (오늘: 2026-04-27 기준 / 미래 날짜만 표시됨)
INSERT INTO consulting_slots (id, consultant_id, slot_date, slot_time, duration_minutes, status)
VALUES
  -- 김지원 (법률)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000001', '2026-05-08', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000001', '2026-05-08', '14:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000001', '2026-05-15', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000001', '2026-05-15', '14:00:00', 60, 'booked'),

  -- 박성호 (회계)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000002', '2026-05-09', '09:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000002', '2026-05-09', '11:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000002', '2026-05-13', '15:00:00', 60, 'available'),

  -- 이수연 (법무)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000003', '2026-05-12', '13:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000003', '2026-05-12', '16:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000003', '2026-05-19', '10:00:00', 60, 'available'),

  -- 최준혁 (글로벌 - 동남아)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000004', '2026-05-07', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000004', '2026-05-07', '13:00:00', 60, 'booked'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000004', '2026-05-14', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000004', '2026-05-14', '14:00:00', 60, 'available'),

  -- 정유나 (글로벌 - 일본/북미)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000005', '2026-05-11', '11:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000005', '2026-05-11', '15:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000005', '2026-05-18', '13:00:00', 60, 'available'),

  -- 한동훈 (글로벌 - IR/투자)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000006', '2026-05-10', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000006', '2026-05-10', '14:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000006', '2026-05-17', '11:00:00', 60, 'available'),

  -- 오민준 (기술 - Android)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000007', '2026-05-08', '11:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000007', '2026-05-08', '16:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000007', '2026-05-15', '11:00:00', 60, 'available'),

  -- 서채원 (기술 - AI/ML)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000008', '2026-05-13', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000008', '2026-05-13', '14:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000008', '2026-05-20', '14:00:00', 60, 'available'),

  -- 임재혁 (기술 - 클라우드)
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000009', '2026-05-16', '10:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000009', '2026-05-16', '14:00:00', 60, 'available'),
  (gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000009', '2026-05-21', '10:00:00', 60, 'available');


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 3. Founder's Club 세션
--   - 4개 세션 (모집중 3개, 완료 1개)
--   - 신청 기록 삽입 → 스팟 게이지 시각화
-- ────────────────────────────────────────────────────────────────────────

-- 3-1. 세션 등록
INSERT INTO founders_club_sessions (id, theme, description, max_participants, session_date, session_time, status)
VALUES
  ('cccccccc-1111-1111-1111-000000000001',
   'SaaS MRR Growth Strategy',
   'SaaS 제품의 MRR(월간 반복 매출) 성장 전략을 함께 논의합니다. 가격 정책, 업셀링, 고객 성공 사례를 중심으로 소그룹 워크샵 진행. 현재 MRR $1K~$10K 구간 스타트업 우선.',
   6, '2026-05-17', '14:00:00', 'recruiting'),

  ('cccccccc-1111-1111-1111-000000000002',
   'Vietnam & SEA 현지 마케팅 실전',
   '동남아(베트남·인도네시아) 앱 마케팅 실전 전략 공유. 현지 인플루언서 채널, UA 캠페인 최적화, 커뮤니티 마케팅 성공/실패 사례를 허심탄회하게 나눕니다.',
   6, '2026-05-24', '15:00:00', 'recruiting'),

  ('cccccccc-1111-1111-1111-000000000003',
   'AI 기반 개인화 UX — 구현 사례 공유',
   'On-device ML을 활용한 개인화 추천, 행동 기반 UI 최적화 구현 사례 공유. 기술 구현 경험이 있는 창업자/CTO 우선 선발.',
   5, '2026-06-07', '14:00:00', 'recruiting'),

  ('cccccccc-1111-1111-1111-000000000004',
   '해외 VC 투자 유치 IR 피칭 실전',
   '북미·유럽 VC 대상 영어 피칭 덱 리뷰 및 Q&A 시뮬레이션. 현직 투자사 심사역 멘토 동석. 실제 투자 유치에 성공한 창업자 패널 포함.',
   6, '2026-04-05', '13:00:00', 'completed')
ON CONFLICT (id) DO NOTHING;


-- 3-2. 신청 기록 삽입 → 스팟 게이지 표시용
--      DB에 실제 존재하는 유저 ID를 사용합니다 (FK 안전)

-- 세션 1 (SaaS): 1st 유저 → accepted (게이지 1/6 채움)
INSERT INTO founders_club_applications (session_id, user_id, message, status, created_at)
SELECT
  'cccccccc-1111-1111-1111-000000000001',
  id,
  '베트남 진출을 준비 중인 B2B SaaS 스타트업입니다. MRR 성장 전략을 공유하고 싶습니다.',
  'accepted',
  NOW() - INTERVAL '3 days'
FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT (session_id, user_id) DO NOTHING;

-- 세션 1 (SaaS): 2nd 유저 → accepted (게이지 2/6 채움, 유저가 1명뿐이면 무시됨)
INSERT INTO founders_club_applications (session_id, user_id, message, status, created_at)
SELECT
  'cccccccc-1111-1111-1111-000000000001',
  id,
  '현재 MRR $3K 구간에서 정체 중입니다. 업셀링 전략을 배우고 싶습니다.',
  'accepted',
  NOW() - INTERVAL '2 days'
FROM auth.users ORDER BY created_at DESC LIMIT 1
ON CONFLICT (session_id, user_id) DO NOTHING;

-- 세션 2 (SEA): 1st 유저 → accepted (게이지 1/6)
INSERT INTO founders_club_applications (session_id, user_id, message, status, created_at)
SELECT
  'cccccccc-1111-1111-1111-000000000002',
  id,
  '인도네시아 게임 시장 진출을 앞두고 현지 마케팅 채널이 궁금합니다.',
  'accepted',
  NOW() - INTERVAL '1 day'
FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT (session_id, user_id) DO NOTHING;

-- 세션 3 (AI UX): 1st 유저 → pending (검토 중 상태 표시)
INSERT INTO founders_club_applications (session_id, user_id, message, status, created_at)
SELECT
  'cccccccc-1111-1111-1111-000000000003',
  id,
  '추천 시스템에 Google ML Kit을 적용 중입니다. 사례를 공유하고 싶습니다.',
  'pending',
  NOW() - INTERVAL '6 hours'
FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT (session_id, user_id) DO NOTHING;

-- 세션 4 (완료된 IR 피칭): 기록용
INSERT INTO founders_club_applications (session_id, user_id, message, status, created_at)
SELECT
  'cccccccc-1111-1111-1111-000000000004',
  id,
  '시드 라운드 IR 준비 중입니다.',
  'accepted',
  NOW() - INTERVAL '25 days'
FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT (session_id, user_id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════
--  실행 완료 후 확인 쿼리
-- ════════════════════════════════════════════════════════════════════════

SELECT 'member_groups' AS table_name, COUNT(*) AS inserted FROM member_groups
UNION ALL
SELECT 'group_members',               COUNT(*) FROM group_members
UNION ALL
SELECT 'expenses posts',              COUNT(*) FROM posts WHERE category = 'expenses'
UNION ALL
SELECT 'consultants',                 COUNT(*) FROM consultants
UNION ALL
SELECT 'consulting_slots (available)',COUNT(*) FROM consulting_slots WHERE status = 'available'
UNION ALL
SELECT 'founders_club_sessions',      COUNT(*) FROM founders_club_sessions
UNION ALL
SELECT 'founders_club_applications',  COUNT(*) FROM founders_club_applications;
