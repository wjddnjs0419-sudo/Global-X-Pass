# ONBOARDING — Global X Pass 운영 인수인계

> 운영자 전환용 문서. **전임자가 떠나며 넘기는 계정·키 체크리스트** + **후임 개발 시작 가이드**.
> 배포 상세는 [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md) 참조.

---

## 0. ⚡ 이관 첫날 할 일 (순서대로)

> **코딩이 처음이면** 먼저 [START_HERE.md](START_HERE.md)부터 읽으세요(큰 그림).
> **개발 설치는 전임자가 미리 해드립니다** — 아래는 *당신*이 챙길 계정·키 인계 위주입니다.
> 위에서부터 순서대로. 1번은 처리에 며칠 걸릴 수 있어 **제일 먼저** 시작하세요.

- [ ] **1. 🔴 Netlify 사이트 이전 티켓 제출** — 무료 플랜은 support 티켓이 유일 경로이고 **응답이 느려서 가장 먼저** 걸어둬야 함. → 아래 §3-1
- [ ] **2. 도메인 소유권 양도 시작** (`ncf-aroundx.com`) — 등록기관 계정을 후임에게 넘겨야 만료를 통제. → §3-2
- [ ] **3. 접근 확인** — Supabase·GitHub 초대가 왔는지 **로그인해서 실제로 들어가지는지** 확인(초대만 되고 수락 안 된 경우 방지). → §3-3·§3-4
- [ ] **4. 🔴 비밀키 번들 안전하게 받기** — 특히 **`ENCRYPTION_SECRET_KEY`(교체 불가)**. 카톡·메일 평문 금지, 1Password/암호화 압축으로. → §3-6
- [ ] **5. 네이버 검색 API 키 교체** — 회사뉴스 자동수집이 전임자 개인 앱 키를 쓰는 중. 후임 키로 바꿔야 할당량 분리. → §3-5
- [ ] **6. (직접 개발할 거면) 새 PC 셋업** — 안 할 거면 전임자가 셋업해줍니다. → §4

> ✅ 표시는 처리 후 직접 체크하세요. 막히면 Claude Code에게 한국어로 물어보면 됩니다.

---

## 1. 프로젝트 한 줄
구글 창구 8기 프로그램 포털 (참여사 100개사 대상). 핵심 기능: 행사 공지·컨설팅 예약·Founder's Club.

## 2. 인프라 한눈에

| 레이어 | 서비스 | 식별자 | 인계 상태 |
|---|---|---|---|
| 프론트 호스팅 | Netlify (수동 배포) | 운영 도메인 `ncf-aroundx.com` (Netlify DNS) | ⏳ support 티켓 이전 |
| DB·Auth·Edge Func | Supabase (prod) | `yzbjvkifwinumytehxgf` | ✅ 멤버 초대됨 |
| 소스 | GitHub | `wjddnjs0419-sudo/Global-X-Pass` | ✅ 초대됨 (Actions secrets는 별도) |
| 뉴스 크롤 | 네이버 검색 API | 운영자 개인 네이버 앱 | ⏳ 후임 키 교체 |
| 로컬 개발 | Docker Supabase | ref `Global_X_Pass` (`127.0.0.1:54321`) | — |

---

## 3. 계정·키 이관 체크리스트 (전임자 → 후임)

### 3-1. Netlify (호스팅 + DNS) — 🔴 우선순위 1
무료(Starter) 플랜은 **멤버 초대·self-service 사이트 이전이 모두 불가**(Transfer 버튼 안 뜸이 정상). → **support 티켓**이 유일 경로.

1. 후임이 Netlify 무료 계정 먼저 생성
2. [netlify.com/support](https://www.netlify.com/support) → topic **"Site/DNS Transfer"**
3. 티켓 제출 문구(영어, 복붙용):

   ```
   Subject: Site + DNS zone transfer between free accounts

   I'm on a Free plan and cannot use self-service transfer
   (no Transfer button — can't add team members on Free).

   Please transfer the following to a new owner:
   - Site name/URL: <사이트명>
   - Custom domain (Netlify DNS zone): ncf-aroundx.com
   - Receiving Netlify account email: <후임 이메일>

   Please move BOTH the site and its DNS zone so the new owner
   fully manages the domain. Confirm env vars and domain settings
   are preserved. This is a handoff; no downtime preferred.
   ```

   - Netlify DNS라 **사이트 + DNS zone 둘 다** 이전해야 함. zone 빠지면 도메인 관리가 전임자 계정에 남음.
   - Netlify 내부 이동이라 **네임서버 변경 불필요 = 무중단**.
   - 무료는 응답이 느릴 수 있음. 폼이 봇으로 막히면 [answers.netlify.com](https://answers.netlify.com) 포럼에 같은 글 올리면 staff가 픽업.
4. **이전 완료 확인 전까지 전임자 계정 삭제 금지.**

### 3-2. 도메인 등록기관 (`ncf-aroundx.com`)
네임서버는 Netlify를 가리킨 채 유지하면 됨. 단 **도메인 소유·갱신 계정(등록기관)** 은 별도로 후임에게 양도해야 만료를 통제할 수 있음.

### 3-3. Supabase (prod) — ✅ 초대 완료
프로젝트 멤버 초대됨. `SUPABASE_SERVICE_ROLE_KEY` 등은 Supabase 대시보드에서 재발급 가능.

### 3-4. GitHub repo — ✅ 초대 완료 (단 Actions secrets 주의)
repo collaborator 초대됨. 단 **`Settings → Secrets and variables → Actions`는 admin 권한 별도**(값은 못 보고 재설정만 가능). 아래 네이버 키가 여기 등록돼 있음.

### 3-5. 네이버 검색 API (회사뉴스 크롤) — ⏳ 후임 키 교체
회사뉴스 크롤(`scripts/crawl-company-news.mjs`, GitHub Actions `company-news-crawl.yml`에서 실행)이 운영자 개인 네이버 앱의 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`을 사용.

1. **후임이 자기 앱 등록** — [developers.naver.com](https://developers.naver.com) → Application 등록 → **검색 API** 사용 설정 → `Client ID`/`Client Secret` 발급. (서비스 URL은 `https://ncf-aroundx.com` 기준)
2. **키 교체 2곳**:
   - **GitHub Actions secrets** (repo `Settings → Secrets and variables → Actions`) — `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` 갱신
   - **로컬 `.env`** (후임 개발 머신) — 같은 두 키
3. GitHub Actions에서 크롤 1회 수동 실행해 동작 확인
4. 네이버 검색 API는 **일일 호출 한도가 앱(계정)당** 부과 → 후임 키로 바꿔야 전임자 할당량과 분리됨

### 3-6. 반드시 전달할 secret 값
계정이 아니라 값. 후임에게 안전하게(평문 공유 채널 금지) 전달:

| Secret | 위치 | 주의 |
|---|---|---|
| **ENCRYPTION_SECRET_KEY** | `.env` / `supabase/functions/.env` / Supabase secrets | 🔴 **교체 불가** — 바꾸면 기존 암호화 PII(프로필 등) 복호화 영구 불능. 값 그대로 전달 |
| **BLOG_SYNC_SECRET** | Supabase secrets | 블로그 동기화(`sync-naver-blog`) 토큰. 자체 발급 → 재발급+EF secret 갱신 가능 |
| **GITHUB_PAT** | GitHub + Supabase secrets | Actions 디스패치용. 후임 명의 PAT 재발급 권장 |

---

## 4. 새 컴퓨터 셋업 (clone → 로컬 → prod)

> **`git clone` 한 방만으론 100% 동작 불가** — 비밀키(특히 `ENCRYPTION_SECRET_KEY`)는 git에 못 올린다.
> 목표는 **clone + 비밀 env 1회 복붙 → 완전동작**. env 변수명·로컬 기본값은 `*.example` 템플릿이 repo에 포함돼 있다.

### 4-0. 사전 도구 — 환경 비교 & 설치 (맥 실측 기준)
신규 PC엔 **아무것도 안 깔려 있다고 가정**. 아래는 전임자 맥에서 실측한 버전과, 빈 Windows에 깔아야 할 항목.
`npm install`은 프로젝트 라이브러리만 깔 뿐 — **Docker·Supabase CLI·Playwright 브라우저는 OS 레벨로 따로 설치해야 한다**(npm으로 안 깔림).

| 도구 | 프로젝트 필요? | 맥 실측(기준값) | 최소 | Windows 설치 명령 | 확인 |
|---|---|---|---|---|---|
| **Node.js** | 🔴 필수 | v25.9.0 | 20 LTS+ | `winget install OpenJS.NodeJS.LTS` | `node -v` |
| npm | 🔴 필수(Node 동봉) | 11.12.1 | — | (Node와 함께) | `npm -v` |
| **Git** | 🔴 필수 | 2.50.1 | 2.x+ | `winget install Git.Git` | `git --version` |
| **Docker Desktop** | 🔴 필수(로컬 DB) | 29.4.1 / Compose v5.1.3 | 최신 | `winget install Docker.DockerDesktop` **+ WSL2** | `docker ps` |
| **Supabase CLI** | 🔴 필수(`db:*`) | 2.98.2 | 2.x+ | `scoop install supabase` | `supabase -v` |
| Playwright 브라우저 | 🟡 E2E QA만 | chromium | — | `npx playwright install chromium` | (자동) |
| Netlify CLI | 🟡 선택(코드 배포) | 미설치 | — | `npm i -g netlify-cli` | `netlify -v` |

**안 깔아도 됨**: `deno`(Supabase CLI가 자체 번들) · `psql`(불필요) · `gh`(불필요). 맥에도 없음.

설치 후 한 번에 검증:
```powershell
node -v ; npm -v ; git --version ; docker ps ; supabase -v
```
> Node는 LTS(20·22) 권장. 전임자 맥은 25.9.0이나 프로젝트에 버전 핀(`engines`/`.nvmrc`)이 없어 20 LTS 이상이면 동작.

### 4-1. 로컬 개발 구동
```bash
git clone https://github.com/wjddnjs0419-sudo/Global-X-Pass.git
cd Global-X-Pass
npm install

# env 템플릿 복사 (변수명·로컬 기본값 포함)
cp .env.example .env
cp supabase/functions/.env.example supabase/functions/.env
# → 두 파일의 🔴 ENCRYPTION_SECRET_KEY 에 §3-6에서 받은 실값 붙여넣기 (두 곳 동일!)
#    GEMINI/NAVER 키는 로컬 dev엔 불필요(비워도 됨).
#    ⚠️ 실값 못 받아 임시로 `openssl rand -hex 32`를 넣었다면, 그 임의키는 로컬 전용.
#       절대 .env.production.local 에 재사용 금지 → prod 기존 PII 영구 복호 불능(§4-5).

npm run db:start     # Docker 로컬 Supabase 스택 부팅 (모든 EF 자동 serve)
npm run db:reset     # 마이그 전체 재생 + seed.sql 적용 → admin@test.com 생성 보장
npm run dev          # 로컬 개발 서버
npm run validate     # tsc + eslint + vitest + build + secret scan
```
- 로컬 admin 로그인: `admin@test.com` / `Ncf2026!!`
  (seed는 `[db.seed] enabled=true`로 **db reset 시 적용**됨 — 첫 `db:start`만으론 불확실하니 `db:reset`로 확정.)

### 4-2. prod 배포 가능하게 (선택 — 라이브 운영 시)
```bash
cp .env.production.local.example .env.production.local
# → 모든 🔴 값을 prod 실값으로 교체 (anon/super UID/ENCRYPTION/service_role/외부키)

supabase login                       # 후임 명의 access token
supabase link --project-ref yzbjvkifwinumytehxgf
```
- 배포 절차(DB 먼저 → 코드, 둘 다 수동) 상세: [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md)
- prod DB push 시 `SUPABASE_DB_URL_PROD`(비번 포함)를 셸 env로 export — 커밋 금지.
- 🔴 **순서 고정: 마이그(DB) 먼저 → 코드 나중**. 반대로 하면 라이브가 없는 컬럼을 조회해 즉시 깨짐(§5).
- 🪟 **Windows는 배포 명령을 Git Bash/WSL에서** 실행(`db:push:prod`가 bash 문법, §4-4). PowerShell은 로컬 개발용.

### 4-3. 안전채널로 받아야 할 비밀 번들 (전임자 → 후임)
`*.example`의 🔴 값들. 평문 채널(슬랙/메일 본문) 금지 → 1Password/암호화 압축 등으로:
- `ENCRYPTION_SECRET_KEY` (🔴 교체불가 — 1순위)
- prod `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPER_ADMIN_UIDS`
- `GEMINI_API_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `SUPABASE_DB_URL_PROD` (DB 비번 포함)
- 상세·교체가능 여부: §3-6 표 참조.

### 4-4. Windows 사용자 주의 (Mac과 다른 점)
위 §4 명령은 Mac 기준. Windows는 아래 2가지만 다르고 나머지는 동일.

1. **Docker Desktop은 WSL2 백엔드 필요** — Docker Desktop 설치 후 WSL2 활성화(설치 마법사 안내). 안 켜면 `db:start`가 실패.
2. **`npm run db:push:prod`는 bash 문법** (`url=$(...)`) — Windows의 `npm run`은 기본 cmd.exe로 실행돼 깨진다(VSCode 터미널 종류와 무관). prod DB push 전에 npm 셸을 bash로 1회 지정:
   ```powershell
   npm config set script-shell "C:\Program Files\Git\bin\bash.exe"
   ```
   (Git for Windows 필요. 또는 WSL 안에서 clone+개발하면 Mac과 동일.)
- 로컬 개발(`db:start`/`db:reset`/`dev`)·`cp` 복사는 PowerShell에서 그대로 동작.
- 도구 설치 명령(winget/scoop)은 §4-0 표 참조. `scoop` 없으면 먼저: `irm get.scoop.sh | iex`.

### 4-5. 셋업 트러블슈팅 (빈 PC 첫 셋업 실패 지점)
| 증상 | 원인 | 해결 |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop 미실행/WSL2 미설정 | Docker Desktop 실행(트레이 초록)+WSL2 켜고 재부팅 후 `docker ps` 확인 |
| `db:start`가 멈춘 듯 (수 분 무응답) | **첫 실행 이미지 풀**(정상) | 5~10분 대기. 중단 금지 |
| 로그인/프로필에서 앱 크래시 | `.env`의 `ENCRYPTION_SECRET_KEY` **빈값** | §3-6 실값 입력. 로컬만이면 `openssl rand -hex 32`로라도 채움(빈칸 불가) |
| 회사뉴스 크롤 `dispatched:false` | `GITHUB_PAT` 로컬 EF 부재(정상) | 버그 아님 → prod 앱에서 확인(§5) |
| **prod 프로필 복호화 실패**(decryption failed) | `.env.production.local`에 **틀린 `ENCRYPTION_SECRET_KEY`**(임의키/오타) | 전임자 원래 키(§3-6에서 받은 값)로 즉시 교체. 🔴 새 키로 prod에 새 PII가 쓰이기 전에 되돌려야 영구손상 면함 |
| `db:push:prod` 구문오류(`'url'은…`) | Windows `npm run`=cmd.exe, 스크립트는 bash | §4-4 → `npm config set script-shell` bash 지정 |

---

## 5. 알아둘 제약·함정

- **회사뉴스 크롤은 로컬에서 동작 안 함** — `GITHUB_PAT`가 prod 전용 secret이라 로컬 Edge Function엔 없음(분리의 정상 동작). prod 앱에서 확인할 것. [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md) "로컬 제약" 참조.
- **Netlify 자동빌드 연동 없음** — `git push`만으론 라이브 미반영. `npm run build` 후 수동 배포 필요.
- **마이그 먼저, 코드 나중** — 새 컬럼/정책 쓰는 코드를 push했는데 prod 마이그를 안 올리면 라이브가 깨짐.

---

## 6. 전임자 전용 (인계 대상 아님)

- **아키텍처 맵** (electron 데스크탑 도구) — `src/architecture/`, `src/app/components/admin/architecture/` 등은 **git 추적 제외**(clone에 없음). 전임자 로컬 워크트리에만 존재. 메인 웹앱 운영과 무관.
- **Gemini API** (`GEMINI_API_KEY`) — 위 아키텍처 맵의 블로그 초안 작성에서만 사용 → 인계 대상 아님.
