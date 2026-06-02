import { EVENT_APPLICATION_STATUS, isAnswered } from "./eventApplication";
import type { EventApplication, EventCustomQuestion } from "../lib/types";

// ─── toCsv ──────────────────────────────────────────────────────────────────

const escapeCsvCell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * 주어진 헤더와 행 배열을 UTF-8 BOM이 붙은 CSV 문자열로 변환한다.
 * 엑셀에서 한글이 깨지지 않도록 BOM(U+FEFF)을 prepend한다.
 */
export const toCsv = (headers: string[], rows: string[][]): string => {
  const lines = [headers, ...rows].map(cells => cells.map(escapeCsvCell).join(","));
  return "﻿" + lines.join("\r\n");
};

// ─── buildResponseRows ───────────────────────────────────────────────────────

const LEGACY_FALLBACK: Record<string, (app: EventApplication) => string | string[] | null | undefined> = {
  legacy_expectation: app => app.expectation,
  legacy_interests: app => app.interests,
  legacy_speaker: app => app.speaker_question,
};

const resolveAnswerText = (app: EventApplication, question: EventCustomQuestion): string => {
  const answer = (app.answers ?? {})[question.id];
  const hasAnswer = isAnswered(answer);
  const resolved = hasAnswer ? answer : LEGACY_FALLBACK[question.id]?.(app);
  if (Array.isArray(resolved)) return resolved.join(", ");
  return resolved?.trim() ? resolved : "";
};

/**
 * EventApplication 배열과 동적 질문 목록을 받아 CSV용 헤더·행 배열을 반환한다.
 * - created_at 오름차순으로 정렬하고 1부터 순번을 부여한다.
 * - 상태는 EVENT_APPLICATION_STATUS 한글 label로 변환한다.
 * - 동적 질문 답변은 answers[q.id] 우선, 없으면 레거시 컬럼으로 폴백한다.
 */
export const buildResponseRows = (
  applications: EventApplication[],
  questions: EventCustomQuestion[],
): { headers: string[]; rows: string[][] } => {
  const headers = [
    "순번", "상태", "신청일", "이름", "회사", "직책", "이메일", "연락처",
    ...questions.map(q => q.label),
  ];

  const sorted = [...applications].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const rows = sorted.map((app, index) => [
    String(index + 1),
    EVENT_APPLICATION_STATUS[app.status]?.label ?? app.status,
    new Date(app.created_at).toLocaleDateString("ko-KR"),
    app.applicant_name,
    app.company_tech,
    app.position,
    app.email,
    app.phone ?? "",
    ...questions.map(q => resolveAnswerText(app, q)),
  ]);

  return { headers, rows };
};

// ─── summarizeChoiceQuestions ────────────────────────────────────────────────

export interface ChoiceSummary {
  id: string;
  label: string;
  total: number;
  counts: Record<string, number>;
}

/**
 * single_choice/multi_choice 질문에 대해 선택지별 응답 수를 집계한다.
 * - 다른 유형의 질문은 결과에서 제외한다.
 * - total은 전체 신청 수(미응답 포함)를 나타낸다.
 * - 정의되지 않은 선택지가 선택된 경우에도 counts에 포함한다.
 */
export const summarizeChoiceQuestions = (
  applications: EventApplication[],
  questions: EventCustomQuestion[],
): ChoiceSummary[] =>
  questions
    .filter(q => q.type === "single_choice" || q.type === "multi_choice")
    .map(q => {
      const counts: Record<string, number> = {};
      (q.options ?? []).forEach(option => {
        counts[option] = 0;
      });

      applications.forEach(app => {
        const answer = (app.answers ?? {})[q.id];
        const selected = Array.isArray(answer) ? answer : answer?.trim() ? [answer] : [];
        selected.forEach(option => {
          if (option in counts) counts[option] += 1;
          else counts[option] = 1;
        });
      });

      return { id: q.id, label: q.label, total: applications.length, counts };
    });
