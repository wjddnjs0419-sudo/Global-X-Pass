# Around X 브랜드 포지셔닝 및 SEO 수정 Implementation Plan

> **Execution:** Use a single agent by default. Delegate only genuinely independent work; select verification and TDD according to risk.

**Goal:** Around X를 다중 글로벌 기업 협업 스타트업 액셀러레이팅 프로그램으로 정확히 표현한다.

**Architecture:** 정적 검색 메타데이터는 `index.html`을 단일 출처로 유지한다. 홈 소개는 About의 확정 문구와 Hero의 짧은 산업 범위 요약으로 위계를 나누고, 창구 전용 데이터는 창구 상세 페이지에만 남긴다.

**Tech Stack:** Vite, React 18, TypeScript, HTML metadata, Tailwind CSS v4

## Global Constraints

- title은 정확히 `Around X - 넥스트챌린지`로 설정한다.
- canonical URL, robots, Open Graph, Twitter 카드, WebSite JSON-LD 구조는 유지한다.
- 확정되지 않은 프로그램 정보·성과를 추가하지 않고 keyword stuffing을 하지 않는다.
- Supabase, routing, 인증, 창구 외 상세 프로그램 구현은 수정하지 않는다.
- 코드와 문서는 커밋·푸시·배포하지 않는다.

---

### Task 1: SEO 메타데이터 정렬

**Files:**
- Modify: `index.html`

- [ ] title·description·OG·Twitter·JSON-LD가 Around X 전체 프로그램을 설명하도록 갱신한다.
- [ ] canonical·robots와 미리보기 이미지 설정을 보존한다.

### Task 2: 홈 브랜드 카피 정렬

**Files:**
- Modify: `src/app/content/aroundXBrandInfo.ts`
- Modify: `src/app/components/HeroSection.tsx`

- [ ] About의 브랜드 설명에 담당자 확정 한국어 문구를 정확히 반영하고 언어 전환 시 동등한 영문 의미를 제공한다.
- [ ] Hero의 확장 패널·접근성 라벨·커뮤니티 카피를 Around X 전체 프로그램과 세 산업 분야에 맞춘다.
- [ ] 창구 전용 상세 콘텐츠 데이터와 상세 라우트는 변경하지 않는다.

### Task 3: 검증 및 UI 잔여물 점검

**Files:**
- Modify: `PLAN.md`
- Modify: `RESULT.md`

- [ ] title과 각 metadata 값을 DOM에서 확인한다.
- [ ] 데스크톱과 모바일 viewport에서 Hero·About의 가독성과 overflow를 확인한다.
- [ ] `npm run validate`를 실행하고 실패 시 원인을 수정한 뒤 재실행한다.
- [ ] 결과를 `RESULT.md`에 기록하고 PLAN 항목을 완료 요약으로 압축한다.
