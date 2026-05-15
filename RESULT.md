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
