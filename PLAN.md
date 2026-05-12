# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.
## Pending Approval
- [Done] 회원가입 남용 방지 — IP 기반 rate limit (2026-05-14) — `signup_rate_limit` 테이블 + `check_and_record_signup_attempt` 원자 RPC 함수 추가. unknown IP 건너뜀, 전체 만료 기록 정리 + `attempted_at` 인덱스. `page_views` anon INSERT 권한 추가. `npm run validate` ✅, `supabase db push` ✅, `supabase functions deploy signup-profile` ✅
- [Done] Grep-first 원칙 기반 컨텍스트 로딩 최적화 (2026-05-14) — `GEMINI.md`, `CLAUDE.md`, `docs/AGENT_RULES.md`에 검색 우선 탐색 규칙을 추가하여 토큰 효율성 극대화. `npm run validate` ✅
- [Done] AI 에이전트 문서 구조 최적화 (2026-05-14) — `GEMINI.md`와 `CLAUDE.md`를 경량 라우터로 전환하고 상세 규칙은 `docs/AGENT_RULES.md`, 안티패턴은 `docs/AGENT_ANTI_PATTERNS.md`로 분리하여 토큰 비용 최적화. `npm run validate` ✅
- [Done] Supabase Data API 보안 정책 변경(GRANT 필수화) 선제 대응 (2026-05-14) — 2026년 10월 30일 강제 적용되는 '기본 권한 차단'에 대비해 모든 기존 테이블에 명시적 `GRANT`를 부여하는 마이그레이션(`20260514100000`) 추가. `GEMINI.md`에 향후 마이그레이션 시 `GRANT` 구문 필수 포함 규칙 명시. `npm run validate` ✅
...
- [Done] Vite dev-server 보안 취약점 긴급 패치 (2026-05-12) — `vite@6.3.5` → `vite@6.4.2` exact pin으로 업데이트해 dev-server 파일 읽기 high advisory를 제거. `npm audit` high/critical 0건 확인, 남은 Quill moderate advisory는 장기 백로그로 분리. `npm run validate` ✅
- [Done] 프론트엔드 번들 비밀키 노출 방지 정리 (2026-05-12) — `dist/` 빌드 산출물을 Git 추적에서 제거하고, 빌드 결과물에 `service_role` JWT 또는 서버 전용 secret 값이 포함됐는지 검사하는 `check:frontend-secrets` 스크립트를 추가. `npm run validate`에 연결 완료. `npm run validate` ✅
- [Done] 게시판 접근 정책 재정렬 (2026-05-12) — DB 마이그레이션(20260512150000) 정책에 맞춰 상세 페이지(notice, events, blog, resources, media) 비로그인 차단 및 목록(notice, events) 공개용 RPC 연동 완료. Consulting/FoundersClub 등 AuthRoute 보호 페이지 내 중복 로그인 알럿 제거 및 프론트엔드 가드 동기화. `npm run validate` ✅
- [Done] 미디어 상세/행사 신청 페이지 공통 `목록으로 돌아가기` 토큰 정렬 (2026-05-12) — `contentListStyles.ts`에 공통 back-link 스타일 헬퍼를 추가하고, `PostDetailPage` 미디어 상세 back-link의 NCF 직접색을 제거해 공통 블루 토큰으로 통일. `EventApplicationPage` 상단에도 같은 스타일의 `← 목록으로 돌아가기` 버튼을 추가해 `/events`로 복귀하도록 정리. `npm run validate` ✅
- [Done] Founder's Club 세션관리 모바일 액션/상태 뱃지 레이아웃 복구 (2026-05-12) — `AdminFoundersClubManagement` 세션 카드를 모바일 우선 세로 레이아웃으로 재배치하고, 상태 배지/상태 select/`신청 보기`/`삭제` 버튼에 `nowrap`·`flex-wrap`·`min-width`를 보강해 좁은 폭에서도 세로 찌그러짐 없이 유지되도록 수정. `npm run validate` ✅, 인앱 브라우저 모바일 뷰포트 확인 시도했으나 관리자 세션 부재로 코드 경로 검증만 수행
- [Done] EventApplicationPage 잔여 숫자 스타일 토큰화 (2026-05-12) — `theme.css`에 EventApplicationPage 전용 의미 토큰을 추가하고, 입력 필드/카드/패널/라벨/버튼/textarea 높이, 페이지 max-width/bottom spacing, 아이콘 크기 등 시각 숫자 값을 `var(--...)` 참조로 교체. 날짜 계산, 배열 길이, 정원 계산 같은 도메인 숫자는 유지. `npm run validate` ✅
- [Done] 컨설팅/Founder's Club 일시·장소 입력 패턴 공용화 및 공개 표시 통일 (2026-05-12) — `scheduleFields.ts` 공용 유틸로 날짜/시간 select option과 `장소명 | 주소` 저장·`장소명, 주소` 표시 규칙을 통합. `AdminConsultingManagement` 슬롯 추가, `AdminFoundersClubManagement` 세션 추가에 장소 이름/주소 분리 입력 적용. `ConsultingBookingModal`, `FoundersClubPage`, `MyPage`, 행사 목록/홈 섹션 표시를 공용 formatter로 통일. `npm run validate` ✅
- [Done] EventApplicationPage 관심 분야 선택지 카드형 편집 및 한글 IME 입력 안정화 (2026-05-12) — 관심 분야 선택지를 textarea 대신 얇은 행 카드로 분리해 `수정/완료`, 삭제(X), 추가(+) 버튼으로 관리. 추가 질문이 없을 때는 얇은 기본 박스 중앙에 + 버튼만 표시. 입력값 기반 React key로 한글 조합이 끊기던 문제를 안정 key로 수정. `npm run validate` ✅
- [Done] EventApplicationPage 장소 분리 입력 및 편집 화면 섹션 개요 추가 (2026-05-12) — 장소 입력을 `장소 이름`/`주소`로 분리하고 기존 `posts.location` TEXT에는 `장소이름 | 주소` 형식으로 저장. 공개 화면은 참가자 관점에서 `장소이름, 주소`로 표시. 관리자 편집 화면에 `행사 기본 정보`, `신청서 안내`, `1. 참가자 기본 정보`, `2. 관심 분야 & 참여 목적`, `3. 사전 질문`, `4. 추가 질문`, `5. 개인정보 동의 및 완료 안내` 섹션 개요 추가. `npm run validate` ✅, 로컬 브라우저 일반 사용자 smoke check ✅
- [Done] EventApplicationPage 관리자 편집 진입 흐름 및 시간 입력 개선 (2026-05-12) — 관리자는 기본 진입 시 신청 페이지를 보고, 질문지 박스 우측 상단 `편집` 버튼을 누를 때만 관리자 편집 박스로 전환. 저장/취소 후 다시 신청 페이지로 복귀. 일시는 `연/월/일 + 시/분(10분 단위)` select로 분리 입력하고 `YYYY.MM.DD (요일) HH:mm` 형식으로 저장. `npm run validate` ✅, 로컬 브라우저 일반 사용자 smoke check ✅
## Long-Term Backlog
- [Backlog] Quill XSS advisory 대응 — `react-quill`이 끌고 오는 `quill@1.3.7` XSS advisory를 제거하기 위해 Quill 2 호환 에디터 전환 또는 유지보수되는 리치 텍스트 에디터 대체안을 설계한다. 관리자 에디터 UX와 기존 HTML 저장/렌더링 호환성 검증 필요.
- [Backlog] Storage 업로드 권한 축소 — `images` public bucket의 인증 사용자 전체 업로드 정책을 관리자 전용 또는 사용자별 경로/소유권/쿼터 기반 정책으로 재설계한다. 기존 public asset 경로와 관리자 이미지 업로드 플로우 회귀 검증 필요.
- [Backlog] CSV 일괄 등록 임시 비밀번호 노출 축소 — `bulk-register-users`가 반환하고 UI가 CSV로 내려받는 평문 임시 비밀번호 흐름을 1회용 설정 링크 또는 첫 로그인 강제 변경 방식으로 대체한다.
- [Backlog] 회원가입 남용 방지 — `signup-profile` Edge Function에 CAPTCHA/Turnstile 또는 IP·이메일 기반 rate limit을 추가하고, 이메일 존재 여부 추정이 어려운 응답 문구로 정리한다.
- [Backlog] 헤더/어드민/FlowMap 민감 영역 토큰화 — `HeaderSection.tsx`, `AdminPage.tsx`, `FlowMapPage.tsx`, `AdminFlowMap.tsx`, `AdminSidebar.tsx`, 일부 어드민 패널의 레거시 색상 값을 정리한다. 어드민 라이트 모드 스크롤 전 상단 헤더/backdrop 색상 회귀 위험이 있으므로 별도 승인과 브라우저 시각 QA 후 진행한다.
- [Backlog] 공용 컴포넌트/토큰 설계 정비 — `ui/button.tsx`, `ui/badge.tsx`, `PageShell.tsx`, `sectionTheme.ts`의 raw 색상과 섹션 테마 값을 공용 토큰 체계로 정리한다. 영향 범위가 넓으므로 페이지 단위 토큰화가 안정화된 뒤 별도 차수로 진행한다.
