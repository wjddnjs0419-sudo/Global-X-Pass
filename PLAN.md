# PLAN.md

완료 계획 = `RESULT.md`에 구현/검증 기록. 이 파일 = 활성/예정만 유지. 완료 항목 `[Done]` 한 줄 축약, 10개 초과 시 오래된 것부터 삭제.

## Pending Approval
(없음)

## In Progress
(없음)

## Done

- [Done] 프로젝트 이관 핸드오프 정비 (2026-06-04) — env.example 3종 신규(+gitignore allowlist), README·START_HERE(비개발자용) 신규, ONBOARDING §4 환경비교표·Windows·트러블슈팅 보강. Codex FAIL 0. 상세 RESULT.md.
- [Done] GitHub QA local-runner 복원 + Visible QA 사전 가드 (2026-06-04) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] Codex 세션 부트스트랩 즉시 실행 엔트리 추가 (2026-06-04) — `npm run codex:bootstrap` + AGENTS/규칙 문서 연결. 상세 RESULT_ARCHIVE.md.
- [Done] staging 환경 완전 제거 → local→prod 2단 (2026-06-04) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] 무기한 MFA 우회 — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] 슈퍼어드민 무기한 우회 영구락 수정 (2026-06-03) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] 무기한 MFA 우회 옵션 + "안 함"→"해제" 라벨 (2026-06-03) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] 게시판 접근권한 토글 미반영 버그 수정 (2026-06-02) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] UX layout/action 자동 추적 제거 + 아키텍처 인박스 UX 이슈 필터링 (2026-06-02) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] 어드민 refocus 깜빡임 + 응답 테이블 ellipsis + 대시보드 차트 정렬 (2026-06-02) — 압축됨. 상세 RESULT_ARCHIVE.md.
- [Done] 행사 신청 승인제(선별제) 전환 (2026-06-02) — 압축됨. 상세 RESULT_ARCHIVE.md.

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
