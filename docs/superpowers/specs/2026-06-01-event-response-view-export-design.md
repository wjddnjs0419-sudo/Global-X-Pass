# 행사 신청 응답 시트 조회 + CSV 다운로드 — 설계

- 날짜: 2026-06-01
- 상태: 설계 확정 (구현 대기)
- 배포: 로컬 확인 → Netlify 수동 배포 (프론트 전용, DB 변경 0)

## 목적

행사 신청 폼으로 수집한 데이터를 구글 폼의 "응답 시트(표)" + "요약 통계" 방식으로 조회하고, CSV로 내려받을 수 있게 한다. 현재 어드민은 카드 뷰만 제공해 한눈에 비교하거나 외부로 내보낼 수 없다.

## 결정 사항 (사용자 확정)

- 조회 형태: **응답 시트(표)** + **요약 통계** 둘 다.
- 다운로드 포맷: **CSV** (의존성 0, UTF-8 BOM으로 한글 처리).
- 범위: **선택 행사 기준** — 단일 행사의 전체 신청(상태 무관).

## 구조 & 경계

- `AdminEventManagement`에 서브탭 **"응답"** 추가 (기존: 행사현황·참가자·처리내역).
- **표 조회는 단일 행사 필수**: 행사마다 동적 질문(`event_form_config.customQuestions`)이 달라 열 정렬이 불가능. 상단 행사 선택이 `all`이면 "행사를 선택하세요" 안내를 보여주고, 특정 행사 선택 시 그 행사의 **전체 신청(상태 무관)** 을 표로 렌더한다.
- 큰 파일(`AdminEventManagement.tsx`, 407줄) 분리: 신규 컴포넌트 **`src/app/components/admin/EventResponsesView.tsx`** 가 표 + 요약 + 다운로드 버튼을 담당. `AdminEventManagement`는 선택된 행사와 해당 신청 목록만 props로 전달.
- 순수 변환 로직은 신규 **`src/utils/eventResponseExport.ts`** 에 배치 (UI 무관, TDD 대상).

## 데이터 변환 (순수함수, TDD)

`src/utils/eventResponseExport.ts` 의 3개 순수함수:

1. **`buildResponseRows(applications, eventConfig)`** → `{ headers: string[], rows: string[][] }`
   - 고정 열: 순번 · 상태(한글 라벨, `EVENT_APPLICATION_STATUS`) · 신청일 · 이름 · 회사 · 직책 · 이메일 · 연락처
   - 동적 열: `eventConfig.customQuestions` 순서대로 `label`. 답이 배열이면 `", "` join.
   - legacy fallback: 답이 없을 때 `legacy_expectation`→`expectation`, `legacy_interests`→`interests`, `legacy_speaker`→`speaker_question` (기존 카드 뷰와 동일 규칙).
   - 순번은 신청일 오름차순(먼저 신청 순) 기준으로 부여.
2. **`toCsv(headers, rows)`** → `string`
   - 선두에 UTF-8 BOM(`﻿`).
   - RFC4180 이스케이프: 값에 따옴표·쉼표·줄바꿈이 있으면 `"` 로 감싸고 내부 `"` 는 `""` 로 치환.
   - 행 구분 `\r\n`.
3. **`summarizeChoiceQuestions(applications, questions)`** → 선택형(`single_choice`/`multi_choice`) 질문별 `{ id, label, counts: Record<option, number>, total }` 배열. 단답/장문 질문은 제외.

표 렌더와 CSV 다운로드는 **동일하게 `buildResponseRows` 결과**를 사용 → 화면과 파일 내용 일치 보장.

## UI & 동작

- **요약 통계**(상단): 선택형 질문만, 옵션별 카운트 가로 막대 + `n명(%)`. 단답/장문 제외. 선택형 질문이 없으면 섹션 생략.
- **표**(하단): 가로 스크롤 컨테이너 + sticky 헤더. 응답 없음 셀은 `–`. 기존 테마 토큰(`--color-surface-card` 등) 재사용.
- **다운로드 버튼**: 표 우상단 "CSV 다운로드". 신청 0건이면 비활성. 클릭 시 `buildResponseRows` → `toCsv` → `Blob`/anchor 다운로드. 파일명 `{행사명}_응답_{YYYYMMDD}.csv` (행사명은 파일명 안전 문자로 sanitize).
- 행사 미선택(`all`) 시: 표/요약/버튼 대신 안내 문구.

## 비범위 (YAGNI)

- 전체 행사 통합 표/다운로드 (행마다 행사명 열) — 미포함.
- `.xlsx` 바이너리 내보내기 — 미포함 (CSV로 충분).
- 단답/장문 질문의 워드클라우드·텍스트 집계 — 미포함.
- 서버 측 집계/RPC — 미포함 (클라이언트에서 기존 조회 데이터 재사용, DB 변경 0).

## 검증

- TDD: `src/utils/eventResponseExport.test.ts`
  - `toCsv`: BOM 선두, 따옴표/쉼표/줄바꿈 이스케이프, 빈 값 처리.
  - `buildResponseRows`: 고정+동적 열 헤더, 배열 답 join, legacy fallback, 상태 한글 라벨, 순번 오름차순.
  - `summarizeChoiceQuestions`: 옵션별 카운트, multi_choice 다중 카운트, 비선택형 제외.
- `npm run validate` (tsc, eslint, vitest, vite build, frontend secret scan) 통과.
- Codex 재리뷰 FAIL 0.
- 로컬 브라우저 확인 후 Netlify 수동 배포.
