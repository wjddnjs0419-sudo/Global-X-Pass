import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { stripHtml } from "./naverHtmlParser.mjs";
import { loadStyleProfile, validateStyleProfile } from "./blogStyleProfile.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");

const DEFAULT_SAMPLE_COUNT = 27;
const MIN_CONTENT_CHARS = 500;
const MAX_CONTENT_CHARS = 1100;
const TARGET_CONTENT_MIN_CHARS = 650;
const TARGET_CONTENT_MAX_CHARS = 950;

function loadEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(ROOT, ".env")];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
    break;
  }
}

loadEnv();

export async function loadStyleSamples(n = DEFAULT_SAMPLE_COUNT) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다.");
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, tags")
    .eq("category", "events-archive")
    .order("created_at", { ascending: false })
    .limit(n);

  if (error) throw new Error(`Supabase 조회 실패: ${error.message}`);
  if (!data?.length) {
    throw new Error("스타일 샘플을 찾을 수 없습니다. events-archive 카테고리 포스팅이 DB에 없습니다.");
  }
  return data;
}

function toSnippet(html, maxChars = 650) {
  const text = stripHtml(html || "");
  return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
}

function buildSampleBlock(samples) {
  return samples
    .map(
      (p, i) =>
        `--- 샘플 ${i + 1} ---\n제목: ${p.title}\n본문:\n${toSnippet(p.content)}\n해시태그: ${p.tags || "(없음)"}`,
    )
    .join("\n\n");
}

const STYLE_PROFILE_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    profile: {
      type: SchemaType.OBJECT,
      properties: {
        version: { type: SchemaType.NUMBER },
        sourceCategory: { type: SchemaType.STRING },
        sampleCount: { type: SchemaType.NUMBER },
        brandContext: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            program: { type: SchemaType.STRING },
          },
          required: ["name", "program"],
        },
        voice: {
          type: SchemaType.OBJECT,
          properties: {
            tone: { type: SchemaType.STRING },
            politeness: { type: SchemaType.STRING },
            emojiPolicy: { type: SchemaType.STRING },
          },
          required: ["tone", "politeness", "emojiPolicy"],
        },
        structure: {
          type: SchemaType.OBJECT,
          properties: {
            introPattern: { type: SchemaType.STRING },
            bodyPattern: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            closingPattern: { type: SchemaType.STRING },
            paragraphStyle: { type: SchemaType.STRING },
          },
          required: ["introPattern", "bodyPattern", "closingPattern", "paragraphStyle"],
        },
        titleRules: {
          type: SchemaType.OBJECT,
          properties: {
            count: { type: SchemaType.NUMBER },
            maxLength: { type: SchemaType.NUMBER },
            angles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["count", "maxLength", "angles"],
        },
        hashtagRules: {
          type: SchemaType.OBJECT,
          properties: {
            minCount: { type: SchemaType.NUMBER },
            format: { type: SchemaType.STRING },
            recommendedTags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["minCount", "format", "recommendedTags"],
        },
        dos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        donts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        examples: {
          type: SchemaType.OBJECT,
          properties: {
            intro: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            closing: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
        },
      },
      required: [
        "version",
        "sourceCategory",
        "sampleCount",
        "brandContext",
        "voice",
        "structure",
        "titleRules",
        "hashtagRules",
        "dos",
        "donts",
      ],
    },
    markdownGuide: { type: SchemaType.STRING },
  },
  required: ["profile", "markdownGuide"],
};

const POST_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    titles: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "제목 후보 정확히 3개. 각 40자 이내.",
    },
    content: {
      type: SchemaType.STRING,
      description: "블로그 본문 전체. 600~900자 권장.",
    },
    tags: {
      type: SchemaType.STRING,
      description: "공백으로 구분된 해시태그 문자열. 반드시 5개 이상.",
    },
  },
  required: ["titles", "content", "tags"],
};

function isRetryable(err) {
  const msg = err?.message ?? "";
  return msg.includes("[503") || msg.includes("[429") || msg.includes("503") || msg.includes("429");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGeminiJson(
  systemInstruction,
  userPrompt,
  responseSchema,
  { maxRetries = 4, baseDelayMs = 8000, temperature = 0.75 } = {},
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY가 .env에 없습니다.");

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(userPrompt);
      const raw = result.response.text().trim();
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) {
        throw new Error(`Gemini 응답 오류: ${err.message}`);
      }

      if (attempt === maxRetries) break;
      const delayMs = baseDelayMs * attempt;
      const code = (err.message ?? "").includes("429") ? "429" : "503";
      process.stderr.write(
        `Gemini ${code} - ${attempt}/${maxRetries - 1}회 재시도 (${delayMs / 1000}초 후)...\n`,
      );
      await sleep(delayMs);
    }
  }

  throw new Error(`Gemini 호출 ${maxRetries}회 모두 실패: ${lastErr?.message ?? "알 수 없는 오류"}`);
}

export async function analyzeStyleProfile(sampleCount = DEFAULT_SAMPLE_COUNT) {
  const samples = await loadStyleSamples(sampleCount);
  const sampleBlock = buildSampleBlock(samples);
  const systemInstruction = `너는 Global X Pass 블로그의 스타일 에디터다.
목표는 새 글을 매번 샘플 원문으로 재분석하지 않아도 되도록, 기존 글의 스타일을 재사용 가능한 프로파일로 정리하는 것이다.
반드시 관찰 가능한 패턴과 운영 규칙만 추출하고, 과장된 마케팅 문구를 새로 만들지 않는다.`;

  const userPrompt = `아래는 ★글로벌 기업 협업 프로그램 게시판의 기존 포스팅 샘플 ${samples.length}개다.
이 샘플을 분석해서 JSON profile과 사람이 읽는 markdownGuide를 작성해줘.

프로파일 규칙:
- version은 1
- sourceCategory는 "events-archive"
- sampleCount는 ${samples.length}
- brandContext.name은 "Global X Pass"
- brandContext.program은 "구글 창구 8기 스타트업 프로그램"
- titleRules.count는 3
- titleRules.maxLength는 40
- hashtagRules.minCount는 5 이상
- dos/donts는 실제 글 작성에 바로 쓸 수 있게 구체적으로 작성
- markdownGuide는 한국어로 작성

[샘플]
${sampleBlock}`;

  const output = await callGeminiJson(
    systemInstruction,
    userPrompt,
    STYLE_PROFILE_RESPONSE_SCHEMA,
    { temperature: 0.45 },
  );

  const profile = {
    ...output.profile,
    version: 1,
    sourceCategory: "events-archive",
    sampleCount: samples.length,
    brandContext: {
      name: "Global X Pass",
      program: "구글 창구 8기 스타트업 프로그램",
      ...output.profile?.brandContext,
    },
    titleRules: {
      ...output.profile?.titleRules,
      count: 3,
      maxLength: 40,
    },
    hashtagRules: {
      ...output.profile?.hashtagRules,
      minCount: Math.max(5, output.profile?.hashtagRules?.minCount ?? 5),
    },
  };

  validateStyleProfile(profile);
  return { profile, markdownGuide: output.markdownGuide, sampleCount: samples.length };
}

function profileToPrompt(profile) {
  return JSON.stringify(profile, null, 2);
}

function countHashtags(tags) {
  return (tags.match(/#[^\s#]+/g) ?? []).length;
}

function normalizeContent(content) {
  return content.replace(/\\n/g, "\n").trim();
}

function getContentLength(content) {
  return [...normalizeContent(content).replace(/\s/g, "")].length;
}

function validateGeneratedPost(output) {
  if (!Array.isArray(output.titles) || output.titles.length !== 3) {
    throw new Error("Gemini 응답 검증 실패: 제목 후보는 정확히 3개여야 합니다.");
  }

  for (const title of output.titles) {
    if (typeof title !== "string" || !title.trim()) {
      throw new Error("Gemini 응답 검증 실패: 빈 제목이 있습니다.");
    }
    if ([...title.trim()].length > 40) {
      throw new Error(`Gemini 응답 검증 실패: 제목이 40자를 초과했습니다. (${title})`);
    }
  }

  const content = normalizeContent(output.content ?? "");
  const contentLength = getContentLength(content);
  if (contentLength < MIN_CONTENT_CHARS || contentLength > MAX_CONTENT_CHARS) {
    throw new Error(
      `Gemini 응답 검증 실패: 본문 길이가 기준을 벗어났습니다. (${contentLength}자)`,
    );
  }

  if (countHashtags(output.tags ?? "") < 5) {
    throw new Error("Gemini 응답 검증 실패: 해시태그는 5개 이상이어야 합니다.");
  }

  return {
    titles: output.titles.map((title) => title.trim()),
    content,
    tags: output.tags.trim(),
  };
}

function formatDraftForPrompt(draft) {
  const titles = Array.isArray(draft?.titles) ? draft.titles.join(" / ") : "";
  const content = typeof draft?.content === "string" ? draft.content.trim() : "";
  const tags = typeof draft?.tags === "string" ? draft.tags.trim() : "";
  return `제목 후보: ${titles}\n\n본문:\n${content}\n\n해시태그:\n${tags}`;
}

async function generateValidatedPost(systemInstruction, initialPrompt, temperature) {
  let output = await callGeminiJson(systemInstruction, initialPrompt, POST_RESPONSE_SCHEMA, {
    temperature,
  });

  for (let repairAttempt = 0; repairAttempt <= 2; repairAttempt += 1) {
    try {
      return validateGeneratedPost(output);
    } catch (err) {
      if (repairAttempt === 2) throw err;

      const repairPrompt = `${initialPrompt}

[직전 JSON 응답]
${JSON.stringify(output, null, 2)}

[검증 실패 사유]
${err.message}

위 실패 사유를 반드시 해결해서 JSON만 다시 작성해줘.
- 제목 후보는 정확히 3개
- 각 제목은 40자 이내
- 본문은 공백 제외 ${MIN_CONTENT_CHARS}~${MAX_CONTENT_CHARS}자 범위 안에 들어야 함
- 본문 목표 길이는 공백 제외 ${TARGET_CONTENT_MIN_CHARS}~${TARGET_CONTENT_MAX_CHARS}자
- 해시태그는 5개 이상
- 이미 적절한 제목/본문/해시태그는 최대한 유지해도 됨`;

      output = await callGeminiJson(systemInstruction, repairPrompt, POST_RESPONSE_SCHEMA, {
        temperature: Math.max(0.5, temperature - 0.12 * (repairAttempt + 1)),
        maxRetries: 2,
        baseDelayMs: 5000,
      });
    }
  }

  throw new Error("Gemini 응답 검증 실패: 자동 보정 루프가 비정상 종료되었습니다.");
}

export async function generatePost(articleText, { profilePath, profile } = {}) {
  const styleProfile = validateStyleProfile(profile ?? loadStyleProfile(profilePath));
  const systemInstruction = `너는 Global X Pass 블로그의 전문 에디터다.
아래 스타일 프로파일을 유일한 스타일 기준으로 사용해서 새 포스팅을 작성한다.
샘플 원문을 다시 분석하지 말고, 프로파일의 규칙을 일관되게 적용한다.

[스타일 프로파일]
${profileToPrompt(styleProfile)}`;

  const userPrompt = `아래 기사 원문을 바탕으로 Global X Pass 블로그 포스팅 초안을 작성해줘.

[기사 원문]
${articleText}

작성 기준:
- 제목 후보는 정확히 3개
- 각 제목은 40자 이내
- 본문은 공백 제외 ${MIN_CONTENT_CHARS}~${MAX_CONTENT_CHARS}자 범위 안에서, 가능하면 ${TARGET_CONTENT_MIN_CHARS}~${TARGET_CONTENT_MAX_CHARS}자에 맞춰 작성
- 프로파일의 인사말, 단락 구조, 마무리 문구, 해시태그 규칙을 따른다
- 해시태그는 5개 이상
- 단락 구분은 빈 줄 사용`;

  const post = await generateValidatedPost(systemInstruction, userPrompt, 0.82);

  return {
    ...post,
    sampleCount: styleProfile.sampleCount,
    profileSource: styleProfile.sourceCategory,
  };
}

export async function revisePost(
  articleText,
  draft,
  instruction,
  { profilePath, profile } = {},
) {
  const styleProfile = validateStyleProfile(profile ?? loadStyleProfile(profilePath));
  const normalizedInstruction = String(instruction ?? "").trim();
  if (!normalizedInstruction) {
    throw new Error("수정 요청이 비어 있습니다.");
  }

  const systemInstruction = `너는 Global X Pass 블로그의 전문 에디터다.
아래 스타일 프로파일을 유일한 스타일 기준으로 사용해서 기존 초안을 수정한다.
반드시 사용자의 수정 요청을 반영하되, 스타일 프로파일의 제목/본문/해시태그 규칙은 유지한다.

[스타일 프로파일]
${profileToPrompt(styleProfile)}`;

  const userPrompt = `아래는 원본 기사, 현재 초안, 그리고 수정 요청이다.
현재 초안의 장점을 유지하면서 수정 요청을 반영한 새 버전을 작성해줘.

[원본 기사]
${articleText}

[현재 초안]
${formatDraftForPrompt(draft)}

[수정 요청]
${normalizedInstruction}

작성 기준:
- 제목 후보는 정확히 3개
- 각 제목은 40자 이내
- 본문은 공백 제외 ${MIN_CONTENT_CHARS}~${MAX_CONTENT_CHARS}자 범위 안에서, 가능하면 ${TARGET_CONTENT_MIN_CHARS}~${TARGET_CONTENT_MAX_CHARS}자에 맞춰 작성
- 프로파일의 인사말, 단락 구조, 마무리 문구, 해시태그 규칙을 따른다
- 해시태그는 5개 이상
- 단락 구분은 빈 줄 사용
- 수정 요청을 반영하되, 기사 원문과 어긋나는 새로운 사실은 만들지 않는다`;

  const post = await generateValidatedPost(systemInstruction, userPrompt, 0.72);

  return {
    ...post,
    sampleCount: styleProfile.sampleCount,
    profileSource: styleProfile.sourceCategory,
  };
}
