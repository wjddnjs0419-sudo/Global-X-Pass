# HANDOFF — 게시판 단위 접근 제어 동적화 후속 개선

**작성일**: 2026-05-26
**전 세션 결과**: `RESULT.md` 참조
**리뷰어**: Codex (gpt-5.3-codex)
**상태**: 미커밋(Codex 리뷰 완료, 개선 작업 대기)

---

## 1. 리뷰 합격 항목 (수정 불필요)

| # | 항목 | 결과 |
|---|---|---|
| 1 | RLS/RPC 보안 — anon 우회 가능 여부 | ✅ OK |
| 2 | BoardAccessGate auth 타이밍 — flicker/race | ✅ LOW (허용 범위) |
| 3 | useBoardAccess Realtime 채널명 충돌 | ✅ OK |

세부 근거:
- `list_public_post_previews`: anon은 `post_categories.is_public=true` AND 게시판 공개일 때만 노출. `auth.uid() IS NOT NULL` 분기 우선.
- `get_post_access_info`: 메타데이터만 반환, 비공개·미매핑 시 `requires_auth=true`.
- `increment_view_count`: 비인가 증분 차단.
- expenses 이중 잠금: `20260526130000_lock_expenses_visibility.sql` 트리거 + 프리뷰 제외.
- `useBoardAccess`: `useId()` 접미사로 인스턴스별 고유 채널, `id=eq.${category}` 필터.

---

## 2. 개선 필요 항목 (HIGH)

### A. AdminBoardManagement 잠금 카테고리 보호 불완전

**문제**:
- 서버 트리거(`enforce_post_category_lock`): `is_public`/`is_locked` 변경만 차단. 라벨·설명 수정은 허용.
- UI: 잠금 토글 버튼만 비활성. 라벨/설명 input은 잠금 여부와 무관하게 편집 가능.
- 결과: 잠긴 게시판(expenses) 라벨을 어드민이 자유롭게 변경 가능 → "잠금=변경 불가" 의미 불일치.

**개선 작업**:
1. **마이그레이션 신규** `supabase/migrations/YYYYMMDD_lock_post_category_metadata.sql`:
   ```sql
   CREATE OR REPLACE FUNCTION public.enforce_post_category_lock()
   RETURNS trigger
   LANGUAGE plpgsql
   AS $$
   BEGIN
     IF OLD.is_locked = true THEN
       IF NEW.is_public IS DISTINCT FROM OLD.is_public
          OR NEW.is_locked IS DISTINCT FROM OLD.is_locked
          OR NEW.label IS DISTINCT FROM OLD.label
          OR NEW.description IS DISTINCT FROM OLD.description THEN
         RAISE EXCEPTION '카테고리 % 는 잠겨 있어 설정을 변경할 수 없습니다.', OLD.id;
       END IF;
     END IF;
     RETURN NEW;
   END;
   $$;
   ```
2. **`src/app/components/admin/AdminBoardManagement.tsx`**:
   - 라벨·설명 `<input>`에 `disabled={cat.is_locked}` 추가
   - "라벨/설명 저장" 버튼도 `disabled={cat.is_locked || !dirty || saving}`
   - 잠긴 카테고리는 input 시각적으로 readonly 톤(opacity 또는 background 변경)

---

### B. AdminPostCreate 편집 모드 visibility 미동기화

**문제**:
- 신규 작성: 카테고리 변경 시 board `is_public` 상속 (구현됨)
- 편집 모드: `editingPost` 존재 시 board 기본값 조회 useEffect가 early return → 사용자가 카테고리를 바꿔도 `is_public` 미갱신
- 결과: 공개 게시판 글을 비공개 게시판으로 이동해도 `is_public=true` 유지 → 비공개 게시판에 공개 글이 노출되는 정책 불일치.

**개선 작업**:
- `src/app/components/admin/AdminPostCreate.tsx` 의 board 상속 useEffect 수정:
  - 옵션 1 (단순): 편집 모드 가드 제거. 카테고리 변경 시 항상 board 기본값 적용. 단, 초기 로드(editingPost 동기화 직후)에는 적용 안 되도록 별도 ref로 첫 마운트 추적.
  - 옵션 2 (UX 보존): 편집 모드에서 카테고리 변경 시 토스트/모달로 "이 게시판의 기본 공개 설정은 X입니다. 적용할까요?" 확인 후 적용.
- **권장**: 옵션 1. 사용자는 저장 직전 공개/비공개 토글 UI에서 최종 확인 가능하므로 추가 모달 불필요.

구현 가이드(옵션 1):
```tsx
const initialSyncRef = useRef(false);

useEffect(() => {
  if (editingPost && !initialSyncRef.current) {
    initialSyncRef.current = true;
    return;
  }
  if (category === "expenses") return;
  let cancelled = false;
  supabase.from("post_categories").select("is_public").eq("id", category).maybeSingle()
    .then(({ data }) => {
      if (cancelled || !data) return;
      setIsPublic(Boolean(data.is_public));
    });
  return () => { cancelled = true; };
}, [category, editingPost]);

useEffect(() => {
  initialSyncRef.current = false;
}, [editingPost?.id]);
```

---

## 3. 검증 체크리스트

- [ ] A 마이그레이션 작성 + 원격 적용 (`mcp__plugin_supabase_supabase__apply_migration`)
- [ ] A UI 잠금 disabled 처리
- [ ] B AdminPostCreate ref 기반 초기 동기화 + 카테고리 변경 시 상속
- [ ] `npm run validate` (tsc + eslint + vite build + secret scan)
- [ ] 수동 테스트:
  - expenses 라벨 변경 시도 → 트리거 RAISE EXCEPTION
  - 편집 모드에서 카테고리 events→resources 변경 → is_public 자동 false 전환
- [ ] Codex 재리뷰 (선택)
- [ ] amend 커밋

---

## 4. 미커밋 변경 목록 (현재 시점)

```
M  PLAN.md
M  RESULT.md
M  electron/main.cjs
M  electron/preload.cjs
M  index.html
M  package.json
M  src/lib/types.ts
M  src/app/routes.tsx
M  src/app/pages/AdminPage.tsx
M  src/app/pages/NoticePage.tsx
M  src/app/pages/NewsPage.tsx
M  src/app/pages/EventsPage.tsx
M  src/app/pages/EventArchivePage.tsx
M  src/app/pages/ResourcesPage.tsx
M  src/app/pages/MediaPage.tsx
M  src/app/pages/BlogPage.tsx
M  src/app/pages/FaqPage.tsx
M  src/app/components/admin/AdminSidebar.tsx
M  src/app/components/admin/AdminPostCreate.tsx
M  src/app/components/admin/AdminBoardManagement.tsx
?? src/app/components/BoardAccessGate.tsx
?? src/hooks/useBoardAccess.ts
?? supabase/migrations/20260526120000_add_post_visibility.sql
?? supabase/migrations/20260526130000_lock_expenses_visibility.sql
?? supabase/migrations/20260526140000_create_post_categories.sql
?? HANDOFF.md
```

원격 적용 완료된 마이그레이션:
- `add_post_visibility`
- `lock_expenses_visibility`
- `create_post_categories`

---

## 5. 참고 자료

- 전 세션 결과 상세: `RESULT.md`
- 활성 작업: `PLAN.md`
- 프로젝트 규칙: `docs/AGENT_RULES.md`
- 안티패턴: `docs/AGENT_ANTI_PATTERNS.md`
