# RESULT: 회원가입 남용 방지 — IP 기반 Rate Limit (2026-05-14 — 22차)

## 현재 상태
- `signup-profile` Edge Function에 IP 기반 rate limit을 추가해 동일 IP에서 10분 내 5회 초과 시 회원가입을 차단한다.
- 원자적 처리(PostgreSQL advisory lock)로 동시 요청 경쟁 조건을 제거했다.

## 이번 세션 주요 변경

| 파일 | 변경 내용 |
|------|-----------|
| `supabase/migrations/20260514110000_signup_rate_limit.sql` | `signup_rate_limit` 테이블 생성, `(ip, attempted_at)` + `(attempted_at)` 인덱스, RLS 활성화 |
| `supabase/migrations/20260514120000_signup_rate_limit_atomic.sql` | `page_views` anon INSERT 권한 추가, `check_and_record_signup_attempt()` RPC 함수 생성 (advisory lock + 전체 만료 기록 정리) |
| `supabase/functions/signup-profile/index.ts` | `extractIp()` 추가, 3개 쿼리 → RPC 1회 호출로 교체, unknown IP 시 rate limit 건너뜀 |

## Codex 리뷰 이력
- 1차: RPC 함수 누락(P1), anon 권한 누락(P2) → 수정
- 2차: unknown IP 버킷 문제(P2), 테이블 무한 증가(P3) → 수정
- 3차: 전체 테이블 스캔 발생(P2, `attempted_at` 인덱스 누락) → 수정
- 4차: 이슈 없음 (GEMINI.md 이슈는 기존 세션 문제로 범위 외)

## 검증 결과
- [x] `npm run validate` ✅
- [x] `supabase db push` ✅ (마이그레이션 2개 적용)
- [x] `supabase functions deploy signup-profile` ✅

## 세션 중 확정된 워크플로우 규칙
- Git: Codex 리뷰 직후 amend → 피드백 반영 → 다시 Codex 리뷰 → amend
- Codex 리뷰 전: 변경 요약을 사용자에게 제공 후 승인 시 실행

## 종료 전 점검
- [x] `PLAN.md` 완료 항목 `[Done]` 정리
- [x] `RESULT.md` 최신 핫 컨텍스트 반영
- [x] `npm run validate` ✅
- [x] 마이그레이션 DB 적용 확인
