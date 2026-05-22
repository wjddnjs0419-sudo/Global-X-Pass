const MIN_TERM_LENGTH = 2;

function normalizeForMatch(value) {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactForMatch(value) {
  return normalizeForMatch(value).replace(/[^0-9a-z가-힣]/g, "");
}

function hasTerm(text, compactText, term) {
  const normalizedTerm = normalizeForMatch(term);
  if (normalizedTerm.length < MIN_TERM_LENGTH) return false;
  if (text.includes(normalizedTerm)) return true;

  const compactTerm = compactForMatch(normalizedTerm);
  return compactTerm.length >= MIN_TERM_LENGTH && compactText.includes(compactTerm);
}

export function splitCompanyNewsKeywords(raw) {
  return (raw ?? "")
    .split(/[\n,;|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function uniqueTerms(terms) {
  const seen = new Set();
  const unique = [];

  for (const term of terms) {
    const normalized = normalizeForMatch(term);
    if (normalized.length < MIN_TERM_LENGTH || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(term.trim());
  }

  return unique;
}

export function buildCompanyNewsQueries(company, maxKeywords) {
  const companyName = company.name?.trim() ?? "";
  const keywords = uniqueTerms(splitCompanyNewsKeywords(company.search_keywords));
  const limit = Math.max(1, maxKeywords);
  const queries = [];

  if (companyName) {
    queries.push(companyName);
  }

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeForMatch(keyword);
    const normalizedCompany = normalizeForMatch(companyName);
    const query = normalizedCompany && normalizedKeyword.includes(normalizedCompany)
      ? keyword
      : `${companyName} ${keyword}`.trim();
    queries.push(query);
  }

  return uniqueTerms(queries).slice(0, limit);
}

export function evaluateCompanyNewsRelevance(company, article) {
  const companyName = company.name?.trim() ?? "";
  const keywordTerms = uniqueTerms(splitCompanyNewsKeywords(company.search_keywords));
  const title = normalizeForMatch(article.title);
  const description = normalizeForMatch(article.description);
  const titleCompact = compactForMatch(title);
  const descriptionCompact = compactForMatch(description);
  const matched = new Set();
  let score = 0;
  let companyMatched = false;

  if (companyName && hasTerm(title, titleCompact, companyName)) {
    score += 6;
    matched.add(companyName);
    companyMatched = true;
  } else if (companyName && hasTerm(description, descriptionCompact, companyName)) {
    score += 3;
    matched.add(companyName);
    companyMatched = true;
  }

  for (const term of keywordTerms) {
    let termScore = 0;
    if (hasTerm(title, titleCompact, term)) {
      termScore += 3;
    }
    if (hasTerm(description, descriptionCompact, term)) {
      termScore += 1;
    }
    if (termScore > 0) {
      score += termScore;
      matched.add(term);
    }
  }

  const matchedTerms = Array.from(matched);
  const reason = companyMatched
    ? "company_or_keyword_matched"
    : matchedTerms.length > 0
      ? "keyword_only_matched"
      : "no_company_or_keyword_match";

  return {
    score,
    matchedTerms,
    reason,
    companyMatched,
  };
}

export function isCompanyNewsRelevant(relevance, minScore) {
  if (relevance.companyMatched) {
    return relevance.score >= minScore;
  }

  return relevance.score > minScore * 2;
}
