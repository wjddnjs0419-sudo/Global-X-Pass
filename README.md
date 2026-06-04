# Global X Pass

구글 창구 8기 프로그램 포털 (참여사 100개사). 핵심 기능: 행사 공지·컨설팅 예약·Founder's Club.

스택: React + Vite + TypeScript / Supabase(DB·Auth·Edge Functions) / Netlify(수동 배포).

## 🚀 처음 오셨나요 (이관·셋업)
- **코딩이 처음이라면 → [START_HERE.md](START_HERE.md)** (아이에게 설명하듯 쉬운 큰 그림)
- **개발·셋업 상세 → [ONBOARDING.md](ONBOARDING.md)** (계정·키 인계 + 새 컴퓨터 셋업 clone→로컬→prod)

## 빠른 시작 (로컬)
```bash
npm install
cp .env.example .env                              # 🔴 비밀값은 ONBOARDING §3-6 참조
cp supabase/functions/.env.example supabase/functions/.env
npm run db:start && npm run db:reset              # 로컬 Supabase + seed(admin@test.com)
npm run dev
```
사전 도구·비밀 전달 등 상세는 [ONBOARDING.md §4](ONBOARDING.md#4-새-컴퓨터-셋업-clone--로컬--prod).

## 문서 지도
| 문서 | 내용 |
|---|---|
| [START_HERE.md](START_HERE.md) | 🌱 코딩 입문자용 — 유지보수 흐름 큰 그림 |
| [ONBOARDING.md](ONBOARDING.md) | 운영 인수인계 + 새 PC 셋업 |
| [docs/DEPLOY_WORKFLOW.md](docs/DEPLOY_WORKFLOW.md) | 배포 절차(로컬→prod, 2트랙 수동) |
| [docs/AGENT_RULES.md](docs/AGENT_RULES.md) | 개발 규칙·보안 의무·코딩 컨벤션 |
| [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) | AI 에이전트 라우터·작업 규약 |
