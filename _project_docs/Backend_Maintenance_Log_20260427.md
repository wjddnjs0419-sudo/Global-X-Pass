# Backend & System Maintenance Log

**작업 일자:** 2026-04-27
**담당:** 시스템 유지보수 담당 (Gemini) / **인계 대상:** 프론트엔드 담당 (Claude Code)

이 문서는 프론트엔드 코드의 안정성, 성능, 유지보수성, 그리고 데이터베이스(Supabase) 연동을 개선하기 위해 백엔드/시스템 관점에서 진행된 대규모 리팩토링 및 버그 수정 내역을 압축한 것입니다. 향후 Claude Code가 작업을 이어받을 때 이 문서를 컨텍스트로 로드하여 프로젝트의 최신 상태를 파악해야 합니다.

---

## 1. 데이터베이스(Supabase) & 에러 핸들링 수정 🛠️
*   **DB 스키마 동기화:** `activity_logs` 테이블에 누락되었던 `user_email` 컬럼 추가 (SQL DDL 쿼리 적용 완료).
*   **Storage 업로드 버그 해결:** macOS 스크린샷 드래그 앤 드롭 시 발생하는 긴 로컬 경로 및 특수문자로 인한 Supabase Storage 업로드 실패 현상 해결. `src/utils/file.ts`의 `encodeFilename`을 수정하여 순수 파일명(Base Name)만 추출하고 길이를 제한하도록 개선.
*   **무음 에러(Silent Error) 방지:** `PostDetailPage.tsx` 및 `AdminPage.tsx`의 DB `update`/`insert` 및 Storage `upload` 로직에 명시적인 에러 핸들링(`throw error` 및 `alert` 세분화) 추가.

## 2. 대규모 프론트엔드 리팩토링 (Tailwind & 모듈화) 🧹
*   **전면 Tailwind CSS 전환:** `HeroSection`, `HeaderSection` 및 `src/app/pages/` 하위의 **모든 14개 페이지**에 하드코딩되어 있던 무거운 인라인 스타일(`style={{...}}`)을 Tailwind CSS 유틸리티 클래스로 100% 전환 완료. (렌더링 성능 대폭 향상, JS 반응형 연산 제거). 단, 심우주 궤도 애니메이션을 위한 고도의 동적 렌더링 값(크기, 각도 등)은 안전성을 위해 인라인으로 보존.
*   **관리자 페이지(AdminPage) 모듈화:** 800줄이 넘던 거대한 `AdminPage.tsx`를 `src/app/components/admin/` 폴더를 신설하여 5개의 독립된 컴포넌트(`NotificationBell`, `AdminDashboard`, `AdminUserManagement`, `AdminPostCreate`, `AdminPostManage`)와 1개의 상수 파일로 완벽하게 분리.

## 3. UI/UX 및 모바일 반응형(RWD) 치명적 결함 해결 📱
*   **모바일 뷰포트 버그 픽스:** 모바일 브라우저 주소창 등장 시 화면이 덜컹거리는 현상을 막기 위해 모든 최상위 레이아웃의 `100vh`를 `100dvh`로 일괄 교체 (`RootLayout.tsx`, `HeroSection.tsx`, `PageShell.tsx`).
*   **Header 겹침(Overlap) 문제 해결:** 로고 박스가 모바일 우측 버튼들의 터치 이벤트를 막는 현상을 `pointer-events`와 `z-index`로 해결. 900px 이하 화면에서는 텍스트 버튼(Login, Sign up 등)을 숨기고 사이드바(Sidebar) 최하단의 `[ACCOUNT]` 섹션으로 이동시켜 공간 최적화.
*   **Admin 그리드 찌그러짐 픽스:** `AdminPage`의 차트, 통계 카드, 목록들이 모바일에서 바늘처럼 얇아지던 현상을 해소하기 위해 Tailwind의 반응형 그리드(`grid-cols-1 md:grid-cols-3` 등)를 적용하여 모바일에서는 세로로 자연스럽게 쌓이도록 수정.
*   **플로팅 탭 가로 스크롤:** 화면 하단 관리자 탭이 모바일에서 줄바꿈되며 깨지는 현상을 `whitespace-nowrap`, `overflow-x-auto`를 통해 스와이프 가능한 형태로 개선.

## 4. 접근성(a11y) 및 부가 기능 추가 ✨
*   **웹 접근성 개선:** `HeroSection`의 궤도 노드(위성 아이콘)들에 `<div role="button" tabIndex={0} onKeyDown={...}>`를 추가하여 마우스 없이 키보드(Tab, Enter)만으로도 우주 궤도 네비게이션이 가능하도록 개선.
*   **페이지 트랜지션 (Framer Motion):** `RootLayout.tsx`의 `<Outlet />`을 `<AnimatePresence mode="wait">`와 `<motion.div>`로 감싸, 전체 메뉴 이동 시 부드러운 페이드 인/아웃(Fade-in/out) 및 슬라이드 애니메이션 적용.
*   **루트 디렉토리 대청소:** 기획안, 가이드라인, 클로드 백업본(`.claude`) 등을 모두 신설된 `_project_docs/` 폴더로 몰아넣어 프로젝트 최상단 경로를 깔끔하게 구조화. `README.md`를 신규 온보딩 가이드로 전면 개편.