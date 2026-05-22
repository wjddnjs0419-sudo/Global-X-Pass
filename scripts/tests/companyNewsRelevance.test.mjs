import test from "node:test";
import assert from "node:assert";
import {
  buildCompanyNewsQueries,
  evaluateCompanyNewsRelevance,
  isCompanyNewsRelevant,
} from "../utils/companyNewsRelevance.mjs";

test("company news relevance - builds company-scoped keyword queries", () => {
  const queries = buildCompanyNewsQueries(
    { name: "글로벌패스", search_keywords: "AI, 해외 진출" },
    6,
  );

  assert.deepStrictEqual(queries, ["글로벌패스", "글로벌패스 AI", "글로벌패스 해외 진출"]);
});

test("company news relevance - accepts direct company title match", () => {
  const relevance = evaluateCompanyNewsRelevance(
    { name: "글로벌패스", search_keywords: "AI" },
    { title: "글로벌패스, 일본 진출 지원 프로그램 선정", description: "스타트업 글로벌 협업 소식" },
  );

  assert.ok(relevance.score >= 6);
  assert.deepStrictEqual(relevance.matchedTerms, ["글로벌패스"]);
  assert.strictEqual(relevance.companyMatched, true);
});

test("company news relevance - rejects unrelated broad keyword article", () => {
  const relevance = evaluateCompanyNewsRelevance(
    { name: "글로벌패스", search_keywords: "AI, 스타트업" },
    { title: "국내 AI 스타트업 투자 시장 회복", description: "여러 기업의 투자 유치가 이어졌다" },
  );

  assert.strictEqual(relevance.score, 6);
  assert.strictEqual(relevance.companyMatched, false);
  assert.deepStrictEqual(relevance.matchedTerms, ["AI", "스타트업"]);
  assert.strictEqual(isCompanyNewsRelevant(relevance, 3), false);
});
