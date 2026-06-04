#!/usr/bin/env node
// 프로덕션/CI 빌드 가드: VITE_SUPABASE_URL이 로컬(127.0.0.1/localhost)이면 빌드 중단.
// 로컬 dev 빌드(npm run validate 포함)는 통과 — CI/NETLIFY 신호 있을 때만 차단한다.
import { readFileSync, existsSync } from "node:fs";

const isCI = process.env.CI === "true" || process.env.NETLIFY === "true";
if (!isCI) process.exit(0); // 로컬 빌드는 무조건 통과
if (process.env.ALLOW_LOCAL_BUILD_IN_CI === "1") process.exit(0); // GitHub QA runner의 local stack preview 허용

// URL 소스: 환경변수 우선, 없으면 루트 .env 파일에서 파싱
let url = process.env.VITE_SUPABASE_URL;
if (!url && existsSync(".env")) {
  const m = readFileSync(".env", "utf8").match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+?)\s*$/m);
  if (m) url = m[1].trim();
}

const isLocal = !url || /127\.0\.0\.1|localhost/.test(url);
if (isLocal) {
  console.error(`\n[build-guard] 프로덕션/CI 빌드인데 VITE_SUPABASE_URL이 로컬입니다 (${url ?? "미설정"}).`);
  console.error("[build-guard] 호스팅/CI secret으로 프로덕션 Supabase URL을 주입하세요. 빌드 중단.\n");
  process.exit(1);
}
console.log(`[build-guard] OK — VITE_SUPABASE_URL=${url}`);
