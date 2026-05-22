#!/usr/bin/env node
/**
 * AI 블로그 포스팅 생성 CLI
 *
 * 사용법:
 *   node scripts/generate-ai-post.mjs --input-url  <URL>
 *   node scripts/generate-ai-post.mjs --input-file <파일경로>
 *   echo "기사 본문" | node scripts/generate-ai-post.mjs --input-stdin
 *
 * 최초 1회:
 *   npm run blog:analyze-style
 */

import { existsSync, readFileSync } from "node:fs";
import { generatePost } from "./utils/aiStyleAnalyzer.mjs";
import { fetchArticleText } from "./utils/articleExtractor.mjs";
import { DEFAULT_STYLE_PROFILE_PATH, loadStyleProfile } from "./utils/blogStyleProfile.mjs";

const MAX_ARTICLE_CHARS = 3000;
const LINE = "-".repeat(52);

function getArgValue(argv, name) {
  const eqMatch = argv.find((arg) => arg.startsWith(`${name}=`));
  if (eqMatch) return eqMatch.slice(name.length + 1);

  const idx = argv.indexOf(name);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith("--")) {
    return argv[idx + 1];
  }
  return null;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
  });
}

function header(label) {
  console.log(`\n${LINE}`);
  console.log(label);
  console.log(LINE);
}

function printResult({ titles, content, tags, sampleCount, profileSource }) {
  console.log(`\n스타일 프로파일(${profileSource}, 샘플 ${sampleCount}개) 기반 포스팅 생성 완료\n`);

  header("제목 후보 (하나 골라서 사용)");
  titles.forEach((title, i) => {
    console.log(`\n${i + 1}. ${title}`);
  });

  header("본문");
  console.log(`\n${content}`);

  header("해시태그");
  console.log(`\n${tags}`);

  console.log(`\n${LINE}\n`);
}

function printUsage() {
  console.error(`
사용법:
  node scripts/generate-ai-post.mjs --input-url  <URL>
  node scripts/generate-ai-post.mjs --input-file <파일경로.txt>
  echo "기사 본문" | node scripts/generate-ai-post.mjs --input-stdin

최초 1회:
  npm run blog:analyze-style

옵션:
  --profile <경로>  스타일 프로파일 JSON 경로

기본 프로파일:
  ${DEFAULT_STYLE_PROFILE_PATH}

예시:
  node scripts/generate-ai-post.mjs --input-url https://n.news.naver.com/article/...
  node scripts/generate-ai-post.mjs --input-file ~/Downloads/article.txt
  pbpaste | node scripts/generate-ai-post.mjs --input-stdin
`);
}

async function readArticleInput(argv) {
  const url = getArgValue(argv, "--input-url");
  const filePath = getArgValue(argv, "--input-file");
  const useStdin = argv.includes("--input-stdin");

  if (url) {
    console.log("URL에서 기사 본문 추출 중...");
    console.log(`  ${url}`);
    const articleText = await fetchArticleText(url, { maxChars: MAX_ARTICLE_CHARS });
    console.log(`  -> ${articleText.length}자 추출됨`);
    return articleText;
  }

  if (filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }
    const articleText = readFileSync(filePath, "utf8").trim().slice(0, MAX_ARTICLE_CHARS);
    if (!articleText) throw new Error("입력 파일이 비어 있습니다.");
    console.log(`파일 읽기 완료: ${articleText.length}자`);
    return articleText;
  }

  if (useStdin) {
    const articleText = (await readStdin()).slice(0, MAX_ARTICLE_CHARS);
    if (!articleText) throw new Error("stdin 입력이 비어 있습니다.");
    console.log(`stdin 입력: ${articleText.length}자`);
    return articleText;
  }

  printUsage();
  process.exit(1);
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const profilePath = getArgValue(argv, "--profile") ?? DEFAULT_STYLE_PROFILE_PATH;
  const profile = loadStyleProfile(profilePath);
  const articleText = await readArticleInput(argv);

  console.log("\nGemini 2.5 Flash로 포스팅 생성 중...");
  console.log(`스타일 프로파일: ${profilePath}`);
  const result = await generatePost(articleText, { profile });
  printResult(result);
}

main().catch((err) => {
  console.error(`\n오류: ${err.message}`);
  process.exit(1);
});
