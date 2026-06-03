# RESULT: 무기한 MFA 우회 — 일반 admin 로그인 루프 근본수정 (EF 의존 제거) — 2026-06-04

## 배경
- 무기한 우회 영구락 수정(2026-06-03) 배포 후, **무기한 우회 ON + 일반 admin(과거 MFA factor 등록자)** 로그인 시 `/admin`이 아니라 `/login`으로 튕기는 **간헐 루프** 발생("지금은 또 괜찮네" = 간헐성).
- 근본원인(코드 추적 + prod EF 로그 실측): 로그인/게이트가 `get-admin-mfa-bypass-state` **EF 호출에 의존**. prod EF 로그는 전부 200이나 **로그인 직후 5~7개 동시 폭주 + 콜드스타트 최대 1.2s** → 클라가 한 번 헛발(invoke 실패/지연)하면 `fetchBypass.ok=false` → fail-closed → `bypassActive=false`. factor 보유 admin은 우회로 OTP를 안 거쳐 `currentLevel=aal1/nextLevel=aal2` → `mfaRequired=true` → [AdminRoute.tsx:33](src/app/components/AdminRoute.tsx#L33)가 `/login`으로. EF만 성공하면 안 생김 → 간헐.

## 구현 (TDD)
- **A. `src/utils/superAdminClient.ts`** (신규): `parseSuperAdminUids`+`isSuperAdminClient(userId, raw)`. 서버 `_shared/superAdmin.ts` 미러. super 판정을 EF 없이 클라(`VITE_SUPER_ADMIN_UIDS` + user.id)로. 8테스트.
- **B. `resolveEffectiveBypass.ts`**: `decideLoginBypass`에서 `stateError` 인자 제거 → `{rpcBypassed, isSuperAdmin}`. EF 안 쓰니 fail-safe 분기 불필요. 테스트 갱신.
- **C. `LoginPage.tsx`**: admin+RPC bypassed일 때 EF 호출 삭제. super=`isSuperAdminClient(user.id, VITE_SUPER_ADMIN_UIDS)`.
- **D. `useAdmin.ts` `fetchBypass` 재구현**: 우회 활성은 **RPC `is_admin_mfa_bypassed`가 권위**(경량 DB 함수, 콜드스타트 없음). super는 클라 판정. EF(`get-admin-mfa-bypass-state`)는 **배너 상세 best-effort**로 강등(실패해도 게이트 무관). `ok`는 RPC 기준.
- **E. `adminGate.ts` `buildBypassState(active, detail)`** (신규 순수함수): RPC active + best-effort EF detail → 배너 state 합성. **RPC=true인데 EF 실패(detail=null)여도 우회 ON 유지** = 루프 회귀 방어선. `is_active`는 항상 RPC 권위. 4테스트.
- **F. env**: `VITE_SUPER_ADMIN_UIDS` 추가 — 로컬·staging=`a0000000…001`, prod=`4bcae9aa…`(admin@test.com). 서버 `SUPER_ADMIN_UIDS`와 동일해야 함.
- `evaluateAdminGate` 코어(레이스가드 47테스트)·`AdminRoute`는 미변경. fetchBypass 데이터 소스만 교체(최소침습).

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| 순수함수 분기 | super 판정(UID 매칭/빈값 fail-safe), bypass 합성(RPC권위·EF실패시 ON 유지) | superAdminClient 8 + buildBypassState 4 통과 |
| 게이트 회귀 | bypass OFF의 aal1→mfaRequired 보존, super 억제 양축(LoginPage·adminGate) | adminGate 51테스트 통과 |
| Universal gate | `npm run validate` | 통과 (tsc, eslint 0warn, vitest **134**, vite build, secret scan) |
| Codex 리뷰 | 정확성·회귀·보안·일관성·테스트 | **FAIL 0** / PASS×2(정확성·일관성) / WARN×3 |
| prod 빌드 검증 | dist에 prod 백엔드 + super UID 박힘, 로컬/staging UID 오염 0 | PASS (`4bcae9aa` in LoginPage·index, `a0000000` 없음) |

## Codex WARN 처리 (FAIL 0)
- **SECURITY**(UUID 번들 노출): 서버 경계(toggle AAL2+`isSuperAdminUid` 재검증) 유지 → 권한상승 아님. **수용**.
- **REGRESSION**(VITE↔서버 UID drift): 주석으로 동일 유지 강조. 서버 secret을 클라서 못 봐 런타임 패리티 불가 → **수용·문서화**. drift 시 super가 일반으로 분류돼 영구락 재발 가능 = 배포 시 UID 일치 필수.
- **TEST**(RPC=true+EF실패→ON 유지 미검증): `buildBypassState` 추출+4테스트로 **해소**.

## 배포 (2026-06-04)
- ✅ **프론트만** netlify 수동 배포(`npm run build`→`dist` 드래그드롭). 이번 변경은 EF/마이그 미변경 → DB·EF 배포 불필요.
- VITE_SUPER_ADMIN_UIDS는 `.env.production.local`로 빌드 시 주입(드래그드롭 방식이라 netlify env 설정 불필요).

## 교훈
- **게이트를 EF 콜드스타트에 묶지 말 것**: 보안 게이트의 크리티컬 패스가 무거운 EF(콜드스타트 1.2s+동시폭주)에 의존하면, 서버가 200이어도 클라 race로 fail-closed가 간헐 발생. 권위 소스는 경량 RPC로, 무거운 조회는 best-effort 강등. super 판정처럼 클라가 user.id로 직접 할 수 있는 건 서버 왕복 제거.
- 영구락 수정(슈퍼)과 동일한 4축 게이트인데, 슈퍼는 살리고 **일반 admin이 EF race에 희생**되던 사각. 단위테스트가 EF 성공만 가정해 가려졌고, prod EF 로그(전부 200) + 코드 추적으로 클라측 race를 특정.

## 비고 (⚠️ 미완·후속)
- **런타임 실측 미수행**: 사용자가 staging Playwright 실측 생략하고 prod 직접 배포 선택. 배포 후 일반 admin 1회 확인 권고함.
- staging `admin_mfa_bypass` 검증용 **무기한 ON** 유지. 끄기: `UPDATE public.admin_mfa_bypass SET enabled=false, expires_at=NULL WHERE id=true;`
- 후속(사용자 "나중에"): 패널 403→"MFA 인증 필요" 에러메시지 개선. VITE↔서버 UID 패리티 자동 체크(CI).
