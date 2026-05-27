# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval

- [ ] **Codex 재리뷰 재실행 — 게시판 gated 일관 적용 변경분 (미커밋)** — 미커밋 diff 누적: ①게시판 3단계 접근 모델(1차 리뷰 4건 반영 완료) ②gated 일관 적용(아래 Done) — 홈 4개 섹션 RPC 전환, AdminBoardManagement board gated 허용, 이머젼 anon RLS, 마이그 2건. `codex login` 정상화 후 `/codex:rescue`로 미커밋 diff 재리뷰 필요. 점검 포인트: (a) gated board 본문이 anon 직접 API로 노출 안 되는지(`posts_select_public_by_flag`=public만), (b) gated 목록 RPC(`list_public_post_previews`)가 본문 500자만 노출하는지, (c) `consultants_select_public`이 `is_active=true`만 노출하는지, (d) gated page 신청 INSERT가 anon 차단되는지.

## Done

- [Done] 행사 목록 썸네일 2버그 수정 (2026-05-28) — ①`/events` 카드 대표 썸네일이 영역 밖 거대 표시+카드 높이 폭발: 데스크톱 `sm:h-auto sm:self-stretch` flex 행에서 img `height:100%`가 부모 높이 미확정으로 원본 비율 펼쳐지던 순환 의존 → `EventsPage` 컨테이너 `relative overflow-hidden`+img `absolute inset-0`로 해소. ②어드민 행사 대표 썸네일 업로드 시 하단 첨부에 자동 중복적재: `onCropApply`가 업로드 파일을 `pendingThumbnailFile`+`files[]` 이중 보관 → 저장 시 events 분기가 `files` 전체를 `image_url`로 올리던 게 원인 → `files` push 제거 + `thumbnailFromUploadRef`로 standalone/candidate 출처 구분, `[files]`이펙트·`onCropApply`·`onChange`·저장 업로드 가드(`&& supportsFinalThumbnail`) 정합. media(aspectRatio+dataUrl)/news/events-archive 무관 확인. `npm run validate` ✅×2, Codex 2회(1차 Change2 needs-fix 4건→재작업→2차 4건 RESOLVED·SAFE-TO-COMMIT). 상세 RESULT.md.

- [Done] 회원가입 승인제 전환 + 서버단 강제 (2026-05-27) — 자가가입을 관리자 승인 후 로그인 가능 구조로 전환. `profiles.status`(pending/approved/rejected) + auth `banned_until` 이중 트랙. 자가가입(`signup-profile`)은 pending+ban → 서버가 로그인 거부(JWT 미발급). CSV 어드민 등록(`bulk-register-users`)·역할 부여(`update-user-role`)는 자동 approved+unban. 신규 `update-user-status` EF(AAL2 게이트, approve=status→unban / reject=ban→status, 부분 실패 fail-safe 순서). `LoginPage` user_banned 중립 안내, `SignupPage` 승인 안내 문구, `AdminUserManagement` 상태 배지+승인/반려 버튼+대기 카운트. 마이그 `112409`(기존회원 approved 백필) sync, EF 5개 배포, DB 전원 approved 확인, `npm run validate` ✅×2, Codex 리뷰 반영(🔴1·🟡2). 상세 RESULT.md.

- [Done] 홈 최신게시물 탭 정정 + 인사이트 섹션 전체보기 badge (2026-05-27) — `CommunitySection`: "인사이트" 탭→라벨 "뉴스"(news 카테고리·`/news` 유지, 카드 배지 "인사이트"→"뉴스" 동기화), "행사소식" 탭 id `events`→`events-archive`(내용=events-archive public 35건만, 전체보기 `/events/archive`), 기존 events+events-archive 통합 fetch 특수분기 2개(세션/anon) 제거→일반 eq/RPC 경로 단순화. `MediaSection`: 헤더 설명 아래 중앙에 기존 pill(`Button`+`getHomeSectionCtaPillClass`) 재사용한 "인사이트 전체보기"→`/insights` badge 추가(`!loading`만, 일반 flow라 게시물 그리드와 비겹침). `/insights` CTA 헤더+캐러셀끝 2개 중복은 의도적 유지. 마이그 무변경(프론트만). Codex 리뷰 2건 PASS/LGTM, `npm run validate` ✅. 커밋 `c9b7cbfe`/`6a8e2e3f`(main, 미푸시).

- [Done] 게시판 gated 일관 적용 + 자동 반영 수정 (2026-05-27) — 증상: 비로그인이 행사/인사이트/자료실/이머젼/파운더스 목록을 못 봄 + 어드민 게시판관리 변경이 공개 사이트에 반영 안 됨. 근본원인 4가지 진단·수정: ①`post_categories`가 `supabase_realtime` publication 누락 → `useBoardAccess`/`BoardCategoriesContext`의 postgres_changes 구독이 영영 안 불려 라이브 반영 깨짐 → publication 추가. ②events/resources/media `access_level=gated` 통일(목록 공개+상세 로그인), `AdminBoardManagement`의 board gated 금지(`gatedBlocked`) 가드 제거. ③gated board 목록을 직접 `posts.select()`하던 홈 4개 섹션(Media/Resource/NoticeResource/Community)이 RLS(public만)에 막혀 빈 목록 → `fetchPublicPostPreviews`(list_public_post_previews RPC, is_public=true·본문 500자) 전환. ④온라인 이머젼 `consultants`/`consulting_categories`에 anon SELECT 정책 부재 → `consultants_select_public`(is_active=true)·`consulting_categories_select_public` 추가. 마이그 2건(`101555_post_categories_realtime_and_access_fix`/`102620_consulting_immersion_public_read`) sync 정렬. gated 동작은 RPC 목록+`posts_select_public_by_flag`(public만 직접) 본문 차단+`get_post_access_info`(access_level≠public→로그인) 3중. 인사이트(media)/파운더스(founders_club_sessions) 빈 화면은 사용자가 데이터 전량 삭제해 0개라 정상(코드/권한 무관). `npm run validate` ✅. Codex 재리뷰는 Pending Approval 참고.

- [Done] 파비콘 임시 제거 + 도메인 ncf-aroundx.com 전환 (2026-05-27) — `index.html` 파비콘 `<link rel="icon">` 제거(임시 무파비콘, `public/favicon.svg`는 미참조로 보존). 운영 도메인 globalxpass.com→ncf-aroundx.com 전환: `supabase/functions/_shared/cors.ts` `ALLOWED_ORIGINS`에서 기존 globalxpass.com/netlify 2개 제거 + `https://`·`http://ncf-aroundx.com` 추가, `AdminFlowMap.tsx` 허용주소 안내 텍스트 갱신. cors 공용 코드 변경분 반영 위해 edge function 19개 일괄 재배포(`supabase functions deploy`), dist 2회 재빌드. Supabase 콘솔 Auth URL Configuration(Site URL/Redirect URLs)은 사용자 수동 완료. `npm run validate` ✅, 신규 마이그 없음(원격 last=061936, sync 일치)

- [Done] 게시판 3단계 접근 모델(public/gated/private) + 특수 페이지 통합 (2026-05-27) — `post_categories`에 `access_level`(public/gated/private)+`kind`(board/page) 추가. `is_public`은 트리거로 access_level과 동기화(RLS `posts_select_public_by_flag` 호환), `enforce_post_category_lock`에 access_level 보호 추가. `get_post_access_info` RPC를 access_level 기반으로 전환. companies/consulting/founders-club을 `kind=page` 가상 게시판(gated)으로 등록하고 routes의 `AuthRoute` 제거 → `BoardAccessGate`(private만 진입 차단)+신규 `useAuthGate`(gated에서 상세/신청 클릭 시 로그인). `OfficeHourPanel` 목록 공개화, `founders_club_sessions` anon SELECT 정책 추가. 보안 마이그 `board_access_rls_hardening`으로 anon posts(`access_level='public'`)/companies(published) RLS 강화. `AdminBoardManagement`는 3단계 셀렉트(board는 gated 비활성)+낙관적 갱신. 사업비 자료실=private 유지. 마이그 3건(053805/055536/061936) sync 정렬, `npm run validate` ✅. Codex 재리뷰는 Pending Approval 항목 참고.

- [Done] 홈 인사이트 문구 정리 + 프로그램 태그 모바일 높이 보정 (2026-05-27) — `MediaSection`의 홈 노출 텍스트를 `우리 인사이트` 기준으로 정리하고, 에러/빈 상태/캐러셀 접근성 라벨/fallback `INSIGHT` 표기를 함께 맞췄다. `ProgramSection`은 태그 래퍼 `alignItems/alignContent`와 칩 `inline-flex + alignSelf + lineHeight`를 보정해 모바일에서 키워드 박스가 행 높이에 늘어나는 현상을 막았다. `npm run validate` ✅, 홈 `/` 브라우저 heading smoke ✅

- [Done] 홈 About 섹션 미니멀 재정렬 (2026-05-27) — 승인된 재기획 기준대로 과한 Around X 전용 배경/그라데이션/브랜드 배지/키워드 칩/반복 색상 장식을 제거하고, `homeSectionStyles.ts` + `getSectionTheme()` 기반의 기존 홈 섹션 문법으로 재정렬했다. 반복 가치 카드는 신규 `AboutValueCard`로 분리했고, 아이콘은 `AdminSidebar`의 16px `currentColor` 선형 스타일을 참고했다. `npm run validate` ✅, 홈 `/` 데스크톱·모바일·다크·EN 브라우저 smoke ✅

- [Done] 홈 About 섹션을 Around X 브랜드 소개로 전환 (2026-05-27) — 홈 `AboutSection`을 창구 프로그램 타임라인 대신 `Around X` 브랜드 소개로 교체했다. `Logo.png` 워드마크를 재사용하고, `Around X Purple (#8264FF) → Around X Blue (#0073FF)` 그라데이션 토큰과 4가지 핵심 가치(글로벌 지향성·협업·연결·확장성)를 홈 첫 소개 블록에 반영했다. `/` 홈 브라우저 smoke 확인 ✅, `npm run validate` ✅

- [Done] 중복 UI / 구식 편집 경로 정리 감사 후속 (2026-05-27) — `EventApplicationPage`의 예전 관리자 인라인 편집기(`adminEditing`/`adminDraft`/`handleAdminSave`)와 직접 `posts.update()` 저장 경로를 삭제해 행사 편집 진입을 `/post/:id?edit=1` + `AdminPostCreate`로 단일화. 홈 `EventSection` 대표 행사 배경은 `resolvePostThumbnail()` 사용으로 새 대표 이미지 저장소를 반영. `AdminDashboard` 인기 게시물 라벨은 `post_categories` 동적 라벨 우선으로 전환. `categoryStore.ts`는 `useBoardTagPresets()`의 DB 로딩 전 정적 fallback으로 사용 중이라 유지. `npm run validate` ✅

- [Done] 행사 대표 이미지 업로드/수정/삭제 + 행사 수정 UI 단일화 (2026-05-27) — events 대표 이미지를 `thumbnail_url` 원본 URL + `thumbnail_crop` JSON으로 저장하도록 확장. `EventFormConfigEditor` 신규 추가로 신청서 질문/문구(`event_form_config`)를 어드민 게시물 작성/수정에서 함께 관리. `/events`와 행사 신청 상단 이미지는 `resolvePostThumbnail()` 우선 렌더. 상세 수정은 `AdminPostCreate` 위임, 행사관리/신청 페이지 편집 버튼은 게시물 편집 경로로 연결. `npm run validate` ✅, 인앱 브라우저 `/events` smoke ✅

## Future / 추후 수정

### Discord Bot 구현 (보류, 2026-05-22~)

**목표**: Discord 채팅으로 자동화 실행 + 에러 알림 + Groq LLM 에러 분석 봇

**아키텍처**:
- `discord-bot` Supabase Edge Function — Slash commands (Interactions Endpoint)
- `discord-alert` Supabase Edge Function — DB Webhook 수신 → 에러 자동 알림
- Groq API (Llama 3.3 70B) — 에러 자연어 분석·답변
- Discord 채널: `#gxp-ops` (명령어), `#gxp-alerts` (에러 알림)

**Slash Commands 목록**:
- `/run qa [suite]` → qa-dispatch.yml workflow_dispatch
- `/run news` → trigger-company-news-crawl Edge Function
- `/run blog` → sync-naver-blog Edge Function
- `/errors` → 최근 에러 목록 출력
- `@봇 [자연어 질문]` → Groq LLM 에러 분석

---

#### 선행 작업 체크리스트 (Discord Developer Portal)

- [x] Discord Application 생성 완료 (Application ID: 150733774600247157)
- [x] Bot 생성 완료
- [ ] **BOT_TOKEN 복사** — Bot 페이지 → Reset Token → 복사 저장
- [ ] **PUBLIC_KEY 복사** — 일반 정보 페이지 → Public Key 복사
- [ ] **봇 서버 초대** — 설치 페이지에서 기본 설치 설정 → 길드 설치 → scopes: bot + applications.commands → 봇 권한: 메시지 보내기 + 링크 임베드 + 파일 첨부 → 저장 후 생성된 설치 링크 열기 → 서버 선택 → Authorize
- [ ] **#gxp-ops Webhook URL** — 채널 우클릭 → 편집 → 연동 → Webhooks → New Webhook → URL 복사
- [ ] **#gxp-alerts Webhook URL** — 동일하게
- [ ] **GitHub PAT 발급** — Settings → Developer Settings → Fine-grained tokens → Actions R/W + Contents R
- [ ] **Groq API Key 발급** — console.groq.com/keys → Create API Key

#### Supabase Secrets 등록 (선행 작업 완료 후)

```bash
supabase secrets set DISCORD_PUBLIC_KEY=...
supabase secrets set DISCORD_BOT_TOKEN=...
supabase secrets set DISCORD_APP_ID=150733774600247157
supabase secrets set DISCORD_OPS_WEBHOOK_URL=...
supabase secrets set DISCORD_ALERT_WEBHOOK_URL=...
supabase secrets set GXP_GITHUB_TOKEN=...
supabase secrets set GROQ_API_KEY=...
```

#### 구현 작업 (선행 작업 완료 후 시작)

- [ ] `supabase/functions/discord-bot/index.ts` — Slash commands + LLM 연동
- [ ] `supabase/functions/discord-alert/index.ts` — DB Webhook → Discord 알림
- [ ] `supabase/migrations/YYYYMMDD_discord_alert_webhook.sql` — error_logs INSERT DB Webhook 설정
- [ ] Discord Slash Commands 등록 스크립트 (`scripts/register-discord-commands.mjs`)
- [ ] Discord Developer Portal → Interactions Endpoint URL 입력
- [ ] `npm run validate` + 전체 배포 검증

---

- [Done] 어드민 사이드바 그룹 재정리 — 콘텐츠/자동화 분리 (2026-05-27) — `AdminSidebar.tsx` `SECTIONS`에서 과밀했던 `콘텐츠` 6개를 직접 편집형 `콘텐츠` 3(게시물 작성·관리·게시판) + 외부 수집형 신설 `자동화` 3(블로그 동기화·기업 뉴스·언론보도)으로 분리. 정적 배열 재구성만 — TabId/렌더/라우팅/DB 무변경. `npm run validate` ✅, Codex 블로킹 없음(중복/누락 tab id 없음, 12개 전부 AdminPage 렌더)

- [Done] 블로그 게시판 완전 삭제 + 어드민 카테고리 드롭다운 동적화 (2026-05-27) — "지웠다"는 인식과 달리 blog는 코드·DB에 그대로 남아 있었음(공개 네비에서만 숨김). 마이그 `20260527030134`로 posts(category=blog) 10개·board_tag_presets 6행·post_categories blog 행 삭제. 프론트 표면 제거(BlogPage/`/blog` 라우트·adminConstants `CATEGORIES`/`CATEGORY_COLOR`·categoryStore `BOARD_PRESETS`·CommunitySection·SearchPage 데모·PostDetailPage 테마/매핑). 근본 원인이던 하드코딩 `CATEGORIES`↔동적 `post_categories` 불일치는 `BoardCategoriesContext.useBoardCategoryList()`를 추가해 AdminPostCreate/AdminPostManage 드롭다운을 동적화(`categoryOptions = boardList.length ? boardList : CATEGORIES`)로 해소. 네이버 블로그 크롤링 자동화(sync-naver-blog 등)는 적재처가 news/events-archive라 의도적 보존. `npm run validate` ✅, 원격 DB 0/0/0 ✅, Codex 블로킹 없음, migration sync 정렬 완료

- [Done] 언론보도 링크 원클릭 등록 자동 메타데이터화 (2026-05-27) — `/news` 언론보도를 `링크 입력 -> 미리보기 -> 초안 저장 -> 게시 승인` 승인형 워크플로우로 개편. Naver 검색 API는 쓰지 않고, `supabase/functions/external-news-preview`에서 URL 직접 fetch + OG/HTML/JSON-LD 메타 추출 + SSRF 방지 가드를 구현했다. `AdminExternalNewsManagement`는 목록/필터와 새 `ExternalNewsPreviewComposer`로 분리했고, `ExternalNewsPreviewCard`/`ExternalNewsDraftEditor`를 추가해 기존 스타일과 공용 컴포넌트를 재사용했다. `external_news_items`는 새 테이블 없이 기존 `draft | published` 상태만 재사용한다. `npm run validate` ✅

- [Done] 파운더스클럽 참여사 직접 세션 등록 + 어드민 승인 (2026-05-27) — `/founders`에 participant `세션 등록하기` 버튼/모달(전 항목 필수) 추가. 세션은 `pending`으로 생성→어드민이 `승인`(recruiting)/`반려`(rejected). 허위 등록 방지는 participant 역할 게이트(`is_founders_session_host()`)+세션 승인 이중. `founders_club_sessions.created_by`·status(`pending`/`rejected`) 확장, pending/rejected 가시성 제한(작성자·admin), 미승인 세션 신청 차단 가드, 호스트 본인 세션 삭제 정책, 승인 시 등록자 자동참가 트리거(마이그 `013726`/`015126`/`020631`). 등록 모달은 공용 `ModalShell`/`getModalFieldStyle` 재사용. 관리자 패널 직접 생성(즉시 모집중)은 유지. Codex 3회 반영(🔴 stale SELECT 정책 노출, 🟡 가드 FOR UPDATE, 🟡 fontFamily). `npm run validate` ✅, migration sync 정렬 완료

- [Done] 1:1 컨설팅 → 온라인 이머젼 / 오피스아워 분리 (2026-05-26) — `/consulting`을 상단 탭 2개로 분리. 온라인 이머젼은 기존 전문가 선택형 그대로(`ImmersionPanel` 추출), 오피스아워는 전문가 비노출 + 6~12월 월별 모집(정원 제한, `FOR UPDATE` 정원 트리거) + 관리자 매칭. 신규 테이블 `office_hour_months`/`office_hour_applications`, 잔여좌석 RPC, edge function `office-hour-admin-applications`(프로필 복호화) 배포. 관리자 `오피스아워 관리` 탭(월별 정원/신청 매칭). 상태 라벨·색상은 `officeHours.ts`, 모달 셸은 `ModalShell.tsx`로 공용화. Codex 리뷰 반영(🔴 INSERT 상태 우회 차단, 🟡 로더 에러 처리). `npm run validate` ✅, migration sync 정렬 완료
