# Global X Pass (Admin & Portal)

이 프로젝트는 **Global X Pass**의 프론트엔드 포털 및 관리자(Admin) 페이지 소스코드입니다.
누구나 처음 이 프로젝트 폴더를 열었을 때 구조를 쉽게 파악할 수 있도록 핵심 폴더와 파일을 정리해 두었습니다.

## 📂 프로젝트 폴더 구조 (Directory Structure)

```text
Global X Pass/
├── 📁 src/                     # 핵심 프론트엔드 소스코드 (React/Vite)
│   ├── 📁 app/                 # 화면 UI 컴포넌트 및 페이지
│   │   ├── 📁 components/      # 재사용 가능한 UI 컴포넌트 (Header, Footer, Hero 등)
│   │   │   └── 📁 admin/       # 관리자 페이지 전용 컴포넌트 모음 (모듈화 완료)
│   │   └── 📁 pages/           # 실제 라우팅되는 화면들 (Home, Admin, Blog 등)
│   ├── 📁 hooks/               # 커스텀 훅 (useAdmin, useTracker 등)
│   ├── 📁 lib/                 # 외부 라이브러리 설정 (supabaseClient, types 등)
│   └── 📁 utils/               # 유틸리티 함수 (파일 인코딩 변환 등)
│
├── 📁 public/                  # 정적 에셋 파일 (favicon, 로봇 텍스트 등)
├── 📁 _project_docs/           # 기획안, 가이드라인, Claude 백업 파일 모음 (참고용)
│   ├── 📁 docs/
│   ├── 📁 guidelines/
│   └── CLAUDE.md, etc.
│
├── 📄 vite.config.ts           # Vite 빌드 도구 설정 파일
├── 📄 package.json             # 설치된 외부 라이브러리(Dependencies) 목록
└── 📄 README.md                # 현재 보고 계신 프로젝트 안내 문서
```

## 🚀 시작하기 (Getting Started)

1. **패키지 설치:**
   ```bash
   npm install
   ```

2. **로컬 개발 서버 실행:**
   ```bash
   npm run dev
   ```
   > 서버가 실행되면 브라우저에서 `http://localhost:5173` 으로 접속하세요.

3. **프로덕션 빌드 (배포용):**
   ```bash
   npm run build
   ```

## 🛠️ 기술 스택 (Tech Stack)
- **프레임워크:** React 18 (Vite)
- **스타일링:** Tailwind CSS, 부분적 Inline Styles (복잡한 궤도 애니메이션용)
- **애니메이션:** Framer Motion (`motion`)
- **데이터베이스/백엔드:** Supabase (PostgreSQL, Auth, Storage)
- **아이콘 및 컴포넌트:** Lucide React, Radix UI

## 📝 관리자 메모
* **Tailwind 리팩토링 완료:** 기존에 복잡하게 얽혀있던 인라인 스타일을 Tailwind CSS로 전면 개편하여 성능과 유지보수성을 극대화했습니다.
* **페이지 트랜지션:** `Framer Motion`을 활용하여 페이지 이동 시 부드러운 애니메이션 효과가 적용되어 있습니다.
* **컴포넌트 모듈화:** 800줄이 넘던 비대한 `AdminPage.tsx`를 `src/app/components/admin/` 하위의 독립된 파일 5개로 분할하여 가독성을 높였습니다.
