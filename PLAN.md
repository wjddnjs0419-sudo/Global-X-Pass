# PLAN.md

완료 계획 = `RESULT.md`에 구현/검증 기록. 이 파일 = 활성/예정만 유지. 완료 항목 `[Done]` 한 줄 축약, 10개 초과 시 오래된 것부터 삭제.

## Pending Approval
(없음)

## In Progress
- [ ] 행사 신청 선착순 → **승인제(선별제)** 전환 — 스펙: `docs/superpowers/specs/2026-06-01-event-approval-flow-design.md`. **DB 변경 0**(트리거가 이미 accepted에서만 정원 가드, RPC/헬퍼 그대로). 모델: 정원=확정(accepted) 기준, pending 무제한·정원 미점유, 거절/취소 시 여석 복구. 작업 4건(TDD):
  1. `src/utils/eventApplication.ts` — 순수함수 `getAdminActionStatuses(current): EventApplication["status"][]` 추가. 전이표: pending→[accepted,rejected,cancelled_by_admin] / accepted→[pending,rejected,cancelled_by_admin] / rejected→[pending,accepted] / cancelled_by_admin→[pending,accepted] / cancelled_by_user→[pending,accepted].
  2. `src/utils/eventApplication.test.ts` — `getAdminActionStatuses` 5상태 RED→GREEN 단위테스트.
  3. `src/app/pages/EventApplicationPage.tsx` — insert `status:"accepted"`→`"pending"`(L179); 제출후 `setAcceptedCount(prev=>prev+1)` 제거(L198, pending은 정원 미점유); 완료카드(L293-294) pending 분기 추가 → 제목 "신청이 접수되었습니다." / 설명 "관리자 승인 후 확정 안내를 등록된 이메일로 보내드리겠습니다." (accepted=config문구, cancelled=기존 유지). *normalize가 config 문구를 "확정"으로 되돌리므로 pending은 상태기준 분기 필수.*
  4. `src/app/components/admin/AdminEventManagement.tsx` — (a) `participantApplications` memo created_at **오름차순(먼저 신청 순)** 재정렬(L47-50, fetch는 desc) + 카드 순번표시(seq=(page-1)*PAGE_SIZE+idx+1); (b) 참가자/이력 카드 action을 `getAdminActionStatuses(application.status)`로 렌더(L346·L359 하드코딩 배열 제거); (c) `countsByEvent`에 pending 추가(L60-69) → overview 요약 "확정/대기/정원" 표시(L322-330).
  - 마무리: `npm run validate` → Codex 재리뷰 FAIL 0 → 문서갱신. 기존 prod 신청 3건 전부 accepted(이미 승인됨), 데이터 마이그 불필요.
- [ ] 관리자 대시보드 성능 개선 — `useAdmin` 중복 권한 게이트 제거, `AdminDashboard` 트래픽/Top 5 조회를 서버 집계 중심으로 전환, 필요 시 `NotificationBell` 초기 로딩 지연으로 `/admin` 첫 진입 체감 속도 개선

## Done

- [Done] 처리내역 어드민 영구삭제 버튼 (2026-06-01) — `isDeletableApplicationStatus` 순수함수(terminal만, RLS와 일치) + 5 tests, `AdminEventManagement` history 탭에만 Trash2 삭제(window.confirm 가드 + `delete().eq("id")`). DB변경 0(admin DELETE 기존 RLS 허용). validate 83 통과. Codex F1(처리내역 복원버튼)=승인제 의도설계로 유지 확정·W3 미반영. 상세 RESULT.md. (미커밋)
- [Done] 행사 신청서 동적 질문 — Codex FAIL 4건 수정 (2026-06-01) — `mergeEventFormConfig` legacy prepend 회귀픽스, `findMissingRequiredAnswer` 빈 choice 데드락 제외, options dedupe, AdminEventManagement legacy 컬럼 fallback, EventApplicationPage "선택지 없음" 안내. validate 69 통과 + Codex 재리뷰 FAIL 0. 상세 RESULT.md. (미커밋)
- [Done] 관리자 대시보드 전체화면 차트 붕괴 수정 (2026-06-01) — `AdminDashboard` 2열 grid item과 Top 5 텍스트 row에 Tailwind `min-w-0` 구조 클래스 적용으로 긴 제목이 차트 컬럼을 밀어내지 않게 보정. `npm run validate` 통과.
- [Done] 로컬 로그인 복구 — Auth seed NULL 토큰 보정 (2026-06-01) — `supabase/seed.sql`에 `auth.users` 토큰 컬럼+비밀번호 보정 추가, `npm run db:reset` 후 `/auth/v1/token` 로컬 관리자 로그인 성공 및 `npm run validate` 통과.
- [Done] 브라우저 E2E QA — Codex 이관 (2026-06-01) — 미커밋 대규모 업데이트(RLS 성능/보안 + 대시보드 + useAdmin 게이트) 실브라우저 실동작 검증 완료. tests/qa 11스펙/9파일 + QA env(MFA TOTP 주입). 정적·DB레벨 PASS 위 headed 사람눈 확인까지 종료.
- [Done] 테스트/프로덕션 분리 2단계 — 클라우드 staging 신설 (2026-05-31) — staging 프로젝트(`bgnkxavrwdwtbgvdmbvr`) 생성+마이그 82개 이관+webServer 자가완결 QA. Codex FAIL 0. 상세 RESULT.md.
- [Done] 로컬 Supabase 격리 — 테스트/프로덕션 분리 1단계 (2026-05-31) — Docker 로컬 스택+env 분리+seed+빌드가드. Codex FAIL 0. 상세 RESULT.md.
- [Done] Founder's Club 신청 RLS 무한재귀 픽스 (2026-05-31) — INSERT 자기참조 서브쿼리 제거 및 트리거 위임. 상세 RESULT.md.
- [Done] 미커밋 대규모 업데이트 검증 — 정적 + DB레벨 (2026-05-30) — validate 통과 및 라이브 RLS/트리거 대조 완료. 상세 RESULT.md.
- [Done] useAdmin 권한 게이트 동시성/fail-closed 하드닝 (2026-05-30) — 순수함수 추출 + Vitest 43개 테스트 도입. 상세 RESULT.md.
- [Done] 사이트 성능/보안 감사 — RLS·select*·인증게이트 (2026-05-30) — RLS InitPlan 캐싱 및 정책 통합으로 성능 경고 해소. 상세 RESULT.md.
- [Done] Edge 로딩/페이지 이동 최적화 — 옵션 1+2+3 (2026-05-29) — manualChunks 분할 및 Suspense 도입으로 첫 페인트 40% 절감. 상세 RESULT.md.

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
