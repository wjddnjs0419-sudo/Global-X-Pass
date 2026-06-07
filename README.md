# Global X Pass

구글 창구 8기 프로그램 포털 (참여사 100개사). 핵심 기능: 행사 공지·컨설팅 예약·Founder's Club.

스택: React + Vite + TypeScript / Supabase(DB·Auth·Edge Functions) / Netlify(수동 배포).

## 🚀 처음 오셨나요 (이관·셋업)
- **이관 첫날이라면 → [ONBOARDING.md §0 첫날 할 일](ONBOARDING.md#0--이관-첫날-할-일-순서대로)** (순서대로 따라가는 체크리스트)
- **코딩이 처음이라면 → [START_HERE.md](START_HERE.md)** (아이에게 설명하듯 쉬운 큰 그림)
- **개발·셋업 상세 → [ONBOARDING.md](ONBOARDING.md)** (계정·키 인계 + 새 컴퓨터 셋업 clone→로컬→prod)

## 빠른 시작 (로컬)
> 위에서부터 **순서대로** 한 줄씩 실행. 각 명령이 무슨 일을 하는지 주석으로 적어둠.
> (Docker·Supabase CLI 등 사전 도구가 먼저 깔려 있어야 함 → [ONBOARDING.md §4-0](ONBOARDING.md#4-0-사전-도구--환경-비교--설치-맥-실측-기준))

```bash
# 1) 프로젝트 라이브러리(의존성) 설치 — 코드가 쓰는 외부 패키지를 내려받음
npm install

# 2) 비밀값 쪽지(.env) 두 개 생성 — 템플릿 복사. 🔴 실제 비밀값은 ONBOARDING §3-6에서 받아 채움
cp .env.example .env
cp supabase/functions/.env.example supabase/functions/.env

# 3) 내 컴퓨터 안에 '연습용 서버'(로컬 Supabase) 켜기 + 초기 데이터 넣기
#    db:start = Docker로 DB·로그인·Edge Function 스택 부팅
#    db:reset = 표 구조(마이그) 재생성 + seed로 admin@test.com 계정 생성
npm run db:start && npm run db:reset

# 4) 개발 서버 실행 — 브라우저로 사이트가 뜸(보통 http://localhost:5173)
npm run dev
```
- 로컬 어드민 로그인: `admin@test.com` / `Ncf2026!!`(슈퍼어드민)
- 로컬 어드민(MFA): `ncf@test.com`    / `Ncf2026!!` 
- 코드 바꾼 뒤 검사: `npm run validate` (tsc·eslint·테스트·빌드·비밀유출 한 번에 점검)
- 사전 도구·비밀 전달 등 상세는 [ONBOARDING.md §4](ONBOARDING.md#4-새-컴퓨터-셋업-clone--로컬--prod).

## 🔌 매일 작업 시작 (켜는 순서)
> 위 "빠른 시작"은 **새 컴퓨터에서 딱 한 번**. 셋업이 끝난 뒤로는, **작업하러 앉을 때마다** 아래 순서로 켜면 됩니다.

1. **Docker Desktop 실행** — 트레이 아이콘이 **초록색** 될 때까지 대기. (로컬 서버가 도는 토대 — 안 켜면 4번이 실패함)
2. **VSCode 열기 → 폴더 `Global X Pass` 열기** — 상단 메뉴 `File → Open Folder`.
3. **터미널 열기** — 상단 메뉴 `Terminal → New Terminal`. (아래 명령들을 여기에 입력)
4. `npm run db:start` — 내 컴퓨터 안 '연습용 서버'(DB·로그인·Edge Function) 켜기. *(처음 한 번은 몇 분 걸림 — 중단 금지)*
5. `npm run dev` — 사이트를 브라우저로 띄움 (보통 http://localhost:5173 ).
6. **Claude Code 켜고 `ㅎㅇ` 입력** — AI 비서가 현재 상황 요약 + 다음 할 일을 한국어로 안내.

**작업 끝낼 때**: 터미널에서 `Ctrl+C`로 dev 중지 → `npm run db:stop`(연습용 서버 끄기). *Docker Desktop도 꺼도 됨.*

## 문서 지도
| 문서 | 내용 |
|---|---|
| [START_HERE.md](START_HERE.md) | 🌱 코딩 입문자용 — 유지보수 흐름 큰 그림 |
| [ONBOARDING.md](ONBOARDING.md) | 운영 인수인계 + 새 PC 셋업 |
| [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md) | 배포 절차(로컬→prod, 2트랙 수동) |
| [docs/AGENT_RULES.md](docs/AGENT_RULES.md) | 개발 규칙·보안 의무·코딩 컨벤션 |
| [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) | AI 에이전트 라우터·작업 규약 |
