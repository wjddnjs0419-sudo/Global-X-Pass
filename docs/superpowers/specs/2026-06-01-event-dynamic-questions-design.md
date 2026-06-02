# 행사 신청서 — 동적 질문 + 선택형 유형 설계

> 작성일 2026-06-01 · 상태: 승인됨(설계) → 구현계획 대기

## 배경 / 목적

현재 행사 신청서는 5개 **고정 섹션** 구조다. 관리자는 라벨만 수정할 수 있고, "추가 질문(customQuestions)"만 동적이며 그 유형도 `short_text`/`long_text` **타이핑형 2종**뿐이다.

팀원 피드백:
- **참가자 기본정보(1번)만 고정**으로 두고
- 나머지 질문(참여목적·관심분야·사전질문 등)은 **질문 유형**과 **번호 옆 카테고리명**을 관리자가 직접 타이핑·수정할 수 있게 한다.
- 질문 유형 2부류: **선택형**(항목 고르기) + **타이핑형**(주관식 입력).

핵심 = 동적 질문에 **선택형(choice) 유형을 추가**하고, 기존 고정 질문(참여목적·관심분야·사전질문)을 동적 질문 배열로 흡수한다.

## 현황 (조사 결과)

- 사용자 신청 폼: `src/app/pages/EventApplicationPage.tsx`
- 관리자 행사 생성 폼: `src/app/components/admin/AdminPostCreate.tsx` → `EventFormConfigEditor.tsx`
- 신청서 설정 에디터: `src/app/components/admin/EventFormConfigEditor.tsx`
- 관리자 신청 조회: `src/app/components/admin/AdminEventManagement.tsx`
- 기본값/병합/정규화 유틸: `src/utils/eventApplication.ts`
- 타입: `src/lib/types.ts` (`EventFormConfig`, `EventCustomQuestion`, `EventApplication`)
- 저장 스키마: `posts.event_form_config`(JSONB), `event_applications.answers`(JSONB, 현재 `Record<string,string>`)

**프로덕션 실데이터 확인(yzbjvkifwinumytehxgf, 2026-06-01):**
- 행사 2건, `event_form_config` 보유. 단 둘 다 `customQuestions = []`, 고정 라벨만 일부 커스텀.
- `event_applications` **접수 0건**, 커스텀 답변 0건.
- → 답변 데이터 마이그레이션 부담 없음. 기존 행사 설정은 read-time 자동변환으로 무손실 보존 가능.

## 결정 사항 (브레인스토밍)

1. 기존 고정 질문 → **전부 동적 질문으로 흡수**. 기본정보 1블록만 고정.
2. 선택형 = **단일선택(라디오) + 복수선택(체크박스) 둘 다** 지원.
3. 하위호환 = 기존 행사 설정 보존 필요(단 답변 0건이라 read-time 변환으로 충분).
4. 카테고리 = **질문에 `category` 필드**를 두는 평평한 배열 방식(접근법 A). 명시적 섹션 중첩(B)은 과설계로 배제.

## 데이터 모델

### `EventCustomQuestion` (types.ts) 확장
```ts
export type EventQuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multi_choice';

export interface EventCustomQuestion {
  id: string;
  label: string;
  category?: string;          // 신규: 번호 옆 카테고리명, 자유 타이핑. 빈 값 허용.
  type: EventQuestionType;    // 선택형 2종 추가
  options?: string[];         // 신규: single_choice / multi_choice 전용
  required: boolean;
}
```

### 답변 타입 확장
```ts
EventApplication.answers?: Record<string, string | string[]> | null;
// multi_choice = string[], 그 외 = string
```
DB는 JSONB라 스키마 변경 불필요(타입스크립트 타입만 확장). 컬럼 마이그레이션 없음.

### `EventFormConfig`
- 기존 고정 라벨 필드(`expectationLabel`, `interestsLabel`, `interestOptions`, `speakerQuestionLabel` 등)는 **삭제하지 않는다** — 자동변환 소스로 유지(하위호환).
- 신규/편집 시 실질 질문은 전부 `customQuestions`에 모인다.

## 폼 구조

1. **고정 블록 — 참가자 기본정보**: 기업명/기술분야, 성함, 직책, 이메일, 연락처. 지금처럼 라벨만 수정 가능. 저장은 기존 전용 컬럼 유지.
2. **동적 블록 — 질문 목록**: `customQuestions` 단일 배열. 렌더 시 직전 질문과 `category`가 다를 때만 카테고리 헤더 1회 표시(빈 category는 헤더 없음).
3. **고정 — 개인정보 동의 + 완료 안내**: 그대로 유지.

## 자동 변환 (하위호환)

`src/utils/eventApplication.ts`의 `mergeEventFormConfig`에 1회성 변환 추가:

기존 행사 config에서 `customQuestions`가 비어 있고 고정 라벨이 존재하면 → 동적 질문 배열로 시드한다.

| 기존 고정 질문 | → 동적 질문 type | category | 비고 |
|---|---|---|---|
| `expectationLabel` | `long_text` | "참여 목적" | |
| `interestsLabel` + `interestOptions` | `multi_choice` | "관심 분야" | options = interestOptions |
| `speakerQuestionLabel` | `long_text` | "사전 질문" | |

- 변환 결과의 각 질문 `id`는 안정적(예: `legacy_expectation`, `legacy_interests`, `legacy_speaker`)으로 부여해 답변 키 충돌 방지.
- 신규 행사 생성 시에도 이 3개를 **기본 템플릿**으로 시드(빈 폼이 아니라 기존 UX 유지).
- DB SQL 마이그레이션은 수행하지 않는다(read-time 변환만). 프로덕션 답변 0건이므로 안전.

## 컴포넌트별 변경

### `EventFormConfigEditor.tsx` (관리자 에디터)
- 기존 "2. 관심분야 & 참여목적", "3. 사전 질문" 고정 섹션 제거 → "동적 질문" 단일 영역으로 통합.
- 질문 카드 필드: `[카테고리 입력] [질문 문구] [유형 ▼ 4종] [필수 ☑]`.
- 유형이 `single_choice`/`multi_choice`일 때만 옵션 편집 UI 노출(추가/삭제) — 기존 `interestOptions` 에디터 패턴 재사용.
- 순서 삽입/삭제는 기존 `insertQuestion`/`removeQuestion` 유지.
- "기본 문구로 되돌리기" = 기본 템플릿(위 3개 시드)로 복원.

### `EventApplicationPage.tsx` (신청 폼)
- 동적 질문 렌더 분기:
  - `short_text` → `input[type=text]`
  - `long_text` → `textarea`
  - `single_choice` → 라디오 그룹
  - `multi_choice` → 체크박스 그룹
- 카테고리 헤더는 연속 그룹 첫 질문에서만 렌더.
- 필수검증: text = 비어있지 않음, choice = 최소 1개 선택.
- 저장: `answers[question.id]` — multi_choice는 `string[]`, 그 외 `string`. 빈 답변은 기존처럼 제외.

### `AdminEventManagement.tsx` (신청 조회)
- 답변 표시 시 값이 배열이면 쉼표로 join.
- 고정 컬럼(expectation/interests/speaker_question) 직접 의존 제거하고 `answers` 중심으로 표시(기본정보 컬럼은 유지).

## 에러 처리 / 엣지

- `options` 없는 choice 질문 → 정규화에서 빈 배열 보정, 폼에서 "선택지 없음" 비활성 처리.
- 유형 변경(text↔choice) 시 기존 `options`/답변 잔여 정리는 정규화(`normalizeEventCustomQuestions`)에서 일관 처리.
- 빈 `category` = 헤더 미표시(자유 허용).
- 중복 `id` 방지: 자동변환 예약 id + 신규 생성 id 네임스페이스 분리.

## 테스트 전략 (TDD)

순수함수 우선 RED→GREEN→REFACTOR (Vitest):
1. `normalizeEventCustomQuestions` — category/options 정규화, choice 유형 보존, 잘못된 type 폴백.
2. `mergeEventFormConfig` — 레거시 고정 라벨 → 동적 질문 자동변환, 안정 id, 신규 기본 템플릿 시드.
3. choice 필수검증 헬퍼 — single/multi 최소선택 규칙.
4. 답변 직렬화 — multi_choice 배열 보존, 빈 답변 제외.

컴포넌트 렌더 분기는 함수 추출 후 단위 테스트, 통합은 기존 QA 스펙 흐름 따름.

## 비목표 (YAGNI)

- 명시적 섹션 중첩 구조(접근법 B), drag&drop 순서이동.
- 파일 업로드/날짜/숫자 등 추가 입력 유형.
- 질문 조건부 분기(skip logic).
- DB 컬럼 마이그레이션(JSONB만 사용).
