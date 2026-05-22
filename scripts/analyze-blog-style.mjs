#!/usr/bin/env node
/**
 * Global X Pass 블로그 스타일 1회 분석 CLI
 *
 * 사용법:
 *   node scripts/analyze-blog-style.mjs
 *   node scripts/analyze-blog-style.mjs --samples 27
 */

import { analyzeStyleProfile } from "./utils/aiStyleAnalyzer.mjs";
import {
  DEFAULT_STYLE_GUIDE_PATH,
  DEFAULT_STYLE_PROFILE_PATH,
  writeStyleProfile,
} from "./utils/blogStyleProfile.mjs";

function getArgValue(argv, name) {
  const eqMatch = argv.find((arg) => arg.startsWith(`${name}=`));
  if (eqMatch) return eqMatch.slice(name.length + 1);

  const idx = argv.indexOf(name);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith("--")) {
    return argv[idx + 1];
  }
  return null;
}

function printUsage() {
  console.error(`
사용법:
  node scripts/analyze-blog-style.mjs
  node scripts/analyze-blog-style.mjs --samples 27

옵션:
  --samples <숫자>       스타일 분석 샘플 수 (기본: 27, 최대: 30)
  --profile-path <경로>  JSON 프로파일 저장 경로
  --guide-path <경로>    Markdown 가이드 저장 경로
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const sampleArg = getArgValue(argv, "--samples");
  const sampleCount = Math.min(30, Math.max(1, parseInt(sampleArg ?? "27", 10) || 27));
  const profilePath = getArgValue(argv, "--profile-path") ?? DEFAULT_STYLE_PROFILE_PATH;
  const guidePath = getArgValue(argv, "--guide-path") ?? DEFAULT_STYLE_GUIDE_PATH;

  console.log(`스타일 샘플 ${sampleCount}개를 분석합니다.`);
  const { profile, markdownGuide, sampleCount: actualSampleCount } =
    await analyzeStyleProfile(sampleCount);
  const written = writeStyleProfile({ profile, markdownGuide, profilePath, guidePath });

  console.log(`스타일 분석 완료: 샘플 ${actualSampleCount}개`);
  console.log(`JSON 프로파일: ${written.profilePath}`);
  console.log(`Markdown 가이드: ${written.guidePath}`);
}

main().catch((err) => {
  console.error(`오류: ${err.message}`);
  process.exit(1);
});
