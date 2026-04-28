# Session Log — 2026-04-27 (Session B)

## 업데이트 목록

### 1. 사용자 역할 시스템 리팩토링 (2계급 → 3계급)
- `src/lib/types.ts` — `role: 'admin' | 'user'` → `'admin' | 'participant' | 'user'`
- `src/app/pages/AdminPage.tsx` — `handleGrantAdmin` → `handleSetRole` (3가지 역할 지원)
- `src/app/pages/ExpensesPage.tsx` — 그룹 기반 접근 제어 제거, role 기반으로 교체 (`admin` | `participant` 허용)

### 2. 어드민 회원 관리 개선 (`AdminUserManagement.tsx` 전면 재작성)
- 역할 드롭다운 (`<select>`) 으로 관리자 / 참여사 담당자 / 일반 회원 직접 지정
- 역할별 색상 뱃지: admin=red, participant=blue, user=gray
- 회원 이름/이메일 검색 기능 추가

### 3. 그룹 관리 탭 제거
- `AdminPage.tsx` — "그룹 관리" 탭 및 `AdminGroupManagement` 컴포넌트 렌더링 삭제
- `src/hooks/useUserGroups.ts` 파일 미사용 상태로 잔존 (추후 삭제 가능)

### 4. Founder's Club 어드민 개선 (`AdminFoundersClubManagement.tsx`)
- 세션 상태 필터 추가: 전체 / 모집중 / 마감 / 완료
- 상태 변경 방식 변경: 버튼(사이클) → `<select>` 드롭다운

### 5. 디자인 시스템 — 카테고리 키컬러 일관화
- `badge.tsx` — `purple` variant 추가
- `adminConstants.ts` — `CATEGORY_COLOR` 맵 추가 (카테고리별 color/bg/bgDark)
- `AdminPostManage.tsx` — 카테고리 뱃지 색상 동적화 (hardcode → `CATEGORY_COLOR` 맵)
- `CommunitySection.tsx` — 카테고리별 `Badge` variant 수정 (news=blue, blog=purple, faq=yellow)
- `EventSection.tsx` — 이벤트 뱃지 green으로 통일
- `NewsletterSection.tsx` — 인사이트 뱃지 yellow→blue 수정

### 6. CLAUDE.md 생성
- 프로젝트 루트에 `CLAUDE.md` 작성: 커맨드, 아키텍처, 역할 시스템, DB 테이블, 디자인 시스템 문서화

### 7. 기능 검수 및 버그 수정
- **1:1 컨설팅**: 비로그인 사용자가 "예약 신청" 버튼 클릭 시 alert 후 모달 미오픈 처리 추가 (`ConsultingPage.tsx`)
- **컨설팅 페이지 에러 표시**: 데이터 fetch 오류 시 에러 배너 표시 로직 추가
- **RLS 위반 오류 수정**: 전문가 등록·슬롯 추가·예약 승인·Founder's Club 세션 등록 등 모든 어드민 write 작업에서 발생하던 RLS 오류 → SQL 정책 추가로 해결

---

## 다음 세션 필수 작업 (SQL 실행 필요)

아래 SQL을 Supabase SQL 에디터에서 실행해야 새 기능이 정상 작동합니다.

### ① Founder's Club 세션 공개 조회 정책
```sql
CREATE POLICY "Anyone can view founders club sessions"
  ON founders_club_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);
```
**미실행 시 증상:** `/founders-club` 페이지에서 세션 목록이 로드되지 않음

### ② Founder's Club 신청 INSERT 정책
```sql
CREATE POLICY "Users can insert own founders club applications"
  ON founders_club_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```
**미실행 시 증상:** "신청하기" 버튼 눌러도 신청 실패

### ③ Founder's Club 신청 본인 조회 정책
```sql
CREATE POLICY "Users can view own founders club applications"
  ON founders_club_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```
**미실행 시 증상:** 세션 카드에 신청 상태가 표시되지 않음, MyPage 신청 목록 비어 있음

### ④ 사업비 자료실 역할 기반 접근 정책 교체
> **먼저**: Supabase Dashboard → Authentication → Policies → `posts` 테이블에서 기존 SELECT 정책 이름 확인 후 삭제

```sql
-- 기존 그룹 기반 정책 삭제 (이름 확인 후 조정)
DROP POLICY IF EXISTS "Group-based Post Access Control" ON posts;

-- 역할 기반 정책 추가
CREATE POLICY "Role-based expenses post access"
  ON posts
  FOR SELECT
  TO authenticated
  USING (
    category != 'expenses'
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'participant')
  );
```
**미실행 시 증상:** `participant` 역할 사용자도 사업비 자료실 접근 불가

---

## 알려진 미해결 사항

| 항목 | 내용 |
|---|---|
| `useUserGroups.ts` | 그룹 기반 RBAC 제거 후 미사용 상태. 안전하게 삭제 가능 |
| `posts.allowed_group_id` 컬럼 | DB에 잔존하나 프론트에서 미사용. 추후 마이그레이션으로 제거 가능 |
| 컨설팅 예약 중복 신청 방지 | 동일 슬롯에 중복 신청 방지 DB 제약조건 미확인 (DB 레벨 unique 제약 검토 필요) |
| MyPage 컨설팅 내역 | 취소 기능 없음 (현재는 조회만 가능) |
