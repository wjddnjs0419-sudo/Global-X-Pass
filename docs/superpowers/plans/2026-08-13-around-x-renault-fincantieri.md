# Around X Renault · Fincantieri 프로그램 페이지 Implementation Plan

> **Execution:** Use a single agent by default. Delegate only genuinely independent work; select verification and TDD according to risk.

**Goal:** Renault와 Fincantieri Around X 메뉴를 Coming Soon에서 정식 프로그램 소개 페이지로 전환한다.

**Architecture:** 각 페이지는 PageShell의 제목·부제를 소유하고, 새 `ProgramIntroSection`은 두 페이지에서 동일한 로고·소개 레이아웃만 재사용한다. 명시 라우트가 WildcardRoute보다 먼저 매칭되도록 추가하고, 메뉴 항목에서 두 `comingSoon` 플래그만 제거한다.

**Tech Stack:** React 18, TypeScript, React Router v7, Vite, Vitest, CSS custom properties.

## Global Constraints

- 확정된 한국어 문구를 임의로 번역·확장하지 않는다.
- 사용자 제공 원본 로고만 사용하며 원본 비율을 유지한다.
- Changgu timeline, 공통 Coming Soon 시스템, DB·Supabase·인증은 변경하지 않는다.
- commit, push, deploy를 실행하지 않는다.
- `npm run validate`로 TypeScript·ESLint·Vitest·production build를 검증한다.

---

### Task 1: 메뉴 정식 오픈 회귀 테스트

**Files:**
- Modify: `src/app/navigation/mainMenu.test.ts`

**Interfaces:**
- Consumes: `DESKTOP_MAIN_MENUS` and `AROUND_X_ROUTES` from `mainMenu.ts`.
- Produces: Renault/Fincantieri 메뉴 항목이 `comingSoon`이 아님을 보장하는 테스트.

- [ ] **Step 1: 실패하는 메뉴 테스트를 추가한다.**

```ts
it.each([AROUND_X_ROUTES.renault, AROUND_X_ROUTES.fincantieri])(
  "%s는 정식 프로그램 페이지로 열려 있어 Coming Soon이 아니다",
  (path) => expect(byPath(path)?.comingSoon).not.toBe(true),
);
```

- [ ] **Step 2: 테스트가 현재 `comingSoon: true` 설정 때문에 실패하는지 확인한다.**

Run: `npm test -- src/app/navigation/mainMenu.test.ts`

- [ ] **Step 3: 메뉴 설정에서 Renault/Fincantieri의 `comingSoon`을 제거한다.**

```ts
{ label: { ko: "르노", en: "Renault" }, path: AROUND_X_ROUTES.renault }
{ label: { ko: "핀칸티에리", en: "Fincantieri" }, path: AROUND_X_ROUTES.fincantieri }
```

- [ ] **Step 4: 메뉴 테스트가 통과하는지 확인한다.**

Run: `npm test -- src/app/navigation/mainMenu.test.ts`

### Task 2: 공통 소개 UI와 원본 로고 추가

**Files:**
- Create: `src/imports/renault-logo.png`
- Create: `src/imports/fincantieri-logo.svg`
- Create: `src/app/components/ProgramIntroSection.tsx`

**Interfaces:**
- Produces: `ProgramIntroSection({ logoSrc, logoAlt, logoMaxWidth, title, tagline, description })`.
- Consumes: 디자인 토큰 `--color-text-primary`, `--color-text-secondary`, `--color-surface-card`, `--color-border-soft`.

- [ ] **Step 1: 제공 원본 로고를 프로젝트 asset 폴더로 복사한다.**

```text
Downloads/Renault logo.png → src/imports/renault-logo.png
Downloads/Fincantieri_logo (1).svg → src/imports/fincantieri-logo.svg
```

- [ ] **Step 2: 로고, 제목, 핵심 소개, 상세 설명을 렌더하는 테마/반응형 공유 컴포넌트를 구현한다.**

```tsx
<img src={logoSrc} alt={logoAlt} style={{ maxWidth: logoMaxWidth, width: "100%", height: "auto" }} />
<h2>{title}</h2>
<p>{tagline}</p>
<p>{description}</p>
```

### Task 3: 개별 프로그램 페이지와 명시 라우트 추가

**Files:**
- Create: `src/app/pages/AroundXRenaultProgramPage.tsx`
- Create: `src/app/pages/AroundXFincantieriProgramPage.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Consumes: `PageShell`, `ProgramIntroSection`, program logo imports, `AROUND_X_ROUTES`.
- Produces: `/around-x/renault`와 `/around-x/fincantieri`에서 실제 소개 페이지를 렌더하는 React Router routes.

- [ ] **Step 1: 각 PageShell에 담당자 확정 title/subtitle과 원문 소개 콘텐츠를 연결한다.**

```tsx
<PageShell title="르노코리아 RINNO 프로그램" subtitle="르노코리아와 함께 글로벌 성장을 준비하는 Around X 대표 프로그램을 소개합니다." accentColor="var(--color-accent-blue)">
  <ProgramIntroSection {...renaultContent} />
</PageShell>
```

- [ ] **Step 2: Changgu 라우트와 동일한 `AROUND_X_ROUTES` 경로 변환을 사용해 두 명시 라우트를 추가한다.**

```ts
{ path: toChildRoutePath(AROUND_X_ROUTES.renault), Component: AroundXRenaultProgramPage }
{ path: toChildRoutePath(AROUND_X_ROUTES.fincantieri), Component: AroundXFincantieriProgramPage }
```

### Task 4: UI 정리와 검증

**Files:**
- Modify: `PLAN.md`
- Modify: `RESULT.md`

**Interfaces:**
- Consumes: 최종 diff와 검증 결과.
- Produces: 완료 요약·검증 매트릭스.

- [ ] **Step 1: 변경 UI에 쓰이지 않는 state/handler/fallback이 없는지 확인한다.**
- [ ] **Step 2: 메뉴 단위 테스트, 전체 `npm run validate`를 실행한다.**
- [ ] **Step 3: Changgu 및 Renault/Fincantieri route 설정과 Coming Soon 범위를 diff로 재확인한다.**
- [ ] **Step 4: `PLAN.md` 완료 요약과 `RESULT.md` 검증 매트릭스를 기록한다.**
