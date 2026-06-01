# RESULT: 처리내역 어드민 영구삭제 버튼 — 2026-06-01

## 배경
행사 관리 "처리 내역(history)" 탭(거절/사용자취소/관리자취소 = terminal 신청)에 어드민이 행을 **영구 삭제**할 수 있는 버튼이 없었다. 기존 다른 관리탭(FoundersClub/OfficeHour/News)의 Trash2 삭제 패턴을 처리내역 카드에 도입했다. TDD로 진행.

## 구현
- **`src/utils/eventApplication.ts`**
  - 순수함수 `isDeletableApplicationStatus(status)` 추가 — terminal(`rejected`/`cancelled_by_user`/`cancelled_by_admin`)만 `true`. RLS `event_applications_delete_own_terminal`의 terminal 집합과 일치.
- **`src/utils/eventApplication.test.ts`**: 5상태 RED→GREEN(terminal 3=true, pending/accepted=false).
- **`src/app/components/admin/AdminEventManagement.tsx`**
  - `Trash2` import.
  - `handleDelete(application)`: `isDeletableApplicationStatus` 가드 → `window.confirm` → `supabase.from("event_applications").delete().eq("id", id)` → 성공 시 `fetchData()`. 기존 `updatingId` 재사용.
  - `renderDeleteButton`(빨간 Trash2 버튼, `deleteBg`/`deleteBorder`), `renderActionRow`/`renderApplicationCard`에 `deletable` 플래그 추가.
  - **처리내역(history) 렌더에서만** `deletable=true` → 참가자(pending/accepted) 탭엔 삭제 버튼 미노출.

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| Pure logic | 유닛 테스트 | `eventApplication.test.ts` 5케이스 추가, vitest 40 통과 |
| Universal gate | `npm run validate` | 통과 (tsc, eslint 0warn, vitest 83, vite build, frontend secret scan) |
| DB/RLS | 권한 확인 | DB변경 0 — admin은 `event_applications_delete_own_terminal`로 DELETE 기존 허용 |
| Cross-validation | Codex 재리뷰 | 삭제기능 PASS. F1·W1~W3 처리 아래 참조 |

## 비고
- **Codex F1**(처리내역에 `getAdminActionStatuses` 복원버튼 노출) = 내 변경 아님, 승인제 전환 작업의 의도 전이표(`rejected→[pending,accepted]`). 사용자가 **유지** 확정(처리내역이 유일 복원 경로).
- **W1**(eventApplication.ts normalize/merge 변경) = 직전 "동적질문 FAIL 4건" 미커밋분, 본 작업 무관.
- **W2**(UI 경로 테스트 부재) = 컴포넌트 테스트 인프라 부재, 순수 가드만 유닛 보강.
- **W3**(delete 영향 행수 미확인) = RLS상 admin 항상 통과 + fetchData 갱신으로 무해, 사용자 **미반영** 결정.
- 변경 2파일 + 테스트 미커밋. 직전 동적질문 4파일과 함께 퍼블리싱 전 커밋 필요.
