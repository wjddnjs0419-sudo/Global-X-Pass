import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");

export const DEFAULT_STYLE_PROFILE_PATH = resolve(
  ROOT,
  "docs/ai/blog-style-profile.json",
);
export const DEFAULT_STYLE_GUIDE_PATH = resolve(ROOT, "docs/ai/blog-style-guide.md");

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`스타일 프로파일 필드가 비어 있습니다: ${field}`);
  }
}

function assertArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`스타일 프로파일 배열 필드가 비어 있습니다: ${field}`);
  }
}

export function validateStyleProfile(profile) {
  if (!profile || typeof profile !== "object") {
    throw new Error("스타일 프로파일이 JSON object가 아닙니다.");
  }

  if (profile.version !== 1) {
    throw new Error("지원하지 않는 스타일 프로파일 version입니다.");
  }

  assertString(profile.sourceCategory, "sourceCategory");
  if (!Number.isInteger(profile.sampleCount) || profile.sampleCount < 1) {
    throw new Error("스타일 프로파일 sampleCount가 올바르지 않습니다.");
  }

  assertString(profile.brandContext?.name, "brandContext.name");
  assertString(profile.brandContext?.program, "brandContext.program");
  assertString(profile.voice?.tone, "voice.tone");
  assertString(profile.voice?.politeness, "voice.politeness");
  assertString(profile.voice?.emojiPolicy, "voice.emojiPolicy");
  assertString(profile.structure?.introPattern, "structure.introPattern");
  assertArray(profile.structure?.bodyPattern, "structure.bodyPattern");
  assertString(profile.structure?.closingPattern, "structure.closingPattern");
  assertString(profile.structure?.paragraphStyle, "structure.paragraphStyle");

  if (profile.titleRules?.count !== 3) {
    throw new Error("스타일 프로파일 titleRules.count는 3이어야 합니다.");
  }
  if (profile.titleRules?.maxLength !== 40) {
    throw new Error("스타일 프로파일 titleRules.maxLength는 40이어야 합니다.");
  }
  assertArray(profile.titleRules?.angles, "titleRules.angles");

  if ((profile.hashtagRules?.minCount ?? 0) < 5) {
    throw new Error("스타일 프로파일 hashtagRules.minCount는 5 이상이어야 합니다.");
  }
  assertString(profile.hashtagRules?.format, "hashtagRules.format");
  assertArray(profile.hashtagRules?.recommendedTags, "hashtagRules.recommendedTags");
  assertArray(profile.dos, "dos");
  assertArray(profile.donts, "donts");

  return profile;
}

export function loadStyleProfile(profilePath = DEFAULT_STYLE_PROFILE_PATH) {
  if (!existsSync(profilePath)) {
    throw new Error(
      `스타일 프로파일이 없습니다: ${profilePath}\n먼저 npm run blog:analyze-style 을 실행하세요.`,
    );
  }

  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  return validateStyleProfile(profile);
}

function list(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function formatStyleGuide(profile, aiNotes = "") {
  validateStyleProfile(profile);
  const introExamples = profile.examples?.intro?.length ? list(profile.examples.intro) : "- 없음";
  const closingExamples = profile.examples?.closing?.length
    ? list(profile.examples.closing)
    : "- 없음";

  return `# Global X Pass 블로그 스타일 가이드

## 기준
- 소스 카테고리: ${profile.sourceCategory}
- 분석 샘플 수: ${profile.sampleCount}
- 브랜드: ${profile.brandContext.name}
- 프로그램: ${profile.brandContext.program}

## 목소리
- 톤: ${profile.voice.tone}
- 높임말/문체: ${profile.voice.politeness}
- 이모지 원칙: ${profile.voice.emojiPolicy}

## 글 구조
- 인사말 패턴: ${profile.structure.introPattern}
- 문단 스타일: ${profile.structure.paragraphStyle}
- 마무리 패턴: ${profile.structure.closingPattern}

## 본문 구성 패턴
${list(profile.structure.bodyPattern)}

## 제목 규칙
- 제목 후보 수: ${profile.titleRules.count}
- 제목 최대 길이: ${profile.titleRules.maxLength}자

## 제목 각도
${list(profile.titleRules.angles)}

## 해시태그 규칙
- 최소 개수: ${profile.hashtagRules.minCount}
- 형식: ${profile.hashtagRules.format}

## 권장 해시태그
${list(profile.hashtagRules.recommendedTags)}

## 작성 시 지킬 것
${list(profile.dos)}

## 피할 것
${list(profile.donts)}

## 인사말 예시
${introExamples}

## 마무리 예시
${closingExamples}
${aiNotes.trim() ? `\n## AI 분석 메모\n${aiNotes.trim()}\n` : ""}`;
}

export function writeStyleProfile({
  profile,
  profilePath = DEFAULT_STYLE_PROFILE_PATH,
  guidePath = DEFAULT_STYLE_GUIDE_PATH,
}) {
  validateStyleProfile(profile);
  mkdirSync(dirname(profilePath), { recursive: true });
  mkdirSync(dirname(guidePath), { recursive: true });
  writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  writeFileSync(guidePath, `${formatStyleGuide(profile)}\n`, "utf8");
  return { profilePath, guidePath };
}
