# Global X Pass — 홈페이지 시스템 레퍼런스 문서

> **목적:** 이 문서는 AI 에이전트 및 기술 담당자가 Global X Pass 플랫폼의 전체 구조를 빠르게 파악하기 위한 기초 참조 문서입니다.
> **최종 업데이트:** 2026-05-12
> **작성 기준:** `src/` 디렉터리 및 `supabase/` 전체 코드베이스 분석

---

## 목차

1. [시스템 아키텍처 및 기술 스택](#1-시스템-아키텍처-및-기술-스택)
2. [데이터베이스 및 스키마 구조](#2-데이터베이스-및-스키마-구조)
3. [보안 및 권한 관리](#3-보안-및-권한-관리)
4. [프론트오피스 핵심 기능 및 로직](#4-프론트오피스-핵심-기능-및-로직)
5. [백오피스 관리자 기능 (AdminPage.tsx)](#5-백오피스-관리자-기능-adminpagetsx)

---

## 1. 시스템 아키텍처 및 기술 스택

### 1-1. 전체 구조 개요

```
┌──────────────────────────────────────────────────────────────┐
│  클라이언트 (React SPA)                                        │
│  React 18 + TypeScript + Vite + Tailwind CSS v4 + motion     │
│                                                              │
│  ┌─ 라우팅: React Router v7 ─────────────────────────────┐  │
│  │  RootLayout → HeaderSection / FooterSection           │  │
│  │  ↳ 공개 페이지 (Home, Notice, Events, Blog, …)        │  │
│  │  ↳ 인증 페이지 (Login, Signup, MyPage, …)             │  │
│  │  ↳ 관리자 전용 (AdminRoute → AdminPage, FlowMapPage)  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
           │ Supabase JS Client (@supabase/supabase-js)
           ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase 백엔드                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Auth (JWT)  │  │ PostgreSQL  │  │  Storage (S3 호환)   │ │
│  │ MFA/TOTP   │  │ RLS 정책   │  │  images / documents  │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Edge Functions (Deno runtime)                          │ │
│  │  signup-profile / encrypt-profile / decrypt-profiles   │ │
│  │  decrypt-own-profile / update-user-role / delete-user  │ │
│  │  bulk-register-users / change-password / sync-naver-blog│ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Realtime (Postgres Changes)                            │ │
│  │  profiles 테이블 변경 → 관리자 회원 목록 실시간 갱신   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
           │ GitHub Actions
           ▼
┌──────────────────────────────────────────────────────────────┐
│  외부 연동                                                    │
│  Naver Blog API → sync-naver-blog → blog_import_runs/queue   │
└──────────────────────────────────────────────────────────────┘
```

### 1-2. 프론트엔드 기술 스택

| 항목 | 기술/라이브러리 | 용도 |
|------|-----------------|------|
| 프레임워크 | React 18 (TypeScript) | UI 컴포넌트 렌더링 |
| 빌드 도구 | Vite | 개발 서버 / 프로덕션 번들 |
| 스타일링 | Tailwind CSS v4 | 레이아웃·구조 클래스 |
| 스타일링 (동적) | Vanilla CSS / CSS 변수 | 테마·다크모드 토큰 기반 색상 |
| 애니메이션 | `motion` (Framer Motion) | 섹션 트랜지션 / 호버 효과 |
| 라우팅 | React Router v7 | SPA 클라이언트 라우팅 |
| DB 클라이언트 | `@supabase/supabase-js` | DB / Auth / Storage 통합 |
| UI 컴포넌트 | shadcn/ui 기반 (`src/app/components/ui/`) | Button, Badge, Dialog 등 프리미티브 |
| 상태 관리 | React `useState` / `useEffect` (로컬) | 전역 상태 관리자 없음 |
| 테마 | `ThemeContext` (`useTheme()`) | 다크/라이트 모드 전환 |

### 1-3. 백엔드 기술 스택 (Supabase)

| 항목 | 설명 |
|------|------|
| 인증 | Supabase Auth (이메일+비밀번호, JWT, MFA TOTP) |
| 데이터베이스 | PostgreSQL (RLS 적용, pgcrypto 확장 포함) |
| 스토리지 | Supabase Storage — `images` 버킷 (공개), `documents` 버킷 (공개 읽기) |
| 서버리스 함수 | Edge Functions (Deno runtime, TypeScript) |
| 실시간 | Postgres Realtime — profiles 테이블 변경 구독 |
| PII 암호화 | AES-256-GCM (Web Crypto API, `enc:v1:` 접두어 방식) |
| 외부 연동 | GitHub Actions → Naver Blog 자동 이관 |

### 1-4. 디자인 시스템

- **Orbital System + Glassmorphism** 기반 비주얼 언어
- CSS 변수 토큰 체계: `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--size-*)` 등
- 파일 위치: `src/styles/theme.css` (다크/라이트 모드 오버라이드 포함)
- **No-Hardcode 규칙 (절대 원칙):** 컴포넌트/페이지에서 raw 색상·간격 리터럴 직접 작성 금지. 반드시 CSS 변수 참조 사용.

---

## 2. 데이터베이스 및 스키마 구조

### 2-1. 전체 테이블 목록

| 테이블명 | 용도 | RLS 활성화 |
|---------|------|-----------|
| `profiles` | 사용자 프로필 (PII 암호화됨) | ✅ |
| `posts` | 공지·뉴스·행사·자료·미디어·블로그·FAQ·경비 게시물 | ✅ |
| `event_applications` | 행사 참가 신청 | ✅ |
| `consultants` | 컨설턴트 프로필 | ✅ |
| `consulting_slots` | 컨설팅 가능 일정 슬롯 | ✅ |
| `consulting_reservations` | 사용자의 컨설팅 예약 | ✅ |
| `consulting_categories` | 컨설팅 카테고리 (법률/글로벌/기술 등) | ✅ |
| `founders_club_sessions` | Founder's Club 세션 목록 | ✅ |
| `founders_club_applications` | Founder's Club 참가 신청 | ✅ |
| `page_views` | 페이지별 방문 통계 | ✅ |
| `activity_logs` | 게시물 CRUD 활동 로그 | ✅ |
| `board_tag_presets` | 게시판별 태그 프리셋 | ✅ |
| `media_category_labels` | 미디어 카테고리 표시명 | ✅ |
| `blog_import_runs` | 네이버 블로그 자동 이관 실행 이력 | ✅ |
| `blog_import_queue` | 네이버 블로그 이관 대기 큐 | ✅ |

---

### 2-2. 테이블 상세 스키마

#### `profiles` — 사용자 프로필
```
id           uuid      PK, auth.users.id를 참조
email        text      AES-256-GCM 암호화 저장 (enc:v1:... 접두어)
name         text      AES-256-GCM 암호화 저장
phone        text      AES-256-GCM 암호화 저장
company      text      평문 저장 (비 PII)
user_type    text      평문 저장 (창업자/직원 등 사용자 분류)
role         text      CHECK: 'admin' | 'participant' | 'user'
created_at   timestamptz
```
- **중요:** `role` 컬럼은 `guard_profile_role_changes()` 트리거로 직접 UPDATE 차단. 변경은 반드시 `update-user-role` Edge Function 경유.
- 회원가입 시 `handle_new_user()` 트리거가 `auth.users` INSERT 후 자동으로 profiles 레코드 생성.
- 기본 role은 `'user'`.

#### `posts` — 게시물 (단일 테이블 다형성 구조)
```
id               uuid       PK
title            text       NOT NULL
content          text       HTML 본문 (Quill Editor 출력)
category         text       DEFAULT 'notice'
                            ('notice'|'news'|'events'|'events-archive'|
                             'resources'|'media'|'blog'|'faq'|'expenses')
author_id        uuid       FK → auth.users(id)
image_url        text       대표 이미지 URL
thumbnail_url    text       썸네일 이미지 URL
thumbnail_crop   jsonb      {x, y, zoom, aspect} — AdvancedThumbnailEditor crop 메타
views            integer    DEFAULT 0 (increment_view_count() 함수로 증가)
is_featured      boolean    DEFAULT false (블로그 피처드 카드)
tags             text       콤마 구분 태그 문자열
event_date       text       행사 일시 (YYYY.MM.DD (요일) HH:mm 형식)
location         text       행사/컨설팅 장소 ("장소명 | 주소" 구조)
capacity         integer    행사 정원
slots_remaining  integer    잔여 좌석 (sync_event_application_counts 트리거로 자동 관리)
event_status     text       '접수예정'|'접수중'|'마감임박'|'마감'
status           text       DEFAULT '모집중' (legacy 필드)
event_form_config jsonb     행사 신청서 커스텀 설정 (EventFormConfig 타입)
created_at       timestamptz
updated_at       timestamptz (set_updated_at 트리거로 자동 갱신)
```
- **카테고리별 용도:**
  - `notice`: 공지사항 게시판
  - `news`: 뉴스 게시판
  - `events`: 행사 신청 가능한 현재 행사
  - `events-archive`: 종료된 행사 아카이브
  - `resources`: 다운로드 자료실
  - `media`: 미디어(리포트/영상/팟캐스트 등)
  - `blog`: 블로그 포스트 (Naver 자동 이관 포함)
  - `faq`: 자주 묻는 질문
  - `expenses`: 사업비 자료실 (관리자+participant 역할만 접근)

#### `event_applications` — 행사 참가 신청
```
id               uuid       PK
post_id          uuid       FK → posts(id) ON DELETE CASCADE
user_id          uuid       FK → profiles(id) ON DELETE CASCADE
company_tech     text       기업명/기술분야 (NOT NULL)
applicant_name   text       신청자 이름 (NOT NULL)
position         text       직책 (NOT NULL)
email            text       연락 이메일 (NOT NULL)
phone            text       연락처 (nullable)
expectation      text       기대 내용 (NOT NULL)
interests        text[]     관심 주제 (다중 선택)
speaker_question text       강연자 사전 질문 (nullable)
privacy_consent  boolean    개인정보 동의 (CHECK: true 필수)
answers          jsonb      커스텀 추가 질문 답변 {questionId: "답변"}
status           text       'pending'|'accepted'|'rejected'|'cancelled'
admin_note       text       관리자 메모
created_at       timestamptz
updated_at       timestamptz
UNIQUE (post_id, user_id)   -- 중복 신청 방지
```
- `status`가 `'accepted'`로 변경될 때마다 `sync_event_application_counts()` 트리거 → `posts.slots_remaining` 자동 업데이트.
- 정원 초과 시 EXCEPTION 발생으로 자동 차단.

#### `consultants` — 컨설턴트
```
id            uuid   PK
name          text   NOT NULL
category      text   CHECK: 'legal'|'global'|'tech'
bio           text
expertise     text[] 전문 분야 태그 배열
image_url     text
is_active     boolean DEFAULT true
display_order integer DEFAULT 0
created_at    timestamptz
```

#### `consulting_slots` — 컨설팅 가능 슬롯
```
id               uuid   PK
consultant_id    uuid   FK → consultants(id) ON DELETE CASCADE
slot_date        date   NOT NULL
slot_time        time   NOT NULL
duration_minutes integer DEFAULT 60
status           text   'available'|'booked'|'cancelled'
location         text   장소 ("장소명 | 주소" 구조)
created_at       timestamptz
UNIQUE (slot_id) -- consulting_reservations에서 슬롯당 예약 1개
```

#### `consulting_reservations` — 컨설팅 예약
```
id          uuid   PK
slot_id     uuid   FK → consulting_slots(id) ON DELETE CASCADE, UNIQUE
user_id     uuid   FK → profiles(id) ON DELETE CASCADE
description text   상담 내용 (NOT NULL)
status      text   'pending'|'confirmed'|'rejected'|'cancelled'
admin_note  text
created_at  timestamptz
```

#### `founders_club_sessions` — Founder's Club 세션
```
id               uuid   PK
theme            text   세션 주제 (NOT NULL)
description      text
max_participants integer DEFAULT 6, CHECK (1~10)
session_date     date
session_time     time
location         text   ("장소명 | 주소" 구조)
status           text   'recruiting'|'closed'|'completed'
created_at       timestamptz
```
- `check_fcfs_capacity()` 트리거: accepted 수 >= max_participants 시 `status = 'closed'` 자동 전환.

#### `founders_club_applications` — Founder's Club 신청
```
id          uuid   PK
session_id  uuid   FK → founders_club_sessions(id) ON DELETE CASCADE
user_id     uuid   FK → profiles(id) ON DELETE CASCADE
message     text   신청 메시지
status      text   'pending'|'accepted'|'rejected'|'cancelled'
created_at  timestamptz
UNIQUE (session_id, user_id) -- 세션당 1인 1신청
```

#### `page_views` — 페이지 방문 통계
```
id          uuid   PK
visitor_id  uuid   NOT NULL (로컬스토리지 UUID 기반)
page_path   text   NOT NULL
user_agent  text
referrer    text
created_at  timestamptz
```
- 30분 쓰로틀: 같은 페이지 30분 내 재방문은 기록 안 함 (`useTracker` 훅).

#### `activity_logs` — 활동 로그
```
id          uuid   PK
action      text   'INSERT'|'UPDATE'|'DELETE'
table_name  text
record_id   text
user_id     uuid   (nullable)
user_email  text
user_name   text
old_data    jsonb
new_data    jsonb
created_at  timestamptz
```
- `log_post_activity()` 트리거가 `posts` 테이블의 모든 CUD 작업 자동 기록.
- 조회수만 증가하는 UPDATE는 로깅 제외 (불필요한 로그 방지).

#### `blog_import_runs` / `blog_import_queue` — 블로그 이관 자동화
```
blog_import_runs:
  id, trigger_source('manual'|'cron'|'worker'|'github_actions'),
  status('queued'|'running'|'success'|'failed'|'cancelled'),
  requested_by(FK → auth.users), dry_run, discovered_count,
  queued_count, inserted_count, updated_count, skipped_count,
  failed_count, error, created_at, started_at, finished_at

blog_import_queue:
  id, run_id(FK → blog_import_runs), source_url(UNIQUE),
  source_log_no, source_board,
  target_category('news'|'events-archive'),
  suggested_title, suggested_date, suggested_tag,
  status('pending'|'approved'|'imported'|'skipped'|'failed'),
  existing_post_id(FK → posts), error, created_at, imported_at
```

#### `board_tag_presets` — 게시판 태그 프리셋
```
board_id   text   PK (part)  ('events'|'events-archive'|'blog'|'notice'|'news')
tag        text   PK (part)
is_hidden  boolean DEFAULT false
is_default boolean DEFAULT false
sort_order integer DEFAULT 999
created_at timestamptz
```

#### `media_category_labels` — 미디어 카테고리 표시명
```
id    text   PK CHECK('report'|'issue-paper'|'trend-report'|'podcast'|'video'|'interview')
label text   NOT NULL
```

#### `consulting_categories` — 컨설팅 카테고리
```
id            text   PK
label         text   NOT NULL
display_order integer DEFAULT 0
created_at    timestamptz
```
- 기본 시드: `legal(법률/특허/회계)`, `global(글로벌 진출)`, `tech(기술 자문)`

---

### 2-3. 테이블 간 관계도 (외래키)

```
auth.users (Supabase 내부)
  └─ profiles.id (1:1)
       ├─ consulting_reservations.user_id (1:N)
       ├─ founders_club_applications.user_id (1:N)
       └─ event_applications.user_id (1:N)

posts
  ├─ event_applications.post_id (1:N)
  └─ blog_import_queue.existing_post_id (nullable, 1:1)

consultants
  └─ consulting_slots.consultant_id (1:N)
       └─ consulting_reservations.slot_id (1:1, UNIQUE)

founders_club_sessions
  └─ founders_club_applications.session_id (1:N)

blog_import_runs
  └─ blog_import_queue.run_id (1:N)
```

---

### 2-4. 주요 DB 함수 및 트리거

| 함수/트리거 | 종류 | 설명 |
|------------|------|------|
| `handle_new_user()` | 트리거 (AFTER INSERT ON auth.users) | 신규 가입 시 profiles 레코드 자동 생성 |
| `is_admin()` | SQL 함수 (SECURITY DEFINER) | 현재 사용자가 admin role + verified MFA factor + aal2 세션인지 확인 |
| `increment_view_count(row_id)` | SQL 함수 (SECURITY DEFINER) | 게시물 조회수 1 증가 |
| `log_post_activity()` | 트리거 (AFTER CUD ON posts) | posts 변경사항 activity_logs에 기록 |
| `set_updated_at()` | 트리거 (BEFORE UPDATE) | posts.updated_at 자동 갱신 |
| `check_fcfs_capacity()` | 트리거 (AFTER CUD ON founders_club_applications) | 선착순 정원 초과 시 세션 상태 'closed' 전환 |
| `sync_event_application_counts()` | 트리거 (AFTER CUD ON event_applications) | 행사 신청 상태 변경 시 posts.slots_remaining 자동 재계산 |
| `refresh_event_slots_remaining(post_id)` | SQL 함수 | 수동으로 행사 잔여 좌석 재계산 |
| `get_event_application_counts()` | SQL 함수 | 행사별 신청/승인 집계 (공개 접근 가능) |
| `get_event_archive_participant_stats()` | SQL 함수 | 아카이브 고유 참가자/참가 횟수 집계 |
| `guard_profile_role_changes()` | 트리거 (BEFORE UPDATE ON profiles) | service_role 이외의 role 직접 변경 차단 |

---

### 2-5. Storage 버킷

| 버킷 ID | 공개 여부 | 파일 크기 제한 | 허용 MIME 타입 | 업로드 권한 |
|--------|----------|--------------|----------------|------------|
| `images` | 공개 (public) | 10 MB | jpeg, png, gif, webp | 인증된 사용자만 (authenticated) |
| `documents` | 공개 읽기 | 10 MB | pdf, zip, docx, xlsx, pptx, hwp | 관리자만 (is_admin()) |

- SVG는 XSS 위험으로 `images` 버킷 업로드 거부.
- 파일명 인코딩: `encodeFilename()` 유틸 필수 사용 (한글 파일명 깨짐 방지).

---

## 3. 보안 및 권한 관리

### 3-1. 인증 흐름 (회원가입 / 로그인)

#### 회원가입 흐름
```
[클라이언트] SignupPage
  │ POST /functions/v1/signup-profile
  │ Payload: {name, phone, email, password, company, userType}
  ▼
[Edge Function] signup-profile/index.ts
  1. anonClient.auth.signUp() — Supabase Auth 계정 생성
  2. handle_new_user() 트리거 자동 실행 → profiles 레코드 생성 (평문)
  3. waitForProfile() — 최대 5초간 profiles 반영 재시도
  4. AES-256-GCM 암호화: name, email, phone → enc:v1:IV:CT:TAG 형식
  5. adminClient.from('profiles').update({name_enc, email_enc, phone_enc, company, user_type, role:'user'})
  6. 실패 시 rollback: profiles 삭제 + auth.admin.deleteUser()
  ▼
[응답] {success: true, needsEmailConfirmation: boolean}
```

#### 로그인 흐름
```
[클라이언트] LoginPage
  │ supabase.auth.signInWithPassword({email, password})
  ▼
[Supabase Auth] JWT 발급 (aal1 level)
  │
  ├─ 일반 사용자: 로그인 완료 → 홈으로 이동
  │
  └─ 관리자: MFA TOTP 챌린지 필요
       │ supabase.auth.mfa.challenge({factorId})
       │ supabase.auth.mfa.verify({factorId, challengeId, code})
       ▼
     JWT 재발급 (aal2 level) → /admin 접근 가능
```

#### 세션 유지 및 자동 로그아웃
- **비활동 자동 로그아웃:** 28분 비활동 시 경고 모달 표시 → 2분 내 미응답 시 자동 로그아웃 (`useIdleLogout` 훅)
- **탭 닫힘 감지:** `pagehide` / `beforeunload` 이벤트 → `gxp_last_active` (localStorage) 타임스탬프 기록
- **재방문 스테일 체크:** 앱 마운트 시 `gxp_last_active` 확인 → 30분 이상 경과 시 `supabase.auth.signOut()` 후 홈으로 이동

---

### 3-2. 역할(Role) 체계

| 역할값 | 한국어 명칭 | 접근 범위 |
|--------|------------|----------|
| `'user'` | 일반 회원 | 공개 게시물 열람, 행사 신청, 컨설팅 예약, Founder's Club 신청, 마이페이지 |
| `'participant'` | 참여사 회원 | user 권한 + `expenses` 카테고리(사업비 자료실) 접근 |
| `'admin'` | 관리자 | 모든 데이터 읽기/쓰기, 회원 관리, 관리자 대시보드, MFA 필수 |

**역할 변경 경로 (엄격히 제한):**
1. 클라이언트 직접 UPDATE 불가 (트리거로 차단)
2. 반드시 `update-user-role` Edge Function 경유
3. 관리자 재인증(현재 비밀번호) + MFA(aal2) 검증 후 service_role로 변경

---

### 3-3. RLS (Row Level Security) 정책 요약

#### `profiles` 테이블
| 작업 | 정책 | 조건 |
|------|------|------|
| SELECT | "Users can read own profile" | `id = auth.uid()` |
| SELECT | "Admin can read all profiles" | `is_admin()` |
| INSERT | "관리자 회원 추가(CSV) 가능" | `is_admin()` |
| UPDATE | "관리자 회원 권한 수정 가능" | `is_admin()` (role 컬럼은 트리거로 추가 차단) |
| DELETE | "관리자 회원 삭제 가능" | `is_admin()` |

#### `posts` 테이블
| 작업 | 정책 | 조건 |
|------|------|------|
| SELECT | "posts_select_role_based" | 인증된 사용자 + (`expenses` 카테고리는 `admin` 또는 `participant` role만) |
| SELECT (비인증) | 별도 정책 없음 | 비로그인 사용자는 읽기 불가 |
| INSERT | "관리자만 쓰기 가능" | `is_admin()` |
| UPDATE | "관리자만 게시물 수정 가능" | `is_admin()` |
| DELETE | "Enable delete for admins only" | `is_admin()` |

> **참고:** 2026-05-07 마이그레이션에서 `admin@test.com` 하드코딩 백도어 제거, `is_admin()` 함수로 통일.

#### `event_applications` 테이블
| 작업 | 정책 | 조건 |
|------|------|------|
| SELECT | "event_applications_select_own" | `auth.uid() = user_id` |
| INSERT | "event_applications_insert_own" | 본인 + 해당 행사가 `events` 카테고리 + `event_status != '마감'` |
| ALL | "event_applications_all_admin" | `is_admin()` |

#### `consulting_slots` 테이블
| 작업 | 정책 | 조건 |
|------|------|------|
| SELECT | "Public can view available slots" | 모두 허용 |
| UPDATE | "Users can update slot status on booking" | 기존 status='available', 변경 후 status='booked' 만 허용 |
| ALL (관리자) | "Admin full access on consulting_slots" | `is_admin()` |

#### `page_views` 테이블
| 작업 | 정책 | 조건 |
|------|------|------|
| INSERT | "Anyone can insert page views" | anon + authenticated 모두 허용 |
| SELECT | "Admin can read page views" | `is_admin()` |

---

### 3-4. `is_admin()` SQL 함수 세부 로직

```sql
-- 2026-05-07 MFA 강화 마이그레이션 적용 버전
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'          -- (1) profiles.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM auth.mfa_factors
        WHERE user_id = auth.uid()
          AND status = 'verified' -- (2) 검증된 TOTP factor 존재
      )
      AND (auth.jwt() ->> 'aal') = 'aal2'  -- (3) 현재 세션이 aal2
  );
END;
$$;
```

**3가지 조건 모두 충족 시에만 true 반환:**
1. `profiles.role = 'admin'`
2. `auth.mfa_factors`에 `status = 'verified'` TOTP factor 존재
3. 현재 JWT의 `aal` 클레임이 `'aal2'` (MFA 인증 완료 세션)

---

### 3-5. PII 암호화 파이프라인

**암호화 대상 필드:** `profiles.name`, `profiles.email`, `profiles.phone`

**암호화 형식:** `enc:v1:{IV_hex}:{ciphertext_hex}:{authTag_hex}`

**알고리즘:** AES-256-GCM (128-bit auth tag, 96-bit random IV)

**키 파생:** `SHA-256(ENCRYPTION_SECRET_KEY)` → AES-GCM CryptoKey

```
[회원가입] signup-profile Edge Function
  → Web Crypto API로 name/email/phone 암호화
  → service_role로 profiles.update()

[관리자 조회] decrypt-profiles Edge Function
  → requireVerifiedAdmin() 검증 (MFA aal2 필수)
  → service_role로 전체 profiles 조회
  → 복호화 후 JSON 반환

[본인 조회] decrypt-own-profile Edge Function
  → 로그인한 사용자 본인 profiles만 복호화 반환

[기존 평문 마이그레이션] encrypt-profile Edge Function
  → 이미 암호화된 경우 skip (enc:v1: 접두어 확인)
  → 관리자 또는 본인만 호출 가능
```

---

### 3-6. Edge Function 공통 보안 패턴

모든 관리자용 Edge Function은 `requireVerifiedAdmin(authHeader, {requireAal2: true})` 호출:

```typescript
// _shared/adminAuth.ts
export async function requireVerifiedAdmin(authHeader, options = {}) {
  // 1. JWT에서 aal 클레임 파싱
  // 2. aal2 옵션 활성화 시 aal2 아니면 403 반환
  // 3. callerClient.rpc('is_admin') 호출 → DB 게이트 통과 확인
  // → 모두 통과 시 { ok: true, user } 반환
}
```

**CORS 허용 오리진 (cors.ts):**
- `https://globalxpass.com`
- `http://localhost:5173`, `http://localhost:5174`
- `http://127.0.0.1:5173`, `http://127.0.0.1:5174`

---

### 3-7. 관리자 MFA 등록 및 진입 흐름

```
관리자 계정 최초 접근 시:
  useAdmin() → isAdmin=true, mfaEnrolled=false
  AdminRoute → sessionStorage.set('mfa_setup_required', 'true') → /mypage 리디렉트

/mypage에서 MFA 등록:
  supabase.auth.mfa.enroll({factorType: 'totp'})
  → QR코드 표시 → 사용자가 Authenticator 앱 등록
  → supabase.auth.mfa.challengeAndVerify({factorId, code})
  → factor.status = 'verified' 확정

이후 /admin 접근 시:
  로그인 후 aal1 상태 → useAdmin()에서 mfaRequired=true 감지
  AdminRoute → /login 리디렉트 (MFA 챌린지)
  로그인 페이지에서 MFA 코드 입력 → aal2 세션 획득
  → /admin 진입 허용

관리자 MFA 해제 불가:
  MyPage에서 관리자 계정은 MFA 해제 버튼 비표시 (isAdmin 조건)
```

---

## 4. 프론트오피스 핵심 기능 및 로직

### 4-1. 라우팅 구조 (`src/app/routes.tsx`)

```
/                     → HomePage (공개 홈)
├── notice            → NoticePage (공지사항 목록)
├── news              → NewsPage (뉴스 목록)
├── events            → EventsPage (행사 목록)
│   ├── :id/apply     → EventApplicationPage (행사 신청 페이지)
│   └── archive       → EventArchivePage (행사 아카이브)
├── resources         → ResourcesPage (자료실)
├── media             → MediaPage (미디어 목록)
├── blog              → BlogPage (블로그 목록)
├── faq               → FaqPage (FAQ)
├── consulting        → ConsultingPage (1:1 컨설팅 예약)
├── founders-club     → FoundersClubPage (Founder's Club)
├── expenses          → ExpensesPage (사업비 자료실, participant+admin)
├── flow-map          → [AdminRoute] FlowMapPage (서비스 흐름도, admin only)
├── post/:id          → PostDetailPage (게시물 상세)
├── login             → LoginPage
├── signup            → SignupPage
├── mypage            → MyPage (마이페이지)
├── search            → SearchPage (통합 검색)
├── update-password   → UpdatePasswordPage (비밀번호 재설정)
├── admin             → [AdminRoute] AdminPage (관리자 대시보드)
├── privacy-policy    → PrivacyPolicyPage
├── terms-of-use      → TermsOfUsePage
└── *                 → NotFoundPage
```

**AdminRoute 가드 로직:**
1. `loading` 중 → 빈 hidden div (깜빡임 방지)
2. `!isAdmin` → `/` (홈)으로 리디렉트
3. `!mfaEnrolled` → `mfa_setup_required` 세션 플래그 설정 후 `/mypage`로 리디렉트
4. `mfaRequired` → `/login`으로 리디렉트 (MFA 챌린지)
5. 모두 통과 → `<Outlet />` 렌더

---

### 4-2. RootLayout 구조

`RootLayout`은 모든 페이지의 공통 래퍼:
- `HeaderSection` (관리자 페이지·디자인시스템 제외)
- `FooterSection` (디자인시스템 제외)
- `useTracker()` — 페이지 방문 기록
- `useIdleLogout()` — 비활동 자동 로그아웃
- 탭 닫힘 시 `gxp_last_active` localStorage 기록
- 재방문 스테일 세션 자동 로그아웃 (30분 기준)
- **관리자 플로팅 네비게이션 바:** `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled` 조건 충족 시에만 하단에 렌더 (사이트 미리보기 / 관리자 페이지 / 디자인 시스템 / 서비스 흐름도 탭)

---

### 4-3. 주요 공개 페이지별 기능 및 데이터 흐름

#### HomePage (홈)
- **섹션 구성:** HeroSection → AboutSection → ProgramSection → EventSection → NoticeResourceSection → MediaSection → CommunitySection(Founder's Club Calendar) → FooterSection
- **EventSection:** `posts` 테이블에서 `category='events'` 최신 3건 조회 → 행사 카드 표시
- **NoticeResourceSection:** `notice` 최신 3건 + `resources` 최신 3건 조회
- **MediaSection:** `media` 카테고리 최신 콘텐츠 표시

#### EventsPage (행사 목록)
- `posts` 테이블 `category='events'` 전체 조회 (최신순)
- `get_event_application_counts()` RPC로 행사별 승인 인원 집계
- 태그 필터 탭 + 페이지네이션 (10건/페이지)
- 잔여 좌석: `capacity - accepted_count` 계산 표시 (🟡 마감임박 / ✅ 여유)

#### EventApplicationPage (행사 신청)
- `:id` 파라미터로 특정 행사 `posts` 레코드 fetch
- `event_form_config` JSONB에서 커스텀 질문 설정 로드
- 일반 사용자: 참가 신청 폼 표시 → 제출 시 `event_applications` INSERT
- 관리자: `posts` 레코드 편집 패널 (행사 정보 + 신청서 설정 수정)
- 관리자 편집 → `AdvancedThumbnailEditor`로 대표이미지 관리, 연/월/일+시/분 select로 일시 입력
- 신청 성공/이미 신청됨 상태 관리

#### PostDetailPage (게시물 상세)
- `/post/:id` 경로에서 `posts` 레코드 fetch
- `increment_view_count(id)` RPC로 조회수 증가
- 카테고리별 레이아웃 분기 (미디어형: report/video 등, 일반형: notice/news/blog 등)
- 관리자 편집: `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled` 전체 조건 게이트
- 첨부파일: `posts.image_url` + 이미지 표시 / 문서 다운로드
- 대표 이미지 편집: `AdvancedThumbnailEditor` (16/10, 10/9, 7/1 비율 지원)

#### ConsultingPage (1:1 컨설팅)
- `consulting_categories` 테이블에서 카테고리 로드 (Realtime 구독으로 실시간 갱신)
- 카테고리별 `consultants` 필터링 표시
- 컨설턴트 카드 클릭 → `ConsultingBookingModal` 모달 열기
  - 해당 컨설턴트의 `consulting_slots` (status='available') 표시
  - 슬롯 선택 + 상담 내용 입력 → `consulting_reservations` INSERT + `consulting_slots` 상태 'booked'로 UPDATE

#### FoundersClubPage (Founder's Club)
- `founders_club_sessions` 전체 조회 (anon/인증 모두 가능)
- 로그인 사용자: `founders_club_applications`에서 본인 신청 내역 확인
- 관리자: accepted 신청자 목록 확장 표시 (`decrypt-profiles` 호출로 PII 복호화)
- 신청 시: `founders_club_applications` INSERT → `check_fcfs_capacity()` 트리거가 정원 초과 시 자동 closed

#### MyPage (마이페이지)
- 로그인 필수 (비로그인 시 로그인 페이지 리디렉트)
- **프로필 조회:** `decrypt-own-profile` Edge Function 호출 (복호화된 name/email/phone 표시)
- **비밀번호 변경:** `change-password` Edge Function (기존 비밀번호 + MFA OTP 검증 후 변경)
- **MFA 관리:**
  - 일반 사용자: TOTP 등록/해제 가능
  - 관리자: MFA 해제 버튼 비표시 (필수 상태 유지)
- **예약 내역 탭:** 컨설팅 예약 / Founder's Club 신청 / 행사 신청 각각 목록 + 취소 버튼

#### SearchPage (통합 검색)
- 현재 정적 목데이터 기반 (실시간 DB 검색 미구현)
- 쿼리 + 카테고리 필터 조합 검색
- 향후 Supabase Full-text Search 연동 예정

---

### 4-4. 주요 유틸리티

| 파일 | 주요 기능 |
|------|----------|
| `src/utils/file.ts` | `encodeFilename()` — Storage 업로드용 파일명 인코딩 / `isImage()` 판별 |
| `src/utils/text.ts` | `cleanText()` — 문자열 trim/정규화 |
| `src/utils/scheduleFields.ts` | `formatStructuredLocation()` — "장소명 \| 주소" 파싱·포매팅 / 날짜·시간 select option 생성 |
| `src/utils/eventApplication.ts` | `DEFAULT_EVENT_FORM_CONFIG` / `mergeEventFormConfig()` / `EVENT_APPLICATION_STATUS` / `EVENT_STATUS_CONFIG` |
| `src/utils/postThumbnail.ts` | `uploadThumbnailIfDataUrl()` — data URL → Storage URL 변환 / `resolvePostThumbnail()` — 썸네일 소스 결정 |
| `src/utils/htmlSecurity.ts` | `sanitizeSvgMarkup()` — SVG XSS 방지 |
| `src/utils/urlSecurity.ts` | URL 안전성 검증 |
| `src/lib/layers.ts` | z-index 레이어 상수 (LAYERS.blockingModal 등) |

---

## 5. 백오피스 관리자 기능 (AdminPage.tsx)

### 5-1. 진입 조건

`AdminPage`는 `AdminRoute` 가드를 통과해야 진입 가능:

```
isAdmin = true
  AND mfaEnrolled = true (TOTP 등록 완료)
  AND mfaRequired = false (aal2 세션 유효)
  AND !adminLoading
```

조건 미충족 시:
- `!isAdmin` → `/` 리디렉트
- `!mfaEnrolled` → `/mypage` (MFA 등록 강제)
- `mfaRequired` → `/login` (MFA 챌린지)

---

### 5-2. 탭 구조 (총 8개 탭)

`AdminPage`는 `sessionStorage('gxp_admin_active_tab')`으로 탭 상태를 세션 간 유지하며, 각 탭은 `React.lazy()` + `<Suspense>`로 지연 로딩됩니다.

| 탭 ID | 컴포넌트 | 기능 요약 |
|-------|----------|----------|
| `dashboard` | `AdminDashboard` | 통계 대시보드 |
| `users` | `AdminUserManagement` | 회원 관리 |
| `create` | `AdminPostCreate` | 게시물 작성/수정 |
| `manage` | `AdminPostManage` | 게시물 목록/수정/삭제 |
| `events` | `AdminEventManagement` | 행사 신청 관리 |
| `consulting` | `AdminConsultingManagement` | 컨설팅 관리 |
| `founders` | `AdminFoundersClubManagement` | Founder's Club 관리 |
| `blog-queue` | `AdminBlogQueueManagement` | 네이버 블로그 이관 큐 |

---

### 5-3. 탭별 상세 기능

#### 탭 1: 대시보드 (`AdminDashboard`)
- **통계 카드:** 전체 페이지뷰 수 / 총 게시물 수 / 고유 방문자 수
- **방문 차트:** 7일 / 30일 기간 선택 → `page_views` 데이터로 일별 방문 수 + 누적 방문 수 선그래프 표시 (SVG 수동 렌더링)
- **인기 게시물 TOP 5:** `posts` 테이블 `views` 기준 정렬 → 제목 + 카테고리 + 조회수 클릭 시 관리 탭으로 이동
- **Realtime 갱신:** `profiles` 변경 구독으로 `usersRefreshKey` 증가 → 회원 목록 자동 갱신

#### 탭 2: 회원 관리 (`AdminUserManagement`)
- **회원 목록 조회:** `decrypt-profiles` Edge Function 호출 → 복호화된 이름/이메일/전화번호 표시
- **역할 변경:** 각 회원 카드의 역할 드롭다운 → `AdminRoleModal` 확인 다이얼로그 → 관리자 비밀번호 입력 → `update-user-role` Edge Function 호출
  - 허용 역할: `'user'` | `'participant'` | `'admin'`
  - 본인 역할 변경 불가
- **회원 삭제:** `delete-user` Edge Function 호출 (service_role로 auth.admin.deleteUser + profiles 삭제)
- **CSV 대량 등록:** `AdminBulkResultModal` → `bulk-register-users` Edge Function 호출
  - CSV에서 이름/이메일/회사/사용자유형 파싱
  - 임시 비밀번호 자동 생성 (GXP-XXXX-XXXX 형식)
  - PII 암호화 후 계정 생성
- **검색:** 이름/이메일 기준 클라이언트 측 필터링
- **정렬:** 가입일순/이름순 전환

#### 탭 3: 게시물 작성 (`AdminPostCreate`)
- **카테고리 선택:** notice / news / events / events-archive / resources / media / blog / faq / expenses
- **제목 입력** (한국어/영어)
- **본문 편집:** Quill 리치 텍스트 에디터 (HTML 출력)
- **대표 이미지:** `AdvancedThumbnailEditor` — URL 입력 또는 파일 업로드 + 비율별 Crop (16/10, 10/9, 7/1)
  - Crop 결과 data URL → `uploadThumbnailIfDataUrl()` → Storage URL 변환 후 저장
- **첨부 이미지:** 다중 이미지 업로드 → `images` 버킷 저장
- **첨부 문서:** 다중 파일 업로드 → `documents` 버킷 저장 (관리자만)
- **행사 전용 필드:** 일시(select), 장소(이름+주소), 정원, 행사상태, `event_form_config` 설정
- **태그:** 쉼표 구분 태그 입력 (board_tag_presets 프리셋 선택 가능)
- **Featured 토글:** 블로그 피처드 카드 여부
- **저장:** `posts` 테이블 INSERT (신규) 또는 UPDATE (수정)
- **활동 로그:** `log_post_activity()` 트리거가 자동 기록

#### 탭 4: 게시물 관리 (`AdminPostManage`)
- **게시물 목록:** 카테고리 필터 + 검색 + 최신순 정렬
- **수정:** 해당 게시물 데이터를 `AdminPostCreate` 탭에 전달 (`handleStartEdit()`)
- **삭제:** `AdminPostModal` 확인 다이얼로그 → `posts.delete()`
- **빠른 미리보기:** 제목/카테고리/날짜/조회수 표시

#### 탭 5: 행사 신청 관리 (`AdminEventManagement`)
- **행사 목록:** `posts` 테이블 `category='events'` 조회
- **신청자 목록:** 행사 선택 → `event_applications` 조회 + 신청자 상태별 표시
- **신청 처리:**
  - 승인 (`'accepted'`): `sync_event_application_counts()` 트리거 → `slots_remaining` 자동 감소
  - 거절 (`'rejected'`): 관리자 메모 입력 가능
  - 취소 (`'cancelled'`)
- **정원 표시:** 승인 인원 / 전체 정원 실시간 표시

#### 탭 6: 컨설팅 관리 (`AdminConsultingManagement`)
- **카테고리 관리:** `consulting_categories` CRUD (추가/수정/삭제)
- **컨설턴트 관리:** `consultants` 테이블 CRUD
  - 이름, 카테고리, 소개, 전문분야 배열, 이미지 URL, 활성 여부, 표시 순서
- **슬롯 관리:** `consulting_slots` CRUD
  - 날짜(연/월/일), 시간(시/분), 소요시간, 장소(이름+주소 분리 입력)
  - 저장 시 `장소명 | 주소` 형식으로 DB 저장
- **예약 조회 및 처리:** `consulting_reservations` 목록 조회
  - 예약 상태 변경: pending → confirmed / rejected / cancelled
  - 관리자 메모 입력

#### 탭 7: Founder's Club 관리 (`AdminFoundersClubManagement`)
- **세션 관리:** `founders_club_sessions` CRUD
  - 주제, 설명, 최대 참가자(1~10명), 날짜(연/월/일), 시간(시/분), 장소(이름+주소)
  - 세션 상태: 모집중 / 마감 / 완료
- **신청 조회:** 세션별 `founders_club_applications` 목록
  - 신청 상태 변경: pending → accepted / rejected / cancelled
  - `check_fcfs_capacity()` 트리거가 정원 초과 시 세션 자동 closed

#### 탭 8: 블로그 이관 큐 (`AdminBlogQueueManagement`)
- **이관 실행:** `sync-naver-blog` Edge Function 호출 → GitHub Actions 워크플로우 dispatch
  - `trigger_source`: manual / dry_run 옵션 선택 가능
- **실행 이력 조회:** `blog_import_runs` 목록 (status별 색상 구분)
- **큐 아이템 관리:** `blog_import_queue` 목록
  - status 필터: pending / approved / imported / skipped / failed
  - 개별 항목 승인/건너뜀/재시도 처리
  - 태그 편집 (서버 suggested_tag 기반, 사용자 편집 ID 추적으로 재fetch 시 편집본 보존)
- **페이지네이션:** 큐 아이템 페이지 단위 탐색 (승인/건너뜀 후 빈 페이지 자동 클램프)

---

### 5-4. 관리자 공통 UX 패턴

| 패턴 | 설명 |
|------|------|
| Lazy Load + Skeleton | 모든 탭은 `React.lazy()` + `<Suspense>` + 테마 일치 Skeleton UI |
| 탭 상태 유지 | `sessionStorage('gxp_admin_active_tab')`으로 새로고침 후에도 탭 복원 (`create` 탭은 dashboard로 fallback) |
| 탭 간 편집 전달 | `editingPost` 상태로 `manage → create` 탭 편집 흐름 구성 |
| 실시간 갱신 | `profiles` Realtime 구독 → `usersRefreshKey` 증가 |
| RefreshKey 패턴 | `dashRefreshKey`, `postsRefreshKey`, `usersRefreshKey`로 자식 컴포넌트 re-fetch 트리거 |
| 알림 벨 | `NotificationBell` 컴포넌트로 새 신청/예약 알림 표시 |
| 사이드바 | `AdminSidebar` — 탭 네비게이션 + 관리자 이메일 표시 |

---

### 5-5. 관리자 전용 플로팅 네비게이션

관리자로 인증된 상태(`!adminLoading && isAdmin && !mfaRequired && mfaEnrolled`)에서 화면 하단에 플로팅 바 표시:

| 탭 | 경로 | 설명 |
|----|------|------|
| 🌐 사이트 미리보기 | `/` | 공개 홈페이지 미리보기 |
| 📊 관리자 페이지 | `/admin` | 관리자 대시보드 |
| 🎨 디자인 시스템 | `/design-system` | 디자인 토큰 미리보기 |
| 🗂 서비스 흐름도 | `/flow-map` | 시스템 플로우 다이어그램 |

---

### 5-6. 관리자 접근 불가 처리 흐름

```
관리자 아닌 사용자가 /admin 접근 시:
  AdminRoute.loading=false && !isAdmin → <Navigate to="/" replace />

관리자이지만 MFA 미등록 시:
  sessionStorage.set('mfa_setup_required', 'true')
  → <Navigate to="/mypage" replace />
  → MyPage에서 mfaSetupRequired=true 감지 → MFA 등록 섹션 자동 스크롤

관리자 + MFA 등록됨 + aal2 미충족 시:
  → <Navigate to="/login" replace />
  → 로그인 페이지에서 MFA 챌린지 입력 → aal2 세션 획득 → /admin 재접근
```

---

## 부록: 주요 환경 변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `SUPABASE_URL` | Edge Function env | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 클라이언트 + Edge Function | 공개 anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function only | 서비스 롤 키 (RLS 우회 가능, 비공개) |
| `ENCRYPTION_SECRET_KEY` | Edge Function only | PII AES-256-GCM 암호화 비밀키 (비공개) |
| `GITHUB_PAT` | Edge Function only | GitHub Actions dispatch용 Personal Access Token |

---

## 부록: 파일 디렉터리 구조 요약

```
src/
├── app/
│   ├── components/
│   │   ├── admin/          # 관리자 컴포넌트들
│   │   ├── ui/             # shadcn 기반 UI 프리미티브
│   │   ├── AdminRoute.tsx  # 관리자 라우트 가드
│   │   ├── RootLayout.tsx  # 전체 레이아웃 래퍼
│   │   ├── HeaderSection.tsx
│   │   ├── FooterSection.tsx
│   │   └── ...             # 홈 섹션 컴포넌트들
│   ├── pages/              # 라우트별 페이지 컴포넌트
│   ├── constants/          # 카테고리, 연락처 상수
│   ├── routes.tsx          # React Router 라우팅 설정
│   ├── App.tsx             # ThemeProvider + RouterProvider
│   └── ThemeContext.tsx    # 다크/라이트 테마 Context
├── hooks/
│   ├── useAdmin.ts         # 관리자 권한 + MFA 상태 훅
│   ├── useIdleLogout.ts    # 비활동 자동 로그아웃
│   ├── useTracker.ts       # 페이지 방문 추적
│   └── ...
├── lib/
│   ├── supabaseClient.ts   # Supabase 클라이언트 초기화
│   ├── types.ts            # TypeScript 인터페이스 정의
│   └── layers.ts           # z-index 레이어 상수
├── utils/                  # 공용 유틸리티
└── styles/
    └── theme.css           # CSS 변수 토큰 정의 (다크/라이트)

supabase/
├── functions/              # Edge Functions (Deno)
│   ├── _shared/            # 공용 헬퍼 (cors.ts, adminAuth.ts)
│   ├── signup-profile/     # 회원가입 + PII 암호화
│   ├── encrypt-profile/    # PII 암호화 마이그레이션
│   ├── decrypt-profiles/   # 관리자용 전체 복호화
│   ├── decrypt-own-profile/# 본인 프로필 복호화
│   ├── update-user-role/   # 역할 변경 (재인증 필요)
│   ├── delete-user/        # 회원 삭제
│   ├── bulk-register-users/# CSV 대량 회원 등록
│   ├── change-password/    # 비밀번호 변경
│   └── sync-naver-blog/    # 네이버 블로그 동기화 트리거
└── migrations/             # DB 마이그레이션 SQL 파일
```
