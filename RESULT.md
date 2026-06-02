# RESULT: 어드민 refocus 깜빡임 + 응답 테이블 ellipsis — 2026-06-02

## 배경
1. **어드민 새로고침 깜빡임 재발**: 어드민 화면에서 다른 탭 갔다 오면 페이지가 처음부터 재로딩. 원인 = MFA bypass 활성 세션은 탭 refocus마다 authoritative 재검증(`shouldRefocusAuthoritative`=is_active) → `silent=false` → `shouldRaiseLoading`=true → `setLoading(true)`. AdminRoute가 `loading`이면 `<Outlet>` 대신 hidden div 렌더 → 어드민 트리 전체 unmount→remount = 데이터 재fetch 깜빡임. 일반 admin(bypass 없음)은 silent라 무관 → bypass 세션만 재발.
2. **응답 테이블 가독성**: 긴 답변이 셀을 늘려 표가 들쭉날쭉. 원본은 CSV에 보존되므로 표는 요약만.

## 구현
- **`src/hooks/adminGate.ts`**: 순수함수 `shouldGateAdminRender(loading, isAdmin) = loading && !isAdmin` 추가. 초기 진입(아직 admin 미확정)에만 게이트, 이미 admin인 재검증 중엔 false(화면 유지).
- **`src/hooks/adminGate.test.ts`**: RED→GREEN 3케이스(초기진입 게이트 / 재검증 유지 / loading 아님).
- **`src/app/components/AdminRoute.tsx`**: `if (loading)` → `if (shouldGateAdminRender(loading, isAdmin))`. loading&&isAdmin 구간은 통과해 화면 유지, 강등은 commit 후 `!isAdmin` 분기로 Navigate 퇴출. stale MFA 분기(비라이브) 주석 추가.
- **`src/app/components/admin/EventResponsesView.tsx`**: 표 셀을 2줄 clamp(`-webkit-line-clamp:2`)+`height:36`/`lineHeight:18px` 고정 높이+`maxWidth:240`+`title`(hover 전체보기). 선택형 막대그래프 렌더 제거(`summarizeChoiceQuestions` util/test는 보존).
- **`src/app/components/admin/AdminDashboard.tsx`** (방문/누적 추이 차트 정렬 — 시각수정, Codex 미경유·validate 통과): (a) x축 라벨 첫=좌측정렬/마지막=우측정렬/중간=중앙 + `whiteSpace:nowrap`("오늘" 세로 줄바꿈 해결, 선 양끝과 라벨 일치). (b) SVG `preserveAspectRatio="none"` + polyline/grid `vectorEffect="non-scaling-stroke"` → 넓은 화면에서 선이 풀폭 미충족(meet 중앙축소)으로 라벨과 벌어지던 문제 해소. 축 값 숫자(일간/누적 max·0)는 none 스케일 글자 왜곡 방지 위해 HTML 오버레이로 분리.

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| Pure logic | 유닛 테스트 | adminGate.test 3케이스 추가, vitest 101 통과 |
| Universal gate | `npm run validate` | 통과 (tsc, eslint 0warn, vitest 101, vite build, secret scan) |
| Security gate | bypass 만료 시 퇴출 유지 | 강등 commit → loading 해제 → `!isAdmin` Navigate (게이트 유지) |
| Cross-validation | Codex 재리뷰 | **FAIL 0**. F1(clamp 높이)·WARN1(stale 주석) 반영, WARN2(route 렌더 테스트=인프라 부재) 유지 결정 |

## 비고
- **보안 트레이드오프(사용자 수용)**: bypass가 백그라운드 중 만료된 경우, refocus 후 재검증 창(수백ms~few s) 동안 어드민 화면 짧게 stale 노출 후 퇴출. 즉시 가림(기존) → 깜빡임 제거 우선.
- **수동 검증 권장**: refocus 동작은 단위테스트로 못 잡음 → `npm run dev` + bypass 켠 admin 탭 전환으로 확인 필요.
- 미커밋 상태(amend-only 워크플로우). 그래프 제거분은 직전 세션에 이미 force-push로 라이브 반영됨; 본 깜빡임 수정·ellipsis는 배포 전.
