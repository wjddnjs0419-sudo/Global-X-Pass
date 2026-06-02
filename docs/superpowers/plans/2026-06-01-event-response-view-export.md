# 행사 신청 응답 시트 + CSV 다운로드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 행사 관리에 "응답" 서브탭을 추가해 단일 행사의 신청 데이터를 표(응답 시트)+요약 통계로 조회하고 CSV로 내려받게 한다.

**Architecture:** 순수 변환 로직(`eventResponseExport.ts`)을 UI와 분리해 TDD로 작성하고, 표·요약·다운로드는 동일 함수 결과를 사용한다. 신규 컴포넌트 `EventResponsesView.tsx`가 렌더를 담당하고 `AdminEventManagement`는 데이터만 전달한다. DB 변경 0.

**Tech Stack:** React + TypeScript, Vitest, 기존 Supabase 조회 데이터 재사용, 브라우저 Blob/anchor 다운로드.

**프로젝트 git 규약:** 이 저장소는 amend-전용·미커밋 유지 워크플로우다. 각 태스크에 별도 커밋을 만들지 않는다. 모든 태스크 완료 후 마지막에 `npm run validate` + Codex 리뷰 FAIL 0 확인 후 사용자 승인하에만 커밋한다.

**스펙:** `docs/superpowers/specs/2026-06-01-event-response-view-export-design.md`

---

## File Structure

- **Create** `src/utils/eventResponseExport.ts` — 순수함수 3개(`buildResponseRows`, `toCsv`, `summarizeChoiceQuestions`). UI 무관.
- **Create** `src/utils/eventResponseExport.test.ts` — 위 3함수 Vitest.
- **Create** `src/app/components/admin/EventResponsesView.tsx` — 요약 통계 + 표 + CSV 다운로드 버튼. 단일 행사 신청 목록을 props로 받음.
- **Modify** `src/app/components/admin/AdminEventManagement.tsx` — 서브탭 `"responses"` 추가, 선택 행사·신청 목록을 `EventResponsesView`에 전달.

참고(읽기): `src/utils/eventApplication.ts`(`EVENT_APPLICATION_STATUS`, `mergeEventFormConfig`), `src/lib/types.ts`(`EventApplication`, `EventFormConfig`, `EventCustomQuestion`).

---

## Task 1: `toCsv` 순수함수 (CSV 직렬화 + BOM + 이스케이프)

**Files:**
- Create: `src/utils/eventResponseExport.ts`
- Test: `src/utils/eventResponseExport.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/utils/eventResponseExport.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { toCsv } from "./eventResponseExport";

describe("toCsv", () => {
  it("UTF-8 BOM을 선두에 붙인다", () => {
    const csv = toCsv(["a"], [["1"]]);
    expect(csv.startsWith("﻿")).toBe(true);
  });
  it("헤더와 행을 CRLF로 구분한다", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);
    expect(csv).toBe("﻿a,b\r\n1,2");
  });
  it("쉼표/따옴표/줄바꿈이 있으면 따옴표로 감싸고 내부 따옴표는 두 개로 이스케이프한다", () => {
    const csv = toCsv(["x"], [['a,b'], ['he said "hi"'], ["line1\nline2"]]);
    expect(csv).toBe('﻿x\r\n"a,b"\r\n"he said ""hi"""\r\n"line1\nline2"');
  });
  it("빈 값과 일반 값은 따옴표 없이 그대로 둔다", () => {
    const csv = toCsv(["a", "b"], [["", "plain"]]);
    expect(csv).toBe("﻿a,b\r\n,plain");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/utils/eventResponseExport.test.ts`
Expected: FAIL — "toCsv is not exported" / 모듈 없음.

- [ ] **Step 3: 최소 구현**

Create `src/utils/eventResponseExport.ts`:

```typescript
const escapeCsvCell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const toCsv = (headers: string[], rows: string[][]): string => {
  const lines = [headers, ...rows].map(cells => cells.map(escapeCsvCell).join(","));
  return "﻿" + lines.join("\r\n");
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/utils/eventResponseExport.test.ts`
Expected: PASS (toCsv 4건).

---

## Task 2: `buildResponseRows` (표/CSV 공통 행 생성)

**Files:**
- Modify: `src/utils/eventResponseExport.ts`
- Test: `src/utils/eventResponseExport.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

`eventResponseExport.test.ts` 상단 import에 `buildResponseRows` 추가:

```typescript
import { toCsv, buildResponseRows } from "./eventResponseExport";
import type { EventApplication, EventCustomQuestion } from "../lib/types";
```

파일 하단에 추가:

```typescript
const baseApp: EventApplication = {
  id: "1", post_id: "p1", user_id: "u1",
  company_tech: "ACME", applicant_name: "홍길동", position: "대표",
  email: "a@b.com", phone: "010-0000-0000",
  expectation: "기대함", interests: ["AI"], speaker_question: "질문있음",
  privacy_consent: true, answers: {},
  status: "pending", admin_note: null,
  created_at: "2026-06-01T10:00:00Z", updated_at: "2026-06-01T10:00:00Z",
};
const Q = (over: Partial<EventCustomQuestion>): EventCustomQuestion =>
  ({ id: "q1", label: "질문1", type: "short_text", required: false, ...over });

describe("buildResponseRows", () => {
  it("고정 열 + 동적 질문 라벨로 헤더를 만든다", () => {
    const { headers } = buildResponseRows([baseApp], [Q({ id: "q1", label: "회사소개" })]);
    expect(headers).toEqual(["순번", "상태", "신청일", "이름", "회사", "직책", "이메일", "연락처", "회사소개"]);
  });
  it("상태를 한글 라벨로, 배열 답을 ', '로 join한다", () => {
    const app = { ...baseApp, status: "accepted" as const, answers: { q1: ["X", "Y"] } };
    const { rows } = buildResponseRows([app], [Q({ id: "q1", type: "multi_choice", options: ["X", "Y"] })]);
    expect(rows[0][1]).toBe("확정");
    expect(rows[0][8]).toBe("X, Y");
  });
  it("신청일 오름차순으로 순번을 부여한다", () => {
    const older = { ...baseApp, id: "old", created_at: "2026-05-01T00:00:00Z" };
    const newer = { ...baseApp, id: "new", created_at: "2026-06-01T00:00:00Z" };
    const { rows } = buildResponseRows([newer, older], []);
    expect(rows.map(r => [r[0], r[3]])).toEqual([["1", "홍길동"], ["2", "홍길동"]]);
  });
  it("동적 답이 없으면 legacy 컬럼으로 폴백한다", () => {
    const { rows } = buildResponseRows(
      [{ ...baseApp, answers: {} }],
      [Q({ id: "legacy_expectation", label: "기대", type: "long_text" }),
       Q({ id: "legacy_interests", label: "관심", type: "multi_choice", options: ["AI"] })]
    );
    expect(rows[0][8]).toBe("기대함");
    expect(rows[0][9]).toBe("AI");
  });
  it("응답이 전혀 없으면 빈 문자열로 둔다", () => {
    const { rows } = buildResponseRows([{ ...baseApp, answers: {} }], [Q({ id: "q1" })]);
    expect(rows[0][8]).toBe("");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/utils/eventResponseExport.test.ts`
Expected: FAIL — buildResponseRows 없음.

- [ ] **Step 3: 최소 구현**

`eventResponseExport.ts` 상단에 import 추가하고 함수 추가:

```typescript
import { EVENT_APPLICATION_STATUS } from "./eventApplication";
import type { EventApplication, EventCustomQuestion } from "../lib/types";

const LEGACY_FALLBACK: Record<string, (app: EventApplication) => string | string[] | null | undefined> = {
  legacy_expectation: app => app.expectation,
  legacy_interests: app => app.interests,
  legacy_speaker: app => app.speaker_question,
};

const resolveAnswerText = (app: EventApplication, question: EventCustomQuestion): string => {
  const answer = (app.answers ?? {})[question.id];
  const hasAnswer = Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());
  const resolved = hasAnswer ? answer : LEGACY_FALLBACK[question.id]?.(app);
  if (Array.isArray(resolved)) return resolved.join(", ");
  return resolved?.trim() ? resolved : "";
};

export const buildResponseRows = (
  applications: EventApplication[],
  questions: EventCustomQuestion[],
): { headers: string[]; rows: string[][] } => {
  const headers = ["순번", "상태", "신청일", "이름", "회사", "직책", "이메일", "연락처", ...questions.map(q => q.label)];
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/utils/eventResponseExport.test.ts`
Expected: PASS (toCsv 4 + buildResponseRows 5).

---

## Task 3: `summarizeChoiceQuestions` (선택형 질문 집계)

**Files:**
- Modify: `src/utils/eventResponseExport.ts`
- Test: `src/utils/eventResponseExport.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

import에 `summarizeChoiceQuestions` 추가하고 파일 하단에:

```typescript
describe("summarizeChoiceQuestions", () => {
  const single = Q({ id: "s1", label: "직군", type: "single_choice", options: ["개발", "기획"] });
  const multi = Q({ id: "m1", label: "관심", type: "multi_choice", options: ["AI", "웹", "앱"] });
  const text = Q({ id: "t1", label: "한줄", type: "short_text" });

  it("선택형이 아닌 질문은 제외한다", () => {
    const result = summarizeChoiceQuestions([baseApp], [text]);
    expect(result).toEqual([]);
  });
  it("single_choice 옵션별 카운트를 센다", () => {
    const apps = [
      { ...baseApp, id: "1", answers: { s1: "개발" } },
      { ...baseApp, id: "2", answers: { s1: "개발" } },
      { ...baseApp, id: "3", answers: { s1: "기획" } },
    ];
    const [summary] = summarizeChoiceQuestions(apps, [single]);
    expect(summary).toEqual({ id: "s1", label: "직군", total: 3, counts: { 개발: 2, 기획: 1 } });
  });
  it("multi_choice는 선택한 옵션마다 카운트한다", () => {
    const apps = [
      { ...baseApp, id: "1", answers: { m1: ["AI", "웹"] } },
      { ...baseApp, id: "2", answers: { m1: ["AI"] } },
    ];
    const [summary] = summarizeChoiceQuestions(apps, [multi]);
    expect(summary.counts).toEqual({ AI: 2, 웹: 1, 앱: 0 });
    expect(summary.total).toBe(2);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/utils/eventResponseExport.test.ts`
Expected: FAIL — summarizeChoiceQuestions 없음.

- [ ] **Step 3: 최소 구현**

`eventResponseExport.ts`에 추가:

```typescript
export interface ChoiceSummary {
  id: string;
  label: string;
  total: number;
  counts: Record<string, number>;
}

export const summarizeChoiceQuestions = (
  applications: EventApplication[],
  questions: EventCustomQuestion[],
): ChoiceSummary[] =>
  questions
    .filter(q => q.type === "single_choice" || q.type === "multi_choice")
    .map(q => {
      const counts: Record<string, number> = {};
      (q.options ?? []).forEach(option => { counts[option] = 0; });
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/utils/eventResponseExport.test.ts`
Expected: PASS (전체 12건).

---

## Task 4: `EventResponsesView` 컴포넌트 (요약 + 표 + 다운로드)

**Files:**
- Create: `src/app/components/admin/EventResponsesView.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `src/app/components/admin/EventResponsesView.tsx`:

```tsx
import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/button";
import type { EventApplication, Post } from "../../../lib/types";
import { mergeEventFormConfig } from "../../../utils/eventApplication";
import { buildResponseRows, summarizeChoiceQuestions, toCsv } from "../../../utils/eventResponseExport";

interface Props {
  event: Post | null;
  applications: EventApplication[];
}

const sanitizeFileName = (name: string): string => name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) || "행사";

const fileDateStamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
};

export function EventResponsesView({ event, applications }: Props) {
  const card      = "var(--color-surface-card)";
  const border    = "var(--color-border-soft)";
  const textMain  = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const labelBg   = "var(--color-surface-subtle)";
  const barTrack  = "var(--color-surface-subtle)";
  const barFill   = "var(--color-brand-blue)";

  const questions = useMemo(() => mergeEventFormConfig(event?.event_form_config).customQuestions, [event]);
  const { headers, rows } = useMemo(() => buildResponseRows(applications, questions), [applications, questions]);
  const summaries = useMemo(() => summarizeChoiceQuestions(applications, questions), [applications, questions]);

  if (!event) {
    return (
      <div style={{ color: textMuted, padding: "40px 0", textAlign: "center" }}>
        상단에서 행사를 선택하면 응답 데이터를 표로 조회할 수 있습니다.
      </div>
    );
  }

  const handleDownload = () => {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileName(event.title)}_응답_${fileDateStamp()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <strong style={{ color: textMain, fontSize: 16 }}>{event.title} · 응답 {rows.length}건</strong>
        <Button variant="outline" disabled={rows.length === 0} onClick={handleDownload}>
          <Download size={16} style={{ marginRight: 6 }} /> CSV 다운로드
        </Button>
      </div>

      {summaries.length > 0 && (
        <div style={{ display: "grid", gap: 16 }}>
          {summaries.map(summary => (
            <div key={summary.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px" }}>
              <strong style={{ color: textMain, fontSize: 14 }}>{summary.label}</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {Object.entries(summary.counts).map(([option, count]) => {
                  const ratio = summary.total ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div key={option} style={{ display: "grid", gridTemplateColumns: "minmax(80px, 160px) 1fr auto", gap: 10, alignItems: "center" }}>
                      <span style={{ color: textMuted, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{option}</span>
                      <span style={{ height: 8, borderRadius: 4, background: barTrack, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${ratio}%`, background: barFill }} />
                      </span>
                      <span style={{ color: textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{count}명 ({ratio}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ color: textMuted, padding: "32px 0", textAlign: "center" }}>이 행사에 접수된 신청이 없습니다.</div>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${border}`, borderRadius: 12 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header} style={{ position: "sticky", top: 0, background: labelBg, color: textMain, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${border}`, whiteSpace: "nowrap", fontWeight: 700 }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, color: textMuted, verticalAlign: "top", maxWidth: 280 }}>{cell || "–"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EventResponsesView;
```

- [ ] **Step 2: 타입/린트 확인**

Run: `npx tsc --noEmit && npx eslint src/app/components/admin/EventResponsesView.tsx`
Expected: 에러 0. (만약 `--color-brand-blue` 토큰이 없으면 `src/styles/theme.css`에서 존재하는 brand 색 토큰으로 교체.)

---

## Task 5: `AdminEventManagement`에 "응답" 서브탭 연결

**Files:**
- Modify: `src/app/components/admin/AdminEventManagement.tsx`

- [ ] **Step 1: import + 탭 타입 추가**

`AdminEventManagement.tsx` line 8 근처 import 블록에 추가:

```tsx
import { EventResponsesView } from "./EventResponsesView";
```

line 12 `SubTab` 타입을 수정:

```tsx
type SubTab = "overview" | "participants" | "responses" | "history";
```

- [ ] **Step 2: 선택 행사 객체 + 행사별 신청 목록 memo 추가**

`eventFilteredApplications` memo(line 42-45) 바로 아래에 추가:

```tsx
  const selectedEvent = useMemo(
    () => (selectedEventId === "all" ? null : eventById.get(selectedEventId) ?? null),
    [selectedEventId, eventById]
  );
```

(`eventFilteredApplications`가 이미 선택 행사 기준 전체 신청을 상태 무관으로 담고 있으므로 그대로 재사용한다.)

- [ ] **Step 3: 탭 목록에 "응답" 추가**

탭 배열(line 329-333)을 수정 — `participants`와 `history` 사이에 추가:

```tsx
        {([
          ["overview", "행사 현황"],
          ["participants", `참가자 관리 ${participantApplications.length ? `(${participantApplications.length})` : ""}`],
          ["responses", "응답"],
          ["history", "처리 내역"],
        ] as [SubTab, string][]).map(([tab, label]) => (
```

- [ ] **Step 4: responses 탭 렌더 분기 추가**

`return` 본문에서 서브탭별 렌더가 끝나는 위치(history 렌더 분기 근처)에 응답 탭 분기를 추가한다. 기존 분기 패턴(`{subTab === "participants" && (...)}`)을 따라:

```tsx
      {subTab === "responses" && (
        <EventResponsesView event={selectedEvent} applications={eventFilteredApplications} />
      )}
```

- [ ] **Step 5: 빌드/타입 확인**

Run: `npx tsc --noEmit`
Expected: 에러 0.

---

## Task 6: 전체 검증 + 리뷰

- [ ] **Step 1: 전체 검증**

Run: `npm run validate`
Expected: tsc, eslint(0 warn), vitest(기존 + 신규 12), vite build, frontend secret scan 모두 통과.

- [ ] **Step 2: 로컬 브라우저 확인**

`npm run dev:local` (또는 프로젝트 표준 로컬 실행)로 `/admin` → 행사 관리 → 행사 선택 → "응답" 탭에서 표·요약·CSV 다운로드 동작 확인. CSV를 엑셀에서 열어 한글 깨짐 없는지 확인.

- [ ] **Step 3: Codex 리뷰**

변경 diff를 Codex 플러그인으로 리뷰. FAIL 0까지 수정.

- [ ] **Step 4: 문서 갱신 + 커밋 (사용자 승인 후)**

Codex FAIL 0 확인 후 `PLAN.md`/`RESULT.md` 갱신. amend-전용 규약대로 커밋. 이후 사용자가 Netlify 수동 배포.

---

## Self-Review 메모

- 스펙 커버리지: 표 조회(Task 2·4·5), 요약 통계(Task 3·4), CSV 다운로드(Task 1·4), 선택 행사 기준·단일 행사 필수(Task 4 `!event` 분기·Task 5 `selectedEvent`), DB 변경 0(조회 재사용), legacy 폴백(Task 2) 모두 태스크에 대응.
- 타입 일관성: `buildResponseRows`/`summarizeChoiceQuestions`/`toCsv` 시그니처가 Task 1~3 정의와 Task 4 사용처에서 일치. `ChoiceSummary` 구조 동일.
- 비범위 준수: 전체 행사 통합·xlsx·텍스트 집계·서버 RPC 미포함.
