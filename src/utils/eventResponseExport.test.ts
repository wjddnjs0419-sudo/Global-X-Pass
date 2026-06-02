import { describe, expect, it } from "vitest";
import { toCsv, buildResponseRows, summarizeChoiceQuestions } from "./eventResponseExport";
import type { EventApplication, EventCustomQuestion } from "../lib/types";

// ─── Fixture helpers ────────────────────────────────────────────────────────

const makeApp = (overrides: Partial<EventApplication> = {}): EventApplication => ({
  id: "app-1",
  post_id: "post-1",
  user_id: "user-1",
  company_tech: "테스트 주식회사",
  applicant_name: "홍길동",
  position: "대표",
  email: "hong@test.com",
  phone: "010-1234-5678",
  expectation: "많이 배우고 싶습니다",
  interests: ["AI", "웹"],
  speaker_question: null,
  privacy_consent: true,
  answers: null,
  status: "pending",
  admin_note: null,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
  ...overrides,
});

const Q_SHORT: EventCustomQuestion = { id: "q1", label: "한마디", type: "short_text", required: false };
const Q_SINGLE: EventCustomQuestion = {
  id: "q2",
  label: "직군",
  type: "single_choice",
  options: ["개발", "기획", "디자인"],
  required: true,
};
const Q_MULTI: EventCustomQuestion = {
  id: "q3",
  label: "관심분야",
  type: "multi_choice",
  options: ["AI", "웹", "앱"],
  required: false,
};

// ─── toCsv ──────────────────────────────────────────────────────────────────

describe("toCsv", () => {
  it("UTF-8 BOM(\\uFEFF)이 첫 바이트에 붙는다", () => {
    const result = toCsv(["a"], [["1"]]);
    expect(result.charCodeAt(0)).toBe(0xfeff);
  });

  it("헤더와 행이 CRLF로 구분된다", () => {
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe("﻿a,b\r\n1,2");
  });

  it("쉼표·큰따옴표·줄바꿈이 포함된 셀은 큰따옴표로 감싸고 내부 큰따옴표는 두 번 이스케이프한다", () => {
    expect(toCsv(["x"], [['a,b'], ['he said "hi"'], ["line1\nline2"]])).toBe(
      '﻿x\r\n"a,b"\r\n"he said ""hi"""\r\n"line1\nline2"',
    );
  });

  it("빈 셀과 일반 셀은 따옴표 없이 그대로 출력한다", () => {
    expect(toCsv(["a", "b"], [["", "plain"]])).toBe("﻿a,b\r\n,plain");
  });
});

// ─── buildResponseRows ───────────────────────────────────────────────────────

describe("buildResponseRows", () => {
  it("헤더에 고정 컬럼 8개와 동적 질문 label이 포함된다", () => {
    const { headers } = buildResponseRows([makeApp()], [Q_SHORT]);
    expect(headers).toEqual([
      "순번", "상태", "신청일", "이름", "회사", "직책", "이메일", "연락처",
      Q_SHORT.label,
    ]);
  });

  it("status가 한글 label로 변환되고 multi_choice 답변은 쉼표+공백으로 join된다", () => {
    const app = makeApp({
      status: "accepted",
      answers: { [Q_MULTI.id]: ["AI", "웹"] },
    });
    const { rows } = buildResponseRows([app], [Q_MULTI]);
    expect(rows[0][1]).toBe("확정");
    expect(rows[0][8]).toBe("AI, 웹");
  });

  it("created_at 오름차순으로 정렬되어 순번이 매겨진다(최신→구 순으로 넘겨도 1=구 앱)", () => {
    const older = makeApp({ id: "old", created_at: "2026-01-01T08:00:00Z" });
    const newer = makeApp({ id: "new", created_at: "2026-01-02T08:00:00Z" });
    // 최신이 먼저인 배열로 전달
    const { rows } = buildResponseRows([newer, older], []);
    expect(rows[0][0]).toBe("1");
    expect(rows[1][0]).toBe("2");
    // rows[0]이 older 앱이어야 한다(이름으로 확인)
    expect(rows[0][3]).toBe(older.applicant_name);
  });

  it("answers가 null이어도 레거시 컬럼(expectation/interests)으로 폴백한다", () => {
    const app = makeApp({
      answers: null,
      expectation: "기대합니다",
      interests: ["AI", "앱"],
    });
    const legacyExpectQ: EventCustomQuestion = { id: "legacy_expectation", label: "기대", type: "long_text", required: true };
    const legacyInterestsQ: EventCustomQuestion = {
      id: "legacy_interests",
      label: "관심분야",
      type: "multi_choice",
      options: ["AI", "앱"],
      required: true,
    };
    const { rows } = buildResponseRows([app], [legacyExpectQ, legacyInterestsQ]);
    expect(rows[0][8]).toBe("기대합니다");
    expect(rows[0][9]).toBe("AI, 앱");
  });

  it("answers에 해당 질문 답변이 없고 레거시 폴백도 없으면 빈 문자열을 반환한다", () => {
    const app = makeApp({ answers: {} });
    const { rows } = buildResponseRows([app], [Q_SHORT]);
    expect(rows[0][8]).toBe("");
  });

  it("phone이 null이면 빈 문자열로 출력한다", () => {
    const app = makeApp({ phone: null });
    const { rows } = buildResponseRows([app], []);
    expect(rows[0][7]).toBe("");
  });

  it("legacy_speaker가 null이면 빈 문자열로 폴백한다", () => {
    const legacySpeakerQ: EventCustomQuestion = { id: "legacy_speaker", label: "사전질문", type: "long_text", required: false };
    const { rows } = buildResponseRows(
      [makeApp({ answers: {}, speaker_question: null })],
      [legacySpeakerQ],
    );
    expect(rows[0][8]).toBe("");
  });
});

// ─── summarizeChoiceQuestions ────────────────────────────────────────────────

describe("summarizeChoiceQuestions", () => {
  it("single_choice/multi_choice 외 질문은 결과에서 제외된다", () => {
    const result = summarizeChoiceQuestions([makeApp()], [Q_SHORT]);
    expect(result).toHaveLength(0);
  });

  it("single_choice 각 선택지 카운트가 집계되고 total은 전체 신청 수다", () => {
    const apps = [
      makeApp({ answers: { [Q_SINGLE.id]: "개발" } }),
      makeApp({ answers: { [Q_SINGLE.id]: "개발" } }),
      makeApp({ answers: { [Q_SINGLE.id]: "기획" } }),
    ];
    const [summary] = summarizeChoiceQuestions(apps, [Q_SINGLE]);
    expect(summary.id).toBe(Q_SINGLE.id);
    expect(summary.label).toBe(Q_SINGLE.label);
    expect(summary.total).toBe(3);
    expect(summary.counts).toEqual({ 개발: 2, 기획: 1, 디자인: 0 });
  });

  it("multi_choice는 각 선택지별로 개별 집계하고 미선택 옵션은 0이다", () => {
    const apps = [
      makeApp({ answers: { [Q_MULTI.id]: ["AI", "웹"] } }),
      makeApp({ answers: { [Q_MULTI.id]: ["AI"] } }),
    ];
    const [summary] = summarizeChoiceQuestions(apps, [Q_MULTI]);
    expect(summary.total).toBe(2);
    expect(summary.counts).toEqual({ AI: 2, 웹: 1, 앱: 0 });
  });

  it("answers가 없는 신청은 0으로 집계에 포함되어 total에는 반영된다", () => {
    const apps = [
      makeApp({ answers: { [Q_SINGLE.id]: "개발" } }),
      makeApp({ answers: null }),
    ];
    const [summary] = summarizeChoiceQuestions(apps, [Q_SINGLE]);
    expect(summary.total).toBe(2);
    expect(summary.counts["개발"]).toBe(1);
  });
});
