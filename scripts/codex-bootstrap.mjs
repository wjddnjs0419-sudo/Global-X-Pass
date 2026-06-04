#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const ROOT_FILES = {
  agents: "AGENTS.md",
  rules: "docs/AGENT_RULES.md",
  antiPatterns: "docs/AGENT_ANTI_PATTERNS.md",
  plan: "PLAN.md",
  result: "RESULT.md",
};

function readText(filePath) {
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8");
}

function getLines(filePath) {
  return readText(filePath).split("\n");
}

function sectionBody(filePath, heading) {
  const lines = getLines(filePath);
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) return [];

  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s+/.test(line)) break;
    body.push(line);
  }
  return body;
}

function subSectionBody(filePath, heading) {
  const lines = getLines(filePath);
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) return [];

  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^###\s+/.test(line)) break;
    if (/^##\s+/.test(line)) break;
    body.push(line);
  }
  return body;
}

function bulletLines(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
}

function numberedLines(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s/.test(line));
}

function firstNonEmpty(lines) {
  return lines.map((line) => line.trim()).find(Boolean) ?? "(없음)";
}

function topItems(items, limit) {
  return items.slice(0, limit);
}

function extractFutureRisks(filePath, limit) {
  const lines = getLines(filePath);
  const futureStart = lines.findIndex((line) => line.startsWith("## Future"));
  if (futureStart === -1) return ["(없음)"];

  const futureLines = lines.slice(futureStart + 1);
  const risks = futureLines
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [ ] "));

  return risks.length > 0 ? risks.slice(0, limit) : ["(없음)"];
}

function searchHeadings() {
  const args = [
    "-n",
    "^##|^###",
    ROOT_FILES.rules,
    ROOT_FILES.antiPatterns,
    ROOT_FILES.plan,
    ROOT_FILES.result,
  ];

  const rg = spawnSync("rg", args, { encoding: "utf8" });
  if (rg.status === 0 && rg.stdout.trim()) {
    return rg.stdout.trim().split("\n").slice(0, 24);
  }

  return [
    ...collectHeadings(ROOT_FILES.rules),
    ...collectHeadings(ROOT_FILES.antiPatterns),
    ...collectHeadings(ROOT_FILES.plan),
    ...collectHeadings(ROOT_FILES.result),
  ].slice(0, 24);
}

function collectHeadings(filePath) {
  return getLines(filePath)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^##|^###/.test(line))
    .map(({ line, index }) => `${filePath}:${index + 1}:${line}`);
}

function printList(title, items) {
  console.log(`${title}`);
  for (const item of items) {
    const normalized = item
      .replace(/^\s*-\s+/, "")
      .replace(/^\s*#\s+/, "")
      .trim();
    console.log(`- ${normalized}`);
  }
  console.log("");
}

const ruleSummary = topItems(
  numberedLines(sectionBody(ROOT_FILES.rules, "## AI Agent Workflow Mandates (CRITICAL)")),
  6,
);

const pendingApprovalSection = subSectionBody(ROOT_FILES.plan, "## Pending Approval");
const inProgressSection = subSectionBody(ROOT_FILES.plan, "## In Progress");
const doneSection = subSectionBody(ROOT_FILES.plan, "## Done");

const pendingItems = bulletLines(pendingApprovalSection);
const inProgressItems = bulletLines(inProgressSection);
const doneItems = bulletLines(doneSection);

const resultTitle = firstNonEmpty(
  getLines(ROOT_FILES.result).filter((line) => line.startsWith("# ")),
);

const resultImplementation = topItems(
  bulletLines(subSectionBody(ROOT_FILES.result, "## 구현")),
  3,
);

const risks = extractFutureRisks(ROOT_FILES.plan, 4);

console.log("== Codex Session Bootstrap ==");
console.log("");
console.log("이 출력은 새 Codex 세션 시작 직후 확인용 요약입니다.");
console.log("`ㅎㅇ` 입력도 일반 인사가 아니라 이 부트스트랩 재실행 트리거로 취급합니다.");
console.log("");

printList("현재 컨텍스트", [
  resultTitle,
  ...(resultImplementation.length > 0 ? resultImplementation : ["최근 RESULT 구현 요약 없음"]),
]);

printList("최근 완료", doneItems.length > 0 ? topItems(doneItems, 3) : ["(없음)"]);

printList("대기 계획", [
  ...(pendingItems.length > 0 ? pendingItems : ["Pending Approval 없음"]),
  ...(inProgressItems.length > 0 ? inProgressItems : ["In Progress 없음"]),
]);

printList("주요 리스크", risks);

printList("부트스트랩 규칙 스냅샷", ruleSummary.length > 0 ? ruleSummary : ["(없음)"]);

printList("grep-first 헤더 인덱스", searchHeadings());
