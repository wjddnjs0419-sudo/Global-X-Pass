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

## 잔여 사항
- `supabase functions deploy log-client-error` 및 `supabase functions deploy decrypt-error-logs` 배포 필요

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
- `supabase functions deploy log-client-error` 및 `supabase functions deploy decrypt-error-logs` 배포 필요
- `_shared/errorLogger.ts`(Edge Function 내부용) — 현재 PII 위험 낮으나 동일 패턴 적용 가능
- `LiveArchitectureMap` Realtime 구독: 신규 삽입 시 context에 `_enc`가 보임 (message/stack/source_location 전용 컬럼은 평문이므로 핵심 기능 영향 없음)
