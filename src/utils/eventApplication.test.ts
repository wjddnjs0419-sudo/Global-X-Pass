import { describe, expect, it } from "vitest";
import { normalizeEventCustomQuestions, mergeEventFormConfig } from "./eventApplication";

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

  it("long_text 유형의 options도 제거한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q7", label: "긴 답변", type: "long_text", options: ["불필요"], required: false },
    ]);
    expect(result[0].type).toBe("long_text");
    expect(result[0].options).toBeUndefined();
  });

  it("빈 label 질문은 제외한다", () => {
    const result = normalizeEventCustomQuestions([
      { id: "q6", label: "   ", type: "short_text", required: false },
    ]);
    expect(result).toHaveLength(0);
  });
});

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
