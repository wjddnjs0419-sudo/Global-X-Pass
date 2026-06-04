# ONBOARDING — Global X Pass 운영 인수인계

> 운영자 전환용 문서. **전임자가 떠나며 넘기는 계정·키 체크리스트** + **후임 개발 시작 가이드**.
> 배포 상세는 [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md) 참조.

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

## 4. 후임 개발 시작

```bash
git clone https://github.com/wjddnjs0419-sudo/Global-X-Pass.git
cd Global-X-Pass
npm install
npm run db:start     # Docker 로컬 Supabase 스택 (모든 EF 자동 serve)
npm run dev          # 로컬 개발 서버
npm run validate     # tsc + eslint + vitest + build + secret scan
```

- 로컬 admin 로그인: `admin@test.com` / `Ncf2026!!`
- 배포(2트랙·수동) 상세: [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md)

---

## 5. 알아둘 제약·함정

- **회사뉴스 크롤은 로컬에서 동작 안 함** — `GITHUB_PAT`가 prod 전용 secret이라 로컬 Edge Function엔 없음(분리의 정상 동작). prod 앱에서 확인할 것. [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md) "로컬 제약" 참조.
- **Netlify 자동빌드 연동 없음** — `git push`만으론 라이브 미반영. `npm run build` 후 수동 배포 필요.
- **마이그 먼저, 코드 나중** — 새 컬럼/정책 쓰는 코드를 push했는데 prod 마이그를 안 올리면 라이브가 깨짐.

---

## 6. 전임자 전용 (인계 대상 아님)

- **아키텍처 맵** (electron 데스크탑 도구) — `src/architecture/`, `src/app/components/admin/architecture/` 등은 **git 추적 제외**(clone에 없음). 전임자 로컬 워크트리에만 존재. 메인 웹앱 운영과 무관.
- **Gemini API** (`GEMINI_API_KEY`) — 위 아키텍처 맵의 블로그 초안 작성에서만 사용 → 인계 대상 아님.
