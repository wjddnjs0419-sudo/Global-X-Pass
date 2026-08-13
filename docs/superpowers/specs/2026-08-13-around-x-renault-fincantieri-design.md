# Around X Renault · Fincantieri 프로그램 페이지 설계

## 목표

기존 Coming Soon 상태인 `/around-x/renault`, `/around-x/fincantieri`를 각각의 정적 프로그램 소개 페이지로 전환한다.

## 구조

- `AroundXRenaultProgramPage`, `AroundXFincantieriProgramPage`는 각 프로그램의 PageShell 제목·부제를 소유한다.
- 공통 `ProgramIntroSection`은 로고, 프로그램명, 핵심 소개, 상세 설명만 렌더링한다.
- Changgu의 timeline 및 컴포넌트 구조에는 변경을 가하지 않는다.

## 콘텐츠와 다국어

- 담당자가 확정한 한국어 문구를 원문 그대로 사용한다.
- 기존 Changgu처럼 PageShell의 제목·부제는 한국어 고정이다. 확정 영문 마케팅 문구가 없으므로 새 영문 번역은 추가하지 않는다.

## 라우팅·내비게이션

- `routes.tsx`에 두 명시 라우트를 추가해 WildcardRoute 이전에 실제 페이지를 매칭한다.
- `mainMenu.ts`의 두 항목에서 `comingSoon`만 제거한다.
- 공통 Coming Soon 처리와 다른 메뉴에는 변경하지 않는다.

## 자산과 표현

- 사용자가 제공한 원본 Renault PNG와 Fincantieri SVG를 `src/imports/`에 보관하고, 원본 비율을 유지해 `<img>`로 표시한다.
- PageShell, 디자인 토큰, 반응형 `clamp()` 크기를 재사용해 light/dark 및 작은 화면을 지원한다.

## 비범위

- DB, Supabase, CMS, SEO, Changgu timeline, Around X 메인 화면, 인증, 배포, 커밋, 푸시는 변경하지 않는다.
