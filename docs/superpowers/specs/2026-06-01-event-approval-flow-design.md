# 행사 신청 선착순 → 승인제 전환 — 설계

작성일: 2026-06-01

## 배경 / 목적

현재 행사 신청은 **선착순 자동 확정**이다. 신청 즉시 `event_applications.status = "accepted"`로 들어가 정원이 바로 차감되고 차면 "마감"된다. 이를 **신청 → 관리자 승인 → 확정** 흐름으로 바꾼다.

승인 인프라(상태모델 pending/accepted/rejected, 관리자 승인·거절 버튼, 정원 가드 트리거)는 이미 존재한다. 변경은 **신청 진입 상태값 + 관리자 상태전이 확장 + 정렬·표시**뿐인 프론트엔드 소규모 작업이다.

## 정원/마감 모델 — 승인 기준 선별제

**정원 점유 = 확정(accepted) 수.** pending(승인 대기)은 정원을 깎지 않는다.

| 동작 | 상태 전이 | 여석(정원-accepted) |
|---|---|---|
| 신청 | → pending | 변화 없음 |
| 관리자 승인 | pending → accepted | **-1** |
| 관리자 거절/취소 | accepted → rejected/cancelled | **+1 (복구)** |
| 관리자 거절/취소 | pending → rejected/cancelled | 변화 없음 |

- **신청(pending)은 무제한 허용** — 정원 넘어도 계속 받아 관리자가 선별한다.
- **마감 = accepted ≥ capacity** 일 때만 신규 신청 차단(`isEventApplicationOpen`이 이미 accepted 기준).
- **DB 트리거(`sync_event_application_counts`)가 `NEW.status='accepted'`일 때만 정원 초과를 막음** → pending 무제한, 승인 시 초과 차단이 DB 레벨로 이미 보장됨.

### DB 변경 없음 (중요)

기존 인프라가 이미 accepted 기준이라 **마이그레이션·RPC·트리거·유틸 헬퍼 변경이 전혀 없다.**
- `get_event_application_counts` → `accepted_count` 그대로 사용.
- `getEventRemaining`/`getEffectiveEventStatus`/`isEventApplicationOpen` → accepted 기준 그대로.
- 정원 가드 트리거 → accepted 전이에서만 작동, 그대로.

## 관리자 상태전이 — 전체 자유 전환

순수 함수 `getAdminActionStatuses(current)`로 허용 전이를 정의하고, 참가자 목록·이력 목록 모두 이 함수로 버튼을 렌더한다(기존 하드코딩 배열 대체).

| 현재 상태 | 전환 가능 (버튼) |
|---|---|
| pending(대기) | accepted(승인), rejected(거절), cancelled_by_admin(취소) |
| accepted(확정) | pending(대기로), rejected(거절), cancelled_by_admin(취소) |
| rejected(거절) | pending(대기 복원), accepted(승인) |
| cancelled_by_admin(취소) | pending(대기 복원), accepted(승인) |
| cancelled_by_user(본인취소) | pending(대기 복원), accepted(승인) |

- 이력(history)에서 pending으로 복원 시 참가자 목록으로 다시 올라온다.
- rejected/cancelled → accepted 직접 전환은 정원 초과면 DB 트리거가 막고 기존 에러 핸들링("정원이 마감되어…")이 표시된다.

## 신청 순서 표시 (관리자)

참가자 목록(pending+accepted)을 **created_at 오름차순(먼저 신청한 순)** 으로 정렬하고, 카드에 **순번(1, 2, 3…)** 을 표시한다. 이력 목록은 기존 정렬 유지.
*(현재 fetch는 created_at 내림차순 — 참가자 목록 memo에서 오름차순 재정렬.)*

## 신청 완료 화면 — 상태 기준 분기

`ProgramConfirmationCard` 제목/설명을 신청자 **실제 상태 기준**으로 분기(config 문구는 normalize가 "확정"으로 되돌리므로 pending엔 부적합):

- **pending**: "신청이 접수되었습니다." / "관리자 승인 후 확정 안내를 등록된 이메일로 보내드리겠습니다."
- **accepted**: `config.completionTitle` / `config.completionMessage` (확정 문구)
- **cancelled_***: 기존 취소 문구 유지

## 화면별 정원 표시

- **신청자 페이지(공개):** 기존 `확정 N / 정원 K` 유지(accepted 기준, 정확). 대기 인원 미노출.
- **관리자 화면:** 이벤트 요약에 대기수 추가 → `확정 N / 대기 M / 정원 K` (M = pending 수).

## 기존 데이터

프로덕션 신청 3건 모두 이미 `accepted`(확정) — 옛 선착순이 자동 확정시킴. **기존 신청자 = 이미 승인됨**, 데이터 마이그레이션 불필요. 신규 신청만 pending으로 받는다. 관리자는 전체 자유 전환으로 기존 확정 건도 대기/거절로 되돌릴 수 있다.

## 변경 범위 (파일별)

### 1. `src/utils/eventApplication.ts`
- `getAdminActionStatuses(current: EventApplication["status"]): EventApplication["status"][]` 순수 함수 추가(위 전이표).

### 2. `src/utils/eventApplication.test.ts`
- `getAdminActionStatuses` 전이표 케이스(5개 상태) 단위 테스트.

### 3. `src/app/pages/EventApplicationPage.tsx`
- 신청 insert `status: "accepted"` → `"pending"`.
- 제출 후 `setAcceptedCount(prev => prev + 1)` 제거(pending은 정원 미점유).
- 완료 카드 제목/설명에 pending 분기 추가(위 문구).

### 4. `src/app/components/admin/AdminEventManagement.tsx`
- 참가자 목록 memo를 created_at 오름차순 정렬 + 카드에 순번 표시.
- 참가자/이력 카드 action 버튼을 `getAdminActionStatuses(application.status)`로 렌더(하드코딩 배열 제거).
- 이벤트 요약에 대기수(pending) 추가 표시 `확정/대기/정원`.

## 테스트

- `eventApplication.test.ts`: `getAdminActionStatuses` 단위 테스트(RED→GREEN).
- `npm run validate` 통과(tsc/eslint/vitest/build/secret scan).
- Codex 재리뷰 FAIL 0.
- 수동 확인: 신규 신청 → pending 표기, 관리자 승인 → accepted·여석 -1, 거절 → 여석 복구, 순번 정렬.

## 결정사항 (확정)

- 정원 = accepted 기준, pending 무제한, 거절/취소 시 여석 복구(결정됨).
- 관리자 전체 자유 상태전환(결정됨).
- 관리자 화면 신청 순서(먼저 신청 순) 표시(결정됨).
- 신청자에게 대기 순번 미노출(결정됨).
- 기존 3건 확정 유지, 데이터 마이그레이션 없음(결정됨).
- DB(마이그레이션/RPC/트리거) 변경 없음(결정됨).
