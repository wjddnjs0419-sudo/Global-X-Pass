# RESULT: Founder's Club 신청 RLS 무한재귀 픽스 (TDD) — 2026-05-31

## 배경
신청 버튼 클릭 시 `infinite recursion detected in policy for relation "founders_club_applications"` 로 INSERT 전면 실패. non-admin 이 recruiting 세션에 실제 신청할 때만 발동해 표면화.

## 근본원인
`fc_applications_insert_own` INSERT 정책 WITH CHECK 가 정원 체크용 자기참조 서브쿼리를 포함:
`EXISTS(... WHERE s.id=session_id AND s.status='recruiting' AND (SELECT count(*) FROM founders_club_applications fca WHERE fca.session_id=s.id AND fca.status IN ('pending','accepted')) < s.max_participants)`.
INSERT 정책 평가 중 같은 테이블(`founders_club_applications`)을 재조회 → RLS 재귀. 잠복 `20260519120000_auto_confirm_program_applications`(정원 로직을 RLS에 박음)~, 이후 마이그들이 복붙 답습. 정원은 이미 BEFORE INSERT 트리거 `check_fcfs_capacity`(SECURITY DEFINER, `FOR UPDATE` 직렬화, off-by-one 기수정)가 강제 → RLS count 는 **중복**.

## TDD (라이브 DB, 전부 트랜잭션 롤백 — 데이터 무변동)
1. **RED** — 비관리자(`request.jwt.claims` sub 주입) recruiting 세션 INSERT → `infinite recursion detected` 재현 ✅(기대한 이유로 실패).
2. **GREEN** — 멱등 마이그 적용 후 동일 INSERT → `status=accepted` 성공 ✅.
3. **회귀1** — 정원 도달 시 트리거가 세션 `closed` 전환 → RLS의 `recruiting` 체크가 추가 신청 차단(RLS violation) ✅.
4. **회귀2** — close된 세션 강제 recruiting 복귀(race 모사) 후 over-cap INSERT → 트리거 하드가드 `founders club capacity reached` 차단 ✅.

## 수정
- **마이그 `20260531091452_fc_applications_insert_remove_self_ref_recursion`** (멱등, `DROP POLICY IF EXISTS` 선행) — 자기참조 count 서브쿼리 제거, 나머지 가드 유지: `(select public.is_admin()) OR ((select auth.uid())=user_id AND status='accepted' AND EXISTS(select 1 from founders_club_sessions s where s.id=session_id and s.status='recruiting'))`. `to authenticated` 보존.
- 라이브 적용(원격 버전 `20260531091452`) + 로컬 파일명 sync. 세션 상태 원복 확인(max 6, recruiting, apps 0).

## 검증
- **`npm run validate` ✅** (tsc+eslint+vitest+build+secret).
- **Codex adversarial review 4 concern 전부 PASS** (OVERALL PASS): (1) 보안 — 트리거 위임일 뿐 신규 우회 없음, (2) 멱등 — drop-if-exists 수렴, (3) 회귀 — own/accepted/recruiting 가드 유지(count 만 제거), (4) race — 트리거 FOR UPDATE 직렬화로 신규 TOCTOU 없음.
- **전부 미커밋.**

---

# (이전 작업) RESULT: 미커밋 대규모 업데이트 검증 + 브라우저 E2E Codex 이관 — 2026-05-30

## 배경
유저 요청: "무얼 업데이트했고, 모든 기능(어드민 회원관리·게시물 작성/수정·program 행사·컨설팅·Founder's Club 등록/신청)이 정상 작동하는지 확인." 직전 세션이 Codex 13라운드급 대규모 업데이트라 미커밋 변경의 무결성 확인이 핵심.

## 검증한 변경 범위 (미커밋)
- **마이그 4개**: `20260530013843`(RLS initplan 29건 `(select …)` 래핑 + 중복 permissive 33건 admin 흡수 통합, `is_admin`/`is_founders_session_host` STABLE), `20260530014545`(`count_distinct_visitors` RPC), `20260530020536`(post_categories update→is_admin), `20260530024536`(consulting_slots 직접 UPDATE admin 전용).
- **코드 2파일**: `AdminDashboard.tsx`(`select *`→필요 컬럼만 + RPC 집계 + 실패 시 클라 폴백), `AdminUserManagement.tsx`(회원 카드 회사 뱃지).
- 문서/`vite.config.ts`/생성물 다수.

## 검증 방법 & 결과 (정적 + DB레벨)
1. **`npm run validate` ✅** — tsc + eslint + **vitest 43** + build(quill 225kB 등 청크 정상) + frontend-secret scan(77 파일).
2. **마이그 sync ✅** — `list_migrations` 원격에 4개 버전 존재, 로컬 파일명 일치.
3. **라이브 RLS 정책 대조 ✅** — `pg_policies` 조회로 마이그 정의와 1:1 확인:
   - profiles: select(admin OR 본인)/insert·update·delete admin.
   - posts: insert·update·delete admin, select_auth + anon `posts_select_public_by_flag`. post_categories: update admin + select_all.
   - event_applications / consulting_reservations / founders_club_applications: 본인+admin own 정책.
   - consulting_slots: select_auth + insert·update·delete **admin 전용**(비관리자 직접 UPDATE 우회 제거).
   - founders_club_sessions: select_auth + anon public + insert_host/delete_host/update_admin.
4. **트리거 활성 ✅** (`pg_trigger`, 전부 `tgenabled='O'` + SECURITY DEFINER):
   - consulting_reservations: book_slot / release_slot / guard_user_cancel.
   - event_applications: sync_counts / guard_user_cancel / updated_at.
   - founders_club_applications: guard_session_open / guard_user_cancel / fcfs_auto_close(`check_fcfs_capacity`).
   - founders_club_sessions: auto_enroll_host.
   - → 컨설팅 슬롯 booked 전환·FCFS 정원·세션 host 자동등록 모두 백엔드 강제 보장.
5. **Advisor** — 성능: **GXP 테이블 경고 0**(WARN 전부 별도 앱 `date_planner_*`; profiles seq_scan 폭증 해소 확인). 보안: 신규 `count_distinct_visitors` 클린(`search_path=public` + SECURITY INVOKER → page_views_select_admin RLS 적용). 잔여 WARN(secdef 함수 anon/auth 노출 72, function_search_path_mutable 6, 버킷 listing 2, 누설PW 1)은 **전부 기존 항목, 이번 작업 회귀 아님**.

## 결론
**정적·DB레벨 전부 PASS.** 핵심 기능 5종의 권한·무결성 경로가 라이브 DB에 의도대로 반영됨. 깨진 경로 없음.

## 브라우저 E2E — Codex 이관 (사용자 결정)
- headed 브라우저로 사람 눈 실동작 확인은 **Codex가 수행**. 자격증명은 로컬 미보유(`QA_*` env 전부 unset, `.env.qa` 없음, GitHub Secrets는 로컬 재조회 불가) → 사용자/Codex가 env 주입.
- 이관 가이드는 `PLAN.md` In Progress 항목(계정·하니스·플로우·주의) 참조. `tests/qa/*.spec.ts` 하니스 + `playwright.config.ts`(baseURL을 `localhost:5174`로 오버라이드).
- **미커밋 유지** — Codex 리뷰/QA 범위 명확화 위해.

---

# (이전 작업) RESULT: useAdmin 권한 게이트 동시성/fail-closed 하드닝 (TDD) — 2026-05-30

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