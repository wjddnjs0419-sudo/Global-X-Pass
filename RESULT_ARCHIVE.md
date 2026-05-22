## 2026-05-21 미디어 페이지 썸네일 머신 통합

- 미디어 게시물도 `postThumbnail.ts`의 대표 썸네일 resolver를 사용하도록 통합했다.
- `/media` 목록과 홈 미디어 섹션은 수동 대표 썸네일(`thumbnail_url`)과 crop(`thumbnail_crop`)을 우선 반영하고, 없을 때는 외부 영상 썸네일 또는 첨부/본문 이미지를 자동 선택한다.
- 관리자 작성/수정과 상세 편집의 수동 썸네일 지원 범위에 `media`를 포함했다.
- 검증: `npm run validate` ✅

---

## 2026-05-21 창구 프로그램 페이지 배경/여백 통합

- `/around-x/window-program`은 기존 `PageShell`의 페이지 제목/설명 배너를 유지하면서, 본문 타임라인은 full-width로 배너 바로 아래에 붙도록 수정했다.
- `WindowProgramTimeline`/`timelineData`를 분리해 홈 `AboutSection`과 창구 페이지 전용 섹션이 같은 타임라인 데이터/렌더러를 공유하게 했다.
- `PageShell`에는 기존 기본값을 유지한 채 본문 `maxWidth`/`padding`을 조정할 수 있는 옵션을 추가했다.
- 검증: `npm run validate` ✅, Playwright 데스크톱/모바일 배너→타임라인 0px 및 타임라인→푸터 0px 확인 ✅

---

## 2026-05-21 HeroSection 프로그램 정보 타이틀 줄바꿈 수정

- 홈 Hero의 프로그램 정보 패널 타이틀을 한/영 모두 `Around X` 다음 줄에 프로그램명이 표시되도록 수정했다.
- `INFO_CONTENT.title`을 문자열 `<br/>`가 아닌 React fragment + 실제 `<br />` 요소로 구성했다.
- 표시 문구: KO `Around X` / `창구 프로그램`, EN `Around X` / `ChangGoo Program`.
- 검증: `npm run validate` ✅, Playwright KO/EN `<br>` 렌더 확인 ✅

---

## 2026-05-21 아키텍처 맵 파일 과밀화 해소 리팩터링

- `LiveArchitectureMap.tsx`의 타입, 상수, storage 유틸, map 유틸, Ops 파이프라인, 플로팅 인박스, 사이드바, 공유 스타일을 `src/app/components/admin/architecture/` 하위 모듈로 분리했다.
- QA polling 종료 조건, Blog Ops pipeline terminal 상태 처리, clipboard guard, 중복 유틸 통합, 미사용 `IncidentFeed.tsx` 제거, 산출물 `.gitignore` 보강을 함께 반영했다.
- 검증: `npm run validate` ✅, `npm run map:build` ✅

## 2026-05-15 QA 카탈로그 선택형 정리

- `CODEX_QA.md`에 번호 기반 QA 카탈로그를 추가해 `썸네일 에디터 및 동적 폼 시각적 무결성 검증 (Visual & UI)`를 1번 항목으로 고정했다.
- QA 진행 중 중간 텍스트 보고를 생략하고, 종료 후 `RESULT.md` 기준 최종 리포트만 전달하는 규칙을 문서화했다.
- 검증: `npm run validate` ✅

## 2026-05-15 관리자 콘텐츠 작성 UI 시각적 무결성 QA

- visible 인앱 브라우저로 `게시물 작성`/`게시물 관리` 흐름을 검증했고, 카테고리 전환과 `AdvancedThumbnailEditor` 모달 자체는 안정적이었다.
- 긴 뉴스레터 편집 화면의 하단에서는 고정 플로팅 네비가 본문과 이미지를 일부 가리는 시각적 간섭을 확인했다.
- 검증: 브라우저 QA 실행만 수행, 코드 변경 없음으로 `npm run validate` 생략 기록.

## 2026-05-15 관리자 콘텐츠 작성 UI 시각적 무결성 QA 재정리

- 방금 수행한 관리자 콘텐츠 작성 시각 QA를 `썸네일 에디터 및 동적 폼 시각적 무결성 검증 (Visual & UI)`로 QA 카탈로그 1번 항목에 고정할 수 있도록 문서화하는 작업을 준비했다.
- QA 중간 텍스트 보고를 생략하고 종료 후 최종 리포트만 전달하는 운영 규칙을 `CODEX_QA.md`에 추가했다.

## 2026-05-15 관리자 로그인/MFA QA 실행

- visible 인앱 브라우저에서 `qa@test.com` 로그인 입력 반영, OTP 챌린지, `Secret_Key` 기반 TOTP 인증, `/admin` 진입, `/mypage`의 관리자 MFA 활성 상태를 확인했다.
- 로그인 폼 입력 fallback은 이번 실행에서 필요하지 않았고, OTP 제출 후 짧은 처리 뒤 `/admin`으로 정상 리다이렉트됐다.
- 검증: 브라우저 QA 실행만 수행, 코드 변경 없음으로 `npm run validate` 생략 기록.

## 2026-05-15 QA 시 인앱 브라우저 자동 노출 규칙 문서화

- `qa` 요청 시에는 별도 요청이 없어도 인앱 브라우저를 visible 상태로 직접 띄우는 규칙을 `AGENTS.md`, `CODEX_QA.md`, `docs/AGENT_RULES.md`에 반영했다.
- 일반 탐색/비QA 작업에는 영향을 주지 않고, 사용자가 백그라운드 점검만 원할 때는 예외로 숨김 검증을 허용하도록 범위를 제한했다.
- 검증: `npm run validate` ✅

## 2026-05-15 관리자 로그인 자동화 문서 보강

- `CODEX_QA.md`에 관리자 로그인 자동화 우회 절차를 추가해 로그인 폼 입력 반영 여부를 OTP 단계보다 먼저 확인하도록 정리했다.
- OTP 자동 입력이 인증 앱 화면 판독이 아니라 `Secret_Key` 기반 실시간 TOTP 계산이라는 점과, MFA 재등록 시 시크릿 최신화 필요성을 문서화했다.
- 검증: 문서 반영 수동 확인 완료, 당시 `npm run validate`는 문서 변경만 있어 생략 기록.

## 2026-05-15 관리자 MFA 분실 복구 + 권한 강등 시 MFA 자동 초기화

- `admin → user/participant`로 권한을 내리면 대상 사용자의 MFA factor가 서버(Auth)에서 자동 삭제되도록 정리했다.
- 같은 계정을 다시 관리자로 승격하면 예전 OTP를 재사용하지 않고, 항상 새 MFA 등록부터 시작하도록 맞췄다.
- 다른 관리자가 회원관리 화면에서 대상 관리자의 MFA를 강제로 초기화할 수 있는 복구 경로를 추가했다.
- 검증: `npm run validate` ✅, Edge Function 배포(`update-user-role`, `reset-mfa`) 완료 ✅

## 2026-05-15 관리자 MFA 중복 factor 복구 + 로그인 플로우 정상화

- `listFactors().all` 기준으로 `verified`/`unverified` TOTP factor를 구분하는 공통 헬퍼를 추가했다.
- `MyPage`를 미설정/미완료/완료 3상태로 분리해 pending factor가 남아 있으면 OTP 마무리 또는 초기화 후 재설정으로 유도했다.
- `LoginPage` OTP 검증은 `challengeAndVerify()` + 세션 토큰 재반영으로 정리했다.
- 검증: `npm run validate` ✅, 인앱 브라우저에서 `qa@test.com`의 pending MFA 복구 UI 노출 확인 ✅

## 2026-05-15 아키텍처 맵 색상 반영 누락 후속 수정

- 개인용 Electron 아키텍처 맵에서 노드 카드와 클러스터 박스가 클러스터별 고유 색으로 구분되도록 명시 팔레트(`blue/green/purple/red/yellow`) 기반 SVG fill 로직으로 교체했다.
- `LiveArchitectureMap.tsx`의 노드 카드/클러스터 박스/상단 accent bar가 CSS 변수 `color-mix(...)` 조합에 의존하지 않도록 수정했다.
- 검증: `npm run validate` ✅, `npm run map:build` ✅, `npm run app:pack` ✅

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

---

## 게시물 대표 썸네일 수동 지정 1차 — 2026-05-11

### 변경 파일
- `supabase/migrations/20260511090000_add_post_thumbnail_crop.sql`
- `src/utils/postThumbnail.ts`
- `src/lib/types.ts`
- `src/app/components/admin/AdminPostCreate.tsx`
- `src/app/pages/NewsPage.tsx`
- `src/app/pages/EventArchivePage.tsx`
- `PLAN.md`

### 구현 내용
- `news`, `events-archive` 게시물에서 본문/첨부 이미지 후보를 대표 썸네일로 수동 지정할 수 있게 했다.
- 게시판별 crop 비율(`news = 10/9`, `events-archive = 16/10`)과 `thumbnail_url`, `thumbnail_crop` 저장/렌더링 경로를 추가했다.
- 원격 migration 적용과 public 카드 crop 렌더링까지 완료했다.

### 검증 결과
`npm run validate`, `supabase db push`, `supabase migration list` 성공

---

## 대표 썸네일 고급 이미지 편집 컴포넌트 — 2026-05-11

### 변경 파일
- `src/app/components/admin/AdvancedThumbnailEditor.tsx`
- `src/app/components/admin/AdminPostCreate.tsx`
- `src/app/components/admin/AdminConsultingManagement.tsx`
- `src/app/pages/AdminPage.tsx`
- `src/app/pages/PostDetailPage.tsx`
- `src/utils/postThumbnail.ts`
- `PLAN.md`
- `RESULT.md`

### 구현 내용
- `news`, `events-archive` 게시물의 대표 썸네일 지정 UI를 업로드/후보 선택/canvas crop 기반 고급 편집기로 교체했다.
- 게시판별 비율(`news = 10/9`, `events-archive = 16/10`)을 유지하고, 적용 시 crop 완료 JPEG data URL을 `thumbnail_url`에 저장하도록 연결했다.
- 상세 페이지 관리자 수정 모드와 컨설팅 전문가 사진 등록에도 동일 편집기를 연결했다.
- 관리자 페이지 활성 탭을 `sessionStorage`에 저장해 컨설팅 관리 화면 리마운트 후 대시보드로 돌아가는 현상을 줄였다.

### 검증 결과
`npm run validate` 성공


---

# Archived from RESULT.md before 아키텍처 맵 리팩터링 (2026-05-21)

# RESULT: 관리자 승격 후 MFA 등록 강제 범위 보강 (2026-05-21)

## 현재 상태
일반 유저가 관리자 권한으로 승격된 뒤 같은 세션에서 새로고침하면 `RootLayout`이 `useAdmin()` 재평가 결과를 기준으로 admin+MFA 미등록 상태를 감지한다. 이 상태에서는 일반 페이지/메뉴를 사용할 수 없고 `/mypage`의 MFA 등록 화면만 사용할 수 있다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/components/RootLayout.tsx` | `adminMfaEnrollmentLocked` 전역 잠금 추가. MFA 미등록 admin이 `/mypage` 외 경로에 있으면 `mfa_setup_required`를 설정하고 `/mypage`로 replace 이동. 잠금 중에는 Header/Footer와 기존 라우트 Outlet 렌더링을 차단. |
| `src/app/pages/MyPage.tsx` | 프로필 로딩 중 중립 로딩 화면을 먼저 표시. MFA 미등록 admin일 때 페이지 타이틀/서브타이틀을 보안 설정 모드로 전환하고 가입 정보, 비밀번호 변경, 관리자 바로가기, 일반 신청 내역을 숨김. 관리자 보안(MFA) 등록/완료 UI만 표시. |
| `docs/AGENT_RULES.md` | admin+MFA 미등록 계정은 공개 앱 전체에서 보안 잠금으로 취급한다는 운영 규칙 추가. |
| `PLAN.md` | 승인 계획을 `[Done]`으로 축약. |

## 동작 정책
- 일반 유저가 admin으로 승격된 뒤 새로고침하면 `profiles.role`과 TOTP factor를 다시 읽고 `/mypage`로 강제 이동한다.
- MFA 미등록 admin은 Header/Footer가 숨겨져 다른 메뉴로 이동할 수 없다.
- `/mypage`에서도 MFA 등록/인증 흐름 외 일반 설정과 신청 내역은 표시하지 않는다.
- 프로필 로딩이 끝나기 전에는 기존 마이페이지 섹션을 먼저 노출하지 않는다.
- MFA 등록 완료 시 기존 흐름대로 `/admin`으로 이동한다.

## 검증 결과
- `npm run validate` ✅
- 수동 브라우저 시뮬레이션은 admin+MFA 미등록 계정 준비가 필요해 이번 턴에서는 실행하지 않음.

---

# RESULT: Ops 파이프라인 운영용 상태 시각화 전환 (2026-05-19)

## 현재 상태
Ops 탭의 파이프라인을 개념도 중심에서 실제 실행 상태를 추적하는 운영용 뷰로 전환했다. 이제 각 노드는 단일 `activeNodeId`가 아니라 `idle / active / success / failed / muted` 상태 맵으로 렌더링된다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | `QaRunTracker`, `PipelineNodeStatus`, 노드별 상태 빌더 추가. QA/블로그/AI 파이프라인 노드 구성과 실제 상태 매핑 재정렬. 컨트롤 패널 상단에 현재 추적 중인 run/suite/상태 메타 표시 추가. |
| `PLAN.md`, `RESULT.md` | 승인 계획 완료 처리 및 세션 결과 최신화. |

## 운영 상태 매핑

| 탭 | 상태 기준 |
|---|---|
| QA | GitHub 실행 성공 시 `suite + trigger 시각`을 저장하고, `qaRuns[0]` 대신 해당 suite의 trigger 이후 run을 우선 매칭한다. `queued / in_progress / completed + conclusion`으로 GitHub, Actions, Playwright, Supabase, Inbox 노드를 표시한다. |
| 블로그 | `sync-naver-blog` 요청, `blog_import_runs` row, GitHub dispatch, import worker, posts 반영 흐름으로 노드를 재구성했다. dispatch 실패는 Actions 노드에서 실패로 보이고, run terminal 상태와 실패 카운트는 worker/posts에 반영된다. |
| AI 초안 | 실제 생성 순서에 맞게 `입력 → 본문 추출 → Style Profile → Gemini → 검증 → 초안 출력`으로 재배치했다. 스타일 재분석, 초안 생성, 수정 요청 각각의 loading/error/success 상태가 노드에 반영된다. |

## 후속 보정

- Active 회전 링과 active 노드 테두리를 노드 고유색이 아니라 상태색(`active` 노랑)으로 통일했다.
- 블로그 동기화 완료 후 `Import Worker`/`Posts`가 계속 active로 남지 않도록 `success`/terminal run 상태를 우선 반영했다.
- 블로그 수동 동기화도 QA처럼 생성된 `blog_import_runs.id` 기준으로 8초 간격 폴링을 시작하고, `success`/`failed` 등 terminal 상태 또는 10분 타임아웃에서 중단하도록 했다.

## 검증 결과

- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- `npm run map:dev` + 인앱 브라우저 진입 확인: `Architecture Map` 로그인 게이트까지 렌더링 확인. Ops 화면은 관리자 계정 + MFA 인증이 필요해 세션 없이 직접 진입하지 않음.

---

# RESULT: 아키텍처 맵 Ops 탭 2차 고도화 (2026-05-19)

## 현재 상태
Ops 탭을 QA / 블로그 / AI 초안 3개 서브탭으로 분리하고, 각 탭에 Make.com 스타일의 좌→우 파이프라인 SVG 다이어그램과 우측 컨트롤 패널을 추가했다. 자동화 실행 중에는 노드가 spinning ring + dash-flow 애니메이션으로 활성화된다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | `OpsSubTab` 타입 + `PipelineNode/Edge` 타입 신규. QA/블로그/AI 파이프라인 노드·엣지 데이터 정의. `OpsPipelineDiagram` SVG 컴포넌트 신규 추가 (viewBox 기반, CSS keyframes — `gxp-dash-flow` · `gxp-spin` · `gxp-pulse`). `OperationsSidebar` 전면 재작성 — 서브탭 바, 파이프라인+컨트롤 2열 레이아웃, QA 상세 설정 접기/펼치기(`qaExpanded`), `animStep` 타이머로 600ms 간격 노드 순환. |

## 파이프라인 구성

| 탭 | 노드 흐름 |
|---|---|
| QA | GitHub → Actions → Playwright → Supabase(qa_runs) → Inbox |
| 블로그 | Naver Blog → Edge Fn → Supabase(blog_import_runs) → Router → GitHub Actions / Auto Publish |
| AI 초안 | 입력(URL/본문) → 본문추출 → Gemini 2.5 Flash → Style Profile → 초안 출력 |

## 애니메이션 방식 (최종 — 실제 상태 기반)
- **idle**: 노드 dim(`#181818`), 점선 정지
- **실행 중**: `activeNodeId`(useMemo) 기반으로 현재 진행 단계 노드만 spinning ring + dash-flow 점등
  - QA: `qaTriggerLoading`→`gh`, `queued`→`ci`, `in_progress`→`pw`, `completed`→`sb`
  - 블로그: `syncLoading`→`ef`, `dispatched true`→`ga`, `false`→`db`
  - AI: `blogAiAnalyzeLoading`→`sp`, `generate/revision`→`gem`
- ~~600ms random cycling 제거~~ → 실제 GitHub Actions 상태에 동기화

## QA 폴링
- `triggerQaRun` 성공 후 8초 간격으로 `readQaRuns()` 폴링 자동 시작
- `completed`/`failure`/`cancelled` 등 종료 상태 감지 시 즉시 중단, 최대 10분(75회) 안전 타임아웃
- `qaPollingRef`(useRef) 로 interval 관리, 컴포넌트 unmount 시 cleanup

## QA 컨트롤 패널 접기/펼치기
- 기본: GitHub 실행 + 로컬 실행 버튼만 표시
- `▼ 상세 설정` 클릭 → Suite 선택 + Visible QA 계정 + GitHub workflow 링크 펼침

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 아키텍처 맵 UI/UX 수정 (2026-05-19)

## 현재 상태
아키텍처 맵 앱의 탭 구조·SVG 인터랙션·사이드바 레이아웃을 개선하고, AdminFlowMap 텍스트를 선착순 자동 확정 흐름에 맞게 갱신했다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | 상위 탭 `"alerts"` 제거 → `"map" \| "ops"` 2탭 구조 확정. SVG 컨테이너에 포인터 이벤트 기반 드래그 패닝 추가(`panState`/`didPan` ref, Pointer Capture, 드래그 vs 클릭 구분). 우측 aside에 `col-resize` 핸들 추가(localStorage `arch-aside-width` 저장, min 220 / max 600). `ArchitectureMapSidebar`에서 `IncidentFeed` 및 `Notable Findings` 섹션 제거 — `Structure Diff` + 타임스탬프만 유지. |
| `src/app/components/admin/AdminFlowMap.tsx` | 컨설팅/FC/행사 흐름 스텝 텍스트를 "어드민 승인" → "선착순 자동 확정(confirmed/accepted)" 기준으로 갱신. 관리자 기능 카드 설명도 "예약 승인" → "예약 관리", "수락/거절" → "취소 관리"로 수정. |

## 주요 UX 변경

- **상위 탭 정리**: `Alerts` 탭 제거, `아키텍처 맵` / `Ops` 2탭만 유지. Alerts 기능은 플로팅 인박스로 이관(기존 완료 항목).
- **SVG 드래그 패닝**: 버튼 클릭과 충돌 없이 맵을 자유롭게 이동 가능. 드래그 임계값 4px로 클릭 오발 방지.
- **aside 가로 리사이즈**: 사이드바 너비를 마우스로 조절, 새로고침 후에도 유지.
- **Notable Findings 제거**: 중복 정보(Incident Feed와 동일 내용) 제거, Structure Diff + 스냅샷 타임스탬프만 표시.

## 검증 결과

- `npm run validate` ✅

---

# RESULT: 블로그 동기화 자동 임포트 + 태그 인라인 편집 (2026-05-19)

## 현재 상태
블로그 동기화 흐름을 "승인 후 재실행" 2단계에서 "동기화 즉시 게시" 단일 흐름으로 전환했다.

## 변경 파일

| 파일 | 내용 |
|---|---|
| `scripts/import-blog-posts.mjs` | `nextQueueStatus` 를 항상 `approved` 반환으로 단순화, events-archive 태그 필수 검사 제거 |
| `src/hooks/useBlogImportAdmin.ts` | `patchTag` 추가(queue+posts 동시 업데이트), `handleApprove`/`handleRetry` 승인 즉시 `triggerRun` 호출, 태그 편집 모드 상태(`editingTagIds`, `enterTagEdit`, `exitTagEdit`) 추가 |
| `src/app/components/admin/AdminBlogQueueManagement.tsx` | 이관완료 항목에 태그 인라인 편집 UI 추가(편집/저장/취소) |

## 흐름 변경

**이전:** 신규 글 발견 → `pending` → 관리자 태그 입력+승인 → 재동기화 → 게시
**이후:** 신규 글 발견 → 자동 `approved` → 동기화 즉시 임포트 → 게시, 태그는 이후 인라인 편집

## 검증 결과

- `npm run validate` ✅

---

# RESULT: 아키텍처 맵 앱 이슈 인박스 단일화 + 플로팅 알림 패널 전환 (2026-05-19)

## 현재 상태
아키텍처 맵 앱의 운영 신호 UI를 하나의 플로팅 인박스로 재편했다. 이제 우측 사이드 `Alerts` 탭 없이, 우하단 벨 버튼으로 `error issue`, 실패/진행중 QA run, 실패/경고 블로그 동기화 run을 한 패널에서 보고 정리할 수 있다.

## 주요 변경

| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | 기존 `Incident Feed`/`AlertsSidebar`/`Open Issues`/`Watch Nodes` 중복 흐름을 단일 `ArchitectureInboxPanel`로 통합 |
| `PLAN.md`, `RESULT.md` | 승인 계획 완료 처리 및 세션 결과 기록 |

## UX 변경점

- 우하단 플로팅 벨 버튼 추가
  - 기본 위치는 우하단
  - 사용자가 드래그로 자유롭게 이동 가능
  - 위치는 `localStorage`에 저장되어 다음 실행에도 유지
- 인박스 패널은 벨 버튼 기준 위쪽으로 펼침
  - 우측 기준 정렬을 유지하면서 viewport 안으로 clamp
  - 패널 외부 클릭 시 닫힘
  - 패널 우측 상단 안쪽에 공용 `X` 닫기 버튼 추가
- 인박스 공통 액션 지원
  - `전체 선택`
  - `읽음`
  - `선택 삭제`
  - `전체 삭제`
- 카드별 보조 액션 유지
  - issue: `Node`
  - QA: `작업 지시서`, `Open`
  - blog: `Open` 또는 `Workflow`

## 구조 변경 메모

- 인박스 데이터는 `ArchitectureInboxItem` 공통 모델로 정규화했다.
- unread/hidden 상태는 QA·블로그별 분리 저장 대신 단일 인박스 저장소로 합쳤다.
- 우측 사이드바는 더 이상 이슈 리스트를 중복 노출하지 않고, 구조 diff/맵 메타/요약 중심으로 축소했다.
- `Ops` 탭의 문구도 새 플로팅 인박스 흐름에 맞게 갱신했다.

## 검증 결과

- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 아키텍처 맵 앱 Ops 탭 AI 블로그 초안 생성기 추가 (2026-05-19)

## 현재 상태
아키텍처 맵 앱 `Ops` 탭에서 이제 터미널 없이 블로그 초안을 만들 수 있다. 기사 URL 또는 본문 붙여넣기로 제목 3개, 본문, 해시태그를 생성하고, 같은 화면에서 수정 요청을 이어서 보내 초안을 다시 다듬을 수 있다.

## 변경 파일

| 파일 | 내용 |
|------|------|
| `src/app/components/admin/LiveArchitectureMap.tsx` | `Ops` 탭에 `AI 블로그 초안 생성` 섹션 추가. 프로파일 경로/샘플 수 입력, URL/본문 입력 토글, 초안 생성, 결과 복사, 수정 요청 재생성 UI 및 상태 메시지 추가 |
| `electron/preload.cjs` | `analyzeBlogStyle`, `generateBlogDraft`, `reviseBlogDraft` IPC 메서드 노출 |
| `electron/main.cjs` | Electron main 프로세스에서 블로그 스타일 분석/초안 생성/초안 수정 요청을 구조화된 IPC로 처리. renderer가 시크릿을 직접 읽지 않도록 `.env`/Gemini/Supabase 로직을 main 뒤로 이동 |
| `scripts/utils/aiStyleAnalyzer.mjs` | 기존 프로파일 기반 생성 검증을 재사용하는 `revisePost()` 추가. 현재 초안 + 원본 기사 + 수정 요청을 받아 새 제목/본문/해시태그를 재생성 |
| `PLAN.md`, `RESULT.md`, `docs/AGENT_RULES.md` | 완료 기록과 운영 규칙 반영 |

## 구현 메모

- 아키텍처 앱은 기존 `QA 수동 실행`, `블로그 동기화`처럼 수동 운영 도구를 모으는 성격이므로, 새 기능도 `Ops` 카드 안에 배치했다.
- 블로그 동기화와 달리 이 기능은 `blog_import_runs` 같은 영속 실행 로그를 남기지 않는다. 결과는 앱 세션에서 확인하고 복사하는 방식으로 유지했다.
- 보안 경계는 CLI와 동일하게 유지했다. `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 renderer가 아니라 Electron main에서만 사용한다.
- 기사 URL 입력 시에는 기존 `fetchArticleText()`를 그대로 재사용했고, 수정 요청도 동일한 제목 3개/40자 제한/본문 길이/해시태그 5개 이상 검증을 통과해야만 결과를 반환한다.
- 후속 보강: Gemini가 본문을 너무 길게 쓰는 경우가 있어, 생성/수정 모두 직전 JSON 응답 + 검증 실패 사유를 붙여 자동 보정 재생성하는 루프를 추가했다. 이제 1차 응답이 1100자 기준을 넘겨도 바로 실패하지 않고 먼저 스스로 줄여 다시 제출한다.

## 검증 결과

- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

## 사용 흐름

1. 아키텍처 맵 앱 `Ops` 탭에서 프로파일 경로와 필요 시 샘플 수를 확인한다.
2. `스타일 프로파일 재분석`으로 최신 스타일 파일을 다시 만들 수 있다.
3. `기사 URL` 또는 `본문 붙여넣기`를 선택해 `AI 블로그 초안 생성`을 누른다.
4. 결과 카드에서 제목/본문/해시태그를 개별 또는 전체 복사한다.
5. 필요하면 아래 `수정 요청`에 “첫 문단 더 짧게”, “제목 더 공식적으로” 같은 지시를 넣고 다시 생성한다.

---

# RESULT: AI 블로그 포스팅 CLI 프로파일 재사용 구조 전환 (2026-05-19)

## 현재 상태
`blog:ai-generate`가 더 이상 매 실행마다 `events-archive` 샘플 27개를 다시 프롬프트에 넣어 분석하지 않는다. 이제 `blog:analyze-style`을 1회 실행해 스타일 프로파일을 생성하고, 이후 포스팅 생성은 저장된 프로파일(JSON)을 로드해 진행한다.

## 신규 파이프라인

```text
[초기 1회]
npm run blog:analyze-style
-> Supabase posts(events-archive) 27개 조회
-> Gemini 2.5 Flash 스타일 분석
-> docs/ai/blog-style-profile.json 저장
-> docs/ai/blog-style-guide.md 저장

[반복 생성]
npm run blog:ai-generate -- --input-url <기사 URL>
-> 기사 본문 추출
-> 저장된 스타일 프로파일 로드
-> Gemini 2.5 Flash로 제목/본문/해시태그 생성
```

## 신규 파일

| 파일 | 내용 |
|------|------|
| `scripts/analyze-blog-style.mjs` | 스타일 분석 1회성 CLI. 기본 27개, 최대 30개 샘플 분석 후 JSON/MD 저장 |
| `scripts/utils/blogStyleProfile.mjs` | 스타일 프로파일 경로, 로드, 검증, Markdown 가이드 렌더링 유틸 |
| `scripts/utils/articleExtractor.mjs` | URL 기사 본문 추출 유틸. 노이즈 제거, 후보 블록 점수화, 품질 검증 포함 |
| `docs/ai/blog-style-profile.json` | Gemini가 27개 샘플에서 추출한 기계 판독용 스타일 프로파일 |
| `docs/ai/blog-style-guide.md` | 사람이 읽고 검토하기 쉬운 스타일 가이드 |

## 수정 파일

| 파일 | 내용 |
|------|------|
| `scripts/utils/aiStyleAnalyzer.mjs` | 샘플 즉석 분석+생성 결합 구조를 `analyzeStyleProfile()`과 프로파일 기반 `generatePost()`로 분리 |
| `scripts/generate-ai-post.mjs` | 샘플 재조회 제거. 기본 프로파일을 먼저 로드하고, 누락 시 `blog:analyze-style` 실행 안내 |
| `package.json`, `package-lock.json` | `blog:analyze-style` 스크립트 추가, `@google/generative-ai`를 런타임 `dependencies`로 이동 |
| `PLAN.md`, `RESULT.md` | 작업 계획 완료 처리와 결과 기록 |

## 보강된 허점

- `--samples` 안내 불일치 제거: 생성 CLI에서 샘플 옵션을 제거하고, 분석 CLI에만 기본 27/최대 30 기준을 유지했다.
- URL 본문 추출 안정화: `article/main/body` 태그 단순 추출 대신 도메인/본문 후보 셀렉터, 링크 밀도, 문장 수, 한글 비율, 노이즈 문구 기준으로 후보를 고른다.
- 생성 결과 검증: 제목 정확히 3개, 제목 40자 이내, 본문 길이 범위, 해시태그 5개 이상을 검증한다.
- 프로파일 누락 UX: 프로파일이 없으면 Gemini 호출 전에 실패하고 `npm run blog:analyze-style` 실행을 안내한다.
- 런타임 의존성: `@google/generative-ai`를 `dependencies`로 이동해 dev 의존성 생략 설치에서도 CLI가 깨지지 않도록 했다.

## 사용법

```bash
# 최초 1회: 스타일 분석 프로파일 생성
npm run blog:analyze-style

# URL 입력
npm run blog:ai-generate -- --input-url https://n.news.naver.com/article/...

# 클립보드 (macOS)
pbpaste | npm run blog:ai-generate -- --input-stdin

# 텍스트 파일
npm run blog:ai-generate -- --input-file article.txt

# 다른 프로파일 사용
npm run blog:ai-generate -- --input-file article.txt --profile docs/ai/blog-style-profile.json
```

## 환경변수 (.env 필수)

```
GEMINI_API_KEY=AIza...        # Google AI Studio(aistudio.google.com)에서 발급
VITE_SUPABASE_URL=...         # 기존 값 그대로
SUPABASE_SERVICE_ROLE_KEY=... # 기존 값 그대로
```

## 검증 결과
- `node scripts/generate-ai-post.mjs --help` ✅
- `node scripts/analyze-blog-style.mjs --help` ✅
- `npm run blog:analyze-style` ✅
- `node --check scripts/*.mjs scripts/utils/*.mjs` 대상 주요 신규/수정 파일 ✅
- `blog:ai-generate --input-stdin` 프로파일 기반 생성 테스트 ✅
- 프로파일 누락 실패 메시지 확인 ✅
- URL 추출 유틸 data URL 노이즈 HTML 테스트 ✅
- `npm run validate` ✅

## 다음 단계 (미구현 — Codex 이어받기 가능)

1. **Naver Blog API 연결**: `generate-ai-post.mjs`에 `--post-to-naver` 플래그 추가
   - 생성된 포스팅을 네이버 블로그 API로 자동 업로드
   - 네이버 블로그 OAuth 2.0: `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` / `NAVER_REFRESH_TOKEN` 환경변수 필요
   - 업로드 후 기존 `blog:discover` → `blog:worker` 파이프라인이 RSS를 통해 자동 픽업 → 웹사이트 반영

2. **스타일 프로파일 다중화**: `blog:analyze-style --board news` 같은 확장으로 `events-archive` / `news` 프로파일을 별도 생성 가능하게

---

# RESULT: 컨설팅/Founder's Club 확정 모달 X 닫기 버튼 추가 (2026-05-19)

## 현재 상태
1:1 컨설팅과 Founder's Club 신청 완료 모달의 우측 상단 안쪽에 `X` 닫기 버튼을 추가했다. 기존 모달 외곽 클릭 닫기, `예약 취소`, `내 신청 내역 보기` 액션은 그대로 유지했다.

## 변경 파일

| 파일 | 내용 |
|---|---|
| `src/app/components/ConsultingBookingModal.tsx` | 성공 상태에서만 보이는 `X` 아이콘 닫기 버튼 추가 |
| `src/app/pages/FoundersClubPage.tsx` | 성공 상태에서만 보이는 `X` 아이콘 닫기 버튼 추가, 닫을 때 완료 모달 상태 초기화 |
| `PLAN.md`, `RESULT.md` | 작업 결과 기록 |

## 검증 결과
- `npm run validate` ✅

---

# RESULT: 프로그램 확정 화면 공용 컴포넌트화 + 이메일 안내 통일 (2026-05-19)

## 현재 상태
행사 신청, 1:1 컨설팅, Founder's Club의 확정 화면을 `ProgramConfirmationCard`로 공용화했다. 행사 신청 화면의 초록 체크 마크 톤은 유지했고, 성공 화면 안의 작은 `확정` 상태 뱃지는 제거했다. 세 프로그램의 후속 안내 문구는 `연락처`가 아니라 `등록된 이메일` 기준으로 통일했다.

## 변경 파일

| 파일 | 내용 |
|---|---|
| `src/app/components/ProgramConfirmationCard.tsx` | 신규 공용 확정 카드. 체크 아이콘, 제목/설명, 라우팅/외부링크/클릭 액션 버튼을 공통 렌더링 |
| `src/app/pages/EventApplicationPage.tsx` | 성공 영역을 공용 카드로 교체, `신청 취소`와 `내 신청 내역 보기` 유지, 상태 뱃지 제거 |
| `src/app/components/ConsultingBookingModal.tsx` | 예약 완료 상태를 공용 카드로 교체, `예약 취소`와 `내 신청 내역 보기` 추가, 생성된 예약 ID 기반 즉시 취소 처리 |
| `src/app/pages/FoundersClubPage.tsx` | 참여 완료 상태를 공용 카드로 교체, `예약 취소`와 `내 신청 내역 보기` 추가, 생성된 신청 ID 기반 즉시 취소 처리 |
| `src/utils/eventApplication.ts` | 행사 기본 완료 문구를 `행사 참가가 확정되었습니다.` / 이메일 안내로 변경, 기존 레거시 완료 문구 표시 보정 |
| `tests/qa/user-*.spec.ts` | 바뀐 확정 문구와 버튼 조합에 맞춰 기대값 갱신 |
| `docs/AGENT_RULES.md` | 프로그램 확정 UI는 `ProgramConfirmationCard`를 재사용한다는 규칙 추가 |

## 검증 결과
- `npm run validate` ✅
- `npx playwright test --list tests/qa/user-event-application.spec.ts tests/qa/user-consulting-booking.spec.ts tests/qa/user-founders-club.spec.ts` ✅

## 메모
- 기존에 쓰이던 공용 성공/확정 컴포넌트는 없어서 삭제할 대상은 없었다.
- 범용 `dialog`, `alert-dialog` primitive는 다른 용도 가능성이 있어 유지했다.

---

# RESULT: 프로그램 신청 흐름 선착순 자동 확정 전환 (2026-05-19)

## 현재 상태
행사 신청, 1:1 컨설팅, Founder's Club을 **선착순 자동 확정 + 관리자 사후 취소 관리** 흐름으로 전환했다. 신규 행사/FC 신청은 `accepted`, 신규 컨설팅 예약은 `confirmed`로 즉시 저장된다. 기존 `pending/rejected/cancelled` 찌꺼기 프로그램 데이터는 migration에서 정리하고, 상태값 자체는 호환성을 위해 유지한다.

## 변경 파일

| 파일 | 내용 |
|---|---|
| `supabase/migrations/20260519120000_auto_confirm_program_applications.sql` | event/FC/consulting 기본 status 자동 확정값으로 변경, 비확정 찌꺼기 데이터 정리, event/FC/consulting insert 정책을 자동확정·정원·마감·슬롯 available 조건에 맞게 강화 |
| `src/utils/eventApplication.ts` | 행사 기본 완료 문구와 상태 라벨을 `확정` 중심으로 변경 |
| `src/app/pages/EventApplicationPage.tsx` | 행사 신청 insert 시 `accepted` 저장, 완료/정원 문구 확정 중심 반영, 신청 직후 확정 인원 state 즉시 보정 |
| `src/app/components/ConsultingBookingModal.tsx` | 컨설팅 예약 insert 시 `confirmed` 저장, 완료 문구를 예약 확정으로 변경 |
| `src/app/pages/FoundersClubPage.tsx` | FC 신청 insert 시 `accepted` 저장, 수락/검토 문구를 확정/참여 확정으로 변경 |
| `src/app/pages/MyPage.tsx` | 세 프로그램 상태 라벨과 섹션 제목을 확정/예약/참가 중심으로 변경 |
| `src/app/components/admin/AdminEventManagement.tsx` | `신청 승인` 탭을 `참가자 관리`로 전환, 확정 참가자 취소 중심 UI로 변경 |
| `src/app/components/admin/AdminConsultingManagement.tsx` | `예약 승인`을 `예약 관리`로 전환, 확정 예약에도 취소 액션 노출 |
| `src/app/components/admin/AdminFoundersClubManagement.tsx` | `신청 관리`를 `참여자 관리`로 전환, 확정 참여자 취소 중심 UI로 변경 |
| `src/app/components/admin/AdminFlowMap.tsx` | 프로그램 흐름 설명을 자동 확정 모델로 갱신 |
| `src/app/pages/TermsOfUsePage.tsx` | 프로그램 신청 약관 문구를 선착순 확정 기준으로 갱신 |
| `tests/qa/*.spec.ts` | 행사/FC/컨설팅 QA 기대 문구를 확정 모델에 맞게 갱신 |

## 검증 결과
- `npm run validate` ✅
- `npx playwright test --list tests/qa/user-event-application.spec.ts tests/qa/user-founders-club.spec.ts tests/qa/user-consulting-booking.spec.ts` ✅
- `supabase db lint` ⚠️ 로컬 Supabase DB(`127.0.0.1:54322`)가 실행 중이 아니어서 접속 실패. SQL은 migration 파일로 작성했고, 실제 적용 전 `supabase start` 또는 원격 적용 흐름에서 재확인 필요.

## 운영 메모
- 행사와 Founder's Club의 마감은 기존 `accepted_count` 기반 트리거/화면 계산을 그대로 사용한다.
- 컨설팅은 기존 슬롯 `available -> booked` 흐름과 active reservation unique index를 유지한다.
- 관리자 UI의 기본 액션은 이제 승인/거절이 아니라 확정 내역 취소다.

---

# RESULT: isDark 하드코딩 → CSS 토큰 전환 완료 (2026-05-19)

## 현재 상태
admin 패널 전체(13개 파일)에서 `useTheme().isDark` 기반 인라인 색상 하드코딩을 CSS 디자인 토큰(`var(--color-*)`)으로 완전 전환했다. `src/styles/theme.css`에 다크/라이트 양쪽 신규 토큰을 추가하고, `npm run validate` 최종 통과.

## 변경 파일

| 파일 | 내용 |
|---|---|
| `src/styles/theme.css` | 신규 토큰 52개 추가 (dark :root + light html:not(.dark)): surface-active/hover, glass-border-medium, admin-chip-bg, tab-selected-bg, success-text, chart-blue/teal, checker-pattern, FlowMap node/dot/map 계열 26종 |
| `AdminBlogQueueManagement.tsx` | useTheme 제거, 9변수 블록 → CSS 토큰 |
| `AdminEventManagement.tsx` | useTheme 제거, deleteBg/deleteBorder → danger-soft 토큰 |
| `AdminPostManage.tsx` | useTheme 제거, delete 버튼 인라인 → danger-soft 토큰 |
| `AdminUserManagement.tsx` | useTheme 제거, 12변수 블록 → CSS 토큰 |
| `AdminFoundersClubManagement.tsx` | useTheme 제거, getStatusPillStyle(c.color) 으로 축약 |
| `AdminPostModal.tsx` | useTheme 제거, dangerBg/dangerBorder → CSS 토큰 |
| `AdminBulkResultModal.tsx` | useTheme 제거, success/danger 인라인 → CSS 토큰 |
| `AdminDashboard.tsx` | useTheme 제거, 9변수 블록 → CSS 토큰 (chart/rank 포함) |
| `NotificationBell.tsx` | isDark prop 제거, CSS 토큰 직접 사용 |
| `AdminPage.tsx` | `<NotificationBell isDark={isDark} />` → `<NotificationBell />` |
| `AdminSidebar.tsx` | useTheme 제거, activeBg/hoverBg/activeBorder 등 → CSS 토큰 |
| `AdvancedThumbnailEditor.tsx` | useTheme 제거, checkerBg → var(--color-checker-pattern) |
| `AdminFlowMap.tsx` | useTheme 제거, N()/dot() 팔레트 전체 → node/dot CSS 토큰, 필터 활성 → map-filter-active, 본문 텍스트 14곳 → map-body-text |
| `AdminPostCreate.tsx` | **유지** — quill 에디터 className `quill-dark`/`quill-light` 이 useTheme 필요, 나머지 모두 토큰화 |

## 검증 결과
- `npm run validate` ✅ (tsc --noEmit + eslint --max-warnings=0 + vite build + secret scan)

---

# RESULT: 참여 기업 디렉토리 UX 마무리 — 상세 페이지 + 페이지네이션 (2026-05-18)

## 현재 상태
상세 페이지에서 분야·웹사이트 항목을 데이터 유무와 무관하게 항상 표시하도록 수정했다. 목록 페이지에 기존 Pagination 컴포넌트를 적용해 4열 × 5행(20개) 페이지 단위로 표시한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/pages/CompanyDetailPage.tsx` | 분야 배지: 항상 렌더링, 비어있으면 점선 테두리 + "분야 미입력". 웹사이트 섹션: 항상 렌더링, 비어있으면 "미입력" 텍스트 |
| `src/app/pages/CompaniesPage.tsx` | `PAGE_SIZE=20`, `currentPage` state, `paged` 슬라이스, `lg:grid-cols-4` 4열 그리드, 하단 Pagination 컴포넌트 추가. 검색어 변경 시 1페이지 리셋 |

## 검증 결과
- `npm run validate` ✅

## 동작
- 100개 기업 → 5페이지 (20개씩)
- 검색 시 결과 기준으로 페이지 재계산, 자동 1페이지 리셋
- 데이터 입력 후 분야·웹사이트 자동으로 정상 스타일 전환

---

# RESULT: 참여 기업 CSV 일괄 업로드 + 실제 엑셀 데이터 주입 (2026-05-18)

## 현재 상태
창구 8기 100개 참여사 엑셀(`홈페이지 기업설명.xlsx`)을 CSV로 변환하고, AdminCompaniesManagement에 CSV 일괄 업로드 기능을 추가했다. 관리자가 `companies-changgoo8.csv`를 선택·업로드하면 companies 테이블에 일괄 INSERT되며 slug 중복 행은 자동 skip된다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `demo-data/convert.py` | 엑셀→CSV 변환 스크립트. 아이템명+아이템소개 합산, HTML 엔티티 디코딩, RFC 4180 QUOTE_ALL 출력 |
| `demo-data/companies-changgoo8.csv` | 100개 참여사 CSV (UTF-8, RFC 4180). 컬럼: name/industry/description/website_url |
| `src/app/components/admin/AdminCompaniesManagement.tsx` | `parseCsvRow()` / `parseCsv()` 헬퍼 추가, CSV 관련 state 5개 추가, `openCsvUpload()` / `closeCsvUpload()` / `handleCsvUpload()` 핸들러 추가, 헤더에 "CSV 업로드" 버튼 추가, inline CSV 업로드 섹션 JSX 추가, 등록 폼과 상호 닫힘 처리 |

## 기술 구현 상세
- **CSV 파서**: RFC 4180 quoted field 완전 지원 (`""` 이스케이프 처리). 외부 라이브러리 없음.
- **헤더 동적 매핑**: 컬럼 순서 무관하게 헤더명(`name`, `industry`, `description`, `website_url`)으로 인덱스 탐색
- **INSERT 전략**: `supabase.upsert(rows, { onConflict: "slug", ignoreDuplicates: true }).select("id")` → inserted = data.length, skipped = 전체 - inserted
- **엑셀 컬럼 매핑**: 기업명(B)→name, 아이템명(D)+"—"+아이템소개(C)→description, industry·website_url 빈 문자열 (엑셀에 없음)

## 검증 결과
- `npm run validate` ✅ (tsc --noEmit, eslint --max-warnings=0, vite build, secret scan 모두 통과)

## 수동 확인 체크리스트
| 동작 | 확인 내용 |
|---|---|
| 관리자 → 참여 기업 관리 | "CSV 업로드" 버튼 노출 |
| CSV 업로드 버튼 클릭 | inline 섹션 펼침, 기업 등록 폼과 상호 닫힘 |
| `companies-changgoo8.csv` 선택 → 업로드 | `✅ N개 등록 완료, M개 중복 skip` 결과 메시지 |
| 동일 CSV 재업로드 | 전체 skip (0개 등록, 100개 skip) |
| `/companies` | 카드 그리드, 검색, 총 100개 기업 카운트 |
| `/companies` (미로그인) | `/login` 리다이렉트 |
| 카드 overflow | 긴 description `line-clamp-3` truncation |
| 모바일 375px | `grid-cols-1` 반응형 |

## 백로그
- `CompanyDetailPage`에 `.eq("status","published")` 쿼리 필터 추가 (현재 RLS만 의존, 동작 오류 없음)

---

# RESULT: 참여 기업 디렉토리 기능 추가 (2026-05-18)

## 현재 상태
Resources 하위 메뉴에 "참여 기업" 디렉토리가 추가됐다. Supabase `companies` 테이블을 migration으로 생성하고, `/companies` 목록 + `/companies/:slug` 상세 페이지를 AuthRoute로 보호했다. 관리자 페이지에 "참여 기업 관리" 탭이 추가되어 CRUD 가능하다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `supabase/migrations/20260518100000_create_companies.sql` | `companies` 테이블 생성. authenticated SELECT (published only) + admin SELECT all + admin INSERT/UPDATE/DELETE RLS 설정 |
| `src/lib/types.ts` | `Company` 인터페이스 추가 |
| `src/app/routes.tsx` | `/companies` (목록) + `/companies/:slug` (상세) AuthRoute children으로 묶어 라우팅 추가 |
| `src/app/components/HeaderSection.tsx` | `resources` 메뉴 items에 `{ ko: "참여 기업", en: "Companies", path: "/companies" }` 추가 |
| `src/app/pages/CompaniesPage.tsx` | 신규 — 검색창(클라이언트 필터) + 카드 그리드 목록 페이지 |
| `src/app/pages/CompanyDetailPage.tsx` | 신규 — slug 단건 조회, 4개 필드 표시, 404 처리, 웹사이트 `noopener noreferrer` |
| `src/app/components/admin/AdminCompaniesManagement.tsx` | 신규 — 기업 등록/수정/삭제 CRUD UI (IME Enter submit 없이 버튼 클릭 전용) |
| `src/app/pages/AdminPage.tsx` | `TabId`에 `"companies"` 추가, `ADMIN_TABS` 배열 추가, `AdminCompaniesManagement` lazy import + 렌더링 케이스 추가 |
| `src/app/components/admin/AdminSidebar.tsx` | `TabId`에 `"companies"` 추가, "콘텐츠" 섹션에 "참여 기업 관리" 탭 추가 |

## 검증 결과
- `npm run validate` ✅ (tsc --noEmit, eslint, vite build, secret scan 모두 통과)
- `npm run map:build` ✅

## DB Migration 적용
- `supabase db push` ✅ (2026-05-18 적용 완료 — `companies` 테이블 + RLS 5개 정책 운영 DB 반영)

## 수동 확인 URL (Netlify 배포 후)
| URL | 확인 내용 |
|---|---|
| `/companies` | 목록 페이지 렌더링, 검색창, 카드 그리드 |
| `/companies` (미로그인) | `/login` 리다이렉트 |
| `/companies/:slug` | 상세 페이지 4개 필드 + 웹사이트 링크 |
| `/companies/없는slug` | 404 메시지 렌더링 |
| 헤더 Resources 드롭다운 | "참여 기업" 항목 노출 |
| `/admin` → 참여 기업 관리 탭 | CRUD 기능 |

---

# RESULT: QA Alerts 고도화 — AI 에이전트 작업 지시서 자동 생성 (2026-05-18)

## 현재 상태
아키텍처 앱 Alerts 탭의 QA 섹션에서 실패한 run 카드에 **"작업 지시서"** 토글 버튼이 추가됐다. 버튼을 클릭하면 suite별 관련 테스트 파일/소스 파일과 실패 정보를 포함한 AI 에이전트용 마크다운 프롬프트가 카드 안에 펼쳐지고, **"복사"** 버튼으로 클립보드에 바로 복사할 수 있다. 성공 run에는 버튼이 표시되지 않는다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | `QA_SUITE_FILES` 매핑 테이블 추가(suite→테스트 파일·소스 파일), `generateAgentPrompt()` 함수 추가, `QaAlertsSection`에 `expandedPromptId`/`copiedId` state와 `copyToClipboard()` 추가, 카드에 "작업 지시서" 토글 버튼 및 프롬프트 `<pre>` 블록 추가 |
| `PLAN.md`, `RESULT.md` | 완료 반영 및 결과 기록 |

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

## 작업 지시서 포함 정보
- 실패 suite 이름 및 레이블
- 실패 Job / Step (있을 경우)
- 발생 시각, branch, 실행자, GitHub 링크
- suite별 관련 테스트 파일 목록
- suite별 참조 소스 파일 목록
- 1~4번 작업 지시 항목

---

# RESULT: Git 브랜치/QA workflow 기준 정리 (2026-05-18)

## 현재 상태
`backup/*` 브랜치와 `main`, GitHub QA workflow ref, Playwright 테스트 대상 URL이 섞여 보이던 혼선을 제거했다. 앞으로 QA/수정의 코드 기준은 `origin/main`, 브라우저 테스트 대상은 `PLAYWRIGHT_BASE_URL` env(없으면 운영 Netlify URL)로 명확히 분리된다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `playwright.config.ts` | `baseURL`을 `process.env.PLAYWRIGHT_BASE_URL \|\| '운영URL'`로 변경 |
| `.github/workflows/qa-dispatch.yml` | `base_url` workflow input 추가 + `PLAYWRIGHT_BASE_URL` env 전달 |
| `docs/AGENT_RULES.md` | `## Git Branch Source-of-Truth` 섹션 신규 추가 |

## 검증 결과
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `npm run validate` ✅

## 비고
- 로컬 `backup/20260427-stable` upstream이 `origin/backup/qa-consulting-stabilization-20260518`로 어긋난 상태는 destructive 작업 없이 현상 보고만 했다. 원격 `backup/*` 정리는 별도 명시적 승인 시에만 수행한다.

---

# RESULT: GitHub QA `all` 1차 실패 보강 (2026-05-18)

## 현재 상태
GitHub Actions `all` run #38은 11개 중 9개가 통과했고, `admin-post-cud`와 `user-consulting-booking` 두 곳만 남았다. `admin-post-cud`는 공개 페이지 검증 후 다시 `/admin`으로 돌아갈 때 사이드바가 보이지 않아 실패했고, `user-consulting-booking`은 단독 run #37은 성공했지만 `all` 안에서는 공개 `/consulting` 목록에서 방금 만든 QA 전문가 카드가 아직 보이지 않았다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | `openAdminTab()`에서 사이드바 버튼이 보이지 않으면 현재 세션을 정리하고 관리자 재로그인 후 `/admin`을 다시 여는 복구 경로 추가 |
| `tests/qa/user-consulting-booking.spec.ts` | 공개 컨설팅 카드 확인 전에 짧은 reload retry를 넣어 운영 DB/화면 반영 지연을 흡수 |
| `PLAN.md`, `RESULT.md` | `all` run #38 실패 원인과 1차 보강 내용 기록 |

## 검증 결과
- `npm run validate` ✅
- GitHub Actions `all` run #39 ✅
  - https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/26014499944

---

# RESULT: `user-consulting-booking` watchdog 범위 축소 (2026-05-18)

## 현재 상태
`main`에는 관리자 컨설팅 페이지 lazy fetch 수정이 반영됐지만, GitHub QA는 체크아웃한 앱을 실행하지 않고 운영 Netlify URL(`https://google-play-changgoo-program.netlify.app`)을 대상으로 테스트한다. 운영 배포 번들이 아직 예전이면 Actions는 계속 예전 관리자 페이지의 `consulting-admin-reservations` console error를 볼 수 있다. 그래서 `user-consulting-booking`의 runtime watchdog를 관리자 fixture 준비 단계가 아니라 일반 유저 로그인 이후 실제 `/consulting` 예약 흐름부터 설치하도록 좁혔다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/user-consulting-booking.spec.ts` | `installQaFailureWatchdog()` 설치 시점을 테스트 시작에서 일반 유저 로그인 완료 직후로 이동, 성공 시 listener를 정상 해제하고 실패 시 finally에서 best-effort로 해제 |
| `PLAN.md`, `RESULT.md` | 최신 원인과 조치 기록 |

## 검증 결과
- `npm run validate` ✅
- GitHub Actions `user-flows` run #36 ✅
  - https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/26013944531
- GitHub Actions `user-consulting-booking` run #37 ✅
  - https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/26014087354

## 비고
- 앱 쪽 lazy fetch 수정은 여전히 유지한다. Netlify 배포가 최신화되면 관리자 페이지 자체의 불필요한 Edge Function 호출도 사라진다. 이번 테스트 수정은 그 배포 지연과 무관하게 user-flow suite가 자기 책임 범위만 감시하게 만드는 보강이다.

---

# RESULT: AdminConsultingManagement 예약 조회 lazy fetch 전환 (2026-05-18)

## 현재 상태
최신 `user-flows` 재실패의 직접 원인은 `user-consulting-booking` 본문이 아니라 관리자 `컨설팅 관리` 페이지였다. setup/cleanup 과정에서 `/admin`의 `컨설팅 관리` 탭이 mount되자마자 `consulting-admin-reservations` Edge Function을 호출했고, 이 요청이 실패하면서 `console.error("컨설팅 예약 조회 오류: ...")`가 QA watchdog에 잡혀 suite가 실패했다. 이제 초기 마운트에서는 컨설턴트 목록만 읽고, 예약 목록은 실제로 `reservations` 탭에 들어갈 때만 lazy fetch한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/AdminConsultingManagement.tsx` | 초기 `Promise.all([fetchConsultants(), fetchReservations()])`를 제거하고 `fetchConsultants()`만 실행하도록 조정, `subTab === "reservations"`일 때만 `fetchReservations()`를 호출하는 `useEffect` 추가 |
| `PLAN.md`, `RESULT.md` | 승인 계획 압축 및 최신 실패 원인/수정 결과 기록 |

## 검증 결과
- `npm run validate` ✅

## 비고
- 이번 수정은 예약 승인/거절 후의 `fetchReservations()` 재호출 흐름은 유지한다. 즉 예약 탭 기능은 그대로 두고, 비예약 탭 진입 시에만 불필요한 Edge Function 호출을 막는 방향으로 최소 수정했다.

---

# RESULT: QA `user-consulting-booking` 재진입 대기 안정화 (2026-05-18)

## 현재 상태
`user-consulting-booking`이 두 번째 `/consulting` 진입 직후 카드와 모달이 다시 렌더링되기 전에 `예약 신청` 버튼을 눌러 flaky하게 깨질 수 있던 구간을 보강했다. 이제 카드 루트와 모달 상태를 명시적으로 기다린 뒤 상호작용하므로, 첫 진입에서는 슬롯 버튼이 실제로 나타났는지 확인하고, 재진입에서는 `현재 예약 가능한 슬롯이 없습니다.` empty-state가 그려질 때까지 기다린다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/user-consulting-booking.spec.ts` | `getConsultingCard()`/`openConsultingBookingModal()` helper 추가, `/consulting` 재진입 후 카드 visible 대기와 모달 슬롯/empty-state 대기 보강 |
| `PLAN.md`, `RESULT.md` | 승인 계획 압축 및 최신 세션 결과 기록 |

## 검증 결과
- `npx playwright test --list tests/qa/user-consulting-booking.spec.ts` ✅
- `npm run validate` ✅

## 비고
- 실제 end-to-end 재확인은 `QA_ADMIN_*`, `QA_USER_*`가 연결된 환경에서 `npx playwright test tests/qa/user-consulting-booking.spec.ts --project=chromium` 또는 `user-flows` 재실행으로 확인하면 된다. 현재 로컬 세션에는 QA 자격 증명이 없어 구조/빌드 검증까지만 수행했다.

---

# RESULT: QA GitHub Actions 아티팩트 보관 기간 3일로 축소 (2026-05-18)

## 현재 상태
On-Demand QA workflow가 업로드하는 GitHub Actions 아티팩트의 보관 기간을 `30일`에서 `3일`로 줄였다. 이제 `playwright-report-*`, `playwright-raw-artifacts-*`는 사후 디버깅에는 충분히 짧게 유지되면서도 Actions artifact storage 누적은 더 빠르게 줄어든다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | 두 `actions/upload-artifact@v4` 단계의 `retention-days`를 `3`으로 조정 |
| `CODEX_QA.md` | GitHub 실행 기록 아티팩트의 현재 보관 기간이 3일임을 문서에 반영 |
| `PLAN.md`, `RESULT.md` | 승인 계획 압축 및 최신 세션 결과 기록 |

## 검증 결과
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `npm run validate` ✅

## 비고
- 기존에 이미 업로드된 아티팩트의 보관 기간이 소급 변경되지는 않는다. 새 정책은 이번 수정 이후 생성되는 QA 아티팩트부터 적용된다.

---

# RESULT: Founders Club user QA 회귀 안정화 (2026-05-18)

## 현재 상태
`user-founders-club` suite가 실제 앱 동작에 맞게 안정화됐다. 이제 일반 유저 신청 후 재신청 불가 상태를 제목 기준의 정확한 카드 scope로 검증하고, 세션 마감 이후 비로그인 사용자는 별도 익명 브라우저 컨텍스트에서 `/founders-club` 접근 시 `/login`으로 리다이렉트되는 것을 확인한다. 반복 실패를 만들던 false positive는 공통 watchdog 정리로 제거했고, GitHub Actions `user-founders-club` run `#29`가 최종 성공했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/user-founders-club.spec.ts` | 공개 카드 locator를 제목 기준 helper로 고정, 상태 pill assertion strict-safe화, 비로그인 접근 차단은 새 익명 브라우저 컨텍스트에서 검증하도록 변경 |
| `tests/qa/utils/auth.ts` | watchdog가 검사 시점 이후 cleanup 노이즈를 수집하지 않도록 listener 해제를 추가하고, `ERR_ABORTED`/`Failed to fetch` 계열 false positive를 무시하도록 보강 |
| `PLAN.md`, `RESULT.md` | 이번 회귀 수정과 최종 성공 run 기록 반영 |

## 검증 결과
- `npx playwright test --list tests/qa/user-founders-club.spec.ts` ✅
- `npm run validate` ✅
- GitHub Actions `user-founders-club` run `#29` ✅
  - [run #29](https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/26011051995)

## 비고
- `/founders-club`는 실제로 [AuthRoute](/Users/jeongwonkim/Desktop/Global%20X%20Pass/src/app/routes.tsx:53) 뒤에 있으므로, 기존 “공개 마감 표시” 기대값은 제품 동작과 맞지 않았다. 이번 수정으로 suite 기대값을 현재 라우팅 규칙에 맞췄다.

---

# RESULT: QA 일반 유저 로그인 판정 및 Founders cleanup 보강 (2026-05-18)

## 현재 상태
일반 유저 로그인 성공 시 뜨는 환영 alert를 QA helper가 실패로 잘못 해석하던 문제를 바로잡았다. 이제 `robustUserLogin()`을 공유하는 `user-event-application`, `user-consulting-booking`, `user-founders-club`, `admin-auth-negative`가 성공 alert 때문에 즉시 cleanup으로 빠지지 않는다. Founders cleanup도 세션 삭제를 최종 원복 경로로 고정해, 중간 실패가 나도 테스트가 만든 세션이 남을 가능성을 낮췄다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | 로그인 outcome 판정에서 성공 alert와 실패 alert를 분리하고, 일반 유저 성공 alert는 정상 흐름으로 통과시키도록 수정 |
| `tests/qa/user-founders-club.spec.ts` | cleanup이 신청 삭제를 반복 시도한 뒤 세션 삭제를 반드시 다시 잡아 수행하도록 보강 |
| `docs/AGENT_ANTI_PATTERNS.md`, `PLAN.md`, `RESULT.md` | 이번 회귀와 수정 내용을 문서화 |

## 검증 결과
- `npx playwright test --list tests/qa/user-founders-club.spec.ts` ✅
- `npm run validate` ✅

## 비고
- 실제 end-to-end 재확인은 `QA_ADMIN_*`, `QA_USER_*`가 연결된 환경에서 `user-founders-club` 또는 `user-flows`를 다시 실행하면 된다. 이번 수정은 공통 helper 수준이라 다른 일반 유저 로그인 기반 suite에도 함께 적용된다.

---

# RESULT: GitHub QA 강도 상향 2차 (2026-05-18)

## 현재 상태
On-Demand QA가 관리자 중심 smoke/CUD를 넘어 실제 일반 유저 행동 플로우까지 다루게 됐다. 이제 행사 신청, 컨설팅 예약, Founder's Club 신청, 관리자 인증 negative case를 각각 독립 suite로 실행할 수 있고, GitHub workflow / Electron Visible QA / Ops UI / QA 문서가 같은 suite 집합을 공유한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | `robustUserLogin()`, `logoutIfNeeded()`, `beginAdminOtpChallenge()`, `submitOtpCode()`, `getAdminCredentials()`, `getUserCredentials()`, `findByQaTitle()` 추가 |
| `tests/qa/user-event-application.spec.ts` | 관리자 행사 fixture 생성 → 일반 유저 신청 → 재진입 시 기존 신청 상태 확인 → 사용자 취소 + 관리자 게시물 cleanup 흐름 추가 |
| `tests/qa/user-consulting-booking.spec.ts` | 관리자 컨설턴트/슬롯 생성 → 일반 유저 예약 → MyPage 노출 확인 → 재오픈 시 슬롯 비노출 확인 → 사용자 취소 + 관리자 cleanup 흐름 추가 |
| `tests/qa/user-founders-club.spec.ts` | 관리자 세션 생성 → 일반 유저 신청 → 재신청 불가 상태 확인 → 관리자 마감 전환 후 공개 `모집 마감` 확인 → 신청/세션 cleanup 추가 |
| `tests/qa/admin-auth-negative.spec.ts` | 잘못된 관리자 비밀번호, 잘못된 OTP, 비관리자 `/admin` 접근 차단 검증 추가 |
| `.github/workflows/qa-dispatch.yml` | 신규 suite choice, `QA_USER_*` 조건부 preflight, suite별 실행 case 확장 |
| `electron/main.cjs` | 신규 suite allowlist / visible spec 매핑 / run title 파싱 확장, user-flow suite용 `QA_USER_*` prompt 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops QA suite 타입/목록/설명 확장 |
| `CODEX_QA.md`, `.env.qa.example` | 신규 suite 의미, 실행 비용, user credentials 준비 경로 문서화 |
| `PLAN.md`, `RESULT.md` | 승인 계획 압축 및 최신 세션 결과 반영 |

## 검증 결과
- `npx playwright test --list` ✅
- `npx playwright test tests/qa/production-smoke.spec.ts --project=chromium` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

## 비고
- 새 authenticated suite(`admin-auth-negative`, `user-*`)는 이번 세션에서 구조 등록과 빌드 검증까지 확인했다. 실제 end-to-end 실행은 로컬/CI QA credentials(`QA_ADMIN_*`, `QA_USER_*`)가 연결된 환경에서 이어서 돌리면 된다.

---

# RESULT: GitHub QA workflow 속도 최적화 (2026-05-18)

## 현재 상태
GitHub-hosted runner가 매번 Chromium을 처음부터 다시 받는 병목을 줄이기 위해 Playwright browser cache를 workflow에 붙였다. 이제 `~/.cache/ms-playwright`를 `actions/cache`로 복원하고, hit/miss가 로그에 바로 보인다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | Playwright browser cache restore, cache status log step, suite 확장과 user secret preflight 동시 반영 |
| `CODEX_QA.md` | 첫 실행/동일 revision 재실행의 속도 차이와 suite별 실행 비용 문서화 |
| `RESULT.md`, `PLAN.md` | 최신 구현/검증 결과 기록 |

## 검증 결과
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `npm run validate` ✅

---

# RESULT: GitHub QA 강도 상향 1차 (2026-05-18)

## 현재 상태
기존 QA가 렌더링 확인 위주로 통과할 수 있던 지점을 줄였다. 이제 smoke는 헤더 메뉴 구조를 실제로 열어 `/notice` 이동을 확인하고, 모든 QA suite에 공통 런타임 감시를 붙여 `pageerror`, `console.error`, 주요 request 실패, 5xx 응답을 잡는다. 게시물/프로그램 CUD는 관리자 목록 확인에서 끝나지 않고 공개 페이지 반영까지 확인한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | `installQaFailureWatchdog()` 추가. 로그인 env는 `robustLogin()` 내부에서만 읽도록 조정해 smoke가 관리자 secret에 불필요하게 묶이지 않게 함 |
| `tests/qa/production-smoke.spec.ts` | 조건부 통과 제거, 헤더 `News` 드롭다운의 공지 링크 이동 검증, 로그인 버튼 검증, 런타임 감시 추가 |
| `tests/qa/admin-auth.spec.ts`, `tests/qa/admin-complex.spec.ts` | 관리자 인증/스모크 suite에 런타임 감시 추가 |
| `tests/qa/admin-post-cud.spec.ts` | 공지/뉴스/행사/미디어 생성·수정 후 공개 페이지 반영 확인. 행사 상태/일시/장소/정원 필드를 실제 공개 카드에서 검증 |
| `tests/qa/admin-program-mgmt.spec.ts` | 컨설턴트 수정 + 공개 `/consulting` 반영 확인, Founder's Club 상태 변경 + 공개 `/founders-club` 반영 확인 |
| `CODEX_QA.md`, `PLAN.md`, `RESULT.md` | 1차 강화 결과와 2차 사용자 행동 플로우 확장 계획 기록 |

## 검증 결과
- `npx playwright test --list` ✅
- `npx playwright test tests/qa/production-smoke.spec.ts --project=chromium` ✅
- `npm run validate` ✅

## 다음 단계
2차는 일반 사용자 행동 플로우를 분리한다. 후보는 행사 신청, 컨설팅 예약, Founder's Club 신청, 관리자 인증 negative case다.

---

# RESULT: GitHub QA 기본 아티팩트 경량화 (2026-05-18)

## 현재 상태
`GitHub 실행 기록`은 실시간 QA 화면이 아니라 CI runner에서 돈 실행의 사후 디버깅 기록이다. 그래서 기본 보관 아티팩트를 `trace + 실패 screenshot` 중심으로 줄이고, `video`는 기본 비활성으로 전환했다. 필요하면 추후 `PW_QA_RECORD_VIDEO=1`로만 opt-in 활성화할 수 있다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `playwright.config.ts` | `PW_QA_RECORD_REPLAY=1`일 때 `trace`는 유지하고 `screenshot`은 실패 시에만 남기며, `video`는 `PW_QA_RECORD_VIDEO=1`일 때만 기록하도록 조정 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | GitHub QA 안내 문구를 `trace + 실패 screenshot` 기준으로 수정 |
| `CODEX_QA.md` | GitHub/로컬 QA 실행 모드 설명을 실제 기본 동작과 일치하게 갱신 |
| `PLAN.md`, `RESULT.md` | 승인 계획 및 최신 세션 결과 반영 |

## 검증 결과
- `npm run validate` ✅
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=BASE32SECRET QA_USER_EMAIL=user@example.com QA_USER_PASSWORD=password npx playwright test --list` ✅

---

# RESULT: GitHub Actions QA 실제 실행 기록(video/trace/screenshot) 추가 (2026-05-17)

## 현재 상태
`로컬 화면 실행`은 현재 Mac에서 브라우저를 띄우는 디버그용 실행이고, `GitHub 실행 기록`은 실제 GitHub Actions runner에서 돈 QA의 화면 기록을 남기는 실행으로 역할을 분리했다. GitHub-hosted runner는 GUI 실시간 스트리밍을 기본 제공하지 않으므로, 실제 CI 화면 확인은 Playwright video/trace/screenshot 아티팩트 리플레이 기준으로 수행한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | GitHub QA 실행 시 `PW_QA_RECORD_REPLAY=1`을 주입하고 `playwright-report/`, `test-results/`를 각각 아티팩트로 업로드 |
| `playwright.config.ts` | `PW_QA_RECORD_REPLAY=1`일 때 trace/video/screenshot을 항상 기록 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | 버튼/안내 문구를 `GitHub 실행 기록`과 `로컬 화면 실행`으로 분리해 실제 의미가 드러나도록 수정 |
| `CODEX_QA.md`, `PLAN.md`, `RESULT.md` | CI 실시간 관람 불가와 리플레이 아티팩트 기준 운영 방식 문서화 |

## 검증 결과
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `PW_QA_RECORD_REPLAY=1 npx playwright test --list` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 게시물 CUD QA timeout/잔여 데이터 정리 안정화 (2026-05-17)

## 현재 상태
`admin-post-cud`가 local/headed 실행에서 60초 timeout으로 중단되면 마지막 일괄 cleanup까지 안정적으로 도달하지 못해 `QA_E2E_...` 게시물이 남을 수 있었다. 이제 각 게시물 케이스가 생성 직후 수정/검증/삭제까지 끝낸 뒤 다음 케이스로 넘어가며, 시작/종료 시 `QA_E2E_` prefix 잔여 게시물을 추가로 정리한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/admin-post-cud.spec.ts` | 테스트 timeout을 180초로 확장, 케이스별 원자 CUD 흐름 도입, 실패/종료 cleanup에 `QA_E2E_` prefix sweeping 추가, optional cleanup 탐색 timeout 보강 |
| `PLAN.md`, `RESULT.md` | 실제 실행 결과와 잔여 데이터 확인 기록 |

## 검증 결과
- `QA_ADMIN_EMAIL=... QA_ADMIN_PASSWORD=... QA_ADMIN_MFA_SECRET=... npx playwright test --list tests/qa/admin-post-cud.spec.ts` ✅
- `npm run validate` ✅
- 저장된 앱 QA credentials 기반 실제 `npx playwright test tests/qa/admin-post-cud.spec.ts --project=chromium` ✅ (`1 passed`, 35.2s)
- 관리자 게시물 관리에서 `QA_E2E_` 검색 결과 0개 확인 ✅

---

# RESULT: 로컬 Visible QA 계정 앱 저장 지원 (2026-05-17)

## 현재 상태
아키텍처 앱 `Ops` 탭에서 `Visible QA 계정`을 저장하면 이후 `로컬 Visible 실행` 시 터미널에 이메일/비밀번호/MFA secret을 직접 입력하지 않아도 된다. 저장값은 GitHub token과 같은 앱 로컬 userData 영역에만 보관되며, 터미널 명령에는 secret 원문을 노출하지 않고 저장된 env 파일을 source한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | `qa-credentials:get-status/save/clear` IPC 추가, `qa-credentials.env` 저장/삭제, Visible QA 실행 시 저장 credentials 자동 source |
| `electron/preload.cjs` | renderer bridge에 QA credentials IPC 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops 탭에 `Visible QA 계정` 저장/삭제 UI 추가. 저장 후에는 입력칸을 비우고 저장 여부만 표시 |
| `CODEX_QA.md`, `PLAN.md`, `RESULT.md` | 앱 저장 방식과 fallback 우선순위 문서화 |

## 동작 우선순위
Visible QA는 저장된 앱 credentials를 우선 사용하고, 없으면 `.env.qa`, shell env, 터미널 prompt 순서로 fallback한다.

## 검증 결과
- `node --check electron/main.cjs && node --check electron/preload.cjs` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 로컬 Visible QA env 안내 및 zsh 종료 코드 오류 수정 (2026-05-17)

## 현재 상태
로컬 Visible QA는 GitHub Actions Secrets를 역조회하지 않고 현재 Mac의 `.env.qa` 또는 shell env만 읽는다. `.env.qa`/shell env가 없으면 열린 터미널에서 이번 실행용 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`를 직접 입력받아 실행한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | zsh readonly 변수 `status` 대신 `qa_exit_code` 사용, env 간접 참조를 zsh 전용 문법에서 POSIX-compatible `eval` 방식으로 변경, GitHub Secrets 역조회 불가 안내 및 터미널 credentials prompt 추가 |
| `.env.qa.example` | 로컬 Visible QA용 샘플 env 파일 추가 |
| `.gitignore` | 실제 비밀값 파일 `.env.qa` ignore 추가 |
| `CODEX_QA.md`, `PLAN.md` | `.env.qa.example` 복사 방식과 로컬/CI credentials 경계 문서화 |

## 사용 방법
```bash
cp .env.qa.example .env.qa
```

그 다음 `.env.qa`에 실제 QA 관리자 계정, 비밀번호, MFA secret을 채우고 아키텍처 앱 `Ops` 탭에서 `로컬 Visible 실행`을 다시 누르면 된다. `.env.qa`를 만들지 않아도 터미널 prompt에 직접 입력해 1회 실행할 수 있다.

## 검증 결과
- `node --check electron/main.cjs && node --check electron/preload.cjs` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: On-Demand QA 실패 로그 기반 반복 안정화 (2026-05-17)

## 현재 상태
사용자가 실행한 On-Demand QA 실패 3건을 GitHub Actions 아티팩트 기준으로 추적해, 실패한 suite를 하나씩 수정→실행→재수정 루프로 안정화했다. 최종적으로 개별 `admin-post-cud`, `admin-program-mgmt`가 통과했고, 전체 `all` suite도 통과했다.

## 반영 내용
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | 확인 모달 클릭 후 모달이 사라질 때까지 대기해 저장/삭제 완료 전 다음 단계로 넘어가지 않도록 보강 |
| `tests/qa/admin-post-cud.spec.ts` | 게시물 생성 후 실제 row 출현까지 대기, 행사 날짜 입력은 실제 UI에 있을 때만 optional 처리, 검색/수정/삭제 row locator를 제목 기준 ancestor로 좁힘 |
| `tests/qa/admin-program-mgmt.spec.ts` | `전문가 등록` 중복 텍스트 strict 오류 제거, 컨설턴트 필수 필드 입력 추가, 카드 내부 삭제 버튼 locator 보강, Founder's Club 설명 필드를 실제 input placeholder에 맞춤 |

## GitHub Actions 결과
- `admin-post-cud` run #6 (`25985775845`) ✅
- `admin-program-mgmt` run #8 (`25985853314`) ✅
- `all` run #9 (`25985892912`) ✅

## 검증 결과
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=... npx playwright test --list` ✅
- `npm run validate` ✅

---

# RESULT: QA 수동 실행 Visible 모드 추가 (2026-05-17)

## 현재 상태
아키텍처 앱 `Ops` 탭에서 QA suite를 실행할 때 두 가지 경로를 선택할 수 있다.

- `GitHub 실행`: 기존처럼 `qa-dispatch.yml`을 workflow_dispatch로 호출해 백그라운드에서 실행한다.
- `로컬 Visible 실행`: 현재 Mac의 iTerm/Terminal을 열고 `npx playwright test ... --headed --project=chromium`을 실행해 Chromium 브라우저 진행 화면을 직접 볼 수 있다.

로컬 Visible 실행은 QA 비밀값을 앱에 저장하지 않는다. 저장소 루트의 `.env.qa` 또는 shell env에 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`가 있어야 하며, 누락되면 열린 Terminal에서 누락 변수명을 보여주고 종료한다.

방금 실패한 GitHub QA에 대해서는 로컬 환경에 GitHub token과 `QA_ADMIN_*` env가 없어 run 상세 로그를 직접 조회하지 못했다. 대신 `qa-dispatch.yml`에 `Check QA secrets` preflight를 추가해, GitHub Secrets 누락이면 Playwright 진입 전에 어떤 secret이 빠졌는지 Actions 로그에 명확히 표시되도록 했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | `qa:run-visible` IPC 추가. suite allowlist 검증 후 iTerm/Terminal에서 headed Playwright 명령 실행 |
| `electron/preload.cjs` | renderer bridge에 `runVisibleQa(suite)` 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops 탭에 `GitHub 실행` / `로컬 Visible 실행` 버튼 분리, visible 실행 상태/오류 메시지 추가 |
| `.github/workflows/qa-dispatch.yml` | `Check QA secrets` preflight 추가 |
| `CODEX_QA.md`, `PLAN.md` | Visible QA 운영 방식과 검증 결과 반영 |

## 검증 결과
- `node --check electron/main.cjs && node --check electron/preload.cjs` ✅
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=... npx playwright test --list` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: QA 자동화 고도화 및 On-Demand 실행 환경 구축 (2026-05-17)

## 현재 상태
cron 기반 daily QA를 제거하고, 아키텍처 앱 `Ops` 탭에서 원하는 QA suite를 직접 선택 실행하는 On-Demand QA 구조로 전환했다. GitHub Actions workflow는 `qa-dispatch.yml`로 바뀌었고, `workflow_dispatch.test_suite`는 `smoke`, `admin-auth`, `admin-post-cud`, `admin-program-mgmt`, `all` 허용값만 받는다.

Playwright 테스트는 공통 인증 유틸을 사용하도록 분리했고, 기존 MFA TOTP 값 로그 출력은 제거했다. 관리자 CUD 테스트는 `QA_E2E_<runId>_...` prefix를 사용하며, 생성한 테스트 데이터만 정리하는 경로를 포함한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | 신규 On-Demand QA workflow. `test_suite` choice input으로 suite별 Playwright spec 실행 |
| `.github/workflows/daily-qa.yml` | cron 기반 daily workflow 제거 |
| `tests/qa/utils/auth.ts` | 관리자 로그인/MFA/로그아웃 공통 유틸, `QA_E2E` title helper 추가 |
| `tests/qa/admin-auth.spec.ts` | 관리자 로그인, MFA, 로그아웃, 권한 가드 suite |
| `tests/qa/admin-complex.spec.ts` | 경량 smoke/visual suite로 축소 |
| `tests/qa/admin-post-cud.spec.ts` | 공지/뉴스/행사/미디어 게시물 생성/수정/삭제 suite |
| `tests/qa/admin-program-mgmt.spec.ts` | 컨설팅/Founders Club 관리 CUD 기본 suite |
| `electron/main.cjs`, `electron/preload.cjs` | `qa-dispatch.yml` dispatch, suite allowlist, suite metadata 반환 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops 탭 suite 선택 UI, trigger payload, Alerts/Incident Feed suite 표시 |
| `CODEX_QA.md`, `docs/AGENT_RULES.md`, `PLAN.md` | On-Demand QA 운영 규칙과 검증 결과 반영 |

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- `npx playwright test tests/qa/production-smoke.spec.ts` ✅
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=... npx playwright test --list` ✅

## 비고
- 로컬 셸에 실제 `QA_ADMIN_*` 값이 없어 관리자 인증/CUD suite의 실주행은 수행하지 않았다. GitHub Secrets 또는 로컬 환경 변수 연결 후 아키텍처 앱 `Ops` 탭에서 suite별 실행이 필요하다.

---

# RESULT: 아키텍처 맵 앱 고도화 1차 — Incident Feed + 구조 Diff (2026-05-17)

## 현재 상태
아키텍처 맵 앱의 기본 Map 사이드바에 통합 `Incident Feed`를 추가했다. 이제 열린 `error_issues`, 실패/진행 중인 QA workflow run, 실패/대기/진행 중인 블로그 동기화 run을 한 피드에서 볼 수 있고, 항목별로 관련 노드 또는 GitHub workflow/run 링크로 바로 이동할 수 있다.

구조 새로고침(`map:refresh`) 전후 또는 로컬에 저장된 직전 스냅샷 대비 `architectureMap.json` 변화도 표시한다. 노드/간선 추가·삭제, DEAD 코드 증감, cluster별 노드 수 변화를 Map 사이드바에서 바로 확인할 수 있다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | Incident Feed 데이터 정규화, 구조 diff 상태/스냅샷 저장, Map 사이드바 통합, `MapDiffSummary` 추가 |
| `src/app/components/admin/architecture/IncidentFeed.tsx` | error issue/QA/blog sync를 공통 카드로 보여주는 신규 컴포넌트 |
| `src/app/components/admin/architecture/mapDiff.ts` | `ArchitectureMap` 스냅샷 비교 헬퍼. 노드/간선/DEAD/cluster 변화량 계산 |
| `PLAN.md` | 승인 계획을 `[Done]`으로 축약하고 완료 항목 10개 유지 규칙에 맞춰 오래된 완료 항목 2개 정리 |

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: QA 자동화 고도화 및 On-Demand 실행 환경 구축 계획 수립 (2026-05-17)

## 현재 상태
기존 QA 시스템의 허점(단일 블록화, 공통 로직 부재, 표면적 검증)을 분석하고, 이를 개선하기 위한 **원자적(Atomic) 테스트 분리** 및 **아키텍처 앱 연동 On-Demand 실행** 전략을 수립하여 `PLAN.md`에 반영했다. 사용자의 요청에 따라 이번 세션에서는 직접적인 코드 수정 없이 **연구 및 계획 수립**만 수행했다.

## 수립된 계획 요약
1. **인증 로직 분리**: `tests/qa/utils/auth.ts`를 신설하여 MFA 포함 로그인/로그아웃 로직을 공통화.
2. **Atomic CUD 테스트**: `admin-post-cud.spec.ts`, `admin-program-mgmt.spec.ts`를 신규 작성하여 실제 데이터 생성~삭제 풀 사이클 검증.
3. **On-Demand 실행 환경**: GitHub Actions의 `cron`을 제거하고 `workflow_dispatch` 파라미터를 추가하여, 아키텍처 앱 `Ops` 탭 UI에서 원하는 테스트만 골라 실행할 수 있도록 연동.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `PLAN.md` | QA 고도화 및 On-Demand 실행 환경 구축 계획 추가 |

## 검증 결과
- `PLAN.md` 업데이트 완료 ✅
- 직접적인 소스 코드 수정 없음 ✅

---

# RESULT: Realtime CHANNEL_ERROR 수정 + 에러 source 정확도 개선 (2026-05-17)

## 현재 상태
Supabase Realtime 구독 실패(CHANNEL_ERROR/TIMED_OUT) 시 자동 재연결 로직을 추가했고, `LiveArchitectureMap`에서 발생하는 에러 source를 `"admin-page"`에서 `"architecture-map"`으로 정정했다. Electron 앱 재빌드 완료.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | issuesChannel/logsChannel 모두 CHANNEL_ERROR·TIMED_OUT 시 exponential backoff(2→4→8→16→32초) 최대 5회 재연결. 5회 소진 후에만 로그 기록. logsChannel에 누락된 에러 핸들러 추가. 6곳의 source `"admin-page"` → `"architecture-map"` 변경. |
| `src/lib/errorLogger.ts` | `NodeId` 타입에 `"architecture-map"` 추가. `FILENAME_TO_NODE`에 `LiveArchitectureMap` → `"architecture-map"` 매핑 추가. |

## 검증 결과
- `npm run validate` ✅
- `npm run app:pack` ✅

---

# RESULT: 아키텍처 맵 DEAD 판정 정밀화 + 안전한 미사용 파일 정리 (2026-05-15)

## 현재 상태
아키텍처 맵의 `DEAD 코드` 판정이 단순 top-level import 기준에서 벗어나 nested dynamic import, Supabase Edge Function 문자열 호출, 아키텍처 앱 별도 entry를 반영한다. 재생성 결과 기존 DEAD 63개가 41개로 줄었고, 실제 미사용으로 확인된 레거시 컴포넌트 4개만 삭제했다. 삭제 후 최종 맵은 162 nodes / 468 edges / DEAD 37개다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `scripts/generate-architecture-map.mjs` | AST 순회를 재귀 방식으로 바꿔 `React.lazy(() => import(...))` 같은 nested dynamic import를 탐지한다. `supabase.functions.invoke("...")` 호출을 해당 `supabase/functions/<name>/index.ts` 노드와 `api` edge로 연결하고, `src/architecture/main.tsx`를 별도 entry로 보호한다. |
| `src/generated/architectureMap.json` | 새 생성기 기준으로 맵 데이터를 재생성했다. |
| `src/app/components/FoundersClubCalendarWidget.tsx` | 현재 import/entry 없음, 과거 홈에서 제거된 레거시 컴포넌트라 삭제했다. |
| `src/app/components/NoticeSection.tsx` | 현재 홈은 `NoticeResourceSection`을 사용하므로 삭제했다. |
| `src/app/components/ResourceSection.tsx` | 현재 홈은 `NoticeResourceSection`을 사용하므로 삭제했다. |
| `src/app/components/figma/ImageWithFallback.tsx` | 현재 import가 없는 Figma 잔여 컴포넌트라 삭제했다. |
| `docs/AGENT_RULES.md`, `docs/AGENT_ANTI_PATTERNS.md`, `.gemini_prompts/maker_feature.md` | `DEAD 코드`는 삭제 승인 신호가 아니라 정적 힌트라는 운영 규칙을 추가했다. |

## 남긴 항목
- `AdminFlowMap.tsx`: 현재 import는 없지만 문서상 private architecture-map surface로 언급되어 있어 이번 정리에서는 보존했다.
- 미사용 shadcn UI primitive: 디자인 시스템 예비 부품일 수 있어 일괄 삭제하지 않았다.
- `encrypt-profile`, `reset-user-mfa`: 현재 직접 호출 흔적은 약하지만 Edge Function은 배포/외부 호출 영향이 있어 별도 확인 대상으로 남겼다.

## 검증 결과
- `node scripts/generate-architecture-map.mjs` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 아키텍처 앱 Alerts/Ops 재구성 + QA 수동 실행 추가 (2026-05-15)

## 현재 상태
아키텍처 앱에서 `QA Alerts`를 `Alerts`로 확장하고, `QA`와 `블로그 동기화` 소식을 각각 메일형 인박스로 분리해 볼 수 있게 했다. `Ops` 탭에는 `QA 실행`과 `블로그 동기화 실행`을 함께 배치했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | 탭 구조를 `Map / Alerts / Ops`로 재구성했다. `Alerts` 안에 `QA`와 `블로그 동기화` 인박스를 분리했고, 둘 다 read/unread, 선택, 숨김(삭제) UX를 지원한다. 블로그 쪽은 `blog_import_runs`의 `status`, `discovered_count`, `inserted_count`, `updated_count`, `skipped_count`, `failed_count`, `error`를 사용해 메일형 요약 카드를 만든다. `Ops`에는 `QA 실행`과 `블로그 동기화 실행` 버튼을 함께 배치했다. |
| `electron/main.cjs` | GitHub Actions `daily-qa.yml`에 `workflow_dispatch` POST를 보내는 `qa:trigger-run` IPC를 추가하고, 기존 GitHub token/fallback env 경로를 재사용하도록 했다. |
| `electron/preload.cjs` | renderer bridge에 `triggerQaRun()` 추가 |
| `docs/AGENT_RULES.md` | 아키텍처 앱의 `Alerts`/`Ops` 역할 분리와 QA 수동 실행 workflow 정책 추가 |
| `docs/AGENT_ANTI_PATTERNS.md` | Electron IPC 결과 union narrowing을 명시 비교로 처리하라는 재발 방지 항목 추가 |
| `PLAN.md` | 승인 계획 완료 반영 및 완료 항목 개수 정리 |

## 동작 정책
- `Alerts`는 결과/상태를 보는 곳이고, `Ops`는 수동 작업을 실행하는 곳이다.
- QA Alerts는 GitHub Actions 원본 run을 삭제하지 않고 앱 로컬 read/hidden 상태만 관리한다.
- 블로그 Alerts도 `blog_import_runs` 원본 기록을 삭제하지 않고 앱 로컬 read/hidden 상태만 관리한다.
- QA 수동 실행은 GitHub `daily-qa.yml`을 `main` ref로 dispatch 한다.
- 블로그 수동 실행은 계속 `sync-naver-blog` Edge Function만 호출하며, admin+AAL2 검증과 `blog_import_runs` 기록, `GITHUB_PAT` 기반 workflow_dispatch/fallback 정책을 유지한다.

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- UI smoke: 별도 클릭 검증은 생략. 대신 architecture 번들 빌드와 패키징 앱 생성까지 확인했다.

---

# RESULT: 아키텍처 앱 수동 블로그 동기화 버튼 추가 (2026-05-15)

## 현재 상태
아키텍처 앱에서 수동으로 Naver 블로그 동기화 작업을 큐잉하고 GitHub Actions dispatch까지 요청할 수 있게 했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | 오른쪽 패널에 `Ops` 탭 추가. `블로그 동기화 실행` 버튼이 `sync-naver-blog` Edge Function을 호출하고, run id/status/source/생성 시각 및 GitHub Actions dispatch 결과를 표시한다. |
| `docs/AGENT_RULES.md` | 아키텍처 앱 수동 블로그 동기화는 GitHub Actions API 직접 호출이 아니라 Edge Function 경로를 사용한다는 운영 규칙 추가 |
| `docs/AGENT_ANTI_PATTERNS.md` | telemetry source에는 `NodeId` union에 등록된 값만 사용한다는 재발 방지 항목 추가 |
| `.gemini_prompts/maker_feature.md` | 기능 구현 메이커 지침에 아키텍처 앱 운영 버튼 경계 추가 |
| `PLAN.md` | 승인 계획을 완료 항목으로 축약하고 오래된 완료 항목 2개 정리 |

## 동작 정책
- 버튼은 `supabase.functions.invoke("sync-naver-blog", { body: { triggerSource: "manual" } })`만 호출한다.
- admin+AAL2 권한 검증, `blog_import_runs` 실행 기록, `GITHUB_PAT` 기반 workflow_dispatch/fallback 정책은 기존 관리자 화면과 동일하게 보존된다.
- GitHub Actions 원본 기록은 삭제하거나 수정하지 않는다.

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- UI smoke: 별도 브라우저 클릭 검증은 생략. Electron 패키징 산출물 생성으로 앱 번들 포함 여부를 확인했다.

---

# RESULT: 아키텍처 앱 QA 알림 탭 추가 (2026-05-15)

## 현재 상태
아키텍처 앱에서 GitHub Actions `Daily Production QA` 실행 결과를 이메일형 인박스로 확인할 수 있게 했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | GitHub Actions workflow runs/jobs API를 읽는 `qa:read-runs` IPC 추가. 실패 run은 실패 job/step 요약까지 가져온다. 앱 내 토큰 저장/상태/해제 IPC도 추가했다. |
| `electron/preload.cjs` | `readQaRuns()`, `getGithubTokenStatus()`, `saveGithubToken()`, `clearGithubToken()` bridge 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | 오른쪽 패널에 `Map`/`QA Alerts` 탭 추가. QA 인박스는 GitHub 토큰 연결 UI, read/unread, 개별 선택, 전체 선택, 읽음 처리, 선택 삭제, 전체 삭제, GitHub 실행 링크 열기를 지원한다. |
| `PLAN.md` | 완료 항목 반영 |

## 동작 정책
- 삭제는 앱 인박스에서만 숨김 처리한다.
- GitHub Actions 원본 실행 기록은 삭제하지 않는다.
- 비공개 저장소 API 접근용 GitHub 토큰은 앱 안에서 입력해 연결할 수 있으며, Electron `userData` 경로에 로컬 저장된다.
- 환경 변수 `GXP_GITHUB_TOKEN`, `GITHUB_TOKEN`, `GH_TOKEN`도 fallback으로 계속 지원한다.

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 자동 QA 자격 증명 env/secrets 분리 (2026-05-15)

## 현재 상태
자동 QA 관련 코드와 문서에서 평문 QA 계정/비밀번호/MFA 시크릿을 제거하고, 로컬 셸 환경 변수 및 GitHub Actions Secrets 기반 주입 구조로 전환했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/admin-complex.spec.ts` | `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET` 필수 환경 변수 로더 추가 |
| `.github/workflows/daily-qa.yml` | Playwright 실행 단계에 GitHub Secrets 기반 `QA_ADMIN_*` env 주입 추가 |
| `scripts/diag-admin-ui.mjs` | 관리자 로그인/MFA 진단 스크립트를 `QA_ADMIN_*` env 기반으로 전환 |
| `scripts/diag-mfa.mjs` | MFA 진단 스크립트를 `QA_ADMIN_*` env 기반으로 전환하고 현재 TOTP preview 로그 추가 |
| `CODEX_QA.md` | 평문 계정/시크릿 제거, `QA_ADMIN_*` / `QA_USER_*` 변수명과 GitHub Secrets 운영 절차 명시 |
| `docs/AGENT_RULES.md` | QA 자동화 자격 증명은 저장소 하드코딩이 아니라 env/secrets로만 주입한다는 규칙 추가 |
| `.gemini_prompts/maker_feature.md` | 기능 구현 프롬프트에 QA 비밀값 경계 규칙 추가 |

## 검증 결과
- `npm run validate` ✅
- `npx playwright test tests/qa/admin-complex.spec.ts` ✅

## 비고
- 현재 로컬 셸에는 `QA_ADMIN_*` / `QA_USER_*` 환경 변수가 기본 설정되어 있지 않아, 이번 검증은 동일 변수명을 런타임 주입하는 방식으로 수행했다.
- GitHub Actions 원격 실행이 실제로 통과하려면 저장소 Secrets에 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`가 등록되어 있어야 한다.

---

# RESULT: 24시간 자동 QA 시스템 로그아웃 단계 안정화 (2026-05-15)

## 현재 상태
관리자 Playwright 통합 QA의 마지막 로그아웃/권한 가드 단계가 현재 운영 UI와 일치하도록 안정화되었다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/admin-complex.spec.ts` | 로그아웃 검증을 `text=` 기반 탐색에서 헤더 `banner`/모바일 메뉴 `dialog`의 role 기반 링크 탐색으로 교체하고, 로그아웃 후 `/` 복귀 및 `/admin` 재진입 시 홈 리다이렉트 검증으로 보정 |

## 검증 결과
- `npx playwright test tests/qa/admin-complex.spec.ts` ✅
- `npm run validate` ✅

---

# RESULT: 24시간 자동 QA 시스템 (Playwright + GitHub Actions) 구축 (2026-05-15)

## 현재 상태
운영 사이트(`https://google-play-changgoo-program.netlify.app`)를 대상으로 매일 24시간 자동 감시를 수행하는 Playwright 기반 E2E 테스트 환경과 GitHub Actions 워크플로우를 구축했다.

## 기술적 성과
1. **관리자 로그인 및 MFA 자동화 완수**:
   - `otplib` 라이브러리의 `generateSync`를 활용하여 `CODEX_QA.md`에 명시된 시크릿 키 기반 6자리 TOTP를 실시간으로 생성.
   - `input-otp` 컴포넌트의 특이성을 파악하여, `page.fill`과 `dispatchEvent('input')` 조합으로 키보드 이벤트 강제 트리거.
   - '인증 및 로그인' 버튼 활성화를 이끌어내어 2단계 인증의 모든 관문을 통과했다.
2. **실제 운영 UI 기반 셀렉터 정밀 보정**:
   - 관리자 대시보드 진입 후 사이드바 네비게이션을 정확히 뚫어내고, 게시물 관리 화면의 '카테고리 필터 탭'을 조작하는 로직으로 고도화.
   - 시각적 무결성 점검 시, 렌더링 지연 및 카테고리 전환 충돌을 방지하기 위한 `waitForTimeout` 및 `isVisible` 조건 보완.
3. **충돌 방지 및 안전성 확보**:
   - 단일 관리자 계정(`qa@test.com`)을 사용하는 특성상, 세션 충돌을 막기 위해 `playwright.config.ts`의 `fullyParallel`을 `false`로 지정.
   - 글로벌 타임아웃을 60초로 확장하고 `actionTimeout` 등 세부 대기 시간을 넉넉하게 부여.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `playwright.config.ts` | 초기화, 운영 사이트 `baseURL` 지정, 순차 실행(`workers: 1`) 및 60초 타임아웃 설정 |
| `.github/workflows/daily-qa.yml` | 매일 00:00 UTC (한국 아침 9시) 자동 실행 로봇 배치, `playwright-report` 아티팩트 보관 |
| `tests/qa/production-smoke.spec.ts` | 메인 페이지, 주요 메뉴 접근, 로그인 폼 노출 기초 검증 (Smoke Test) |
| `tests/qa/admin-complex.spec.ts` | 풀 사이클 검증: [로그인 → MFA 생성/주입 → 게시물 카테고리별 에디터 무결성 → 로그아웃 검증] 통합 |

## 검증 결과
- `npx playwright test tests/qa/admin-complex.spec.ts` 로컬 실행 완벽 통과 ✅
- 로그인 버튼 클릭 → MFA 화면 진입 → OTP 토큰 정상 생성(`generateSync`) 및 입력 → 대시보드 진입 확인 ✅

# RESULT: 아키텍처 맵 앱 — 로그인 오버레이 + 구조 새로고침 버튼 (2026-05-15)

## 현재 상태
Electron 아키텍처 맵 앱에 admin+AAL2 로그인 오버레이와 런타임 구조 새로고침 버튼을 추가했다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/architecture/main.tsx` | 전체 재작성 — login→OTP→checkAdmin→ready 플로우, 다크 글래스카드 디자인, `InputOTP` 컴포넌트 |
| `electron/main.cjs` | `map:read-data` / `map:refresh` IPC 핸들러 추가; refresh는 `/bin/zsh -l -c "node ..."` 로그인 셸 사용 |
| `electron/preload.cjs` | `readMapData` / `refreshMap` contextBridge 노출 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | `mapData` → React state 전환, 마운트 시 IPC로 JSON 로드, 새로고침 버튼 UI(idle/loading/ok/error) |
| `vite.architecture.config.ts` | 함수형 defineConfig로 전환, `server.port: 5175` 고정, `base: "./"` 빌드 전용 |
| `package.json` | `map:dev` 스크립트에 `--config vite.architecture.config.ts` 추가 |

## 검증 결과
- `npm run app:build` ✅ — Vite 빌드 + electron-builder 패키징 완료
- 패키징된 앱에서 로그인 오버레이 표시 확인 ✅
- 세션 캐시 시 로그인 스킵 정상 동작 ✅
- 구조 새로고침 버튼 패키징 앱에서 성공 ✅

---

# RESULT: 에러 로그 시스템 PII 보호 및 구조 고도화 (2026-05-15)

## 현재 상태
에러 로그 파이프라인 전체에 PII 격리 계층을 추가하고, explainError 로직을 별도 파일로 분리했다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/lib/errorLogger.ts` | `maskPii()` 추가 (클라이언트 1차 방어), `supabase.rpc()` → `supabase.functions.invoke("log-client-error")` 전환 |
| `src/lib/errorExplainer.ts` | **신규** — `explainError()` 추출, 최소 인터페이스(ExplainInput/NodeLabel) 정의 |
| `supabase/functions/log-client-error/index.ts` | **신규** — 서버측 2차 마스킹 + AES-256-GCM(enc:v1) 암호화, `build_id`/`source_location` 평문 유지, 사용자 JWT 포워딩으로 RPC rate-limit/dedup 보존 |
| `supabase/functions/decrypt-error-logs/index.ts` | **신규** — `requireVerifiedAdmin({ requireAal2: true })` 게이트, `_enc` 복호화 후 반환, `type: "logs"|"issues"` 분기 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | `fetchLogs` → `decrypt-error-logs` EF 호출로 전환, `explainError` 인라인 정의 제거 → import (1312→1237줄) |

## 보안 데이터 흐름

```
[브라우저] options.context
  → maskPii() 1차 마스킹
  → supabase.functions.invoke("log-client-error")
    → [EF] maskPii() 2차 마스킹
    → build_id, source_location 평문 분리
    → 나머지 키 AES-256-GCM 암호화 → _enc
    → log_client_error RPC (dedup/rate-limit 보존)
    → DB: {build_id, source_location, _enc: "enc:v1:..."}

[Electron 맵 앱 — AAL2 세션]
  → supabase.functions.invoke("decrypt-error-logs")
    → requireVerifiedAdmin({ requireAal2: true }) ✓
    → service role로 DB 조회
    → _enc 복호화
    → 복호화된 context 반환
```

## 검증 결과
- `[성공]` `npm run validate` — TypeScript 오류 없음, 빌드(1848 모듈) ✅, 시크릿 스캔 ✅

## 잔여 사항
- `_shared/errorLogger.ts`(Edge Function 내부용) — 현재 PII 위험 낮으나 동일 패턴 적용 가능
- `LiveArchitectureMap` Realtime 구독: 신규 삽입 시 context에 `_enc`가 보임 (message/stack/source_location 전용 컬럼은 평문이므로 핵심 기능 영향 없음)

---

# RESULT: 참여 기업 행사 참여 년도 표시 추가 (2026-05-21)

## 현재 상태
`companies` 테이블에 `participation_year` 필드를 추가하고, 원격 DB의 기존 참여 기업 100개 전체에 `2026`을 주입했다. `/companies` 공개 카드와 상세 모달에서 참여 년도를 표시하며, 관리자 참여 기업 관리와 CSV 업로드 양식도 같은 필드를 사용한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `supabase/migrations/20260521151000_add_company_participation_year.sql` | `participation_year` nullable integer 컬럼, 2000-2100 체크 제약, 컬럼 코멘트, 기존 row `2026` 백필, Data API GRANT 추가. 원격 직접 실행 재시도 안전성을 위해 idempotent SQL로 작성. |
| `src/lib/types.ts` | `Company.participation_year: number \| null` 타입 추가. |
| `src/app/components/admin/AdminCompaniesManagement.tsx` | 등록/수정 폼에 참여 년도 입력 추가, 저장 payload 반영, CSV 헤더/예시/파서/검증/upsert 반영, 관리자 목록과 검색에 참여 년도 반영. |
| `src/app/pages/CompaniesPage.tsx` | 카드 상단에 `2026년 참여` 중립 배지 표시, 상세 모달 헤더와 `참여 정보` 섹션에 참여 년도 표시, 연도 검색 지원, subtitle을 다년도 표현에 맞게 조정. |
| `PLAN.md`, `RESULT.md` | 승인 계획 완료 처리 및 이번 세션 결과 최신화. |

## DB 반영
- 로컬 DB: `supabase migration up --local`로 pending migration 적용.
- 원격 DB: `supabase db query --linked -f supabase/migrations/20260521151000_add_company_participation_year.sql`로 이번 SQL만 직접 실행.
- 원격 검증: `select participation_year, count(*) ... group by participation_year` 결과 `2026 = 100`.
- 참고: `supabase migration list`상 `20260519120000`도 원격 미반영이라 `supabase db push`는 사용하지 않았다. 이번 작업 SQL은 idempotent라 추후 migration push 시 재실행되어도 실패하지 않도록 했다.

## 화면 반영
- `/companies` 카드 첫 페이지 20개 모두 `2026년 참여` 배지 표시 확인.
- 상세 모달에서 `2026년 참여` 배지와 `2026년 행사 참여 기업` 문구 표시 확인.
- `총 100개 기업`은 기존처럼 `filtered.length` 기반 동적 표시다.

## 후속 UI 정리
- 카드의 연도 배지는 `2026년 참여`에서 `2026`으로 단순화했다.
- 상세 모달 헤더에서는 연도 배지를 제거해 `분야` 배지만 남기고, 연도 설명은 `참여 정보` 섹션의 `2026년 행사 참여 기업` 문구로만 표시한다.

## 검증 결과
- `npm run validate` ✅
- 인앱 브라우저 `/companies` 데스크톱 확인 ✅
- 인앱 브라우저 `/companies` 390px 모바일 확인 ✅
- 인앱 브라우저 `/companies` 카드 배지 `2026` 단순화 및 모달 헤더 중복 제거 확인 ✅
- 가로 overflow 없음 확인 ✅

---

# RESULT: Around X 메인 메뉴 및 하위 메뉴 추가 (2026-05-21)

## 현재 상태
헤더와 모바일 사이드 메뉴에 `Around X` 메인 메뉴를 추가했다. 헤더에서는 `Support` 오른쪽에 노출되고, 사이드 메뉴에서는 `Programs` 바로 하단에 노출된다. 하위 메뉴는 `창구 프로그램`, `르노`, `핀칸티에리`이며, 경로는 공용 상수로 관리한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/navigation/mainMenu.ts` | 신규 공용 네비게이션 설정. 기존 메뉴 데이터와 `Around X` 메뉴를 단일 출처로 관리하고, `AROUND_X_ROUTES` 경로 상수 및 데스크톱/사이드 메뉴 표시 순서를 분리. |
| `src/app/components/HeaderSection.tsx` | 컴포넌트 내부 메뉴 상수를 제거하고 `DESKTOP_MAIN_MENUS`, `SIDEBAR_MAIN_MENUS`를 import해 렌더링만 담당하도록 변경. |
| `PLAN.md`, `RESULT.md`, `RESULT_ARCHIVE.md` | 승인 계획 완료 처리, 이번 세션 결과 최신화, 직전 결과 아카이브 누적. |

## 메뉴 경로
- `창구 프로그램` → `/around-x/window-program`
- `르노` → `/around-x/renault`
- `핀칸티에리` → `/around-x/fincantieri`

## 하드코딩 방지
- 새 디자인 raw 값, inline 색상, 간격, z-index를 추가하지 않았다.
- 메뉴 라벨/경로/순서는 `HeaderSection.tsx`가 아닌 공용 네비게이션 설정 파일에서 관리한다.
- 실제 페이지/라우트는 이번 범위에 포함하지 않았으므로 링크 클릭 시 현재 라우터의 기본 NotFound 흐름을 탄다.

## 검증 결과
- `npm run validate` ✅
- Playwright 데스크톱 1440px 확인 ✅ — 헤더 메뉴 순서 `Resources → Programs → News → Support → Around X`, 드롭다운 3개 항목 및 href 확인.
- Playwright 모바일 390px 확인 ✅ — 사이드 메뉴 순서 `Resources → Programs → Around X → News → Support → ACCOUNT`, 패널 완전 열림 상태 확인.

---

# RESULT: Around X 창구 프로그램 랜딩 페이지 추가 (2026-05-21)

## 현재 상태
`/around-x/window-program` 공개 랜딩 페이지를 추가했다. 기존 게시판 페이지처럼 `PageShell` 상단 소개 배너를 사용하고, 본문에는 기존 `AboutSection`을 재사용해 창구 프로그램 타임라인 콘텐츠를 보여준다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/pages/AroundXWindowProgramPage.tsx` | 신규 공개 랜딩 페이지. `PageShell` 배너와 `AboutSection` 재사용. |
| `src/app/routes.tsx` | `AROUND_X_ROUTES.windowProgram` 상수 기반으로 `/around-x/window-program` 라우트 연결. |
| `PLAN.md`, `RESULT.md`, `RESULT_ARCHIVE.md` | 승인 계획 완료 처리, 이번 세션 결과 최신화, 직전 결과 아카이브 누적. |

## 범위
- 단순 랜딩 페이지이므로 `posts` category, 관리자 게시글 작성, Supabase migration, RLS 변경은 추가하지 않았다.
- 기존 `RootLayout`을 그대로 타므로 고정 `HeaderSection`과 `FooterSection` 흐름을 유지한다.

## 하드코딩 방지
- 새 디자인 raw 값, inline 색상, 간격, z-index를 추가하지 않았다.
- 상단 배너는 기존 `PageShell` 토큰을 사용하고, 본문은 기존 `AboutSection` 테마 흐름을 재사용한다.
- 라우트 경로는 `AROUND_X_ROUTES.windowProgram` 상수를 기준으로 연결했다.

## 검증 결과
- `npm run validate` ✅
- Playwright 데스크톱 1440px 확인 ✅ — `/around-x/window-program`, `창구 프로그램` 배너, AboutSection 제목, 고정 헤더 위치, 가로 overflow 없음.
- Playwright 모바일 390px 확인 ✅ — 배너와 AboutSection 렌더링, 고정 헤더 아래 배치, 가로 overflow 없음.

---

# RESULT: 창구 프로그램 페이지 소개 영역 재구성 (2026-05-21)

## 현재 상태
`/around-x/window-program` 본문 타임라인 상단의 중복 제목/짧은 설명을 제거하고, 창구 로고와 프로그램 설명 중심의 intro를 추가했다. 사용자는 페이지 배너를 본 뒤 로고, 설명, 타임라인 순서로 자연스럽게 내려가게 된다.

추가 시각 조정으로 창구 로고는 원본 대비 약 1.5배 크기인 `clamp(190px, 26vw, 330px)`로 맞췄다. 2배 크기는 첫 화면에서 상단 여백이 더 크게 느껴져 제외했다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/app/content/windowProgramInfo.ts` | Hero와 창구 페이지가 공유하는 프로그램 정보 문구를 분리. |
| `src/app/components/HeroSection.tsx` | 기존 `INFO_CONTENT` 직접 정의를 제거하고 공통 프로그램 정보 모듈을 import해 렌더링. |
| `src/app/components/window-program/WindowProgramIntro.tsx` | 신규 intro 컴포넌트. 창구 로고 상단, 설명 하단 중앙 정렬. |
| `src/app/components/window-program/WindowProgramTimeline.tsx` | `showHeader`, `beforeTimeline` 옵션 추가로 페이지별 상단 구성 분기 지원. |
| `src/app/components/WindowProgramTimelineSection.tsx` | 창구 페이지 전용 조립: intro + 헤더 없는 타임라인. |
| `src/imports/changgu-symbol.png` | 사용자가 제공한 창구 로고 자산을 앱 import 자산으로 추가. |
| `PLAN.md`, `RESULT.md`, `RESULT_ARCHIVE.md` | 계획 완료 처리 및 결과 최신화. |

## 검증 결과
- `npm run validate` ✅
- Playwright 데스크톱 1440px 확인 ✅ — 중복 `h2` 제거, 창구 로고 표시, 설명 중앙 정렬, intro→timeline 흐름 확인.
- Playwright 모바일 390px 확인 ✅ — 로고/설명/타임라인 단일 컬럼 흐름, 가로 overflow 없음.
