# RESULT: useAdmin 권한 게이트 동시성/fail-closed 하드닝 (TDD) — 2026-05-30

## 현재 상태

- 발단: 아래 성능/보안 감사의 Codex 재리뷰 **#6 잔여 2건**(silent fail-open 보안 구멍 / 시퀀스 가드 무력화).
- 접근: 게이트 결정 로직을 supabase 의존 없는 **의존성 주입 순수함수**(`src/hooks/adminGate.ts`)로 추출 + **Vitest 도입**(RTL 없이 결정론적 단위 테스트). `useAdmin` 은 얇은 배선으로 위임.
- Codex `/codex:adversarial-review` **#6~#16(11라운드)**. 매 라운드 high 를 TDD(RED→GREEN)로 수렴. 최종 잔여 3건은 **사용자 결정으로 수용 리스크 종료**.
- `npm run validate`(tsc + eslint + **vitest 43** + build + secret) ✅. **전부 미커밋**.

## 변경 파일

- **신규 `src/hooks/adminGate.ts`** — 순수 게이트 코어. `evaluateAdminGate(deps,{silent,prev})`(role→bypass→AAL→factor, `safe()` throw 정규화), `shouldCommitGate`(seq + fail-closed 우선권 + 사용자 식별 + `authoritativeInFlight`), `shouldCheckSilently(event,isSameUser)`, `shouldRaiseLoading`, `shouldRefocusAuthoritative`, `withRetry(fn,attempts,delayMs,sleep)`.
- **신규 `src/hooks/adminGate.test.ts`** — 43 테스트(기존 동작 보존 + 각 라운드 회귀).
- **수정 `src/hooks/useAdmin.ts`** — 순수 코어에 supabase fetcher 주입 + 시퀀스/loading/in-flight ref 배선. 외부 반환 시그니처 불변.
- **신규 `vitest.config.ts`/수정 `package.json`** — Vitest 설정 + `test`/`test:watch` + `validate` 에 `vitest run` 편입.

## Codex 재리뷰 #6~#16 (전부 high → TDD 수렴)

- **#6** silent fail-open(만료 순간 admin 잔존) + 시퀀스 가드 무력화 → 트리거별 fail-open/closed + 부수효과 없는 평가·단일 가드 커밋.
- **#7** 나중 silent 가 먼저 시작된 fail-closed 드롭 / sign-out in-flight 재커밋 → `shouldCommitGate`(fail-closed 우선권 + 사용자 식별) + sign-out seq 무효화.
- **#8** 동일사용자 이벤트 전부 silent → OTP 직후 stale mfaRequired → `shouldCheckSilently`(상승 이벤트 authoritative).
- **#9** SIGNED_IN 오분류(refocus 빈발) + MFA hard-deny → `MFA_CHALLENGE_VERIFIED`만 authoritative + `withRetry`.
- **#10** authoritative·만료/토글 loading 미상승 → 비동기 창 stale 라우팅 → `shouldRaiseLoading` 즉시 게이트.
- **#11** fail-closed bypass 실패 시 옛 active bypass 유지 → 만료타이머 무한루프+stale 배너 → bypass 비활성화.
- **#12** 즉시 재시도 전파 race 무력 / loading wedge → `withRetry` delay + `safe()` 정규화 + finally.
- **#13/#14** 만료 bypass refocus fail-open(캐시 의존) → `shouldRefocusAuthoritative`(is_active 기준).
- **#15** 나중 silent 가 fail-closed in-flight loading 창 닫아 stale 재노출 → `authoritativeInFlight` 가드.
- **#16** (가드 부작용) fresher silent 드롭 + 옛 fail-closed deny 커밋 → narrow false-lockout(수용).

## 수용 리스크 (사용자 결정 "여기서 수용 리스크로 종료", 2026-05-30)

1. **#16 narrow false-lockout** — OTP 전파 직후 좁은 창에서 fresher silent 드롭 + stale fail-closed deny 커밋 가능. 대부분 authoritative retry(~600ms) 자체 회복, 잔여는 다음 이벤트/RLS 회복. 보안상 #15(stale admin 재노출) 차단을 우선해 현 상태 유지.
2. **실시간 강등 미반영** — 포커스 유지 탭 role/bypass 변경 지연(realtime 필요). RLS(AAL2) 최종차단.
3. **소비자별 useAdmin fan-out** — 인스턴스마다 중복 check(100명·멱등·RLS 최종차단 저영향).

→ 셋 다 `PLAN.md` Future(직렬화/realtime/싱글톤).

---

# (이전 작업) RESULT: 사이트 성능/보안 감사 — RLS·select*·인증게이트 (2026-05-30)

## 현재 상태

- 발단: 유저 "사이트 느림/무거움" → 6항목 점검(N+1/페이지네이션/인덱스·풀스캔/커넥션풀/select*/기타).
- 핵심 원인 = **RLS 비효율**(profiles 110행 seq_scan 1015만, admin_mfa_bypass 1행 158만). `is_admin()` 행마다 재평가 + 중복 permissive.
- 마이그 4 + 코드 2파일 적용, `npm run validate` ✅, **전부 미커밋**.
- Codex `/codex:adversarial-review` **6라운드**: 1~5 high/medium 전부 처리, **#6 잔여 2건 미적용**(→ `PLAN.md` In Progress).

## 감사 결과 (6항목)

| # | 항목 | 결과 |
|---|---|---|
| 1 | N+1 쿼리 | **없음**. FoundersClubPage `Promise.all(map(async))` 내부 쿼리 0(메모리 Map) → 오탐 |
| 2 | 페이지네이션 없음 | **갭 없음**. News/EventArchive/Companies/AdminPostManage/Community 전수 클라 페이지네이션 기구현(단, 전행 fetch 후 클라 분할) |
| 3 | 인덱스 누락·풀스캔 | 풀스캔 폭증은 인덱스 아님, **#6 RLS 원인**(소형 테이블). unindexed FK 22건 INFO·저영향 |
| 4 | 커넥션풀 크래시 | **해당없음**. Supabase PgBouncer 서버측 관리, 클라 싱글톤 정상 |
| 5 | select * 과다 | **부분**. 공개 리스트 `posts.select('*')` content(본문 HTML)가 썸네일/video 파싱 **필수**라 strip RPC 부적합 → 유지. AdminDashboard만 절감 |
| 6 | 기타 (주범) | **RLS auth_rls_initplan 29 + multiple_permissive 33** |

## 변경 내용

### 마이그 (4개)

- **`20260530013843_rls_perf_initplan_and_permissive_consolidation`** (메인, 멱등)
  - `is_admin()`/`is_founders_session_host()` `VOLATILE → STABLE` (InitPlan 캐싱 전제; 둘 다 읽기전용 SECURITY DEFINER).
  - 전 GXP 정책 `auth.uid()`/`is_admin()`/`is_founders_session_host()` `(select ...)`로 래핑 → 쿼리당 1회 평가(auth_rls_initplan 29건 해소).
  - admin `ALL`/`SELECT` 정책을 own/public 정책에 `(select is_admin()) OR ...`로 흡수 → 중복 permissive 33건 통합(profiles/companies/consultants/consulting_slots/consulting_reservations/event_applications/founders_club_applications/office_hour_applications/office_hour_months/founders_club_sessions/articles/external_news_items).
  - **보안 부수 수정**: `post_categories_update_admin` raw role(`profiles.role='admin'`) → `(select is_admin())` (MFA/AAL2 우회 차단); `consulting_slots` 비관리자 직접 UPDATE 제거 → admin 전용(booked 전환은 `book/release_consulting_slot_on_reservation` SECURITY DEFINER 트리거 담당, 비관리자 UPDATE 불필요).
  - **멱등성**: 신규 이름 정책 전부 `DROP POLICY IF EXISTS` 선행(핫픽스 환경 재실행 시 duplicate 방지).
  - `date_planner_*`(별도 앱·0행) 범위 외 — 잔존 advisor 경고 전부 그쪽.
- **`20260530014545_dashboard_distinct_visitor_count_rpc`** — `count_distinct_visitors()` (SECURITY INVOKER, page_views RLS 준수, authenticated EXECUTE).
- **`20260530020536_post_categories_update_admin_use_is_admin`** — 멱등 보정(013843 반영, 약한 정의 잔존 환경 수렴).
- **`20260530024536_consulting_slots_update_admin_only`** — 멱등 보정(동일).

### 코드 (2파일)

- **`src/app/components/admin/AdminDashboard.tsx`** — (a) top-5용 전체 posts 풀바디(~800KB) → `select('id, title, views, created_at, category')`. (b) page_views 6243행 클라 distinct → `rpc('count_distinct_visitors')` + **실패 시 클라 distinct 폴백**(0 오염 방지) + 로깅.
- **`src/hooks/useAdmin.ts`** — 이벤트 인지 권한 재검증. `check()`를 컴포넌트 스코프 `useCallback` 승격 + 시퀀스 가드(`checkSeqRef`). 동일 유저/탭복귀(`visibilitychange`)/모든 auth 이벤트에서 silent 재검증(신규 유저만 로딩 게이트). `refreshBypassState`·만료 타이머 `check`로 위임 → role+bypass+MFA 전체 재평가. `INITIAL_SESSION`은 getSession 중복이라 skip.

## Codex adversarial 재리뷰 이력

- **#1** [high] post_categories raw-role → AAL2 우회 → `is_admin()` 픽스. [medium] Dashboard RPC 에러 무시 → 로깅. [medium] useAdmin same-user skip → 이벤트 분기.
- **#2** [high] useAdmin same-user stale(이벤트 미발생 권한변경) → 강화. [high] 마이그 순서 취약 → 첫 마이그 직접 수정.
- **#3** [high] consulting_slots 비관리자 UPDATE 우회 → admin 전용. [high] FC 세션 host 전상태 하드삭제 → **유저 "현행 유지" 결정**(의도된 동작, 수용 리스크).
- **#4** [high] 013843 비멱등 → 신규 이름 7블록 self-DROP. [medium] bypass 만료 재평가가 role 미조회 → check 승격+위임.
- **#5** [high] silent 재검증이 일시 실패를 권한 박탈로 오해(admin 튕김) → `check(silent)` 도입, 실패 시 기존 권한 유지. [medium] Dashboard RPC 폴백.
- **#6 (해결됨 → 위 "useAdmin 게이트 하드닝" 세션에서 #6~#16 TDD 수렴)**

## 메모

- diff stat: 마이그 4 신규 + 코드 2 수정. 이전 미커밋 diff(프로그램 신청 모델 등) 위 적층.
- 잔여 한계(설계): events-archive 공개 페이지 35건×~23KB HTML(~800KB) 끌어옴 — content가 클라 media 파싱에 구조적 필수, 안전 drop 불가. 후속: 서버측 thumbnail/youtube URL 추출 컬럼 도입 권장.
- 잔여 한계(권한): 액티브 탭에서 타 관리자 실시간 강등은 다음 토큰갱신/탭복귀까지 지연(silent). instant 반영은 profiles/admin_mfa_bypass realtime 구독 필요(별도). 백엔드 RLS가 최종 차단.
- 이전 세션(프로그램 신청 모델 정합화) RESULT는 필요 시 `RESULT_ARCHIVE.md` 참고.