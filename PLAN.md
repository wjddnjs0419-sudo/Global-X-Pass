# PLAN.md

완료 계획 = `RESULT.md`에 구현/검증 기록. 이 파일 = 활성/예정만 유지. 완료 항목 `[Done]` 한 줄 축약, 10개 초과 시 오래된 것부터 삭제.

## Pending Approval

(없음)

## In Progress

(없음)

## Done

- [Done] useAdmin 권한 게이트 동시성/fail-closed 하드닝 — TDD + Codex 재리뷰 #6~#16 (2026-05-30) — `#6` 잔여 2건(silent fail-open 보안 구멍, 시퀀스 가드 무력화)을 발단으로 게이트 결정 로직을 의존성 주입 **순수함수**(`src/hooks/adminGate.ts`)로 추출 + **Vitest 도입**(43 테스트, `validate` 게이트 편입). 닫은 항목: 트리거별 fail-open/closed, 부수효과 없는 평가+단일 시퀀스 가드 커밋, fail-closed 우선권(`shouldCommitGate`), sign-out seq 무효화+사용자 식별 게이트, 이벤트별 silent(`MFA_CHALLENGE_VERIFIED`만 authoritative), `withRetry`(전파 delay) probe 회복, throw 정규화(`safe()`+finally) loading wedge 방지, fail-closed 즉시 loading 게이트, bypass 기대 세션 refocus authoritative, fail-closed bypass 실패 시 stale bypass 비활성화, `authoritativeInFlight`로 silent 가 fail-closed loading 창 못 닫게. **수용 리스크(사용자 결정)**: (a) #16 narrow false-lockout(OTP 전파 직후 좁은 창—대부분 retry 자체 회복, 잔여 다음 이벤트/RLS 회복), (b) 포커스 유지 탭 실시간 강등 미반영(realtime 필요), (c) 소비자별 useAdmin fan-out(100명·멱등·백엔드 RLS AAL2 최종차단) — 셋 다 Future. `npm run validate` ✅, 미커밋. 상세 `RESULT.md`.

- [Done] 사이트 성능/보안 감사 — RLS initplan·중복정책 + select* + 인증게이트 (2026-05-30, Codex adversarial 5라운드 high/medium 수렴, #6 잔여 2건 In Progress) — **(1) RLS 마이그 4개**: `20260530013843`(메인, 멱등) — `is_admin`/`is_founders_session_host` VOLATILE→STABLE + 전 GXP 정책 `auth.*()`/`is_admin()` `(select ...)` 래핑(auth_rls_initplan 29건) + admin ALL/SELECT를 own/public 정책 흡수해 중복 permissive 통합(33건) → **GXP 성능 advisor 경고 0**(profiles seq_scan 1015만→제거). 부수: `post_categories_update_admin` raw-role→`is_admin()`(AAL2 우회 차단), `consulting_slots` 비관리자 직접 UPDATE 제거(트리거가 booked 전환). `20260530014545` count_distinct_visitors() RPC, `20260530020536`/`20260530024536` 멱등 보정. **(2) AdminDashboard**: 전체 posts 풀바디(~800KB, top-5 계산용) → `id,title,views,created_at,category`; page_views 6243행 클라 distinct → RPC + 실패 시 클라 폴백. **(3) useAdmin**: 이벤트 인지 재검증(check 컴포넌트 스코프 승격+시퀀스 가드, 동일사용자/탭복귀 silent 재검증, role+bypass+MFA 전체 재평가). **(4) #2 페이지네이션**: News/Archive/Companies/AdminPostManage/Community 전수 기구현 확인(갭 없음). **(5) #1 N+1 없음, #4 풀 N/A(Supabase 관리)**. **수용 리스크**: FC 세션 host 전상태 하드삭제(Codex high#2, 사용자 "현행 유지" — 의도된 제품 동작). `npm run validate` ✅. 전부 미커밋.
- [Done] Edge 로딩/페이지 이동 최적화 — 옵션 1+2+3 (2026-05-29, Codex FAIL 0 / WARN 2 — 사용자 수용) — (1) `vite.config.ts` `manualChunks` 분할(react-vendor/router/supabase/quill/charts/dnd/slick/ui/vendor). 단일 vendor 897 kB(gz 257) → 다중 청크. (2) `src/app/routes.tsx` public 25종 `React.lazy`(guards eager 유지), `RootLayout.tsx` Outlet `<Suspense fallback={<LoadingSpinner/>}>` 래핑. HomePage 첫 페인트 ~321 kB gz → **~191 kB gz (-40%)**. Quill 225 kB는 어드민 PostCreate 진입 시점만 로드. (3) backdrop-filter 4건 감소(HeroSection 메뉴 아이콘 6px 제거, 액션 카드 24→14px, Header 18→10px + 드롭다운 20→12px, AttachmentPopover 22→14px + bg alpha 보정), `theme.css` `@media (prefers-reduced-motion: reduce)` 블록 추가. `npm run validate` ✅. Codex WARN 2건 [Future] 이관: (e) AttachmentPopover dark overlay 토큰 분기, (f) reduced-motion서 `backdrop-filter: none !important` 제거.
- [Done] 프로그램 신청 모델 부분 롤백 (Event/FC 참여 신청 → 선착순 재복귀) (2026-05-29, Codex a~h PASS, blocking/HIGH/MEDIUM 0) — 마이그 `20260529065845_events_fc_apps_fcfs_revert`. event_applications/founders_club_applications `DEFAULT='accepted'` + RLS INSERT `status='accepted'` 강제 + 사용자 취소 path만 허용. Consulting + FC 세션 등록 승인제 유지. UI INSERT/완료문구 "확정" 복귀. Codex pending 분기 dead-code 안전망 판정. 상세 RESULT.md.
- [Done] Gemini 시니어 리뷰 팩트체크 + 반박서 (2026-05-29) — `docs/SENIOR_REVIEW_REPORT.md` 원문 + `docs/SENIOR_REVIEW_REBUTTAL.md` 반박. 4건 중 유효 1.5 / 무효 2.5 판정.
- [Done] Codex 재리뷰 — gated 일관 적용 (2026-05-29) — (a)(b)(c)(e) PASS, (d) WARN(테이블명 차이지만 anon 차단 확인), (f) FAIL(완료문구 "확정" → "접수+승인 후 확정" 어휘 픽스 후 부분 롤백으로 재복귀).
- [Done] P4 `postThumbnail.ts` 다이어트 (2026-05-29, Codex 7/7 PASS) — 356줄 단일 유틸을 `src/utils/thumbnail/{parser,renderer,editor}` 3분할, 12 caller import 갱신, `npm run validate` ✅. 상세 RESULT 아카이브.
- [Done] PostDetailPage SPOF 분해 1~5단계 (2026-05-29) — 747→82줄(-665, 89%↓). `usePostDetail` 훅 + `buildPostDetailModel` + UI 컴포넌트 3종 + 렌더 분기 View 3종 + `DetailHeader` 추출. Codex 전 단계 PASS, 사용자 5카테고리 QA ✅. 상세 RESULT 아카이브.
- [Done] 프로그램 자동 확정 모델 1차 원복 (선착순 → 승인제) (2026-05-29, Codex 7/7 PASS) — 마이그 `20260529025958_revert_to_approval_model`, 3 테이블 DEFAULT='pending' + CHECK 확장 + RLS 재작성 + consulting book/release slot 트리거 신설. 이후 2차 부분 롤백(`20260529065845`)으로 Event/FC 참여 신청만 선착순 재복귀.
- [Done] FC capacity off-by-one race 픽스 (2026-05-29) — `check_fcfs_capacity` 트리거 `>` → `>=` 정정 + self row 제외(`id <> NEW.id`). 마이그 `20260529035948_fix_fc_capacity_off_by_one`. 동시 INSERT 6/5 over-cap 차단.
- [Done] 언론보도 검색 토글 중간 끊김 (디바운스 + race guard) (2026-05-29, Codex APPROVE WITH NOTES) — 신규 `useDebouncedValue<T>` + `activeFetchRef` 토큰 검증. `AdminExternalNewsManagement`/`AdminCompanyNewsManagement` 동일 패턴. 상세 RESULT.md.
- [Skipped] 게시물 공개/비공개 의미 변경(B=어드민만 열람) (2026-05-29) — 원복 결정. 마이그 2건 net-zero(`20260529023556` + `20260529023916_revert` 원격 sync), UI 라벨 무변동.
- [Done] 행사 게시물 일시/장소 구조 컬럼 도입 + 작성/수정 UI 개편 (2026-05-28). 상세 RESULT.md.
- [Done] 홈 진입 시 간헐적 `/mypage` 강제 이동 + 로그인 alert 루프 차단 (2026-05-28). 상세 RESULT.md.
- [Done] 행사 신청 상단 와이드 crop 미리보기/실제 렌더 불일치 보정 (2026-05-28). 상세 RESULT.md.
- [Done] 상세 페이지 첨부 패널화 + 디버그 콘솔 하드닝 (2026-05-28). 상세 RESULT.md.

## Future / 추후 수정

### useAdmin 게이트 — 수용 리스크 후속 (Codex #14~#16, 2026-05-30)

- [ ] **게이트 동시성 직렬화(coalescing)** — 현 모델은 인스턴스 내 check 동시 실행 + seq/`authoritativeInFlight` 가드. 16라운드 가드 패치가 인접 race를 계속 낳음(현 잔여: #16 narrow false-lockout). 근본 해법 = check 를 한 번에 하나만 실행, 진행 중이면 다음 요청 큐잉(모드 병합: fail-closed 우선), 완료 후 1회 재실행. stale 재노출·false 잠금·커밋 순서 race 부류를 통째 제거. useAdmin 내부 한정(소비자 API 불변). 오케스트레이션 재작성이라 시각 QA 필요.
- [ ] **실시간 강등 반영(realtime)** — 포커스 유지 탭에서 `profiles.role`/`admin_mfa_bypass` 변경은 auth 이벤트·visibility 미발생 → 다음 이벤트까지 강등 지연. 해법: 현재 사용자 `profiles` 행 + bypass 상태 Realtime 구독, 변경 시 `check(userId, false)`. 백엔드 RLS(AAL2)가 최종차단이므로 클라 신선도 갭(UX·표면).
- [ ] **useAdmin 공유 싱글톤(fan-out 제거)** — 소비자 6곳(RootLayout/HeaderSection/AdminRoute/AdminPage/PostDetailPage/EventApplicationPage)이 인스턴스마다 구독·타이머·retry probe 실행 → 만료/refocus 1회가 동시 다발 check. module-level 게이트 스토어(`useSyncExternalStore`)로 탭당 1회 + in-flight dedup. 100명 규모라 우선순위 낮음(멱등·RLS 최종차단).

### Edge 성능 최적화 후속 (Codex WARN 2건, 2026-05-29)

- [ ] **AttachmentPopover dark mode overlay 보정** — Codex (e) WARN. 현재 `color-mix(var(--color-surface-card) 94%, transparent)` + `backdrop-blur(14px)`, dark `--color-surface-card` ≈ rgba(255,255,255,0.04) → 실효 alpha 0.0376(88→94% Δ 0.0024). blur 22→14 감소 대비 보정 사실상 0 → dark서 본문 비칠 가능. 수정: dark 전용 overlay 토큰(예: `rgba(14,18,28,0.88~0.92)`) 분기 또는 `--color-surface-card-overlay-dark` 신설. 사용자 시각 확인 후 회귀 보고 시 진행.
- [ ] **reduced-motion 전역 `backdrop-filter: none !important` 제거** — Codex (f) WARN. 접근성(모션 감소)에 GPU 최적화 묶은 게 과범위. `src/styles/theme.css` `@media (prefers-reduced-motion: reduce)` 블록서 `backdrop-filter`/`-webkit-backdrop-filter` 라인만 제거(애니메이션/transition 감소는 유지). GPU 비용 큰 표면은 별도 opt-in 클래스(`.no-glass-on-low-end` 등) 분리.

### 선택 후속 (P3·P4 잔여)

- [ ] **AttachmentPopover shadcn Popover 채택** — P3 4단계 defer. useEffect 25줄 제거 vs 글래스모피즘 override + 시각 회귀 리스크. 별도 amend 재방문.
- [ ] **섹션 깊은 layout 마이그레이션 (P3-extra)** — 7개 섹션 평균 19 style/file 총 137 인라인 블록. P3 5단계 라이트 패스 범위 외, 별도 시리즈 분리.

### Discord Bot 구현 (보류, 2026-05-22~)

**목표**: Discord 채팅 자동화 실행 + 에러 알림 + Groq LLM 에러 분석.
**아키텍처**: `discord-bot` EF(Slash commands) + `discord-alert` EF(DB Webhook → 알림) + Groq Llama 3.3 70B. 채널 `#gxp-ops`/`#gxp-alerts`.
**명령어**: `/run qa|news|blog`, `/errors`, `@봇 [자연어]`.
**선행**: Application/Bot 생성 완료(App ID 150733774600247157). 미완 — BOT_TOKEN/PUBLIC_KEY 복사, 봇 서버 초대, 2채널 Webhook URL, GitHub PAT, Groq API Key.
**Supabase Secrets**: `DISCORD_PUBLIC_KEY`/`DISCORD_BOT_TOKEN`/`DISCORD_APP_ID`/`DISCORD_OPS_WEBHOOK_URL`/`DISCORD_ALERT_WEBHOOK_URL`/`GXP_GITHUB_TOKEN`/`GROQ_API_KEY`.
**구현 파일**: `supabase/functions/discord-{bot,alert}/index.ts` + `migrations/YYYYMMDD_discord_alert_webhook.sql`(error_logs DB Webhook) + `scripts/register-discord-commands.mjs` + Interactions Endpoint URL 등록.