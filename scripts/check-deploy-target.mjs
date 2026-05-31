#!/usr/bin/env node
// 마이그레이션 배포 가드: 타깃(staging|prod)별 DB URL을 검증해 오발사를 막는다.
// 안전 규칙: ① DB URL은 셸 env로만(비밀, 미커밋) ② URL의 ref가 타깃과 일치해야 함
// ③ 프로덕션은 CONFIRM_PROD=yes 명시 필요. CLI는 현재 프로덕션에 link돼 있어 가드 없이는 위험.
import { pathToFileURL } from "node:url";

export const STAGING_REF = "bgnkxavrwdwtbgvdmbvr";
export const PROD_REF = "yzbjvkifwinumytehxgf";

const TARGETS = {
  staging: { ref: STAGING_REF, envName: "SUPABASE_DB_URL_STAGING", confirm: false },
  prod: { ref: PROD_REF, envName: "SUPABASE_DB_URL_PROD", confirm: true },
};

// Supabase 접속 URL에서 project-ref를 정규 위치에서만 추출한다.
// query/fragment/path에 우연·악의로 섞인 ref 문자열은 무시(substring 매칭 우회 차단).
// 지원 형태: ① pooler — username "postgres.<ref>" ② direct — hostname "db.<ref>.supabase.co".
function extractProjectRef(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null; // 파싱 불가(예: 비인코딩 비밀번호) → 검증 불가이므로 차단
  }
  const host = u.hostname || "";
  const user = decodeURIComponent(u.username || "");
  // pooler: username "postgres.<ref>" + 호스트가 반드시 supabase pooler여야 함(임의 호스트 우회 차단).
  if (user.startsWith("postgres.") && host.endsWith(".pooler.supabase.com")) {
    return user.slice("postgres.".length) || null;
  }
  // direct: hostname "db.<ref>.supabase.co" (정규식이 호스트를 앵커링).
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  return m ? m[1] : null;
}

// 순수함수: 부수효과 없이 타깃을 검증해 { dbUrl, ref, label } 반환 또는 throw.
export function resolveDeployTarget({ target, env }) {
  const cfg = TARGETS[target];
  if (!cfg) {
    throw new Error(`알 수 없는 배포 타깃: ${target} (staging|prod 중 하나)`);
  }
  const dbUrl = env[cfg.envName];
  if (!dbUrl || !dbUrl.trim()) {
    throw new Error(`${cfg.envName} 미설정 — 셸 env로 ${target} DB 접속 URL을 주입하세요.`);
  }
  if (cfg.confirm && env.CONFIRM_PROD !== "yes") {
    throw new Error("프로덕션 배포는 CONFIRM_PROD=yes 를 명시해야 합니다 (오발사 방지).");
  }
  const urlRef = extractProjectRef(dbUrl.trim());
  if (urlRef !== cfg.ref) {
    throw new Error(
      `URL ref 불일치 — ${target} 타깃은 ref ${cfg.ref} 를 기대하는데 URL의 정규 위치(username/hostname) ref는 ${urlRef ?? "추출불가"} 입니다. 잘못된 프로젝트를 가리킬 수 있어 중단.`,
    );
  }
  return { dbUrl: dbUrl.trim(), ref: cfg.ref, label: target };
}

// CLI: node check-deploy-target.mjs <staging|prod> → 통과 시 dbUrl을 stdout으로, 실패 시 exit 1.
// 호출부(npm 스크립트)가 stdout을 supabase db push --db-url 인자로 사용한다.
// pathToFileURL: 경로에 공백("Global X Pass")이 있어도 percent-encoding이 import.meta.url과 일치하도록.
const invokedDirectly = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    const target = process.argv[2];
    const { dbUrl, ref, label } = resolveDeployTarget({ target, env: process.env });
    console.error(`[deploy-guard] OK — ${label} (ref ${ref})`);
    process.stdout.write(dbUrl);
  } catch (e) {
    console.error(`[deploy-guard] ${e.message}`);
    process.exit(1);
  }
}
