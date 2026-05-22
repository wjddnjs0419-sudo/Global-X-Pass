# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Active

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

## Pending Approval

- [Done] 인사이트/참여기업 메뉴 개편 + 필터 개선 (2026-05-26) — MediaPage title 인사이트 변경, 인사이트 필터 라벨(마켓·테크·CEO), 참여기업 Around X 하위 이동(핀칸티에리 아래), program_name 컬럼 추가 및 카드·필터·CSV·어드민 폼 전면 반영. `npm run validate` ✅, Supabase migration ✅

- [Done] 마이페이지 회원탈퇴 + 취소/거절 내역 삭제 기능 (2026-05-22) — `delete-own-account` Edge Function 신규 배포, RLS DELETE 정책 마이그레이션 적용, MyPage에 회원탈퇴 모달(비밀번호 확인) 및 cancelled/rejected 카드 Trash2 삭제 버튼 추가. `npm run validate` ✅, `supabase db push` ✅, `functions deploy` ✅

- [Done] 아키텍처 맵 Ops 참여기업 뉴스 실시간 Actions/Crawler 폴링 반영 (2026-05-22) — `company-news-crawl.yml` GitHub Actions run 조회 IPC와 6초 폴링을 추가해 `Ops > 뉴스` 파이프라인이 실제 `queued/in_progress/completed` 상태와 conclusion/업데이트 시간을 반영하도록 개선. 완료/실패 시 polling 자동 중단. `npm run validate` ✅, `npm run app:pack` ✅, `/Applications` 앱 갱신 및 UI 확인 ✅

- [Done] 아키텍처 맵 Ops 참여기업 뉴스 파이프라인 시각 보정 (2026-05-22) — `뉴스` 탭의 기본 상태를 `idle` 중심으로 조정해 `기업 키워드 → Edge Fn → Actions → Crawler → Articles → Review` 흐름이 중간에 끊겨 보이지 않도록 수정. `기업 뉴스 수집 요청 완료` 시 `Crawler`가 `active`로 이어지게 해 dispatch 이후의 흐름도 자연스럽게 보이도록 보정. `npm run validate` ✅, 앱 번들 갱신 ✅

- [Done] 아키텍처 맵 Ops에 참여기업 뉴스 수동 실행 탭 추가 (2026-05-22) — `src/app/components/admin/architecture/opsPipeline.tsx`에 `뉴스` 서브탭을 추가해 `QA / 블로그 / 뉴스 / AI` 구조로 확장하고, `trigger-company-news-crawl` Edge Function과 `company-news-crawl.yml` 흐름을 파이프라인 노드(기업 키워드 → Edge Fn → GitHub Actions → 수집 스크립트 → `articles` → 관리자 검수)로 시각화. `src/app/components/admin/LiveArchitectureMap.tsx`에서 회사 뉴스 전용 trigger 상태/메시지/에러와 수집 옵션을 관리하고, `src/app/components/admin/architecture/constants.ts`에 관련 workflow URL 및 기본 옵션을 추가. `src/generated/architectureMap.json` 재생성 ✅, `npm run validate` ✅

- [Done] 아키텍처 맥 앱 로고를 창구 심볼로 교체 (2026-05-22) — electron-builder macOS 아이콘 경로를 `src/imports/changgu-symbol.png`로 전환해 창구 프로그램 로고가 패키징된 앱 번들 아이콘에 반영되도록 변경. `npm run app:pack` ✅, `/Applications/Global X Pass Architecture Map.app` 재복사 ✅, `npm run validate` 검증 중

- [Done] 아키텍처 맵 macOS 앱 번들 복구 (2026-05-22) — `npm run app:pack`으로 `release/mac-arm64/Global X Pass Architecture Map.app`을 다시 생성해 패키징된 앱 번들을 복구. `map:build` ✅, `electron-builder --dir` ✅, 산출물 확인 ✅

- [Done] 아키텍처 맵 Ops GitHub token 저장 경로 호환성 복구 (2026-05-22) — Electron 앱이 `~/Library/Application Support/Electron`을 쓰면서도 기존 `~/Library/Application Support/@figma/my-make-file/github-token.txt`와 `qa-credentials.env`를 함께 읽도록 `electron/main.cjs`를 수정해, Ops 탭의 `GitHub 실행`이 인증 없이 실패하던 문제를 해결. `npm run validate` ✅, `node --check electron/main.cjs` ✅, Electron 실동작 dispatch ✅

- [Done] 아키텍처 맵 Edge Function CORS 허용 origin 확장 (2026-05-22) — `supabase/functions/_shared/cors.ts`에 `http://localhost:5175`와 `http://127.0.0.1:5175`를 추가해 아키텍처 맵 앱(Electron + `map:dev`)에서 `decrypt-error-logs` 호출이 브라우저 CORS에 막히지 않도록 수정. `npm run validate` ✅, `supabase functions deploy decrypt-error-logs` ✅, Electron 재로드 확인 ✅

- [Done] 기업 뉴스 수집 기본값 조정 (2026-05-22) — 자동/수동 수집 기본값을 `batch_size=25`, `results_per_company=1`로 통일하고, GitHub Actions schedule을 하루 4회(`0 0,6,12,18 * * *`, UTC)로 명시. `npm run validate` ✅, 기본값 dry-run ✅, function deploy ✅

- [Done] 기업 뉴스 즉시 수집 버튼 실패 원인 노출 및 dispatch 정합성 복구 (2026-05-22) — 관리자 화면에서 Edge Function/GitHub Actions `dispatchError` 상세를 표시하도록 수정하고, 관련성 필터 변경사항을 `main`에 push해 원격 workflow input과 Edge Function payload 정합성 복구. `npm run validate` ✅, Node tests ✅, git push ✅

- [Done] 기업 뉴스 수집 데이터 초기화 (2026-05-22) — 원격 `articles` 73건 삭제, `companies.last_crawled_at` 25건 `NULL` 초기화로 동일 회사 재수집 가능 상태 전환. 삭제 후 `articles=0`, 크롤링 완료 회사 `0` 확인, 새 필터 dry-run ✅

- [Done] Around X 준비중 페이지 분기 및 changgu-program 리네이밍 (2026-05-22) — `mainMenu.ts`에 `comingSoon?: boolean` 플래그 추가, 르노·핀칸티에리에 `comingSoon: true` 설정. `ComingSoonPage.tsx` 신규 생성(메뉴 라벨 동적 표시), `WildcardRoute.tsx`로 404/준비중 분기. `window-program` → `changgu-program` 전면 리네이밍(URL·키·상수·타입·컴포넌트·폴더·CSS 클래스). `PageShell` 배너 타이틀 `clamp(44→34px)`, `ChangguProgramIntro` 본문 `clamp(28→18px)` 축소. `npm run validate` ✅, git amend + force push ✅
