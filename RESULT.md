# RESULT: 프로그램 신청 모델 정합화 (2026-05-29)

## 현재 상태

- 1차 마이그(`20260529025958_revert_to_approval_model`) → 2차 부분 롤백 마이그(`20260529065845_events_fc_apps_fcfs_revert`) 적용 완료.
- 최종 모델: Event/FC 참여 신청 = 선착순, FC 세션 등록 + Consulting 예약 = 승인제.
- `npm run validate` ✅ (tsc + eslint 0 warn + vite build + secrets scan).
- Codex `/codex:adversarial-review` (a~h) blocking/HIGH/MEDIUM 0건, LOW 8건은 모두 "이상 없음" 판정.
- 미커밋 diff에 적층.

## 배경

`SENIOR_REVIEW_REPORT.md`(Gemini) 팩트체크 응답 후, 사용자 QA에서 FC 참여 신청이 의도(선착순)와 어긋남을 발견. 분석 결과:
- 원래 의도: FC 세션 등록만 어드민 승인, 참여 신청은 즉시 확정(선착순). 행사 참가도 즉시 확정. 컨설팅 예약만 승인제.
- 2026-05-29 1차 마이그는 3 테이블 일괄 승인제로 과적용 → Event/FC 참여 신청까지 `DEFAULT='pending'`이 됨.

## 변경 내용

### 신규 마이그 — `20260529065845_events_fc_apps_fcfs_revert`

**event_applications**
- `DEFAULT='pending'` → `'accepted'`
- 기존 `pending` row → `accepted` 백필
- RLS `event_applications_insert_own`: `WITH CHECK (status='accepted' AND can_apply_to_event(post_id))`
- `guard_event_application_user_cancel()`: `OLD.status='accepted' AND NEW.status='cancelled_by_user'`만 허용 (`is_admin()` 즉시 통과)

**founders_club_applications**
- `DEFAULT='pending'` → `'accepted'`
- 기존 `pending` row → `accepted` 백필
- RLS `fc_applications_insert_own`: `WITH CHECK (status='accepted' AND session.status='recruiting' AND count(pending+accepted) < max_participants)`
- `guard_fc_application_user_cancel()`: 동일 패턴

**무변경 영역**
- `consulting_reservations` — 승인제 그대로 (`DEFAULT='pending'` + book/release slot 트리거)
- `founders_club_sessions` — 이미 별도 승인제 (`20260527013726`)
- CHECK constraint — `pending` 잔존 허용 (안전망)
- 어드민 RLS(`is_admin()` 우회) + admin 전체 정책 그대로
- `check_fcfs_capacity` 트리거 (off-by-one 픽스 `20260529035948_fix_fc_capacity_off_by_one` 보존) — revert 마이그가 재정의 안 함

### UI 변경

| 파일 | 변경 |
|---|---|
| `src/app/pages/EventApplicationPage.tsx:189` | INSERT `status: "pending"` → `"accepted"` |
| `src/app/pages/FoundersClubPage.tsx:262` | INSERT `status: "pending"` → `"accepted"` |
| `src/app/pages/FoundersClubPage.tsx:511-512` | 완료문구 "확정" 어휘 복귀 |
| `src/utils/eventApplication.ts:23-24` | default `completionTitle`/`Message` 복귀 |
| `src/utils/eventApplication.ts:38-46` | normalize 화이트리스트 — 임시 "접수" 어휘도 default로 흡수 |
| `src/app/components/ConsultingBookingModal.tsx` | 무변경 (승인제 유지) |
| Admin pages | 무변경 — `pending` 분기는 dead-code 안전망으로 보존 |

### 신규 docs

- `docs/SENIOR_REVIEW_REPORT.md` — Gemini 시니어 리뷰 원문
- `docs/SENIOR_REVIEW_REBUTTAL.md` — 4개 주장 실측 대조 반박서 (유효 1.5건 / 무효 2.5건 판정)

## 점검 (Codex a~h 전수 PASS)

- (a) **PASS** — Event INSERT가 RLS `status='accepted'` + `can_apply_to_event(post_id)` 동시 강제, pending 시도 차단.
- (b) **PASS** — FC INSERT가 RLS `status='accepted'` + 세션 recruiting + 정원 미만 동시 강제, pending 시도 차단. `guard_fc_application_session_open()` 트리거 가드 보존.
- (c) **PASS** — `check_fcfs_capacity` 마지막 1자리 정확 차단(off-by-one 픽스 효과 보존).
- (d) **PASS** — guard 트리거가 `OLD.status='accepted' AND NEW.status='cancelled_by_user'`만 허용.
- (e) **PASS** — guard 함수의 `is_admin()` 즉시 통과 + `event_applications_all_admin`/`fc_applications_all_admin` 정책 보존.
- (f) **PASS** — Consulting RLS/트리거/UI 모두 무변경.
- (g) **PASS** — Event/FC "확정" vs Consulting "접수+승인 후 확정" 비대칭이 DB 모델(accepted vs pending)과 정합.
- (h) **PASS** — Admin pending 분기는 dead-code, historical row 호환 경로로 안전.

**전체 판정**: blocking/HIGH/MEDIUM 0건, LOW 8건 전부 "이상 없음".

## 메모

- diff stat(이번 사이클): 신규 1 마이그(+121) + UI 3 파일 수정 + docs 2종.
- 이전 미커밋 diff(승인제 1차 원복 + 디바운스 + gated 일관 적용 + FC capacity 픽스 + P2/P3/P4 + PostDetailPage 분해) 위에 적층.
- 추가 점검 필요(향후): `MyPage`의 `pending` 상태 분기 dead-code 정리 가능성, Admin pending 탭 hide 여부.
- Codex 메모: pending 분기는 향후 코드 정리 차원에서만 제거 대상 (기능 리스크 0).
