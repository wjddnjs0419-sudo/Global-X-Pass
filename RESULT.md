# RESULT: 게시판 접근권한 토글 미반영 버그 수정 — 2026-06-02

## 배경
- 어드민 게시판관리에서 접근권한(전체공개/상세로그인/전체비공개) 토글·라벨 저장 시 초록 성공토스트가 떴지만, 새로고침하면 원래값으로 되돌아갔다(로컬·prod 공통).
- 근본원인: `AdminBoardManagement.tsx` `saveMeta`·`updateAccessLevel` 의 supabase update에 `.select()` 가 없어 PostgREST 가 204(무-바디)를 반환 → RLS 가 0행으로 막아도 `error=null` → 성공 위장 + 낙관적 갱신만, DB 미반영 → refresh/Realtime 재조회 시 되돌아감.

## 구현
- **`src/utils/categoryUpdate.ts`(신규)**: 순수함수 `interpretCategoryUpdate({data,error})→{ok,errorText}` 추출. `error` 있음 / `data===null` / 0행 모두 실패로, 1행 이상만 성공으로 판정. 0행·null 시 "변경 권한이 없거나 세션이 만료되었습니다" 메시지 반환.
- **`src/utils/categoryUpdate.test.ts`(신규)**: RED→GREEN 4케이스(에러/0행/null/1행).
- **`AdminBoardManagement.tsx`**: `saveMeta`·`updateAccessLevel` 두 update에 `.select("id")` 추가 + `interpretCategoryUpdate` 적용. 0행이면 에러토스트, 낙관적 갱신(setCategories)은 `result.ok` 뒤에만 실행. 두 함수 모두 `try/finally` 로 감싸 `setSavingId/setToggledId(null)` 해제를 finally 로 옮겨 예외 시 loading 고착 방지.

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| 성공 위장 차단 로직 | 0행/null 응답이 실패로 처리되고 낙관갱신이 억제되는지 코드 경로 | interpretCategoryUpdate + result.ok 가드로 차단 |
| Universal gate | `npm run validate` | 통과 (tsc, eslint 0warn, vitest 105, vite build, secret scan) |
| Codex 리뷰 | 정확성·회귀·누락 + WARN 보강 재리뷰 | FAIL 0 — 핵심수정 PASS, WARN 보강(null 테스트·try/finally) 재리뷰 전부 PASS |

## 비고
- 운영 원인(왜 0행이 나는가 = write 시점 세션이 admin 인가 아닐 때)은 이제 실제 에러 토스트로 드러난다. 정상 admin 토큰으로는 1행 성공·영구반영 실측 완료.
- 같이 묶인 미커밋 변경: 직전 세션의 uxHealth 제거(`src/lib/uxHealth.ts` 삭제, `LiveArchitectureMap` 필터링) — 별도 작업.
