# RESULT: Supabase 프로젝트 데이터 혼재 원인 확인 및 Date-planner 분리 (2026-05-22)

## 현재 상태

`Global X Pass`는 계속 `yzbjvkifwinumytehxgf` 프로젝트를 사용한다. 같은 Desktop의 `Codex_sample(Date-planner)`는 `.env`와 Supabase CLI link를 `wqjguifsmtblgrhdfnji` (`Date-planner`)로 전환했다.

이번 이슈는 코드가 한 write를 두 Supabase 프로젝트에 동시에 보내는 문제가 아니라, `Codex_sample`이 기존에 `Global X Pass` 프로젝트 ref를 보고 있어서 Date-planner 데이터가 같은 DB에 섞일 수 있었던 설정 문제로 확인했다.

## 변경/작업 내용

| 대상 | 변경 |
|---|---|
| `../Codex_sample/.env` | `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 `wqjguifsmtblgrhdfnji` 기준으로 교체. |
| `../Codex_sample/supabase/.temp/project-ref` | `supabase link --project-ref wqjguifsmtblgrhdfnji --workdir ../Codex_sample --yes`로 CLI link 전환. |
| `../Codex_sample/docs/supabase-schema.sql` | 원본 SQL은 유지하고, 새 프로젝트에 `supabase db query --linked -f docs/supabase-schema.sql --workdir ../Codex_sample`로 적용. |
| `../Codex_sample/AGENTS.md`, `../Codex_sample/context.md` | Date-planner의 현재 연결 프로젝트를 `wqjguifsmtblgrhdfnji`로 문서화. |
| `PLAN.md`, `RESULT.md` | 이번 조사와 분리 결과를 최신 세션 기록으로 반영. |

## 확인 결과

- `Global X Pass` `.env`: URL, anon key, service role key 모두 `yzbjvkifwinumytehxgf`.
- `Codex_sample` `.env`: URL, anon key 모두 `wqjguifsmtblgrhdfnji`.
- `Codex_sample` CLI link: `wqjguifsmtblgrhdfnji` / `Date-planner`.
- 새 Date-planner 프로젝트에는 `date_planner_*` 7개 테이블이 모두 존재한다.
- Row count 확인:
  - `wqjguifsmtblgrhdfnji`: 모든 `date_planner_*` 테이블 0건.
  - `yzbjvkifwinumytehxgf`: `date_planner_profiles` 1건, 나머지 0건.

## 검증 결과

- `npm run validate` ✅ (`/Users/jeongwonkim/Desktop/Codex_sample`)
- `npm run validate` ✅ (`/Users/jeongwonkim/Desktop/Global X Pass`)
- Supabase CLI table existence/count query ✅

## 후속 참고

`yzbjvkifwinumytehxgf`에 남아 있는 `date_planner_profiles` 1건은 이전 잘못된 연결 상태에서 들어간 잔여 데이터로 보인다. 삭제나 이전은 데이터 보존 판단이 필요하므로 이번 작업에서는 수행하지 않았다.
