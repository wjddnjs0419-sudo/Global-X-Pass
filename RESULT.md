# RESULT: 프로젝트 이관 핸드오프 정비 — 2026-06-04

## 배경
- 목표: 새 컴퓨터에서 `git clone` + 비밀 env 1회 복붙만으로 로컬+prod 동작하도록 이관 경로 정비.
- 인수자가 **코딩 문외한**이라는 제약 추가 → 설치는 전임자가 해주되, 유지보수 흐름을 비개발자도 이해하게 별도 문서 필요.
- 한계: 비밀키(특히 prod와 동일한 `ENCRYPTION_SECRET_KEY`)는 git 불가 → "clone 한 방"은 구조상 불가, "clone + 비밀 복붙"으로 목표 하향.

## 구현
- **env 템플릿 3종 신규**: `.env.example`(로컬 dev — 로컬 기본값은 실값, 진짜 비밀은 placeholder), `.env.production.local.example`(prod — 전부 placeholder), `supabase/functions/.env.example`(로컬 EF). `.gitignore`에 `!.env.production.local.example` allowlist 추가.
- **보안 검증**: 로컬 `ENCRYPTION_SECRET_KEY`가 prod와 **동일한 실비밀**임을 확인 → 템플릿에 placeholder 처리, 추적 문서에 키 흔적 0 확인.
- **README.md 신규**: 저장소 진입점. 비개발자→START_HERE, 개발자→ONBOARDING 분기 + 문서 지도.
- **START_HERE.md 신규**: 코딩 입문자용. 도구 비유표, 로컬vs프로덕션 큰그림, 유지보수 4단계, 🚨 빨간줄 4개, 작업표, Claude Code 첫 문장.
- **ONBOARDING.md §4 보강**: §4-0 환경비교표(맥 실측 버전 기준 Windows 설치 목록), §4-4 Windows 함정(WSL2 Docker, npm script-shell=bash), §4-5 트러블슈팅 5종, §4-1 임의키 prod 재사용 경고, §4-2 배포순서(마이그→코드)+Windows 안내, db:start→db:reset로 seed 확정.

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| env 템플릿 + gitignore | 예시 추적가능·실비밀 차단·비밀누수 0 | `git check-ignore` + grep 통과 |
| 문서 정합 | cp 경로·앵커·명령어 사실성 | Codex 리뷰 FAIL 0 (WARN 3=커밋시 해소) |
| 비밀 스캔 | 프론트 번들 secret 유출 | `npm run check:frontend-secrets` 통과 |

## 교훈
- 로컬·prod env는 환경 키(URL/ANON/SERVICE_ROLE/SUPER_ADMIN_UID)는 다르고 `ENCRYPTION_SECRET_KEY`만 동일해야 함 — 이 하나가 어긋나면 prod PII 복호 영구 불능. 임의키 prod 재사용이 가장 위험한 인수 실수.
- 이관 매뉴얼은 실제 시뮬레이션(빈 Windows 셋업)으로 구멍을 찾아야 함 — Docker WSL2, npm=cmd.exe bash 문법, 첫 이미지 풀 지연, 빈 암호화키 크래시는 책상 위 점검으론 안 보임.
