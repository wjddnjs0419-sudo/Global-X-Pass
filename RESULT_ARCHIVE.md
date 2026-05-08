# RESULT: 웹사이트 통합 테스트 및 디버그

## 실행일
2026-05-04

## 검증 요약
- `npm run build` 성공
- `npm run dev -- --host 127.0.0.1` 성공
- 브라우저에서 주요 라우트 순회 확인
- 공개 페이지 및 보호 라우트에서 React Application Error 없음
- 파일 업로드 구현 확인: 이미지 `images` 버킷, 비이미지 `documents` 버킷, `encodeFilename()` 사용
- PII 표시 경로 검색 및 직접 조인 제거

## 확인한 주요 라우트
- `/`
- `/notice`
- `/news`
- `/events`
- `/events/archive`
- `/blog`
- `/resources`
- `/faq`
- `/login`
- `/signup`
- `/mypage`
- `/expenses`
- `/consulting`
- `/founders-club`
- `/admin`
- `/flow-map`

## 수정 사항

### 0-NEW. MyPage 관리자 보안/권한 및 모바일 상위 메뉴 최종 톤 보정
파일: `src/app/pages/MyPage.tsx`, `src/app/components/HeaderSection.tsx`

- 관리자 MyPage의 MFA 카드 배경을 blue/green tint에서 muted panel + neutral border로 낮췄다.
- MFA 활성화/미설정/필수 설정 안내의 아이콘과 텍스트 강도를 낮추고, 위험 액션인 `2단계 인증 해제하기`만 낮은 red tint로 유지했다.
- `관리자 페이지(게시물 등록) 바로가기` 버튼의 짙은 gradient와 그림자를 제거하고 neutral selected button 스타일로 맞췄다.
- 관리자 MyPage 비밀번호 저장 버튼에 남아 있던 blue-green gradient를 단색 primary로 정리했다.
- 모바일 사이드 메뉴 상위 섹션 앞에 추가됐던 accent line을 제거했다.
- 모바일 사이드 메뉴 상위 섹션은 키컬러 텍스트를 유지하되 더 굵게, 하위 메뉴는 한 단계 낮은 neutral text로 조정했다.
- 검증: `npm run build` 성공. 기존 Vite chunk size warning만 유지된다.

### 0-NEW. 헤더/모바일 메뉴/관리자 플로팅 네비 톤다운 4차
파일: `src/app/components/HeaderSection.tsx`, `src/app/components/RootLayout.tsx`

- 데스크톱 헤더 드롭다운의 hover 배경을 mint tint에서 neutral selected 배경으로 낮췄다.
- 드롭다운 패널의 그림자와 border를 현재 muted admin/home 톤에 맞게 완화했다.
- 모바일 사이드 메뉴의 섹션 제목(`Resources`, `Programs`, `News`, `Support`, `Account`)을 강한 mint text에서 muted neutral text + 작은 accent line 구조로 변경했다.
- 모바일 메뉴 항목 hover 배경을 neutral selected tone으로 통일했다.
- 모바일 사이드 패널의 큰 그림자를 줄이고 얇은 border를 추가해 카드 같은 질감으로 정리했다.
- 관리자 하단 floating nav의 active solid blue pill을 neutral selected background + border + textMain 방식으로 변경했다.
- 관리자 floating nav의 emoji를 별도 span으로 분리해 opacity를 낮추고, nav shadow/border 강도를 완화했다.
- 라우팅, 관리자 판별, 언어/테마 토글, idle logout, Header 표시 조건은 변경하지 않았다.
- 검증: `npm run build` 성공. 기존 Vite chunk size warning만 유지된다.

### 0-NEW. 어드민 프로그램/알림 톤다운 3차 통합
파일: `src/app/components/admin/AdminEventManagement.tsx`, `src/app/components/admin/AdminConsultingManagement.tsx`, `src/app/components/admin/AdminFoundersClubManagement.tsx`, `src/app/components/admin/NotificationBell.tsx`

- 행사 관리 서브탭의 solid blue active 상태를 중립 selected 배경과 얇은 border로 변경했다.
- 행사 현황 카드의 승인/잔여석 강조를 green text에서 muted label chip으로 낮췄다.
- 행사 신청 처리 액션은 승인/대기/취소를 중립 pill로, 거절만 낮은 red tint pill로 정리했다.
- 컨설팅 관리의 서브탭, 전문가/슬롯 등록 폼 카드, 사진 선택 버튼, 슬롯 상태, 삭제 버튼, 예약 승인/거절 액션을 1차/2차 admin tone과 맞췄다.
- 컨설팅 사진 올리기 모달의 큰 라운딩/그림자를 줄이고, 내부 안내 박스를 muted panel 스타일로 정리했다.
- Founder's Club 관리의 서브탭, 상태 필터, 세션 선택 pill, 신청 보기/삭제, 승인/거절 액션을 중립 selected + 낮은 destructive tint 패턴으로 정리했다.
- 알림 bell의 floating 버튼을 강한 blue CTA에서 중립 원형 컨트롤로 낮추고, 알림 패널의 라운딩/그림자/worker chip/dot 색상 강도를 완화했다.
- 기능 로직, DB 쓰기, 신청 승인/거절 처리, 이미지 crop/upload, Supabase realtime subscription은 변경하지 않았다.
- 검증: `npm run build` 성공. 기존 Vite chunk size warning만 유지된다.

### 0-NEW. 어드민 폼/회원/모달 톤다운 2차 통합
파일: `src/app/components/admin/AdminPostCreate.tsx`, `src/app/components/admin/AdminUserManagement.tsx`, `src/app/components/admin/AdminPostModal.tsx`, `src/app/components/admin/AdminRoleModal.tsx`, `src/app/components/admin/AdminBulkResultModal.tsx`

- 게시물 작성/수정 폼의 큰 24px 카드, 강한 카테고리 accent 박스, solid 선택 pill을 16px 카드와 muted label/selected 상태 중심으로 낮췄다.
- 미디어 유형, 행사 상세 정보, 첨부파일 관리 영역의 green/blue 강조를 줄이고, 삭제/취소 액션은 낮은 red tint + border로만 구분했다.
- 회원 관리의 role badge, 본인 badge, CSV 일괄 등록 버튼, 회원 카드, 삭제 버튼, pagination active 상태를 `AdminPostManage`와 같은 중립 톤으로 맞췄다.
- 저장/삭제 확인 모달, 관리자 권한 변경 모달, 일괄 등록 결과 모달의 큰 라운딩/그림자/강한 pill 표현을 완화했다.
- 권한 변경 모달의 이모지 중심 강조를 제거하고, 역할 변경 내용을 차분한 정보 박스로 정리했다.
- CSV 결과 모달의 성공/실패 pill과 임시 비밀번호 chip을 muted admin label 스타일로 정리했다.
- 저장/승인 같은 주요 확정 액션의 기본 파란 버튼은 유지하되, 그림자와 과한 라운딩은 제거했다.
- 기능 로직, 업로드, CSV 파싱, 권한 변경 인증, DB/Edge Function 호출은 변경하지 않았다.
- 검증: `npm run build` 성공. 기존 Vite chunk size warning만 유지된다.

### 0. Netlify 배포 도메인 CORS 허용 추가
파일: `supabase/functions/_shared/cors.ts`

- 퍼블리싱된 Netlify 도메인 `https://google-play-changgoo-program.netlify.app`를 Edge Function CORS 허용 목록에 추가했다.
- `decrypt-own-profile`와 다른 인증 기반 Edge Function이 배포 환경에서도 브라우저 호출 차단 없이 동작하도록 맞췄다.
- 기존 `https://globalxpass.com` 및 로컬 Vite 주소 허용은 유지했다.

### 0-1. 서비스 흐름도 보안 보완사항 동기화
파일: `src/app/components/admin/AdminFlowMap.tsx`

- `04 보안 구조`에 관리자 service-role Edge Function 게이트(`requireVerifiedAdmin` + `public.is_admin()` + `aal2`) 카드를 추가했다.
- `04 보안 구조`에 Edge Function CORS 화이트리스트 정책(운영/로컬/Netlify 도메인) 카드를 추가했다.
- 조회수 보호 설명을 `increment_view_count(row_id, visitor_id)` + `post_view_events` 기반 30분 쿨다운 흐름으로 보강했다.
- `06 PII 처리 흐름`의 회원가입 플로우에 `encrypt-profile` 결과 분기(성공 저장 / 실패 경고 및 운영 점검)를 반영했다.

### 0-2. 서비스 흐름도 핵심 기능에 행사 참가 플로우 추가
파일: `src/app/components/admin/AdminFlowMap.tsx`

- `02 핵심 기능 흐름`에 `행사 참가 신청` 카드를 추가했다.
- 흐름도에 `/events/:id/apply` 진입, 신청 폼 제출, 중복 신청 차단, 관리자 승인/거절, 잔여석 자동 계산, MyPage 상태 확인을 반영했다.
- 핵심 기능 카드가 4개가 되면서 가독성을 위해 `02` 섹션 그리드를 2열 레이아웃으로 조정했다.

### 1. 관리자 컨설팅 예약 PII 표시 방식 수정
파일: `src/app/components/admin/AdminConsultingManagement.tsx`

- `consulting_reservations` 조회에서 `profiles(name, email)` 직접 조인을 제거했다.
- 예약 데이터는 `user_id` 기준으로 유지하고, 관리자용 `decrypt-profiles` Edge Function 결과를 매핑해 표시하도록 변경했다.
- 운영 DB에서 `profiles.name/email/phone`이 `enc:v1:` 암호문인 상태로 화면에 노출되는 위험을 줄였다.

### 2. 관리자 Founder’s Club 신청자 PII 표시 방식 수정
파일: `src/app/components/admin/AdminFoundersClubManagement.tsx`

- `founders_club_applications` 조회에서 `profiles(name, email, company)` 직접 조인을 제거했다.
- 신청 데이터와 복호화된 프로필 데이터를 `user_id` 기준으로 매핑하도록 변경했다.

### 3. Founder’s Club 공개 페이지의 관리자용 참여자 표시 수정
파일: `src/app/pages/FoundersClubPage.tsx`

- 관리자에게 수락된 참여자를 보여줄 때 `profiles` 테이블에서 이름/이메일을 직접 조회하지 않도록 변경했다.
- `decrypt-profiles` Edge Function을 호출한 뒤 accepted `user_id` 목록으로 필터링한다.

### 4. 로컬 Edge Function CORS 보강
파일: `supabase/functions/_shared/cors.ts`

- Vite가 안내하는 로컬 주소인 `http://127.0.0.1:5173`, `http://127.0.0.1:5174`를 허용 origin에 추가했다.
- 기존 `http://localhost:5173`, `http://localhost:5174`, `https://globalxpass.com`은 유지했다.

### 5. 프로젝트 문서 갱신
파일: `AGENTS.md`, `GEMINI.md`

- Edge Function CORS 허용 origin 목록에 `127.0.0.1` 로컬 개발 주소를 반영했다.

### 6. 자료실 다운로드 목록 가림 버그 수정
파일: `src/app/pages/ResourcesPage.tsx`

- 다중 첨부파일 다운로드 목록이 열린 자료 카드에만 높은 `z-index`를 적용했다.
- 다운로드 버튼 영역에도 열린 상태에서 안정적인 레이어 값을 적용했다.
- 다운로드 함수, 파일명 처리, Supabase 조회, 상세 페이지 이동 로직은 변경하지 않았다.
- 전역 검색 결과 같은 카드 내부 absolute 드롭다운 패턴은 자료실이 유일했다. Radix dropdown은 Portal 기반이고, FAQ는 아코디언이라 같은 현상 대상이 아니다.

### 7. 비관리자 하단 빈 토글 제거
파일: `src/app/components/RootLayout.tsx`

- 하단 관리자 전용 네비게이션 `<nav>`가 비관리자/로그아웃 상태에서도 빈 껍데기로 렌더링되던 문제를 수정했다.
- `isAdmin`일 때만 하단 관리자 네비게이션 전체가 렌더링되도록 조건부 처리했다.
- 관리자용 탭 목록, 이동 경로, Header/Footer, 인증, 라우팅, idle logout 로직은 변경하지 않았다.

### 8. 게시글 목록 썸네일 크기 고정
파일: `src/app/pages/NoticePage.tsx`, `src/app/pages/NewsPage.tsx`, `src/app/pages/EventsPage.tsx`, `src/app/pages/BlogPage.tsx`

- 공지사항/뉴스 목록에서 이미지 유무와 관계없이 `140x100` 썸네일 컨테이너가 항상 렌더링되도록 수정했다.
- 이미지가 없는 공지사항/뉴스 게시글은 동일 크기의 placeholder 영역을 표시해 텍스트 시작 위치가 흔들리지 않게 했다.
- 행사 목록의 데스크톱 썸네일 높이를 고정해 게시글 내용 길이에 따라 썸네일 세로 크기가 달라지는 현상을 줄였다.
- 블로그 그리드 카드에서 이미지가 없는 게시글도 상단 `160px` 썸네일 영역을 유지하도록 수정했다.
- 업로드, 상세 페이지, 다운로드, Supabase 조회 로직은 변경하지 않았다.

### 9. 컨설팅 전문가 프로필 사진 로컬 업로드
파일: `src/app/components/admin/AdminConsultingManagement.tsx`, `src/app/pages/ConsultingPage.tsx`

- 컨설팅 관리의 전문가 등록 폼에서 `프로필 사진 URL` 직접 입력을 로컬 이미지 업로드 UI로 교체했다.
- 사진 선택 시 `사진 올리기` 모달을 열고 원본 사진과 최종 원형 프로필 미리보기를 함께 표시한다.
- 확대, 가로 위치, 세로 위치 슬라이더로 원형 프레임에 맞게 조정할 수 있게 했다.
- 등록 시 브라우저 `canvas`로 400x400 JPEG 프로필 이미지를 생성하고, 게시물 업로드와 동일하게 `encodeFilename()`을 사용해 Supabase Storage `images` 버킷에 업로드한다.
- 업로드 성공 후 public URL을 기존 `consultants.image_url`에 저장하도록 폼 상태에 반영한다.
- 공개 `/consulting` 카드의 원형 이미지에는 `display: block`을 추가해 원형 프레임 내 이미지 표시를 안정화했다.
- 예약/슬롯/승인 로직과 DB 스키마는 변경하지 않았다.

### 10. 사진 올리기 모달 레이어 및 crop UI 개선
파일: `src/app/components/admin/AdminConsultingManagement.tsx`

- 사진 올리기 모달의 `z-index`를 관리자 하단 플로팅 nav보다 높여, 모달 안에서 관리자 전용 토글이 보이지 않도록 수정했다.
- 기존 가로 위치/세로 위치 슬라이더를 제거하고, 정사각형 crop stage 안에서 사진을 직접 드래그해 위치를 잡는 방식으로 변경했다.
- crop stage에 3x3 그리드와 중앙 원형 가이드를 표시해 최종 원형 프로필 범위를 직관적으로 확인할 수 있게 했다.
- 확대는 하나의 zoom 슬라이더만 유지했다.
- 화면에서 보이는 crop 위치와 저장되는 400x400 JPEG 결과가 같은 계산을 사용하도록 `canvas` crop 계산을 정리했다.

### 11. MyPage PII 표시 경로 정리
파일: `src/app/pages/MyPage.tsx`

- `MyPage`의 가입 정보 표시가 `auth.user.email` 및 `user_metadata` fallback과 섞여 있던 부분을 정리했다.
- 가입 정보 블록의 `이메일`, `이름`, `연락처`, `소속`, `구분`은 이제 `decrypt-own-profile` 응답만 기준으로 표시한다.
- 복호화 응답이 도착하기 전에는 `불러오는 중...` 문구를 보여 주고, 로딩 완료 후 값이 비어 있으면 `미입력`으로 처리한다.
- 복호화 실패 시 콘솔에 오류를 남기도록 해, 화면 표시 경로가 조용히 `auth` 메타데이터로 우회되지 않게 했다.
- 전수 점검 결과, 클라이언트 코드에서 남아 있는 `profiles` 직접 조회는 `role` 확인 또는 이미 복호화 Edge Function으로 전환된 경로만 확인됐다.

### 12. 레이어링 규칙 정리
파일: `src/lib/layers.ts`, `src/app/components/RootLayout.tsx`, `src/app/components/HeaderSection.tsx`, `src/app/pages/ResourcesPage.tsx`, `src/app/components/admin/AdminConsultingManagement.tsx`, `src/app/components/ConsultingBookingModal.tsx`, `src/app/components/admin/AdminPostModal.tsx`, `src/app/components/admin/AdminBulkResultModal.tsx`, `src/app/components/admin/AdminRoleModal.tsx`, `src/app/components/admin/NotificationBell.tsx`, `src/app/pages/FoundersClubPage.tsx`, `src/app/pages/PostDetailPage.tsx`, `src/app/pages/AdminPage.tsx`, `src/app/pages/FlowMapPage.tsx`

- `src/lib/layers.ts`에 공통 레이어 토큰을 추가해 `cardDropdown`, `header`, `mobileMenu`, `adminFloating`, `modal`, `adminModal`, `blockingModal` 계층을 한곳에서 관리하도록 정리했다.
- `RootLayout`의 idle logout 모달, 관리자 하단 floating nav를 공통 토큰 사용으로 전환했다.
- `HeaderSection`의 고정 헤더, 모바일 메뉴 backdrop, 모바일 메뉴 패널을 공통 토큰 사용으로 전환했다.
- `ResourcesPage`의 다중 파일 드롭다운은 카드 내부 레이어 토큰으로 정리해, 전역 모달과 경쟁하지 않으면서도 아래 카드에는 가리지 않게 유지했다.
- 일반 모달 계열(`ConsultingBookingModal`, `FoundersClubPage`, `PostDetailPage`, `AdminPostModal`, `AdminBulkResultModal`, `AdminRoleModal`)은 모두 같은 `modal` 계층으로 통일했다.
- 관리자 사진 업로드 모달은 `adminModal` 계층으로 분리해, 관리자 하단 nav나 bell보다 항상 위에 보이도록 유지했다.
- 관리자 알림 bell은 하단 관리자 nav보다 한 단계 높은 floating 계층으로 맞춰, 두 요소가 겹칠 때 bell/panel이 가리지 않도록 정리했다.
- 관리자/Flow Map 상단 고정 배경도 헤더 바로 아래 계층으로 맞춰 헤더와의 관계를 명확히 했다.

### 13. 배포 전 Supabase 보안 하드닝
파일: `supabase/functions/_shared/adminAuth.ts`, `supabase/functions/decrypt-profiles/index.ts`, `supabase/functions/delete-user/index.ts`, `supabase/functions/bulk-register-users/index.ts`, `supabase/migrations/20260504000000_harden_admin_functions_and_views.sql`, `src/app/pages/PostDetailPage.tsx`, `src/app/pages/SignupPage.tsx`, `GEMINI.md`, `.gemini_prompts/maker_security.md`

- service role을 사용하는 관리자 Edge Function들이 단순 `profiles.role === "admin"` 확인 대신 공통 `requireVerifiedAdmin()` 헬퍼를 사용하도록 변경했다.
- `requireVerifiedAdmin()`은 caller JWT로 `auth.getUser()`를 확인한 뒤 `public.is_admin()` RPC를 호출하므로, DB RLS와 같은 MFA/AAL2 기준을 적용한다.
- `decrypt-profiles`, `delete-user`, `bulk-register-users`는 MFA 등록 admin이 AAL2 세션을 확보하지 못하면 service role 작업을 진행하지 않는다.
- 레거시 `increment_view_count(text)` 함수를 제거하고, visitor/post 30분 cooldown을 적용하는 `increment_view_count(row_id text, visitor_id uuid)` 함수로 교체하는 마이그레이션을 추가했다.
- `post_view_events` 내부 테이블을 추가해 조회수 증가 기록을 남기고, anon/authenticated 직접 접근은 차단했다.
- `PostDetailPage`는 기존 `visitor_id` localStorage 값을 재사용해 조회수 RPC를 호출하고, 직접 `posts.update()` fallback은 제거했다.
- `SignupPage`는 `encrypt-profile` 실패를 조용히 넘기지 않고 콘솔과 사용자 안내로 드러내도록 변경했다.
- SQL 변경 시 컴포넌트 계약을 깨지 않도록 `GEMINI.md`와 보안 maker 프롬프트에 새 원칙을 기록했다.

### 14. 행사 신청 페이지 및 관리자 행사 관리 추가
파일: `supabase/migrations/20260504010000_create_event_applications.sql`, `src/app/pages/EventApplicationPage.tsx`, `src/app/components/admin/AdminEventManagement.tsx`, `src/app/pages/EventsPage.tsx`, `src/app/pages/MyPage.tsx`, `src/app/pages/AdminPage.tsx`, `src/app/components/admin/AdminSidebar.tsx`, `src/app/routes.tsx`, `src/lib/types.ts`, `src/utils/eventApplication.ts`, `PLAN.md`

- `event_applications` 테이블을 추가해 행사 신청 데이터를 별도 저장하도록 했다.
- 신청 중복은 `(post_id, user_id)` 유니크 제약으로 차단한다.
- 사용자는 본인 신청만 조회/생성할 수 있고, 관리자는 `public.is_admin()` 기준으로 전체 신청을 관리한다.
- `posts.event_form_config` JSONB 컬럼을 추가해 행사별 신청 질문, 선택지, 동의 문구, 완료 메시지를 관리자가 수정할 수 있게 했다.
- `/events/:id/apply` 신청 페이지를 추가했다. Google Form 예시를 기준으로 참가자 기본 정보, 관심 분야/참여 목적, 사전 질문, 개인정보 동의 섹션을 구성했다.
- 신청 페이지는 기존 디자인 시스템의 `PageShell`, `Button`, `Badge`, Glassmorphism 카드 톤과 `useTheme()` 분기를 따른다.
- 관리자는 신청 페이지에서 행사 제목, 일시, 장소, 상태, 행사설명, 대표이미지, 질문 문구와 선택지를 수정할 수 있다.
- `/admin` 프로그램 섹션에 `행사 관리` 탭을 추가해 행사별 신청 목록, 답변 상세, 수락/거절, 수락 인원/잔여 좌석을 확인할 수 있게 했다.
- 수락 처리 시 DB 트리거가 `posts.slots_remaining = capacity - accepted_count`로 갱신한다. 정원이 찬 상태에서 추가 수락하면 DB에서 차단한다.
- 행사 목록의 `신청하기` 버튼은 기존 `/post/:id` 상세가 아니라 `/events/:id/apply`로 이동한다.
- `MyPage`에 `나의 행사 신청` 내역을 추가했다.

### 15. 관리자 행사 신청 UI 개선
파일: `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- `행사 관리` 화면을 Founder's Club / 1:1 컨설팅 관리와 같은 서브탭 구조로 정리했다.
- `행사 현황`, `신청 승인`, `처리 내역` 탭을 추가했다.
- `신청 승인` 탭은 `pending` 신청만 표시하므로, 관리자가 수락/거절을 처리하면 해당 신청이 대기 목록에서 사라진다.
- 처리된 신청은 `처리 내역` 탭에서 `전체`, `수락`, `거절` 상태 필터로 확인할 수 있다.
- 행사 선택 필터는 신청 승인/처리 내역 탭에서 유지했다.
- 참가 신청 목록은 페이지당 10명만 표시하고, 10명을 초과하면 이전/다음 페이지 버튼으로 이동하도록 했다.
- DB 구조, RLS, 신청 페이지, 좌석 계산 트리거는 변경하지 않았다.

### 16. 행사 신청 취소 및 관리자 상태 보정 추가
파일: `supabase/migrations/20260504020000_add_cancelled_event_applications.sql`, `src/lib/types.ts`, `src/utils/eventApplication.ts`, `src/app/pages/EventApplicationPage.tsx`, `src/app/pages/MyPage.tsx`, `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- `event_applications.status`에 `cancelled` 상태를 추가하는 신규 마이그레이션을 작성했다.
- 기존 원격 DB에 이미 적용된 `event_applications_status_check` 제약을 새 마이그레이션에서 재생성하도록 했다.
- 일반 사용자가 본인의 `pending` 또는 `accepted` 행사 신청만 `cancelled`로 변경할 수 있도록 `event_applications_cancel_own` UPDATE RLS 정책을 추가했다.
- RLS만으로는 일반 사용자의 다른 컬럼 수정까지 완전히 막기 어렵기 때문에 `guard_event_application_user_cancel()` 트리거를 추가해 사용자 취소 업데이트는 상태 변경 외의 컬럼 변경을 차단한다.
- `EventApplication.status` 타입과 `EVENT_APPLICATION_STATUS` 배지 정의에 `cancelled`를 추가했다.
- `/events/:id/apply`에서 이미 신청한 사용자가 `pending` 또는 `accepted` 상태이면 `신청 취소` 버튼을 볼 수 있게 했다.
- `MyPage`의 `나의 행사 신청` 카드에서도 `pending` 또는 `accepted` 상태 신청을 취소할 수 있게 했다.
- 관리자 `행사 관리 > 처리 내역`에 `취소` 상태 필터를 추가했다.
- 관리자 처리 내역 카드에서 상태를 `대기로`, `수락`, `거절`, `취소`로 다시 보정할 수 있게 했다.
- 좌석 계산은 기존처럼 `accepted` 상태만 기준으로 유지하므로, 수락자가 취소되면 DB 트리거가 잔여석을 다시 늘린다.

### 17. MyPage 신청 카드 장소/취소 UX 통일
파일: `supabase/migrations/20260504030000_add_program_locations_and_user_cancellations.sql`, `src/lib/types.ts`, `src/app/pages/MyPage.tsx`, `src/app/components/admin/AdminConsultingManagement.tsx`, `src/app/components/admin/AdminFoundersClubManagement.tsx`, `src/app/components/ConsultingBookingModal.tsx`, `src/app/pages/FoundersClubPage.tsx`, `PLAN.md`, `RESULT.md`

- 컨설팅 슬롯과 Founder's Club 세션에 `location` 컬럼을 추가하는 신규 마이그레이션을 작성했다.
- `consulting_reservations.status`와 `founders_club_applications.status`에 `cancelled` 상태를 추가했다.
- 일반 사용자가 본인의 컨설팅 예약과 Founder's Club 신청을 취소할 수 있도록 UPDATE RLS 정책을 추가했다.
- 일반 사용자가 취소 업데이트 중 다른 컬럼을 바꾸지 못하도록 컨설팅/Founder's Club 각각 트리거 가드를 추가했다.
- 컨설팅 예약이 `cancelled` 또는 `rejected`가 되면 연결된 `consulting_slots.status`가 `available`로 돌아가도록 DB 트리거를 추가했다.
- 관리자 컨설팅 슬롯 추가 폼과 Founder's Club 세션 등록 폼에 장소 입력 필드를 추가했다.
- 관리자 슬롯/세션 목록과 예약/신청 표시 영역에서 장소를 확인할 수 있게 했다.
- MyPage의 행사/컨설팅/Founder's Club 신청 카드에 날짜/시간과 장소를 함께 표시하도록 통일했다.
- MyPage의 취소 액션은 상태 배지 옆 텍스트 버튼 대신 카드 우측 상단 `X` 버튼으로 통일했다.
- 공개 컨설팅 예약 모달과 Founder's Club 목록에서도 장소를 표시하도록 했다.

### 18. MyPage 취소 후 숨김 및 행사 신청 질문 빌더
파일: `supabase/migrations/20260504040000_add_event_application_answers.sql`, `src/lib/types.ts`, `src/utils/eventApplication.ts`, `src/app/pages/EventApplicationPage.tsx`, `src/app/pages/MyPage.tsx`, `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- `event_applications.answers` JSONB 컬럼을 추가하는 신규 마이그레이션을 작성했다.
- 일반 사용자 취소 가드 함수가 `answers` 컬럼 변경도 차단하도록 재정의했다.
- `EventFormConfig.customQuestions`와 `EventCustomQuestion` 타입을 추가했다.
- `EventApplication.answers` 타입을 추가했다.
- `mergeEventFormConfig()`가 `customQuestions`를 안전하게 병합하도록 확장했다.
- MyPage의 행사/컨설팅/Founder's Club 목록 조회에서 `cancelled` 상태 항목을 제외해, 사용자가 취소하면 재조회 후 카드가 사라지게 했다.
- 행사 신청 페이지의 `신청 페이지 수정` 버튼을 라이트모드에서도 선명하게 보이도록 inline style로 보강했다.
- 관리자 행사 신청 페이지 편집 영역에 추가 질문 빌더를 추가했다.
- 질문 사이 중앙의 `+` 버튼으로 질문을 원하는 위치에 삽입할 수 있게 했다.
- 추가 질문 카드 우측 상단의 `X` 버튼으로 질문을 삭제할 수 있게 했다.
- 추가 질문은 오른쪽 `참가 신청` 폼에 즉시 반영된다.
- 추가 질문 답변은 신청 제출 시 `event_applications.answers`에 저장된다.
- 관리자 `행사 관리` 신청 카드에서 추가 질문 답변을 확인할 수 있게 했다.

### 19. 취소 신청 숨김 및 기본 필수 표시
파일: `src/app/components/admin/AdminEventManagement.tsx`, `src/app/pages/EventApplicationPage.tsx`, `PLAN.md`, `RESULT.md`

- 관리자 행사 관리의 `처리 내역`에서 `cancelled` 신청을 숨기도록 변경했다.
- 관리자 행사 관리 상태 필터에서 `취소` 옵션을 제거했다.
- 행사 신청 폼의 기본 필수 항목에도 `*` 표시를 추가했다.
- 기존 필수값 제출 검증 로직은 유지했다.

### 20. UI 보정 - 행사 카드, 관리자 상태 용어, 공지사항 목록
파일: `src/app/pages/EventsPage.tsx`, `src/app/pages/NoticePage.tsx`, `src/utils/eventApplication.ts`, `src/app/components/admin/AdminEventManagement.tsx`, `src/app/components/admin/AdminConsultingManagement.tsx`, `src/app/components/admin/AdminFoundersClubManagement.tsx`, `PLAN.md`, `RESULT.md`

- 행사 목록 카드의 데스크톱 기본 높이를 썸네일 기준과 맞춰, 썸네일과 카드 박스가 어긋나 보이지 않도록 조정했다.
- 행사 카드의 중앙 본문과 우측 정보 패널 padding/gap을 줄여 고정 높이 안에서 안정적으로 정렬되게 했다.
- 공지사항 목록에서 썸네일 추출, 이미지 placeholder, 썸네일 프레임을 제거해 텍스트형 카드로 정리했다.
- 관리자 `행사 관리`, `컨설팅 관리`, `Founder's Club 관리`에서 승인 완료 상태와 처리 버튼 문구를 `승인`으로 통일했다.
- 내부 DB 상태값(`accepted`, `confirmed`)과 처리 로직, RLS, 신청/예약 구조는 변경하지 않았다.

### 21. 행사 취소 후 문의 및 관리자 복구 흐름 개선
파일: `src/app/pages/EventApplicationPage.tsx`, `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- 행사 신청 취소 완료 화면에 운영자 문의 이메일 `ncf@ncf.or.kr` mailto 링크와 `/faq` 문의 안내 링크를 추가했다.
- 관리자 `행사 관리 > 처리 내역` 상태 필터에 `취소` 옵션을 복구했다.
- 처리 내역 목록에 `cancelled` 행사 신청도 포함되도록 필터를 조정했다.
- 운영자는 취소된 신청 카드에서 기존 상태 보정 버튼으로 `대기로`, `승인`, `거절` 상태로 다시 변경할 수 있다.
- DB 상태값, RLS, 트리거, 좌석 계산 방식은 변경하지 않았다.

### 22. 행사 취소 문의 버튼 라이트모드 대비 보정
파일: `src/app/pages/EventApplicationPage.tsx`, `PLAN.md`, `RESULT.md`

- 행사 신청 취소 완료 화면의 문의 이메일 버튼과 FAQ 버튼에 테마별 inline style을 추가했다.
- 라이트모드에서 흰 배경, 파란 텍스트, 파란 계열 border와 shadow를 적용해 버튼이 명확히 보이도록 했다.
- 다크모드에서는 반투명 파란 배경과 border를 유지해 기존 톤과 어긋나지 않게 했다.
- 공통 `Button` 컴포넌트 전체 스타일은 변경하지 않았다.

### 23. 행사 목록 카드 높이 및 우측 정보 패널 재보정
파일: `src/app/pages/EventsPage.tsx`, `PLAN.md`, `RESULT.md`

- 행사 목록 카드의 데스크톱 높이를 `sm:h-[220px]` 고정에서 `sm:min-h-[220px]`로 변경해 우측 `신청하기` 버튼이 잘리지 않도록 했다.
- 썸네일 영역은 `sm:h-auto sm:self-stretch`로 조정해, 부모의 고정 높이에 의존하지 않고 flex stretch로 카드 높이에 맞춰 늘어나도록 했다.
- 중앙 본문 영역에 `min-w-0`을 추가해 제목/본문 clamp가 flex 레이아웃 안에서 안정적으로 작동하게 했다.
- 우측 정보 패널은 행사 데이터가 비어 있어도 `일시 미정`, `장소 미정`, `정원 미정` fallback을 표시하도록 변경했다.
- 행사 신청 링크, 좌석 계산, Supabase 조회 로직은 변경하지 않았다.

### 24. 행사 신청 완료 상태 카드 액션 정렬 보정
파일: `src/app/pages/EventApplicationPage.tsx`, `PLAN.md`, `RESULT.md`

- 행사 신청 완료 카드에서 상태 배지와 후속 액션을 하나의 세로 스택으로 묶었다.

### 25. 관리자 신청 처리 카드 액션 정렬 통일
파일: `src/app/components/admin/AdminEventManagement.tsx`, `src/app/components/admin/AdminFoundersClubManagement.tsx`, `src/app/components/admin/AdminConsultingManagement.tsx`, `PLAN.md`, `RESULT.md`

- `행사 관리 > 처리 내역` 신청 카드 상단을 내용 영역과 우측 액션 영역으로 재배치해, `편집`, `승인`, `거절`, `취소`, `대기로` 버튼이 오른쪽 빈 공간에서 안정적으로 정렬되게 했다.
- 행사 관리 액션 버튼에 최소 너비를 주고 우측 정렬 그룹으로 묶어, 상태 조합이 달라도 버튼 위치가 흔들리지 않게 했다.
- `Founder's Club 관리 > 신청 관리` 카드도 같은 우측 액션 그룹 구조와 공통 `Button` 디자인으로 맞췄다.
- `1:1 컨설팅 관리 > 예약 승인` 카드의 메모 입력과 상태 버튼을 분리해, 메모는 한 줄 입력 영역으로 유지하고 승인/거절 버튼은 우측 정렬된 액션 행으로 정리했다.

### 26. 관리자 신청 처리 카드 디자인 시스템 재정렬
파일: `src/app/components/admin/AdminEventManagement.tsx`, `src/app/components/admin/AdminFoundersClubManagement.tsx`, `src/app/components/admin/AdminConsultingManagement.tsx`, `PLAN.md`, `RESULT.md`

- 행사 관리 액션 버튼의 최소 너비, 높이, radius를 줄여 기존 어드민 버튼 톤에 가깝게 맞췄다.
- `승인` 버튼의 그림자와 과한 부피감을 줄이고, `거절` 버튼도 같은 크기 체계로 정리했다.
- 행사 관리 상세 정보 박스와 추가 질문 답변 박스의 padding, radius, 텍스트 크기, line-height를 줄여 기존 카드 밀도로 되돌렸다.
- Founder's Club과 1:1 컨설팅 관리도 같은 버튼 높이·너비·라운드 기준으로 통일했다.

### 27. 행사 처리내역 카드를 컨설팅 관리 패턴으로 재구성
파일: `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- `행사 관리 > 처리 내역` 카드에서 상태 변경 액션 버튼을 제거하고, 컨설팅 관리처럼 상태는 이름 옆 pill로만 표시하도록 바꿨다.
- 카드 우측에는 생성일만 표시해 컨설팅 관리 카드의 정보 구조와 맞췄다.
- `직책`, `관심 분야`, `기대하는 부분`, `사전 질문`, 추가 질문 답변을 여러 개의 큰 박스 대신 하나의 낮은 정보 박스 안에 압축했다.
- `신청 승인` 탭의 대기 카드에서는 기존 승인/거절/취소 버튼을 유지하되, 카드 하단 우측 액션 행으로만 표시하도록 정리했다.

### 28. 행사 처리내역 상태 보정 버튼 복구
파일: `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- 사용자 취소 후 운영자 문의를 통해 관리자가 상태를 복구하는 기존 흐름을 보존하기 위해 `행사 관리 > 처리 내역`의 상태 보정 버튼을 복구했다.
- 처리내역 카드의 컨설팅형 정보 구조는 유지하면서, 카드 하단 우측 액션 행에서 `대기로`, `승인`, `거절`, `취소` 상태 변경이 가능하도록 했다.

### 29. 행사 상태 보정 액션을 Badge/Pill 디자인으로 재구성
파일: `src/app/components/admin/AdminEventManagement.tsx`, `PLAN.md`, `RESULT.md`

- `행사 관리`의 상태 보정 액션을 공통 `Button` 스타일이 아니라 `badgeVariants` 기반의 클릭 가능한 pill로 변경했다.
- `승인`, `거절`, `취소`, `대기로` 액션은 각각 기존 `Badge/Pill` 색상 체계(`green`, `red`, `secondary`, `yellow`)를 따른다.
- 액션 pill에서 아이콘을 제거해 컨설팅 관리의 상태 pill과 같은 크기와 밀도로 보이도록 정리했다.
- 취소 후 관리자 복구 흐름과 상태 변경 로직은 유지했다.
- `승인` 상태에서는 `승인` 배지와 `신청 취소` 버튼이 같은 중심축 위에 놓이도록 정렬을 맞췄다.
- `취소` 상태의 문의 버튼과 배지, `내 신청 내역 보기` 버튼도 같은 액션 스택 안에서 자연스럽게 이어지도록 유지했다.
- `거절` 상태처럼 배지만 보이는 경우의 레이아웃은 그대로 유지했다.

### 30. 푸터 법적 고지 링크 및 정책 페이지 추가
파일: `src/app/components/FooterSection.tsx`, `src/app/routes.tsx`, `src/app/pages/PrivacyPolicyPage.tsx`, `src/app/pages/TermsOfUsePage.tsx`, `src/app/pages/SignupPage.tsx`, `src/app/pages/FaqPage.tsx`, `src/app/pages/EventApplicationPage.tsx`, `src/app/constants/contact.ts`, `PLAN.md`, `RESULT.md`

- 푸터 우측에 `개인정보처리방침`, `이용약관`, `Contact`, `공익제보` 링크 그룹을 추가했다.
- `개인정보처리방침`은 `/privacy-policy`, `이용약관`은 `/terms-of-use` 내부 라우트로 연결했다.
- `Contact`는 FAQ와 같은 문의 이메일 `ncf@ncf.or.kr`을 사용하도록 공통 상수(`CONTACT_EMAIL`)로 정리했다.
- `공익제보`는 사용자가 제공한 국민권익위원회 청렴포털 링크(`https://www.clean.go.kr/index.es?sid=a1`)를 새 탭으로 열도록 했다.
- 신규 `PrivacyPolicyPage`는 `PageShell`, 공통 `Badge`, 기존 문서형 카드 여백/폰트/컬러 체계를 사용해 Global X Pass의 실제 개인정보 처리 흐름을 설명하도록 작성했다.
- 신규 `TermsOfUsePage`는 같은 디자인 시스템으로 서비스 이용, 계정 관리, 프로그램 신청/취소, 자료 이용, 개인정보 보호, 약관 변경 조항을 정리했다.
- 회원가입 필수 동의 항목의 `이용약관`, `개인정보 처리방침` 텍스트를 각각 새 문서 페이지 링크로 연결했다.
- 스타트업얼라이언스 참고 페이지는 구조와 항목만 참고하고, 원문 복사는 하지 않았다.

### 31. 푸터 링크 및 정책 문서 본문 밀도 보정
파일: `src/app/components/FooterSection.tsx`, `src/app/pages/PrivacyPolicyPage.tsx`, `src/app/pages/TermsOfUsePage.tsx`, `PLAN.md`, `RESULT.md`

- 푸터 우측 법적 링크의 색상, 폰트 크기, 굵기를 copyright 문구와 같은 muted 톤으로 낮췄다.
- 푸터 링크 구분선 높이와 색상도 더 연하게 조정해 레퍼런스처럼 보조 정보로 읽히도록 했다.
- 개인정보처리방침과 이용약관 본문에서 조항별 상단 border를 제거해, 하나의 문서 박스 안에서 연속적으로 읽히는 구조로 변경했다.
- 정책/약관 조항 제목은 `18px`에서 `15px`, 본문은 `14px`에서 `13px`로 줄이고 paragraph spacing을 낮춰 기존 문서형 페이지 밀도에 맞췄다.

### 32. 푸터 SNS 아이콘 링크 추가
파일: `src/app/components/FooterSection.tsx`, `src/app/constants/contact.ts`, `PLAN.md`, `RESULT.md`

- 푸터 우측 법적 링크 그룹 위에 SNS 아이콘 행을 추가했다.
- LinkedIn, Instagram, YouTube 아이콘은 기존 푸터 톤에 맞춘 작은 흑백 inline SVG로 구현했다.
- 각 SNS 링크는 Next Challenge Foundation 공식 채널로 새 탭 연결되며, 접근성을 위해 `aria-label`을 추가했다.
- SNS URL은 `src/app/constants/contact.ts`에 상수로 모아 관리하도록 했다.

### 33. 다크모드 푸터 SNS 아이콘 대비 보정
파일: `src/app/components/FooterSection.tsx`, `PLAN.md`, `RESULT.md`

- 다크모드에서 LinkedIn과 YouTube 아이콘의 내부 glyph가 흰색 아이콘 배경에 묻히던 문제를 수정했다.
- `SocialIcon`에 `isDark`를 전달해 다크모드에서는 내부 glyph를 어두운 색(`#0a1020`)으로, 라이트모드에서는 기존 흰색으로 렌더링하도록 했다.
- Instagram 아이콘은 stroke 기반이라 기존 테마 색상을 유지했다.

## 검증 결과

```bash
npm run build
```

결과: 성공

썸네일 크기 고정 작업 후 `npm run build` 재실행 결과: 성공

컨설팅 전문가 프로필 사진 로컬 업로드 작업 후 `npm run build` 재실행 결과: 성공

사진 올리기 모달 레이어 및 crop UI 개선 후 `npm run build` 재실행 결과: 성공

MyPage PII 표시 경로 정리 후 `npm run build` 재실행 결과: 성공

레이어링 규칙 정리 후 `npm run build` 재실행 결과: 성공

Supabase 보안 하드닝 후 `npm run build` 재실행 결과: 성공

행사 신청 페이지 및 관리자 행사 관리 추가 후 `npm run build` 재실행 결과: 성공

관리자 행사 신청 UI 개선 후 `npm run build` 재실행 결과: 성공

행사 신청 취소 및 관리자 상태 보정 추가 후 `npm run build` 재실행 결과: 성공

MyPage 신청 카드 장소/취소 UX 통일 후 `npm run build` 재실행 결과: 성공

MyPage 취소 후 숨김 및 행사 신청 질문 빌더 추가 후 `npm run build` 재실행 결과: 성공

취소 신청 숨김 및 기본 필수 표시 후 `npm run build` 재실행 결과: 성공

UI 보정 - 행사 카드, 관리자 상태 용어, 공지사항 목록 작업 후 `npm run build` 재실행 결과: 성공

행사 취소 후 문의 및 관리자 복구 흐름 개선 후 `npm run build` 재실행 결과: 성공

행사 취소 문의 버튼 라이트모드 대비 보정 후 `npm run build` 재실행 결과: 성공

행사 목록 카드 높이 및 우측 정보 패널 재보정 후 `npm run build` 재실행 결과: 성공

행사 목록 썸네일 stretch 방식 보정 후 `npm run build` 재실행 결과: 성공

행사 신청 완료 상태 카드 액션 정렬 보정 후 `npm run build` 재실행 결과: 성공

푸터 법적 고지 링크 및 정책 페이지 추가 후 `npm run build` 재실행 결과: 성공

푸터 링크 및 정책 문서 본문 밀도 보정 후 `npm run build` 재실행 결과: 성공

푸터 SNS 아이콘 링크 추가 후 `npm run build` 재실행 결과: 성공

다크모드 푸터 SNS 아이콘 대비 보정 후 `npm run build` 재실행 결과: 성공

자료실 `/resources` 브라우저 검증:
- 첫 번째 자료의 다중 파일 버튼 클릭 시 `첨부파일 목록 (2)`가 아래 카드 위로 온전히 표시됨
- 목록 내부 파일 버튼까지 DOM에 정상 노출됨

홈 `/` 브라우저 검증:
- 비관리자 상태에서 `사이트 미리보기`, `관리자 페이지`, `디자인 시스템`, `서비스 흐름도` 하단 관리자 네비게이션 문구가 DOM에 남지 않음
- 화면 하단 빈 흰색 토글 원인이던 빈 `<nav>` 껍데기 제거 확인

로컬 확인:
- `http://localhost:5173` 서버 응답 확인
- 사용자와 함께 확인할 수 있도록 로컬 브라우저에서 `http://localhost:5173` 열기 완료

참고: Vite가 `index-*.js` 청크 크기 500kB 초과 경고를 출력한다. 빌드 실패는 아니며, 추후 `manualChunks` 또는 추가 lazy loading으로 개선 가능하다.

---

## AboutSection 지그재그 타임라인 재구성 (v3) — 2026-05-06

### 변경 파일
- `src/app/components/AboutSection.tsx` — 전체 재작성

### 구현 내용

**디자인 변경**
- 지그재그 원형 타임라인: 4개 phase(2019/2021/2023/2026)를 홀짝 교차 배치
- 3겹 원 구조: 외부 점선 링(168px) → 그라디언트 링(144px) → 내부 흰색 원(100px)
- 원 내부: `shortLabel` 제거 → 연도만 중앙 표시 (`fontWeight: 900`)
- Google 4색 per-phase 그라디언트: 2019 파랑(`#4285F4`) / 2021 초록(`#34A853`) / 2023 노랑(`#FBBC05`) / 2026 빨강(`#EA4335`)
- 연도 텍스트 색상 = 각 phase의 `acMain`과 동일
- 외부 점선 링 색상 = `${phase.acMain}66` (phase 색, 40% 불투명도)
- 텍스트 블록: `textAlign: "center"` → `"left"` (가독성 개선)

**레이아웃 수치 (dot 중심 보정)**
- `CTH = 500`, `CO = 168`, `CH = 42`, `SP = 45`
- dot center = SP + CO + CH - dot_radius = 45 + 168 + 42 - 5 = **250 = midline** ✓
- 구 SP=40 이면 dot center=245로 5px 어긋났던 문제 수정

**반응형 브레이크포인트**
- `800px` → `900px` (HeaderSection 등 다른 컴포넌트 기준과 통일)

**구조 요소 유지**
- 수평 연결선, 수직 connector(dot+dashed line): 구조 인디고(`#6B6EE8`) 유지
- `isDark` 테마 토큰 체계, 섹션 헤더, `aria-hidden`, `ol/ul/li` 시맨틱 유지
- 라이트 모드 ringGlow: 인디고 색조 제거 → `rgba(0,0,0,0.12)` 중립 그림자

### 빌드 결과
`npm run build` 성공 (청크 크기 경고는 기존 이슈, 빌드 실패 아님)

### Codex 검토 결과
- TypeScript: `acMain/acLight/acDark` 추론 정상, `ac`/`aA` 구조 요소에 여전히 사용 중 → 제거 불가
- CSS: `${phase.acMain}66` hex opacity 표기 유효 확인
- dot offset / breakpoint 두 이슈 → 이번 세션에서 수정 완료

---

## AboutSection 그라디언트 토큰 정합성 보정 — 2026-05-06

### 변경 파일
- `src/app/components/AboutSection.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- `AboutSection`의 원형 링 배경을 임의 3색 그라디언트(`acLight -> acMain -> acDark`)에서 디자인시스템의 창구 그라디언트 값으로 교체했다.
- phase 매핑은 `2019 -> --gradient-blue`, `2021 -> --gradient-green`, `2023 -> --gradient-yellow`, `2026 -> --gradient-red`로 적용했다.
- 실제 적용값은 `#4377F1 -> #16DBBB`, `#18A343 -> #37AD9A`, `#FFEE56 -> #FFC2B4`, `#FF4340 -> #FF7C44`이다.
- 연도 텍스트, 외부 점선 링, 모바일 불릿 색상은 각 phase의 대표 솔리드 색상을 사용하도록 `solidColor`로 정리했다.
- 지그재그 타임라인 구조, 연도 중앙 표시, dot 중심 보정, 900px 브레이크포인트는 유지했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## AboutSection 하단 구분선 제거 및 섹션 길이 축소 — 2026-05-06

### 변경 파일
- `src/app/components/AboutSection.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- `AboutSection` 하단의 구분선과 `NCF × GOOGLE PLAY × MSS × KISED` 텍스트 블록을 제거했다.
- 제거 후 남는 빈 영역을 줄이기 위해 섹션 bottom padding을 `clamp(70px, 11vw, 110px)`에서 `clamp(44px, 7vw, 72px)`로 축소했다.
- 하단 divider 전용 `dividerColor`, `footerText` 테마 토큰도 함께 제거했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## ProgramSection UI/UX 재정렬 — 2026-05-06

### 변경 파일
- `src/app/components/ProgramSection.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- `ProgramSection`의 radial glow 배경, dot grid, 카드 glow blob, hover 그림자, 아이콘 그림자를 제거해 담백한 정보형 섹션으로 정리했다.
- `programs` 데이터에서 장식용 `glowFrom` 값을 제거하고, 디자인시스템 그라디언트와 대표 색상만 남겼다.
- 섹션 헤더를 좌측 정보 중심 구조로 바꾸고, 제목/설명만 남기는 담백한 구조로 정리했다.
- 메인 제목 위의 `PROGRAMS` eyebrow와 우측 보조 안내 문구를 제거해 제목 블록을 단순화했다.
- `NoticeSection`, `EventSection`, `ResourceSection`의 홈 섹션 제목 패턴을 확인하고, `ProgramSection`도 같은 1280px 컨테이너 좌측 시작점과 `40px` 헤더 하단 간격에 맞췄다.
- 카드 내부 위계를 아이콘/배지, 제목/설명, 태그, 하단 CTA 영역으로 재정렬했다.
- `/consulting`, `/founders-club` 카드에는 `자세히 보기` CTA와 키보드 접근(`Enter`, `Space`)을 추가했다.
- 이동 경로가 없는 카드에는 `안내 준비중` 상태를 표시해 클릭 가능한 카드와 구분했다.
- 카드 hover는 대표색 상단 라인을 흐리지 않도록 border 변경 대신 얇은 outline 변화로 조정했다.
- Founder’s Club 카드는 프로젝트 디자인시스템의 대표 색상인 보라색(`#A855F7`) 계열로 변경했다.
- 카드별 대표 색상이 더 명확히 보이도록 각 카드 상단에 얇은 대표색 accent line을 추가했다.
- 카드 최소 높이와 태그 영역 높이를 잡아 4열/2열/1열 반응형에서 흔들림을 줄였다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 메인 페이지 디자인 시스템 통일 1차 — CommunitySection — 2026-05-06

### 변경 파일
- `src/app/components/HomePage.tsx`
- `src/app/components/CommunitySection.tsx`
- `src/app/components/ui/badge.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 홈 렌더링 순서를 `Hero -> About -> Program -> Community -> Notice -> Event -> Resource -> Newsletter`로 변경했다.
- `FoundersClubCalendarWidget`은 `ProgramSection`에서 Founder's Club을 이미 다루므로 홈에서 제거했다.
- 공통 `Badge` pill padding을 `min-h-6`, `py-1`, `leading-none` 기준으로 통일했다.
- `Badge`의 `glass` variant에서 blur와 dot glow 효과를 제거했다.
- `CommunitySection`의 radial gradient 배경, dot grid, card shadow, hover shadow를 제거했다.
- `CommunitySection` 제목은 1280px 컨테이너 좌측 시작점, 제목 하단 `40px` 간격, 음수 자간 없는 형태로 정리했다.
- `CommunitySection` 게시물 표시를 페이지당 8개, 데스크톱 기준 4열 x 2줄 구조로 고정했다.
- 게시물은 탭별 최대 24개를 불러오고, 현재 페이지의 8개만 렌더링하도록 분리했다.
- 페이지 이동 버튼은 첫 페이지에서 `>`만, 마지막 페이지에서 `<`만 보이도록 조건부 렌더링했다.
- 페이지 이동 화살표는 박스/배경/테두리 없이 텍스트형 `<`, `>` 컨트롤로 정리했다.
- 게시물 카드는 카테고리별 대표색 상단 accent line과 얇은 outline hover만 사용하도록 바꿨다.
- 게시물 카드에 키보드 접근(`Enter`, `Space`)을 추가했다.
- 탭 active 상태는 버튼 기본 shadow를 피하기 위해 `outline` variant 기반으로 유지하면서 보라색 배경만 적용했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 메인 페이지 디자인 시스템 통일 2차 — EventSection — 2026-05-06

### 변경 파일
- `src/app/components/HomePage.tsx`
- `src/app/components/EventSection.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 홈 렌더링 순서를 `Hero -> About -> Program -> Community -> Event -> Notice -> Resource -> Newsletter`로 변경했다.
- `EventSection`이 `CommunitySection` 바로 아래에 오도록 배치해 사용자가 요청한 다음 흐름을 반영했다.
- `EventSection`의 radial gradient 배경과 dot grid 장식을 제거하고 공통 섹션 배경(`th.sectionBg`)으로 통일했다.
- 섹션 헤더 하단 간격을 `40px`로 맞추고 제목의 음수 자간을 제거했다.
- 대표 행사 카드는 이미지 오버레이와 그림자 없이 공통 카드 배경, 얇은 border, 녹색 상단 accent line만 사용하도록 정리했다.
- 이후 피드백에 따라 관리자 대표 행사 선택 팝오버는 메인 섹션에서 완전히 제거했다.
- 대표 행사 CTA는 gradient/shadow 버튼에서 단색 녹색 pill 버튼으로 변경했다.
- 우측 행사 목록 카드는 shadow 없이 녹색 left accent line과 얇은 outline hover만 사용하도록 바꿨다.
- 목록 hover 이동은 가로 밀림 대신 `2px` 세로 이동으로 줄였다.
- 피드백 반영: 대표 행사 카드 뒤쪽에 행사 이미지를 낮은 투명도의 배경 레이어로 복구했다.
- 피드백 반영: 대표 행사 카드 내부를 본문 영역과 하단 액션 영역으로 나누고, 하단 pill 영역과 CTA 사이의 상하 간격을 위쪽 badge 리듬과 맞췄다.
- 피드백 반영: 대표 행사 제목은 최대 2줄, 본문은 최대 3줄로 제한해 길어질 경우 `...` 형태로 생략되도록 했다.
- 피드백 반영: 대표 행사 선정 로직을 블로그 추천 게시물과 같은 `posts.is_featured` 기준으로 통일했다.
- 피드백 반영: 관리자 `게시물 관리` 목록에서 행사 게시물의 `수정` 버튼 왼쪽에 `대표/대표중` 버튼을 추가했다.
- 피드백 반영: `EventSection` 안의 대표 행사 변경 팝오버, 날짜/장소 인라인 편집, `useAdmin()` 기반 관리자 전용 분기를 제거했다.
- 행사 조회와 상세 이동 기능은 유지하고, 대표 행사 변경은 관리자 게시물 관리 화면으로 이관했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 행사 잔여석 수동 입력 제거 — 2026-05-06

### 변경 파일
- `src/app/components/admin/AdminPostCreate.tsx`
- `src/app/pages/PostDetailPage.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 행사 잔여석은 `capacity - accepted_count` 기반 자동 계산값으로 보고, 관리자 게시물 작성 폼에서 `잔여석 (명)` 입력 필드를 제거했다.
- `AdminPostCreate`의 행사 저장 payload에서 `slots_remaining` 수동 업데이트를 제거했다.
- 게시물 상세 페이지의 관리자 행사 수정 폼에서도 `잔여석 (명)` 입력 필드를 제거했다.
- `PostDetailPage`의 행사 수정 저장 payload에서 `slots_remaining` 수동 업데이트를 제거했다.
- `slots_remaining` 타입과 행사 목록 fallback 표시는 유지했다. 정원이 없는 과거 데이터에서는 기존 fallback을 계속 사용할 수 있게 하기 위함이다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 메인 페이지 디자인 시스템 문서화 — 2026-05-06

### 변경 파일
- `MAIN_PAGE_DESIGN_SYSTEM.md`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 메인 페이지 콘텐츠 섹션에 적용 중인 디자인 방향을 별도 문서로 분리했다.
- 섹션 레이아웃, 타이포그래피, 카드, 버튼/pill, 대표 색상, motion, public/admin 분리, 데이터 규칙을 정리했다.
- `ProgramSection`, `CommunitySection`, `EventSection`은 적용 완료 상태로 기록했다.
- `NoticeSection`, `ResourceSection`, `MediaSection`은 다음 적용 대상으로 기록했다.
- 다음 섹션 작업 전 확인할 checklist를 추가했다.

---

## 메인 페이지 Notice + Resource 병치 섹션 — 2026-05-06

### 변경 파일
- `src/app/components/NoticeResourceSection.tsx`
- `src/app/components/HomePage.tsx`
- `MAIN_PAGE_DESIGN_SYSTEM.md`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 홈 전용 `NoticeResourceSection` 컴포넌트를 추가했다.
- `HomePage`에서 기존 `NoticeSection`과 `ResourceSection`을 각각 세로로 렌더링하던 구조를 제거하고, `NoticeResourceSection` 하나로 교체했다.
- 자료실은 왼쪽 컬럼에 2열 2줄 박스형 카드로 배치했다.
- 공지사항은 오른쪽 컬럼에 1열 4줄 compact list로 배치했다.
- 데스크톱에서는 좌우 병치, 좁은 화면에서는 자료실 다음 공지사항 순서로 stacked 되도록 구성했다.
- 자료실은 blue `#4377F1` top accent line과 문서 아이콘을 사용했다.
- 공지사항은 red `#EA4335` left accent line과 compact 날짜 블록을 사용했다.
- 두 컬럼 모두 card shadow, hover shadow, blur/glow 장식을 사용하지 않도록 했다.
- hover는 `translateY(-2px)`와 대표색 outline 변화만 사용했다.
- 공지사항과 자료실의 상세 이동(`/post/:id`) 및 전체 보기(`/notice`, `/resources`) 링크는 유지했다.
- 키보드 접근을 위해 각 카드/row에 `role="button"`, `tabIndex`, `Enter`/`Space` 처리를 추가했다.
- 피드백 반영: 공지사항 row의 긴 nowrap 텍스트가 grid 컬럼 폭을 밀어내지 않도록 좌우 컬럼과 내부 텍스트 영역에 `min-width: 0`을 보강했다.
- 피드백 반영: 자료실 카드가 좁게 잘리는 문제를 줄이기 위해 데스크톱 병치 기준을 `1100px` 이상으로 올리고, 컬럼 비율을 자료실 `0.9fr`, 공지사항 `1.25fr`로 조정했다.
- 피드백 반영: 한 섹션 안에 들어가는 비례에 맞춰 자료실 카드 min-height/padding/radius와 공지사항 row min-height/padding/radius를 더 compact하게 줄였다.
- 피드백 반영: 자료실 2줄 카드 영역과 공지사항 4줄 리스트 영역의 높이를 맞추기 위해 공지 row min-height를 `74px`로 조정했다.
- 피드백 반영: 실제 자료실 카드 높이가 콘텐츠에 의해 커지는 경우에도 공지사항 4개 row가 같은 높이를 나눠 갖도록 공지 컬럼과 row에 flex stretch 구조를 적용했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 미디어 페이지 1차 신설 — 2026-05-06

### 변경 파일
- `src/app/pages/MediaPage.tsx`
- `src/app/routes.tsx`
- `src/app/components/HeaderSection.tsx`
- `src/app/components/admin/adminConstants.ts`
- `src/app/components/admin/AdminPostCreate.tsx`
- `src/app/pages/PostDetailPage.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 새 `/media` 페이지를 추가했다.
- `posts.category = "media"` 게시물을 조회해 자체 제작 리포트, 이슈페이퍼, 트렌드리포트, 팟캐스트, 영상, 인터뷰를 보여주는 구조로 만들었다.
- 미디어 페이지는 `PageShell`을 사용하고, 대표색은 teal 계열 `#20D6A2`로 지정했다.
- 태그 필터는 `전체`, `리포트`, `이슈페이퍼`, `트렌드리포트`, `팟캐스트`, `영상`, `인터뷰` 기본값과 실제 게시물의 커스텀 태그를 함께 지원한다.
- 레퍼런스 방향에 맞춰 세로 표지형 카드 그리드를 적용했다.
- 카드 표지는 첨부 이미지 첫 번째 파일을 우선 사용하고, 없으면 본문 첫 이미지, 그래도 없으면 문서형 placeholder를 보여준다.
- `팟캐스트`와 `영상` 태그 게시물은 카드 표지 위에 재생 성격의 pill을 표시한다.
- 각 카드는 `/post/:id` 상세로 이동하며, 키보드 `Enter`/`Space` 접근도 지원한다.
- `/media` 라우트를 등록했다.
- 헤더 `Resources` 메뉴에 `미디어` 항목을 추가했다.
- 관리자 게시물 카테고리 목록에 `media / 미디어`를 추가했다.
- 관리자 게시물 작성/수정에서 `media` 카테고리도 태그 피커를 사용할 수 있게 했다.
- 게시물 상세 페이지의 카테고리 메타와 관리자 태그 편집 분기에 `media`를 추가했다.
- 이번 1차에서는 별도 `media_items` 또는 `podcast_episodes` 테이블은 만들지 않고 기존 `posts` 기반 운영으로 유지했다.
- 기존 `ResourcesPage`와 `NewsPage` 동작은 변경하지 않았다.
- `/media?demo=1` 데모 미리보기 모드를 추가했다.
- 데모 모드는 실제 DB에 예시 게시물을 저장하지 않고, 페이지 내부 샘플 데이터만 사용한다.
- 데모 샘플은 `리포트`, `이슈페이퍼`, `트렌드리포트`, `팟캐스트`, `영상`, `인터뷰` 유형을 모두 포함한다.
- 사용자가 제공한 YouTube 링크 4개는 `영상` 샘플 카드로 배치했고, YouTube 썸네일 URL을 표지 이미지로 사용했다.
- 데모 영상 카드는 클릭 시 해당 YouTube 링크를 새 탭으로 연다.
- 데모 리포트/팟캐스트/인터뷰 카드는 상세 페이지로 이동하지 않도록 처리해 존재하지 않는 `/post/:id` 진입을 막았다.
- 사용자가 제공한 표지 이미지 5개를 `src/imports/media-cover-*.png`로 추가하고, 데모 샘플의 표지 이미지로 연결했다.
- 미디어 카드 전체를 박스형으로 감싸던 구조를 제거하고, 표지 이미지와 제목만 독립적으로 배치하는 레퍼런스형 그리드로 조정했다.
- 리포트/이슈페이퍼/트렌드리포트는 첨부 표지의 540x675 세로 비율을 유지한다.
- 영상과 팟캐스트는 16:9 비율을 사용하고, 인터뷰는 4:3 비율로 분리했다.
- 데모 팟캐스트 카드도 영상 카드와 동일하게 YouTube 썸네일과 새 탭 링크 동작을 사용하도록 맞췄다.
- 인터뷰 데모 카드도 영상형 콘텐츠로 보고 16:9 비율로 변경했다.
- 기존 인터뷰 데모 2개를 TED Talks 기반 영상 샘플 3개로 교체했다.
- 리포트/이슈페이퍼/트렌드리포트 데모 카드는 클릭 시 `/media?demo=1&item=...` 상세 미리보기 화면으로 이동하도록 했다.
- 데모 상세 화면에는 표지, 유형 pill, 제목, 요약 본문, 실제 운영 상세 영역 안내를 표시한다.
- 미디어 목록은 데스크톱 기준 4열 그리드로 운영한다.
- `전체` 필터에서는 리포트/이슈페이퍼/트렌드리포트 같은 세로 표지형 콘텐츠를 먼저 보여주고, 팟캐스트/영상/인터뷰는 마지막 `영상형 콘텐츠` 한 줄에 최대 4개만 표시하도록 했다.
- 개별 필터(`리포트`, `영상` 등)는 해당 유형 콘텐츠만 4열 그리드로 계속 표시한다.
- 실제 미디어 운영 등록 흐름을 정의했다.
- 관리자 게시물 작성/수정에서 `media` 카테고리를 선택하면 리포트 계열은 `표지 이미지`와 `첨부 PDF / 자료 파일`, 영상형 계열은 `외부 링크` 중심 입력으로 분리된다.
- `media` 게시물은 저장 시 `posts.image_url` 첫 번째 이미지 URL을 표지로, 그 뒤의 문서 URL을 첨부파일로 유지한다.
- 리포트/이슈페이퍼/트렌드리포트 등록 시 미디어 유형과 표지 이미지를 필수로 검증하고, 팟캐스트/영상/인터뷰 등록 시 미디어 유형과 외부 링크를 필수로 검증한다.
- 리포트 계열 표지 이미지는 `images` 버킷, 첨부 PDF/문서 파일은 `documents` 버킷으로 업로드하고, 영상형 계열은 YouTube 링크에서 썸네일 URL을 자동 파생한다.
- 실제 미디어 게시물 상세 페이지를 데모 상세와 같은 좌측 표지 + 우측 본문/다운로드 구조로 전환했다.
- 미디어 상세 페이지에서는 첫 번째 이미지만 표지로 사용하고, 추가 이미지가 있으면 본문 하단 이미지 영역에 표시한다.
- 기존 일반 게시물 상세, 자료실 다운로드, 뉴스/블로그/공지 상세 구조는 유지했다.
- 미디어 카테고리 규칙을 고정 ID 기반으로 정리했다.
- 고정 유형은 `report`, `issue-paper`, `trend-report`, `podcast`, `video`, `interview` 여섯 가지다.
- DB에는 미디어 게시물의 `posts.tags`를 고정 유형 ID로 저장한다.
- 화면에는 고정 ID가 아니라 수정 가능한 표시명을 보여준다.
- 표시명은 `gxp_media_category_labels` localStorage 키에 저장하며, 관리자 미디어 게시물 작성 화면에서 수정할 수 있다.
- 표시명을 바꿔도 고정 ID는 유지되므로 리포트/이슈페이퍼/트렌드리포트는 세로 표지, 팟캐스트/영상/인터뷰는 16:9 규칙이 유지된다.
- 기존에 한국어 태그값(`리포트`, `영상` 등)으로 저장된 미디어 게시물도 고정 ID로 해석되도록 호환 매핑을 추가했다.
- 미디어 상세 페이지 관리자 수정 모드에서도 자유 태그 입력 대신 고정 유형 선택 UI를 사용한다.
- 미디어 유형 선택 UI는 카드 전체를 클릭해 선택할 수 있게 보정했다.
- 팟캐스트/영상/인터뷰 유형을 선택하면 별도 `외부 링크` 입력칸이 표시된다.
- 외부 링크는 새 DB 컬럼 없이 게시물 본문 앞의 숨은 `GXP_MEDIA_META` HTML comment에 저장한다.
- 미디어 상세 페이지는 숨은 메타를 제거한 본문만 렌더링하고, 외부 링크가 있으면 `콘텐츠 보기` 버튼을 표시한다.
- 관리자 미디어 등록/수정 화면에서 팟캐스트/영상/인터뷰 유형을 선택하면 `표지 이미지`와 `첨부 PDF / 자료 파일` 업로드 영역을 숨기도록 정리했다.
- 운영 기준을 리포트/이슈페이퍼/트렌드리포트는 `표지 + 첨부 자료`, 팟캐스트/영상/인터뷰는 `16:9 자동 썸네일 + 외부 링크`로 분리했다.
- 팟캐스트/영상/인터뷰 유형으로 저장할 때는 기존 첨부자료 URL도 저장 payload에서 제외해, 숨겨진 다운로드 파일이 상세 페이지에 남지 않도록 했다.
- 팟캐스트/영상/인터뷰는 별도 표지 이미지 업로드를 요구하지 않고, YouTube 외부 링크에서 썸네일 URL을 자동 파생해 목록/상세 표지로 사용하도록 변경했다.
- YouTube가 아닌 외부 링크는 썸네일을 자동 생성할 수 없으므로 기본 플레이스홀더가 표시된다.
- 미디어 상세 페이지에서 관리자 수정 시 별도 인라인 수정 로직을 쓰지 않고 `AdminPostCreate` 수정 컴포넌트를 lazy-load로 재사용하도록 통일했다.
- 공통 미디어 메타/YouTube 썸네일 파싱 유틸 `src/utils/mediaPost.ts`를 추가해 관리자 작성 화면, 미디어 목록, 상세 화면이 같은 기준을 쓰게 했다.
- 미디어 페이지의 필터 버튼, 카드 재생 pill, 영상형 콘텐츠 보조 텍스트는 관리자에서 수정한 카테고리 표시명을 반영한다.
- `setMediaCategoryLabel()`에서 `gxp:media-category-labels-changed` 이벤트를 발생시키고, `MediaPage`가 해당 이벤트와 `storage` 이벤트를 구독해 표시명 변경을 즉시 갱신하도록 했다.
- `/media?demo=1` 데모 모드, 페이지 내부 샘플 배열, 데모 상세 화면, 데모 안내 배너를 제거했다.
- 실제 Supabase `posts` 테이블에 미디어 샘플 15개를 주입했다.
- 리포트/이슈페이퍼/트렌드리포트 표지는 Supabase Storage `images/media-demo/*` 경로에 업로드한 공개 URL을 사용한다.
- 팟캐스트/영상/인터뷰 샘플은 본문 앞 `GXP_MEDIA_META`에 외부 링크를 저장하고, `image_url`에는 YouTube 썸네일 URL을 저장했다.
- 재주입 스크립트 `scripts/seed-media-demo.mjs`를 추가했다. 같은 샘플 제목의 기존 `media` 게시물만 삭제 후 15개를 다시 삽입한다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 홈 신규 콘텐츠 쇼케이스 전환 — 2026-05-06

### 변경 파일
- `src/app/components/MediaSection.tsx`
- `src/app/components/HeroSection.tsx`
- `MAIN_PAGE_DESIGN_SYSTEM.md`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 기존 홈 하단 `MediaSection`의 이메일 구독 폼, `subscribers` insert, `news` 조회 로직을 제거했다.
- `뉴스` 페이지와 `posts.category = "news"` 데이터 흐름은 그대로 유지했다.
- 홈 하단 섹션을 Startup Alliance 하단 `신규 콘텐츠` 레퍼런스처럼 표지 중심 미디어 쇼케이스로 전환했다.
- 섹션 제목은 `신규 콘텐츠`, 설명은 Global X Pass 리포트/인사이트 콘텐츠 안내로 변경했다.
- 데이터는 `posts.category = "media"` 최신 게시물을 조회한다.
- 리포트/이슈페이퍼/트렌드리포트 같은 세로 표지형 콘텐츠를 우선 노출하고, 부족하면 팟캐스트/영상/인터뷰 같은 16:9 콘텐츠를 후순위로 채운다.
- 홈에서는 최대 8개 콘텐츠를 2열 모바일, 4열 데스크톱 그리드로 표시한다.
- 카드 표지는 기존 공통 유틸 `getMediaPostThumbnailUrl()`을 사용해 미디어 페이지/상세 페이지와 같은 기준으로 결정한다.
- 세로 표지형 콘텐츠는 표지를 `contain`으로 표시해 리포트 커버가 잘리지 않게 했고, 영상형 콘텐츠는 16:9 `cover`로 표시한다.
- `/media`로 이동하는 `자세히 보기` 버튼과 각 카드의 `/post/:id` 이동을 연결했다.
- 빈 상태와 오류 상태를 추가해 미디어 게시물이 없거나 조회 실패 시 섹션이 깨지지 않게 했다.
- `HeroSection`의 기존 미디어 진입 노드를 `미디어` 기준 문구와 `/media` 링크로 정리했다.
- 사용자 피드백에 따라 홈 신규 콘텐츠 섹션을 Startup Alliance 레퍼런스에 더 가깝게 추가 보정했다.
- `Media Library` eyebrow와 우측 상단 버튼을 제거하고, 제목/설명을 중앙 정렬로 변경했다.
- 제목과 카드 사이 여백을 넓혀 레퍼런스의 하단 콘텐츠 섹션 호흡에 맞췄다.
- 홈 섹션 카드는 카테고리 pill과 날짜를 제거하고 표지 + 제목만 표시하도록 단순화했다.
- 기존 2줄 목록형 그리드를 화면 폭에 따라 2~4개씩 보여주는 페이지 쇼케이스 구조로 변경했다.
- 하단에 이전/다음 버튼과 현재 페이지/전체 페이지 표시를 추가했다.
- `/media` 전체 이동은 카드 아래 `자세히 보기` 링크로 배치했다.
- `MAIN_PAGE_DESIGN_SYSTEM.md`에 `MediaSection`은 승인된 레퍼런스 반영을 위해 중앙 정렬 헤더 예외를 사용한다고 기록했다.
- 추가 피드백에 따라 섹션 제목을 `신규 콘텐츠`에서 `미디어`로 변경했다.
- 설명 문구도 “새로운 콘텐츠” 대신 “리포트와 인사이트”를 확인하는 문구로 조정했다.
- 홈 미디어 섹션 썸네일 쇼케이스 폭을 `max-width: 560px` 수준으로 줄여 이전 대비 약 절반 크기의 표지 카드로 보이게 했다.
- 하단 중앙 페이지 번호/`자세히 보기` 링크를 제거하고, `최신 게시물` 섹션처럼 카드 묶음 양옆에 `<`, `>` 화살표를 배치했다.
- 화살표는 카드 묶음 가까이에 배치하고, 첫 페이지에서는 이전 화살표를 숨긴다.
- 다음 페이지가 남아 있으면 `>` 클릭 시 다음 미디어 페이지로 이동한다.
- 마지막 페이지에서 `>`를 한 번 더 클릭하면 오른쪽 화살표 옆에 `자세히 보기` 링크가 나타나며, 클릭 시 `/media`로 이동한다.
- 추가 피드백에 따라 카드 간격을 더 넓히고, 섹션 제목/카드 제목/설명 텍스트 크기를 줄여 밀도를 낮췄다.
- 헤더 설명 문구는 두 줄에서 `Global X Pass에서 발간한 리포트와 인사이트를 확인하세요` 한 줄로 변경했다.
- 재피드백에 따라 미디어 카드 사이 간격을 다시 1.5배 넓히고, 쇼케이스 최대 폭을 1.5배 키워 게시물 썸네일 자체도 더 크게 보이도록 조정했다.
- 미디어 섹션 화살표 크기와 카드 바깥 간격을 `최신 게시물` 섹션의 화살표 패턴과 맞춰 `36px x 72px`, 바깥 `52px` 기준으로 조정했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 메인페이지 섹션 타이포/간격/패딩 통일성 정리 — 2026-05-06

### 변경 파일
- `src/app/components/homeSectionStyles.ts`
- `src/app/components/ProgramSection.tsx`
- `src/app/components/CommunitySection.tsx`
- `src/app/components/EventSection.tsx`
- `src/app/components/NoticeResourceSection.tsx`
- `src/app/components/MediaSection.tsx`
- `src/app/components/AboutSection.tsx`
- `MAIN_PAGE_DESIGN_SYSTEM.md`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 홈 메인 섹션 공통 수치를 한 곳에서 재사용할 수 있도록 `homeSectionStyles.ts`를 추가했다.
- 공통 기준에는 섹션 상하 패딩, 최대 폭, 헤더 하단 간격, 제목 크기, 본문 크기/행간, 카드 radius를 포함했다.
- `ProgramSection`과 `CommunitySection`은 기존 톤을 유지하면서 공통 헤더/레이아웃 기준을 사용하도록 정리했다.
- `EventSection`은 제목만 있던 헤더에 설명문을 추가해 다른 홈 섹션과 같은 정보 계층을 갖추게 했다.
- `EventSection` 대표 카드와 우측 리스트 카드도 공통 radius 기준으로 맞췄다.
- `NoticeResourceSection`은 기존보다 작게 보이던 헤더 타이포와 `18px` 헤더 간격을 공통 기준으로 올려, 독립 섹션처럼 읽히도록 보정했다.
- `NoticeResourceSection` 내부 카드들의 radius, padding, 본문 line-height를 키워 섹션 내부 밀도를 다른 홈 카드와 맞췄다.
- `MediaSection`은 중앙 정렬 헤더 예외는 유지하되, 섹션 패딩·배경·제목 스케일·헤더 간격은 다른 홈 섹션과 같은 리듬으로 되돌렸다.
- `MediaSection` 카드 제목 크기와 hover outline을 보강해 표지형 카드라도 홈 전체 카드군과 시각적 밀도가 크게 벗어나지 않게 했다.
- `AboutSection`은 별도 비주얼 시스템을 유지하면서도 제목 크기, letter-spacing, 헤더 간격, 하단 패딩을 메인페이지 공통 리듬에 더 가깝게 조정했다.
- `MAIN_PAGE_DESIGN_SYSTEM.md`에는 `MediaSection`의 예외가 헤더 정렬에 한정되고, 제외 섹션도 전체 제목 스케일에서 크게 벗어나지 않도록 한다는 기준을 반영했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 홈 미디어 섹션 화살표-카드 간격 보정 — 2026-05-06

### 변경 파일
- `src/app/components/MediaSection.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- 미디어 쇼케이스가 현재 페이지에서 2개 카드만 렌더링될 때도 기존 4열 전체 폭을 유지하던 문제를 수정했다.
- `MediaSection`에서 현재 화면 폭 기준 `itemsPerPage`와 실제 렌더링 카드 수(`pagePosts.length`)를 함께 사용해 쇼케이스 실제 폭을 계산하도록 변경했다.
- 데스크톱/태블릿/모바일별 기준 폭과 gap을 분리해, 현재 보이는 카드 묶음의 바깥 폭만큼만 `media-showcase-wrap`이 차지하도록 조정했다.
- 그 결과 좌우 화살표와 마지막 페이지의 `자세히 보기` 링크가 빈 컬럼 끝이 아니라 실제 마지막 카드 기준 위치에 붙도록 보정했다.
- `itemsPerPage` 계산 breakpoint도 CSS와 맞게 `700px` 기준으로 정렬해 641px~699px 구간의 열 수 불일치를 함께 정리했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 홈 메인 CTA pill hover 규칙 통일 — 2026-05-06

### 변경 파일
- `src/app/components/homeSectionStyles.ts`
- `src/app/components/EventSection.tsx`
- `src/app/components/CommunitySection.tsx`
- `src/app/components/NoticeResourceSection.tsx`
- `MAIN_PAGE_DESIGN_SYSTEM.md`
- `PLAN.md`
- `RESULT.md`
- `GEMINI.md`
- `.gemini_prompts/maker_uiux.md`

### 구현 내용
- 홈 메인 콘텐츠 섹션에서 `전체보기`류 outline CTA pill hover를 공통 규칙으로 묶기 위해 `getHomeSectionCtaPillClass()` 헬퍼를 추가했다.
- 공통 규칙은 대표색 border/text를 유지하고, hover 시에는 같은 대표색의 옅은 tint 배경만 추가하며 텍스트 색은 바꾸지 않는 방식이다.
- `EventSection`의 `전체 일정 보기`는 기존 초록 hover 패턴을 공통 헬퍼 사용으로 정리했다.
- `NoticeResourceSection`의 `전체 자료 보기`, `전체 공지 보기`는 기존 neutral hover(`black/white tint`) 대신 각각 파랑/빨강 대표색 hover로 변경했다.
- `CommunitySection`의 카테고리별 `전체보기`도 현재 활성 탭의 대표색(`notice=red`, `news/resources=blue`, `blog=purple`, `events=green`)을 따르도록 정리했다.
- `MAIN_PAGE_DESIGN_SYSTEM.md`, `GEMINI.md`, `.gemini_prompts/maker_uiux.md`에 홈 outline CTA pill hover 규칙을 문서화했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## Search / Login 버튼 그라디언트 제거 — 2026-05-06

### 변경 파일
- `src/app/pages/SearchPage.tsx`
- `src/app/pages/LoginPage.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- `SearchPage`의 `검색` 버튼에서 파랑-민트 그라디언트를 제거하고 `#4377F1` 단색 버튼으로 변경했다.
- `LoginPage` 기본 로그인 폼의 `로그인` 버튼에서 민트-파랑 그라디언트와 그림자를 제거하고 단색 버튼으로 변경했다.
- disabled 상태의 회색 버튼 처리 방식은 유지했다.
- OTP 인증 단계의 `인증 및 로그인` 버튼은 이번 요청 범위에 포함하지 않아 그대로 유지했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 로그인/회원가입 액션 색상 통일 — 2026-05-06

### 변경 파일
- `src/app/pages/LoginPage.tsx`
- `src/app/pages/SignupPage.tsx`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- `LoginPage`의 `비밀번호 찾기` 링크와 하단 `회원가입` 링크를 `#4377F1` 파란색으로 통일했다.
- `LoginPage` 기본 `로그인` 버튼도 검색 버튼과 같은 `#4377F1` 단색으로 맞췄다.
- `SignupPage`의 `가입하기` 버튼을 같은 `#4377F1` 단색으로 변경하고 그림자를 제거했다.
- `SignupPage` 하단 `로그인` 링크는 기존에도 같은 파란색이어서 그대로 유지했다.
- OTP 인증 단계 버튼은 이번 통일 범위에서 제외했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 전역 UI/UX 색상 및 pill 사용 절제 — 2026-05-06

### 변경 파일
- `src/app/components/contentListStyles.ts`
- `src/app/components/ui/badge.tsx`
- `src/app/components/ui/button.tsx`
- `src/app/components/homeSectionStyles.ts`
- `src/app/components/ProgramSection.tsx`
- `src/app/components/CommunitySection.tsx`
- `src/app/components/EventSection.tsx`
- `src/app/components/NoticeResourceSection.tsx`
- `src/app/pages/NoticePage.tsx`
- `src/app/pages/NewsPage.tsx`
- `src/app/pages/EventsPage.tsx`
- `src/app/pages/BlogPage.tsx`
- `src/app/pages/EventArchivePage.tsx`
- `src/app/pages/MediaPage.tsx`
- `src/app/pages/SearchPage.tsx`
- `src/app/pages/ConsultingPage.tsx`
- `src/app/pages/FoundersClubPage.tsx`
- `src/app/pages/EventApplicationPage.tsx`
- `src/app/pages/MyPage.tsx`
- `src/app/components/admin/AdminConsultingManagement.tsx`
- `src/app/components/admin/AdminFoundersClubManagement.tsx`
- `PLAN.md`
- `GEMINI.md`
- `.gemini_prompts/maker_uiux.md`

### 구현 내용
- 공통 `Badge`의 uppercase/tracking/색상 tint 강도를 낮춰 장식성이 강한 pill 느낌을 줄였다.
- 공통 `Button`의 기본 파랑/보라 버튼 그림자를 제거하고 hover를 단색 변화 중심으로 정리했다.
- `contentListStyles.ts`를 추가해 공개 목록 필터는 중립 tab, 단순 태그/카테고리는 muted label, 실제 상태값은 절제된 status pill로 분리했다.
- 홈 `ProgramSection`, `CommunitySection`, `EventSection`, `NoticeResourceSection`에서 카드 top/left border, colored badge, colored tag, colored CTA가 한 번에 반복되던 패턴을 줄였다.
- 공지/뉴스/행사/블로그/아카이브/미디어/통합검색/컨설팅 페이지의 필터 pill을 중립 tab 스타일로 통일했다.
- 공개 카드 내부의 단순 태그와 카테고리 badge는 muted label로 낮추고, 모집/마감/승인/거절 같은 행동 판단용 상태만 컬러를 유지했다.
- Founder's Club, 행사 신청, MyPage, 관리자 컨설팅/Founder's Club 관리의 상태 pill은 유지하되 공통 상태 스타일로 강도를 낮췄다.
- `GEMINI.md`와 UI/UX maker 프롬프트에 키색상/pill 절제 규칙을 새 작업 기준으로 문서화했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 리뷰 반영 - 행사 저장 동기화 및 Founder's Club 관리자 조회 최적화 — 2026-05-06

### 변경 파일
- `src/app/pages/EventApplicationPage.tsx`
- `src/app/pages/FoundersClubPage.tsx`
- `PLAN.md`

### 구현 내용
- 행사 신청 페이지의 관리자 저장 경로에서 최신 승인 인원을 다시 읽은 뒤 `capacity`, `slots_remaining`, `event_status`를 함께 저장하도록 맞췄다.
- 정원을 승인 인원 이하로 줄이는 경우에는 저장 시 자동으로 `마감` 상태와 `잔여 0석`이 같이 반영되도록 정리했다.
- 저장 직후 화면 상태도 최신 승인 인원 기준으로 다시 동기화해 배지와 잔여석 표시가 어긋나지 않게 했다.
- Founder's Club 공개 페이지의 관리자 조회에서 세션마다 `decrypt-profiles`를 반복 호출하던 흐름을 제거했다.
- 수락된 신청 목록과 관리자용 참여자 정보는 세션 목록 바깥에서 한 번만 조회하고, 세션별로 매핑해서 재사용하도록 바꿨다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 로그인 OTP 인증 버튼 색상 통일 — 2026-05-06

### 변경 파일
- `src/app/pages/LoginPage.tsx`
- `PLAN.md`

### 구현 내용
- OTP 인증 단계의 `인증 및 로그인` 버튼에서 남아 있던 파랑-민트 그라디언트와 그림자를 제거했다.
- 일반 로그인 버튼, 회원가입 버튼과 같은 `#4377F1` 단색 버튼으로 통일했다.
- 비활성화 상태의 회색 버튼 처리와 OTP 길이 검증 로직은 그대로 유지했다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

---

## 어드민 페이지 톤다운 1차 통합 — 2026-05-06

### 변경 파일
- `src/app/pages/AdminPage.tsx`
- `src/app/components/admin/AdminSidebar.tsx`
- `src/app/components/admin/AdminDashboard.tsx`
- `src/app/components/admin/AdminPostManage.tsx`
- `PLAN.md`

### 구현 내용
- 어드민 메인 배경, 콘텐츠 패딩, skeleton 라운딩/간격을 홈의 절제된 리듬에 가깝게 낮췄다.
- 사이드바 활성 탭의 solid blue 배경을 중립 selected tab 스타일로 변경했다.
- 사이드바 하단 관리자 아바타의 파랑-민트 그라디언트를 제거하고 중립 원형 아바타로 교체했다.
- 대시보드 카드의 24px 라운딩과 큰 내부 여백을 줄이고, 통계/차트/Top5 영역을 더 운영 도구형 밀도로 정리했다.
- 대시보드 기간 토글, Top5 순위 박스, 카테고리 label, 조회수 표기를 강한 파랑 중심에서 muted label 중심으로 낮췄다.
- 게시물 관리의 카테고리 badge를 대표색 chip에서 muted label로 낮췄다.
- 게시물 관리의 추천/대표/수정/삭제/pagination 버튼을 강한 색상 반복 대신 outline/neutral selected 상태 중심으로 정리했다.
- 데이터 조회, 저장, 삭제, 권한, Supabase 연동 로직은 변경하지 않았다.

### 빌드 결과
`npm run build` 성공

참고: Vite의 500kB 초과 청크 경고는 기존 이슈이며 빌드 실패가 아니다.

### 후속 후보
- `AdminPostCreate`, `AdminUserManagement`, `AdminEventManagement`, `AdminConsultingManagement`, `AdminFoundersClubManagement`의 폼/상태/액션 UI에도 같은 톤다운 규칙을 확장 적용할 수 있다.

---

## 남은 확인 사항
- `decrypt-profiles` Edge Function 변경은 실제 Supabase Edge Function 배포 후 원격 환경에서 재확인이 필요하다.
- `decrypt-profiles`, `delete-user`, `bulk-register-users` Edge Function 변경은 실제 Supabase Edge Function 배포 후 원격 환경에서 MFA/AAL2 차단을 재확인해야 한다.
- 새 마이그레이션 `20260504000000_harden_admin_functions_and_views.sql`은 `supabase db push` 후 원격 DB에서 적용 상태를 확인해야 한다.
- 새 마이그레이션 `20260504010000_create_event_applications.sql`은 `supabase db push` 후 원격 DB에서 적용 상태를 확인해야 한다.
- 행사 신청 기능은 원격 DB 마이그레이션 적용 후 실제 로그인 사용자와 관리자 세션으로 신청/수락/잔여 좌석 갱신을 확인해야 한다.
- `documents` bucket은 public read 정책이다. 현재 공개 자료실 요구사항에는 맞지만, 민감 문서는 별도 private bucket과 signed URL 흐름으로 분리해야 한다.
- `decrypt-own-profile` Edge Function이 일시적으로 실패하면 `MyPage` 가입 정보는 fallback 표시 대신 `미입력`으로 남는다. 보안 일관성 측면에서는 맞지만, 운영 중 반복되면 함수 로그 점검이 필요하다.
- HeroSection 등 일부 화면 내부 장식용 `z-index` 값은 이번 작업 범위에서 제외했다. 현재 정리 대상은 전역 충돌 가능성이 큰 헤더, floating UI, 드롭다운, 모달 계층이다.
- ReactQuill에서 `findDOMNode` deprecation warning이 발생할 수 있다. 현재 런타임 실패는 아니지만, ReactQuill 대체 또는 wrapper 개선 후보로 기록한다.
- 로그인된 관리자 세션 기준의 쓰기 액션은 누르지 않았다. 삭제/저장/권한변경은 별도 승인 후 테스트해야 한다.

## 다음 세션 인계 Context
- 오늘의 목적은 Claude/Gemini가 만든 웹사이트를 실제로 테스트하고, 깨진 UI/보안/연동 지점을 디버그하는 것이었다.
- 주요 빌드는 모두 통과했다. 기준 명령은 `npm run build`.
- 현재까지 고친 핵심 이슈는 세 가지다.
  - PII 직접 조인 제거: 관리자 컨설팅/Founder’s Club 화면에서 `profiles(name,email,company)` 직접 표시 경로를 `decrypt-profiles` 기반 매핑으로 변경.
  - 자료실 다중 파일 다운로드 목록 가림 수정: 열린 카드의 레이어만 높여 아래 카드에 가리지 않게 처리.
  - 로그아웃/일반 회원 하단 빈 흰색 토글 제거: `RootLayout`의 관리자 하단 네비게이션을 `isAdmin`일 때만 렌더링.
- 새로 추가한 행사 신청 기능은 `/events/:id/apply` 경로와 `/admin`의 `행사 관리` 탭에서 확인한다.
- 행사 신청 수락 인원은 `event_applications.status = accepted` 기준이며, DB 트리거가 `posts.slots_remaining`을 정원 기준으로 갱신한다.
- 현재 브라우저 테스트 중 과거 콘솔 로그에 Edge Function 호출 실패와 ReactQuill `findDOMNode` warning이 남아 있을 수 있다. 이번 세션에서 새로 발생시킨 치명 오류는 아니다.
- `dist/index.html`과 `dist/assets/*`는 빌드 실행으로 계속 바뀔 수 있다. 코드 리뷰 시 실제 소스 변경과 빌드 산출물을 분리해서 봐야 한다.
- 작업 전부터 수정된 파일이 많았다. 기존 변경사항은 되돌리지 않았고, 필요한 파일만 좁게 수정했다.

---

## 보안 하드닝 1차 감사 및 수정 — 2026-05-07

### 변경 파일
- `src/app/components/admin/AdminUserManagement.tsx`
- `src/app/pages/MyPage.tsx`
- `src/utils/htmlSecurity.ts`
- `src/app/pages/PostDetailPage.tsx`
- `src/app/pages/FaqPage.tsx`
- `src/app/pages/EventApplicationPage.tsx`
- `src/utils/file.ts`
- `src/app/components/admin/AdminPostCreate.tsx`
- `GEMINI.md`

### 구현 내용
- 모든 role 변경에 비밀번호 재확인을 적용했다.
- 관리자 MFA 해제 UI/로직을 차단하고, MFA QR SVG 렌더링을 sanitize 경로로 옮겼다.
- 게시글/FAQ/행사 신청 상세 HTML 렌더링을 공용 sanitizer로 통일했다.
- public `documents` 버킷 업로드 경고와 허용 파일/크기 검증을 공용화했다.

### 검증 결과
`npm run validate` 성공

---

## 보안 하드닝 3차 - role 변경 우회 경로 제거 — 2026-05-07

### 변경 파일
- `supabase/migrations/20260507143000_block_direct_role_updates.sql`
- `GEMINI.md`
- `.gemini_prompts/maker_security.md`
- `.gemini_prompts/reviewer_security.md`

### 구현 내용
- `public.profiles.role` 직접 변경을 막는 DB trigger를 추가했다.
- authenticated 세션의 직접 role UPDATE를 차단하고, role 변경을 service-role 기반 서버 경로로만 가능하게 강제했다.
- role 직접 UPDATE 우회 금지 규칙을 보안 문서와 프롬프트에 반영했다.

### 검증 결과
`npm run validate` 성공
