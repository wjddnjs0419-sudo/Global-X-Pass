# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval

(없음)

## In Progress

(없음 — 다음 작업 대기)

## Done

- [Done] 프로그램 신청 모델 부분 롤백 (Event/FC 참여 신청 → 선착순 재복귀) (2026-05-29, Codex a~h PASS, blocking/HIGH/MEDIUM 0) — 마이그 `20260529065845_events_fc_apps_fcfs_revert`. event_applications/founders_club_applications `DEFAULT='accepted'` + RLS INSERT `status='accepted'` 강제 + 사용자 취소 path만 허용. Consulting + FC 세션 등록 승인제 유지. UI INSERT/완료문구 "확정" 복귀. Codex pending 분기 dead-code 안전망 판정. 상세 RESULT.md.
- [Done] Gemini 시니어 리뷰 팩트체크 + 반박서 작성 (2026-05-29) — `docs/SENIOR_REVIEW_REPORT.md` 원문 + `docs/SENIOR_REVIEW_REBUTTAL.md` 반박서. 4건 중 유효 1.5건 / 무효 2.5건 판정.
- [Done] Codex 재리뷰 — gated 일관 적용 변경분 (2026-05-29) — 점검 (a)(b)(c)(e) PASS, (d) WARN(테이블명 차이지만 anon 차단 확인), (f) FAIL(완료문구 "확정" → "접수+승인 후 확정" 어휘 픽스 적용 후 부분 롤백으로 재복귀).
- [Done] P4 `postThumbnail.ts` 다이어트 (2026-05-29, Codex 7/7 PASS) — 356줄 단일 유틸을 `src/utils/thumbnail/{parser,renderer,editor}` 3분할, 12 caller import 갱신, `npm run validate` ✅. 상세 RESULT 아카이브.
- [Done] PostDetailPage SPOF 분해 1~5단계 (2026-05-29) — 747→82줄(-665, 89%↓). `usePostDetail` 훅 + `buildPostDetailModel` + UI 컴포넌트 3종 + 렌더 분기 View 3종 + `DetailHeader` 추출. Codex 전 단계 PASS, 사용자 5카테고리 QA ✅. 상세 RESULT 아카이브.
- [Done] 프로그램 자동 확정 모델 1차 원복 (선착순 → 승인제) (2026-05-29, Codex 7/7 PASS) — 마이그 `20260529025958_revert_to_approval_model`, 3 테이블 DEFAULT='pending' + CHECK 확장 + RLS 재작성 + consulting book/release slot 트리거 신설. 이후 2차 부분 롤백(`20260529065845`)으로 Event/FC 참여 신청만 선착순 재복귀.
- [Done] FC capacity off-by-one race 픽스 (2026-05-29) — `check_fcfs_capacity` 트리거의 `>` → `>=` 정정 + self row 제외(`id <> NEW.id`). 마이그 `20260529035948_fix_fc_capacity_off_by_one`. 동시 INSERT 6/5 over-cap 차단.
- [Done] 언론보도 검색 토글 중간 끊김 (디바운스 + race guard) (2026-05-29, Codex APPROVE WITH NOTES) — 신규 `useDebouncedValue<T>` + `activeFetchRef` 토큰 검증. `AdminExternalNewsManagement`/`AdminCompanyNewsManagement` 동일 패턴. 상세 RESULT.md.
- [Skipped] 게시물 공개/비공개 의미 변경(B=어드민만 열람) (2026-05-29) — 원복 결정. 마이그 2건 net-zero(`20260529023556` + `20260529023916_revert` 원격 sync), UI 라벨 무변동.
- [Done] 행사 게시물 일시/장소 구조 컬럼 도입 + 작성/수정 UI 개편 (2026-05-28). 상세 RESULT.md.
- [Done] 홈 진입 시 간헐적 `/mypage` 강제 이동 + 로그인 필요 alert 루프 차단 (2026-05-28). 상세 RESULT.md.
- [Done] 행사 신청 상단 와이드 crop 미리보기/실제 렌더 불일치 보정 (2026-05-28). 상세 RESULT.md.
- [Done] 상세 페이지 첨부 패널화 + 디버그 콘솔 하드닝 (2026-05-28). 상세 RESULT.md.

## Future / 추후 수정

### 선택 후속 (P3·P4 잔여)

- [ ] **AttachmentPopover shadcn Popover 채택** — P3 4단계 defer 분. useEffect 25줄 제거 vs 글래스모피즘 override + 시각 회귀 리스크. 별도 amend로 재방문.
- [ ] **섹션 깊은 layout 마이그레이션 (P3-extra)** — 7개 섹션 평균 19 style/file 총 137 인라인 블록. P3 5단계 라이트 패스 범위 외, 별도 시리즈로 분리.

### Discord Bot 구현 (보류, 2026-05-22~)

**목표**: Discord 채팅으로 자동화 실행 + 에러 알림 + Groq LLM 에러 분석.
**아키텍처**: `discord-bot` EF(Slash commands) + `discord-alert` EF(DB Webhook → 알림) + Groq Llama 3.3 70B. 채널 `#gxp-ops`/`#gxp-alerts`.
**명령어**: `/run qa|news|blog`, `/errors`, `@봇 [자연어]`.
**선행 작업**: Application/Bot 생성 완료(App ID 150733774600247157). 미완 — BOT_TOKEN/PUBLIC_KEY 복사, 봇 서버 초대, 2채널 Webhook URL, GitHub PAT, Groq API Key.
**Supabase Secrets**: `DISCORD_PUBLIC_KEY`/`DISCORD_BOT_TOKEN`/`DISCORD_APP_ID`/`DISCORD_OPS_WEBHOOK_URL`/`DISCORD_ALERT_WEBHOOK_URL`/`GXP_GITHUB_TOKEN`/`GROQ_API_KEY`.
**구현 파일**: `supabase/functions/discord-{bot,alert}/index.ts` + `migrations/YYYYMMDD_discord_alert_webhook.sql`(error_logs DB Webhook) + `scripts/register-discord-commands.mjs` + Interactions Endpoint URL 등록.
