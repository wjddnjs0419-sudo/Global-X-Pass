# 행사 신청서 동적 질문 + 선택형 유형 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 행사 신청서에서 참가자 기본정보만 고정하고, 나머지 질문은 관리자가 카테고리·유형(타이핑형 2종 + 선택형 2종)을 직접 편집하는 동적 질문으로 통합한다.

**Architecture:** `EventCustomQuestion`에 `category`/`options` 필드와 `single_choice`/`multi_choice` 유형을 추가한다. 기존 고정 질문(참여목적·관심분야·사전질문)은 read-time에 안정 id를 가진 동적 질문으로 자동변환(레거시 시드)하고, 신규 행사는 동일 3질문을 기본 템플릿으로 시드한다. DB 컬럼 마이그레이션은 하지 않고 `event_form_config`(JSONB)와 `answers`(JSONB)만 사용하되, `expectation`/`interests` NOT NULL 컬럼은 레거시 답변을 미러링해 충족한다.

**Tech Stack:** TypeScript, React, Vite, Vitest, Supabase(Postgres JSONB).

참조 스펙: [docs/superpowers/specs/2026-06-01-event-dynamic-questions-design.md](../specs/2026-06-01-event-dynamic-questions-design.md)

---

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `src/lib/types.ts` | 타입 정의 | `EventQuestionType`, `EventCustomQuestion`(category/options/choice), `answers` 타입 확장 |
| `src/utils/eventApplication.ts` | 폼 config 기본값·정규화·병합·검증 순수함수 | normalize 확장, 레거시 자동변환+기본템플릿, 검증/직렬화/레거시매핑 헬퍼 추가 |
| `src/utils/eventApplication.test.ts` | 위 순수함수 단위 테스트 | 신규 생성 |
| `src/app/components/admin/EventFormConfigEditor.tsx` | 관리자 신청서 설정 UI | 고정 2·3섹션 제거 → 동적 질문 통합, choice 옵션 편집 |
| `src/app/pages/EventApplicationPage.tsx` | 사용자 신청 폼 | 동적 질문 렌더 분기(라디오/체크박스), 카테고리 헤더, 제출 매핑 |
| `src/app/components/admin/AdminEventManagement.tsx` | 관리자 신청 조회 | answers 중심 표시(배열 join) |

**레거시 안정 id (자동변환·기본템플릿 공통):**
- `legacy_expectation` — `long_text`, category `"참여 목적"`
- `legacy_interests` — `multi_choice`, category `"관심 분야"`, options = interestOptions
- `legacy_speaker` — `long_text`, category `"사전 질문"`

---

## Task 1: 타입 확장

**Files:**
- Modify: `src/lib/types.ts:124-166`

- [ ] **Step 1: `EventCustomQuestion`·`answers` 타입 확장**

`src/lib/types.ts`에서 `EventCustomQuestion` 인터페이스(141-146)를 교체하고, 바로 위에 유형 별칭을 추가한다:

```ts
export type EventQuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multi_choice';

export interface EventCustomQuestion {
  id: string;
  label: string;
  category?: string;
  type: EventQuestionType;
  options?: string[];
  required: boolean;
}
```

`EventApplication`의 `answers` 필드(161)를 교체한다:

```ts
  answers?: Record<string, string | string[]> | null;
```

- [ ] **Step 2: 타입체크로 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: PASS (기존 `question.type === "long_text"` 등 분기는 union 확장과 호환되어 에러 없음)

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(events): EventCustomQuestion에 category/options/choice 유형 추가"
```

---

## Task 2: `normalizeEventCustomQuestions` 확장

기존 normalize는 `short_text`/`long_text`만 처리하고 category·options를 버린다. choice 유형·category·options를 보존하도록 확장한다.

**Files:**
- Create: `src/utils/eventApplication.test.ts`
- Modify: `src/utils/eventApplication.ts:28-36`

- [ ] **Step 1: 실패 테스트 작성**

`src/utils/eventApplication.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { normalizeEventCustomQuestions } from "./eventApplication";

describe("normalizeEventCustomQuestions", () => {
  it("category와 options를 보존한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q1", label: "좋아하는 색", category: "취향", type: "single_choice", options: ["빨강", "파랑"], required: true },
    ]);
    expect(result[0]).toEqual({
      id: "q1",
      label: "좋아하는 색",
      category: "취향",
      type: "single_choice",
      options: ["빨강", "파랑"],
      required: true,
    });
  });

  it("multi_choice 유형을 보존한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q2", label: "관심사", type: "multi_choice", options: ["A", "B"], required: false },
    ]);
    expect(result[0].type).toBe("multi_choice");
    expect(result[0].options).toEqual(["A", "B"]);
  });

  it("알 수 없는 유형은 short_text로 폴백한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q3", label: "기타", type: "dropdown" as never, required: false },
    ]);
    expect(result[0].type).toBe("short_text");
  });

  it("choice 유형인데 options가 없으면 빈 배열로 보정한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q4", label: "선택", type: "single_choice", required: false },
    ]);
    expect(result[0].options).toEqual([]);
  });

  it("text 유형의 options는 제거한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q5", label: "주관식", type: "short_text", options: ["불필요"], required: false },
    ]);
    expect(result[0].options).toBeUndefined();
  });

  it("빈 label 질문은 제외한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q6", label: "   ", type: "short_text", required: false },
    ]);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/utils/eventApplication.test.ts`
Expected: FAIL (category/options 미보존, choice 폴백)

- [ ] **Step 3: 최소 구현**

`src/utils/eventApplication.ts`의 `normalizeEventCustomQuestions`(28-36)를 교체:

```ts
const EVENT_QUESTION_TYPES = ["short_text", "long_text", "single_choice", "multi_choice"] as const;

const isChoiceType = (type: EventCustomQuestion["type"]) =>
  type === "single_choice" || type === "multi_choice";

const normalizeQuestionType = (type: unknown): EventCustomQuestion["type"] =>
  (EVENT_QUESTION_TYPES as readonly string[]).includes(type as string)
    ? (type as EventCustomQuestion["type"])
    : "short_text";

export const normalizeEventCustomQuestions = (questions?: EventCustomQuestion[] | null): EventCustomQuestion[] =>
  (Array.isArray(questions) ? questions : [])
    .map((question, index): EventCustomQuestion => {
      const type = normalizeQuestionType(question.type);
      const base: EventCustomQuestion = {
        id: question.id || `question-${index + 1}`,
        label: question.label?.trim() || "새 질문",
        type,
        required: Boolean(question.required),
      };
      const category = question.category?.trim();
      if (category) base.category = category;
      if (isChoiceType(type)) {
        base.options = (Array.isArray(question.options) ? question.options : [])
          .map(option => option.trim())
          .filter(Boolean);
      }
      return base;
    })
    .filter(question => question.label.trim().length > 0);
```

`EventCustomQuestion` import는 파일 상단(1행)에 이미 존재한다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/utils/eventApplication.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventApplication.ts src/utils/eventApplication.test.ts
git commit -m "feat(events): normalizeEventCustomQuestions에 category/options/choice 정규화"
```

---

## Task 3: 레거시 자동변환 + 기본 템플릿 시드

기존 행사 config(customQuestions 비어있고 고정 라벨만 있음)를 동적 질문으로 변환하고, 신규 행사는 동일 3질문을 기본 템플릿으로 시드한다.

**Files:**
- Modify: `src/utils/eventApplication.ts:48-64` (`mergeEventFormConfig`)
- Modify: `src/utils/eventApplication.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`src/utils/eventApplication.test.ts`에 추가:

```ts
import { mergeEventFormConfig } from "./eventApplication";

describe("mergeEventFormConfig 레거시 자동변환", () => {
  it("customQuestions가 비면 레거시 3질문을 시드한다", () => {
    const merged = mergeEventFormConfig({
      expectationLabel: "기대하는 점은?",
      interestsLabel: "관심 주제",
      interestOptions: ["A", "B"],
      speakerQuestionLabel: "사전 질문",
      customQuestions: [],
    });
    const ids = merged.customQuestions.map(q => q.id);
    expect(ids).toEqual(["legacy_expectation", "legacy_interests", "legacy_speaker"]);
  });

  it("레거시 관심분야는 multi_choice + interestOptions로 변환한다", () => {
    const merged = mergeEventFormConfig({
      interestOptions: ["A", "B"],
      customQuestions: [],
    });
    const interests = merged.customQuestions.find(q => q.id === "legacy_interests");
    expect(interests?.type).toBe("multi_choice");
    expect(interests?.options).toEqual(["A", "B"]);
    expect(interests?.category).toBe("관심 분야");
  });

  it("레거시 참여목적/사전질문은 long_text로 변환한다", () => {
    const merged = mergeEventFormConfig({ customQuestions: [] });
    expect(merged.customQuestions.find(q => q.id === "legacy_expectation")?.type).toBe("long_text");
    expect(merged.customQuestions.find(q => q.id === "legacy_speaker")?.type).toBe("long_text");
  });

  it("customQuestions가 이미 있으면 시드하지 않는다", () => {
    const merged = mergeEventFormConfig({
      customQuestions: [{ id: "custom1", label: "내 질문", type: "short_text", required: false }],
    });
    expect(merged.customQuestions.map(q => q.id)).toEqual(["custom1"]);
  });

  it("null config면 기본 템플릿 3질문을 시드한다", () => {
    const merged = mergeEventFormConfig(null);
    expect(merged.customQuestions.map(q => q.id)).toEqual([
      "legacy_expectation",
      "legacy_interests",
      "legacy_speaker",
    ]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/utils/eventApplication.test.ts`
Expected: FAIL (customQuestions가 빈 배열로 유지됨)

- [ ] **Step 3: 최소 구현**

`src/utils/eventApplication.ts`에 시드 헬퍼를 추가하고(`mergeEventFormConfig` 위), `mergeEventFormConfig`의 `customQuestions` 처리를 교체한다.

`mergeEventFormConfig`(48행) 바로 위에 추가:

```ts
const seedLegacyQuestions = (config: Required<EventFormConfig>): EventCustomQuestion[] => [
  { id: "legacy_expectation", label: config.expectationLabel, category: "참여 목적", type: "long_text", required: true },
  { id: "legacy_interests", label: config.interestsLabel, category: "관심 분야", type: "multi_choice", options: config.interestOptions, required: true },
  { id: "legacy_speaker", label: config.speakerQuestionLabel, category: "사전 질문", type: "long_text", required: false },
];
```

`mergeEventFormConfig`(48-64)를 교체:

```ts
export const mergeEventFormConfig = (config?: EventFormConfig | null): Required<EventFormConfig> => {
  const base = {
    ...DEFAULT_EVENT_FORM_CONFIG,
    ...(config ?? {}),
    interestOptions:
      config?.interestOptions && config.interestOptions.length > 0
        ? config.interestOptions
        : DEFAULT_EVENT_FORM_CONFIG.interestOptions,
  };

  const normalized = normalizeEventCustomQuestions(config?.customQuestions);
  const customQuestions = normalized.length > 0 ? normalized : normalizeEventCustomQuestions(seedLegacyQuestions(base));

  const merged = { ...base, customQuestions };

  return {
    ...merged,
    completionTitle: normalizeCompletionTitle(merged.completionTitle),
    completionMessage: normalizeCompletionMessage(merged.completionMessage),
  };
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/utils/eventApplication.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: 회귀 확인 — cleanEventFormConfig**

`cleanEventFormConfig`(66-87)는 `mergeEventFormConfig`를 호출하므로 이제 시드된 질문을 저장하게 된다. 이는 의도된 동작(편집 시작 시 기본 3질문 노출). 별도 변경 불필요.

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/utils/eventApplication.ts src/utils/eventApplication.test.ts
git commit -m "feat(events): 레거시 고정 질문 자동변환 + 기본 템플릿 시드"
```

---

## Task 4: 검증·직렬화·레거시 컬럼 매핑 헬퍼

폼 제출 시 필요한 순수함수 3종을 추가한다: choice 포함 필수검증, answers 직렬화, NOT NULL 컬럼 미러링.

**Files:**
- Modify: `src/utils/eventApplication.ts` (말미에 추가)
- Modify: `src/utils/eventApplication.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`src/utils/eventApplication.test.ts`에 추가:

```ts
import {
  findMissingRequiredAnswer,
  serializeEventAnswers,
  mapLegacyAnswerColumns,
} from "./eventApplication";

const Q = {
  text: { id: "t1", label: "주관식", type: "short_text" as const, required: true },
  single: { id: "s1", label: "단일", type: "single_choice" as const, options: ["A", "B"], required: true },
  multi: { id: "m1", label: "복수", type: "multi_choice" as const, options: ["X", "Y"], required: true },
  optional: { id: "o1", label: "선택", type: "short_text" as const, required: false },
};

describe("findMissingRequiredAnswer", () => {
  it("필수 주관식이 비면 해당 질문을 반환한다", () => {
    expect(findMissingRequiredAnswer([Q.text], { t1: "  " })?.id).toBe("t1");
  });
  it("필수 복수선택이 빈 배열이면 반환한다", () => {
    expect(findMissingRequiredAnswer([Q.multi], { m1: [] })?.id).toBe("m1");
  });
  it("모든 필수 답변이 차면 null을 반환한다", () => {
    expect(findMissingRequiredAnswer([Q.text, Q.single, Q.multi], { t1: "답", s1: "A", m1: ["X"] })).toBeNull();
  });
  it("선택(비필수) 질문은 비어도 무시한다", () => {
    expect(findMissingRequiredAnswer([Q.optional], {})).toBeNull();
  });
});

describe("serializeEventAnswers", () => {
  it("빈 답변은 제외하고 multi 배열은 보존한다", () => {
    const answers = serializeEventAnswers([Q.text, Q.multi, Q.optional], { t1: "답", m1: ["X", "Y"], o1: "  " });
    expect(answers).toEqual({ t1: "답", m1: ["X", "Y"] });
  });
  it("빈 multi 배열은 제외한다", () => {
    expect(serializeEventAnswers([Q.multi], { m1: [] })).toEqual({});
  });
});

describe("mapLegacyAnswerColumns", () => {
  it("레거시 답변을 NOT NULL 컬럼 값으로 매핑한다", () => {
    const cols = mapLegacyAnswerColumns({
      legacy_expectation: "기대",
      legacy_interests: ["A", "B"],
      legacy_speaker: "질문",
    });
    expect(cols).toEqual({ expectation: "기대", interests: ["A", "B"], speaker_question: "질문" });
  });
  it("레거시 답변이 없으면 NOT NULL 기본값으로 채운다", () => {
    expect(mapLegacyAnswerColumns({})).toEqual({ expectation: "", interests: [], speaker_question: null });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/utils/eventApplication.test.ts`
Expected: FAIL ("findMissingRequiredAnswer is not exported" 등)

- [ ] **Step 3: 최소 구현**

`src/utils/eventApplication.ts` 말미(파일 끝)에 추가:

```ts
type AnswerMap = Record<string, string | string[]>;

const isAnswered = (value: string | string[] | undefined): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());

export const findMissingRequiredAnswer = (
  questions: EventCustomQuestion[],
  answers: AnswerMap,
): EventCustomQuestion | null =>
  questions.find(question => question.required && !isAnswered(answers[question.id])) ?? null;

export const serializeEventAnswers = (
  questions: EventCustomQuestion[],
  answers: AnswerMap,
): Record<string, string | string[]> =>
  questions.reduce<Record<string, string | string[]>>((acc, question) => {
    const value = answers[question.id];
    if (Array.isArray(value)) {
      if (value.length > 0) acc[question.id] = value;
    } else if (value?.trim()) {
      acc[question.id] = value.trim();
    }
    return acc;
  }, {});

export const mapLegacyAnswerColumns = (answers: AnswerMap) => {
  const expectation = answers.legacy_expectation;
  const interests = answers.legacy_interests;
  const speaker = answers.legacy_speaker;
  return {
    expectation: typeof expectation === "string" ? expectation.trim() : "",
    interests: Array.isArray(interests) ? interests : [],
    speaker_question: typeof speaker === "string" && speaker.trim() ? speaker.trim() : null,
  };
};
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/utils/eventApplication.test.ts`
Expected: PASS (19 tests 누계)

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventApplication.ts src/utils/eventApplication.test.ts
git commit -m "feat(events): 필수검증/answers직렬화/레거시컬럼매핑 헬퍼 추가"
```

---

## Task 5: 관리자 에디터 — 동적 질문 통합 UI

`EventFormConfigEditor`에서 고정 "2·3섹션"을 제거하고, 추가 질문 카드에 카테고리 입력·4종 유형·choice 옵션 편집을 넣는다.

**Files:**
- Modify: `src/app/components/admin/EventFormConfigEditor.tsx`

- [ ] **Step 1: 질문 옵션 편집 핸들러 추가**

`EventFormConfigEditor` 함수 내 `updateQuestion`(26-32) 아래에 추가:

```ts
  const updateQuestionOption = (id: string, optionIndex: number, value: string) => {
    const question = config.customQuestions.find(q => q.id === id);
    if (!question) return;
    const options = (question.options ?? []).map((opt, i) => (i === optionIndex ? value : opt));
    updateQuestion(id, { options });
  };

  const addQuestionOption = (id: string) => {
    const question = config.customQuestions.find(q => q.id === id);
    if (!question) return;
    updateQuestion(id, { options: [...(question.options ?? []), "새 선택지"] });
  };

  const removeQuestionOption = (id: string, optionIndex: number) => {
    const question = config.customQuestions.find(q => q.id === id);
    if (!question) return;
    updateQuestion(id, { options: (question.options ?? []).filter((_, i) => i !== optionIndex) });
  };
```

- [ ] **Step 2: 고정 2·3섹션 제거**

`src/app/components/admin/EventFormConfigEditor.tsx`의 "2. 관심 분야 & 참여 목적" 블록(149-171)과 "3. 사전 질문" 블록(173-176)을 **삭제**한다. 이 라벨들은 이제 레거시 자동변환이 동적 질문으로 노출하므로 별도 고정 편집 UI가 불필요하다.

`updateInterestOption`/`addInterestOption`/`removeInterestOption`(44-56)도 더는 쓰이지 않으면 삭제한다.

- [ ] **Step 3: 추가 질문 카드에 카테고리·유형·옵션 편집 반영**

"4. 추가 질문" 블록(178-206)에서 질문 카드 내부(185-200 `<div style={{ position: "relative" ...}}>` 영역)를 아래로 교체한다. 카드 제목 "4. 추가 질문"은 "질문"으로 바꾼다(고정 섹션이 사라졌으므로 번호 무의미):

```tsx
      <div style={groupStyle}>
        <p style={titleStyle}>질문</p>
        <p style={{ margin: "-4px 0 4px", color: "var(--color-text-muted)", fontSize: 12 }}>
          카테고리·유형을 자유롭게 편집하세요. 같은 카테고리는 신청서에서 하나의 묶음으로 표시됩니다.
        </p>
        <button type="button" aria-label="첫 번째 질문 추가" onClick={() => insertQuestion(0)} style={{ ...addButtonStyle, alignSelf: "center" }}>
          <Plus size={17} />
        </button>
        {config.customQuestions.map((question, index) => (
          <div key={question.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative", padding: "14px 46px 14px 14px", borderRadius: 12, border: "1px solid var(--color-border-soft)", background: "var(--color-field-bg)", display: "grid", gap: 10 }}>
              <button type="button" aria-label="질문 삭제" onClick={() => removeQuestion(question.id)} style={{ ...deleteButtonStyle, position: "absolute", top: 10, right: 10 }}>
                <X size={15} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
                <input style={inputStyle} value={question.category ?? ""} onChange={event => updateQuestion(question.id, { category: event.currentTarget.value })} placeholder="카테고리 (예: 참여 목적)" />
                <select style={inputStyle} value={question.type} onChange={event => updateQuestion(question.id, { type: event.currentTarget.value as EventCustomQuestion["type"] })}>
                  <option value="short_text">짧은 답변</option>
                  <option value="long_text">긴 답변</option>
                  <option value="single_choice">단일 선택</option>
                  <option value="multi_choice">복수 선택</option>
                </select>
              </div>
              <input style={inputStyle} value={question.label} onChange={event => updateQuestion(question.id, { label: event.currentTarget.value })} placeholder="질문 문구" />
              {(question.type === "single_choice" || question.type === "multi_choice") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(question.options ?? []).map((option, optionIndex) => (
                    <div key={optionIndex} style={rowStyle}>
                      <input
                        style={{ ...inputStyle, flex: 1, padding: "8px 10px" }}
                        value={option}
                        onChange={event => updateQuestionOption(question.id, optionIndex, event.currentTarget.value)}
                        placeholder="선택지 이름"
                      />
                      <button type="button" aria-label="선택지 삭제" onClick={() => removeQuestionOption(question.id, optionIndex)} style={deleteButtonStyle}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  <button type="button" aria-label="선택지 추가" onClick={() => addQuestionOption(question.id)} style={{ ...addButtonStyle, alignSelf: "center" }}>
                    <Plus size={17} />
                  </button>
                </div>
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-primary)", fontSize: 13, fontWeight: 700 }}>
                <input type="checkbox" checked={question.required} onChange={event => updateQuestion(question.id, { required: event.currentTarget.checked })} />
                필수 질문
              </label>
            </div>
            <button type="button" aria-label={`${index + 2}번째 질문 추가`} onClick={() => insertQuestion(index + 1)} style={{ ...addButtonStyle, alignSelf: "center" }}>
              <Plus size={17} />
            </button>
          </div>
        ))}
      </div>
```

이후 섹션 번호 "5. 개인정보 동의 및 완료 안내"(209)는 "개인정보 동의 및 완료 안내"로 바꾼다.

- [ ] **Step 4: 타입체크·린트**

Run: `npx tsc --noEmit && npx eslint src/app/components/admin/EventFormConfigEditor.tsx`
Expected: PASS (미사용 import/함수 없음 — `updateInterestOption` 등 제거 확인)

- [ ] **Step 5: Commit**

```bash
git add src/app/components/admin/EventFormConfigEditor.tsx
git commit -m "feat(events): 신청서 에디터 동적 질문 통합 + 선택형 옵션 편집"
```

---

## Task 6: 사용자 신청 폼 — 선택형 렌더 + 카테고리 헤더 + 제출 매핑

`EventApplicationPage`에서 고정 2·3섹션을 제거하고, 동적 질문을 유형별로 렌더하며, 제출 시 헬퍼로 검증·직렬화·컬럼매핑한다.

**Files:**
- Modify: `src/app/pages/EventApplicationPage.tsx`

- [ ] **Step 1: FormState·답변 핸들러를 동적 answers 중심으로 정리**

`FormState`(24-35)에서 `expectation`/`interests`/`speaker_question`을 제거하고 `custom_answers` 타입을 확장한다:

```ts
type FormState = {
  company_tech: string;
  applicant_name: string;
  position: string;
  email: string;
  phone: string;
  custom_answers: Record<string, string | string[]>;
  privacy_consent: boolean;
};
```

`EMPTY_FORM`(37-48)에서도 동일 필드 제거:

```ts
const EMPTY_FORM: FormState = {
  company_tech: "",
  applicant_name: "",
  position: "",
  email: "",
  phone: "",
  custom_answers: {},
  privacy_consent: false,
};
```

`toggleInterest`(153-160)를 삭제하고, choice 토글용 핸들러로 교체한다. `updateCustomAnswer`(162-163)는 값 타입을 넓힌다:

```ts
  const updateCustomAnswer = (questionId: string, value: string | string[]) =>
    setForm(prev => ({ ...prev, custom_answers: { ...prev.custom_answers, [questionId]: value } }));

  const toggleChoiceAnswer = (questionId: string, option: string) =>
    setForm(prev => {
      const current = prev.custom_answers[questionId];
      const list = Array.isArray(current) ? current : [];
      const next = list.includes(option) ? list.filter(item => item !== option) : [...list, option];
      return { ...prev, custom_answers: { ...prev.custom_answers, [questionId]: next } };
    });
```

- [ ] **Step 2: 제출 핸들러를 헬퍼 기반으로 교체**

import 라인(15)에 헬퍼를 추가한다:

```ts
import { EVENT_STATUS_CONFIG, findMissingRequiredAnswer, getEffectiveEventStatus, getEventRemaining, isEventApplicationOpen, mapLegacyAnswerColumns, mergeEventFormConfig, serializeEventAnswers } from "../../utils/eventApplication";
```

`handleSubmit`(165-212)의 검증·INSERT 부분을 교체한다(기본정보 검증은 유지, 고정 expectation/interests 검증은 제거):

```ts
  const handleSubmit = async () => {
    if (!post) return;
    if (!isApplicationOpen) return alert(effectiveEventStatus === "접수예정" ? "아직 접수 시작 전입니다." : "마감된 행사입니다.");
    if (!form.company_tech.trim() || !form.applicant_name.trim() || !form.position.trim() || !form.email.trim()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    const missingQuestion = findMissingRequiredAnswer(config.customQuestions, form.custom_answers);
    if (missingQuestion) return alert(`필수 질문에 답변해주세요: ${missingQuestion.label}`);
    if (!form.privacy_consent) return alert("개인정보 수집 및 이용에 동의해주세요.");

    const answers = serializeEventAnswers(config.customQuestions, form.custom_answers);
    const legacyColumns = mapLegacyAnswerColumns(answers);

    setSubmitting(true);
    const { data, error } = await supabase
      .from("event_applications")
      .insert({
        post_id: post.id,
        user_id: userId,
        status: "accepted",
        company_tech: form.company_tech.trim(),
        applicant_name: form.applicant_name.trim(),
        position: form.position.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        ...legacyColumns,
        answers,
        privacy_consent: form.privacy_consent,
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      alert(error.code === "23505" ? "이미 신청한 행사입니다." : "신청 실패: " + error.message);
      return;
    }
    setApplication(data as EventApplication);
    setAcceptedCount(prev => prev + 1);
    setSaved(true);
  };
```

- [ ] **Step 3: 고정 2·3섹션 삭제 + 동적 질문 렌더 교체**

폼 본문에서 "2. 관심 분야 & 참여 목적" 블록(349-361)과 "3. 사전 질문" 블록(363-366)을 **삭제**한다.

동적 질문 루프(368-377)를 카테고리 헤더 + 유형 분기로 교체한다:

```tsx
                  {config.customQuestions.map((question, index) => {
                    const showCategory = !!question.category && question.category !== config.customQuestions[index - 1]?.category;
                    const value = form.custom_answers[question.id];
                    const selected = Array.isArray(value) ? value : [];
                    return (
                      <div key={question.id} style={formCardStyle}>
                        {showCategory && <strong style={{ color: "var(--color-text-primary)" }}>{question.category}</strong>}
                        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-event-application-label)", fontWeight: "var(--weight-bold)" }}>
                          {question.label}{question.required ? " *" : ""}
                        </p>
                        {question.type === "long_text" && (
                          <textarea style={textareaStyle("var(--size-event-application-textarea-lg)")} value={typeof value === "string" ? value : ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                        )}
                        {question.type === "short_text" && (
                          <input style={input} value={typeof value === "string" ? value : ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                        )}
                        {question.type === "single_choice" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                            {(question.options ?? []).map(option => (
                              <label key={option} style={{ display: "flex", gap: "var(--space-event-application-compact-inline)", alignItems: "center", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-body)" }}>
                                <input type="radio" name={question.id} checked={typeof value === "string" && value === option} onChange={() => updateCustomAnswer(question.id, option)} />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                        {question.type === "multi_choice" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                            {(question.options ?? []).map(option => (
                              <label key={option} style={{ display: "flex", gap: "var(--space-event-application-compact-inline)", alignItems: "center", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-body)" }}>
                                <input type="checkbox" checked={selected.includes(option)} onChange={() => toggleChoiceAnswer(question.id, option)} />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
```

- [ ] **Step 4: 프로필 prefill 정리**

init 효과의 프로필 prefill(135-141)은 기본정보 4필드만 채우므로 변경 불필요. `updateField`의 `string[]` 분기는 더 이상 안 쓰이면 시그니처를 `string | boolean`으로 좁힌다(150-151). 미사용 경고 시에만 조정.

- [ ] **Step 5: 타입체크·린트**

Run: `npx tsc --noEmit && npx eslint src/app/pages/EventApplicationPage.tsx`
Expected: PASS (미사용 `toggleInterest`/`requiredLabel` 잔여 없음 — `requiredLabel`은 기본정보·동의문구에서 여전히 사용되므로 유지)

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/EventApplicationPage.tsx
git commit -m "feat(events): 신청 폼 선택형 렌더 + 카테고리 헤더 + answers 제출"
```

---

## Task 7: 관리자 조회 — answers 중심 표시

`AdminEventManagement`의 신청 카드에서 배열 답변을 join하고, 고정 표시(관심분야/기대/사전질문)는 동적 answers 루프로 통일한다.

**Files:**
- Modify: `src/app/components/admin/AdminEventManagement.tsx:231-272`

- [ ] **Step 1: 고정 expectation/interests/speaker 표시 블록 제거**

`231-272`의 표시 영역에서 "관심 분야"(237-240), "기대하는 부분"(243-246), "사전 질문"(247-250) 블록을 제거하고, 직책 블록만 남긴다. 추가 질문 답변 루프(252-271)에서 배열 join을 적용한다. 교체본:

```tsx
        <div style={{ color: textMain, background: labelBg, border: `1px solid ${labelBorder}`, padding: "12px 16px", borderRadius: 10, display: "grid", gap: 10 }}>
          <div>
            <strong style={{ fontSize: 12 }}>직책</strong>
            <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{application.position || "없음"}</p>
          </div>
          {(eventConfig.customQuestions.length > 0 || unknownAnswers.length > 0) && (
            <div style={{ display: "grid", gap: 8 }}>
              {eventConfig.customQuestions.map(question => {
                const answer = answers[question.id];
                const text = Array.isArray(answer) ? answer.join(", ") : answer;
                return (
                  <div key={question.id}>
                    <strong style={{ fontSize: 12 }}>{question.category ? `${question.category} · ` : ""}{question.label}</strong>
                    <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{text || "응답 없음"}</p>
                  </div>
                );
              })}
              {unknownAnswers.map(([questionId, answer]) => (
                <div key={questionId}>
                  <strong style={{ fontSize: 12 }}>삭제된 질문</strong>
                  <p style={{ margin: "5px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{Array.isArray(answer) ? answer.join(", ") : String(answer)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
```

`unknownAnswers`(210)의 `String(answer).trim()` 필터는 배열도 안전하게 처리하므로 유지한다.

- [ ] **Step 2: 타입체크·린트**

Run: `npx tsc --noEmit && npx eslint src/app/components/admin/AdminEventManagement.tsx`
Expected: PASS (미사용 `textMain` 등 없음 확인 — 직책 블록·헤더에서 여전히 사용)

- [ ] **Step 3: Commit**

```bash
git add src/app/components/admin/AdminEventManagement.tsx
git commit -m "feat(events): 신청 조회 answers 중심 표시 + 배열 답변 join"
```

---

## Task 8: 전체 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 유닛 테스트**

Run: `npx vitest run`
Expected: PASS (eventApplication 19 + 기존 adminGate 43)

- [ ] **Step 2: 프로젝트 표준 검증**

Run: `npm run validate`
Expected: PASS (tsc, eslint, vitest, vite build, frontend secret scan)

- [ ] **Step 3: 수동 스모크 (로컬)**

`admin@test.com / Ncf2026!!`로 로그인 후:
1. `/admin` → 행사 생성/편집 → 신청서 설정에 질문 카드(카테고리·4종 유형) 노출, 단일/복수 선택 옵션 편집 확인.
2. 행사 신청 페이지 → 기본정보 고정 + 동적 질문(라디오/체크박스/주관식) 렌더, 카테고리 헤더 확인, 제출 성공.
3. `/admin` 행사 관리 → 신청 카드에서 배열 답변 쉼표 표시 확인.

- [ ] **Step 4: Codex 리뷰 (프로젝트 규칙)**

코드 변경 완료 후 Codex 플러그인으로 리뷰 실행. FAIL 0 확인 후에만 PLAN/RESULT 갱신.

---

## Self-Review 결과

- **스펙 커버리지:** 데이터모델(T1), 자동변환(T3), 에디터 UI(T5), 폼 렌더(T6), 조회(T7), 검증/직렬화(T4), 테스트(T2~T4) — 스펙 7개 섹션 모두 매핑됨.
- **NOT NULL 제약:** 스펙에 없던 `expectation`/`interests` NOT NULL 컬럼 처리를 `mapLegacyAnswerColumns`(T4)로 보강 — DB 마이그 없이 충족.
- **타입 일관성:** `findMissingRequiredAnswer`/`serializeEventAnswers`/`mapLegacyAnswerColumns` 시그니처가 T4 정의와 T6 호출에서 일치. `custom_answers: Record<string, string|string[]>`가 T1 answers 타입과 정렬됨.
- **레거시 id:** `legacy_expectation`/`legacy_interests`/`legacy_speaker`가 T3 시드와 T4 컬럼매핑에서 동일 사용.
