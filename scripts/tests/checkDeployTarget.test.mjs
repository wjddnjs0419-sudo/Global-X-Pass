import test from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveDeployTarget, PROD_REF } from "../check-deploy-target.mjs";

const modulePath = fileURLToPath(new URL("../check-deploy-target.mjs", import.meta.url));

const prodUrl = `postgresql://postgres.${PROD_REF}:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`;
// staging 제거 후 ref 불일치 검증용 — prod 가 아닌 임의의 정상-형태 ref.
const otherUrl = `postgresql://postgres.someotherref000:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`;

test("prod: CONFIRM_PROD=yes + 일치 URL이면 반환", () => {
  const r = resolveDeployTarget({
    target: "prod",
    env: { SUPABASE_DB_URL_PROD: prodUrl, CONFIRM_PROD: "yes" },
  });
  assert.strictEqual(r.ref, PROD_REF);
  assert.strictEqual(r.dbUrl, prodUrl);
});

test("staging 타깃은 제거됨 → '알 수 없는 타깃'으로 throw (이제 prod 만 지원)", () => {
  assert.throws(
    () => resolveDeployTarget({ target: "staging", env: { SUPABASE_DB_URL_STAGING: prodUrl } }),
    /알 수 없는 배포 타깃/,
  );
});

test("알 수 없는 타깃은 throw", () => {
  assert.throws(() => resolveDeployTarget({ target: "local", env: {} }), /타깃/);
});

test("prod: env 미설정이면 throw", () => {
  assert.throws(() => resolveDeployTarget({ target: "prod", env: { CONFIRM_PROD: "yes" } }), /SUPABASE_DB_URL_PROD/);
});

test("prod: CONFIRM_PROD 없으면 throw (오발사 방지)", () => {
  assert.throws(
    () => resolveDeployTarget({ target: "prod", env: { SUPABASE_DB_URL_PROD: prodUrl } }),
    /CONFIRM_PROD/,
  );
});

test("prod 명령에 다른 프로젝트 URL이 들어오면 throw (ref 불일치)", () => {
  assert.throws(
    () =>
      resolveDeployTarget({
        target: "prod",
        env: { SUPABASE_DB_URL_PROD: otherUrl, CONFIRM_PROD: "yes" },
      }),
    /ref/i,
  );
});

test("ref가 query에만 숨은 임의 호스트 URL은 throw (.includes 우회 차단)", () => {
  const evil = `postgresql://user:pw@evil.invalid:6543/postgres?note=${PROD_REF}`;
  assert.throws(
    () =>
      resolveDeployTarget({
        target: "prod",
        env: { SUPABASE_DB_URL_PROD: evil, CONFIRM_PROD: "yes" },
      }),
    /ref/i,
  );
});

test("ref가 fragment에만 숨은 임의 호스트 URL은 throw", () => {
  const evil = `postgresql://user:pw@evil.invalid:5432/postgres#${PROD_REF}`;
  assert.throws(
    () =>
      resolveDeployTarget({
        target: "prod",
        env: { SUPABASE_DB_URL_PROD: evil, CONFIRM_PROD: "yes" },
      }),
    /ref/i,
  );
});

test("direct 연결 URL(db.<ref>.supabase.co)도 통과", () => {
  const direct = `postgresql://postgres:pw@db.${PROD_REF}.supabase.co:5432/postgres`;
  const r = resolveDeployTarget({
    target: "prod",
    env: { SUPABASE_DB_URL_PROD: direct, CONFIRM_PROD: "yes" },
  });
  assert.strictEqual(r.ref, PROD_REF);
});

test("pooler username ref가 맞아도 호스트가 supabase pooler 아니면 throw (호스트 우회 차단)", () => {
  const evilHost = `postgresql://postgres.${PROD_REF}:pw@evil.invalid:6543/postgres`;
  assert.throws(
    () =>
      resolveDeployTarget({
        target: "prod",
        env: { SUPABASE_DB_URL_PROD: evilHost, CONFIRM_PROD: "yes" },
      }),
    /ref/i,
  );
});

test("argv[1] 없는 import 컨텍스트(node -e)에서도 모듈 로드가 깨지지 않음", () => {
  // node -e 로 동적 import 시 process.argv[1]가 없음 → pathToFileURL(undefined) TypeError가 없어야 한다.
  assert.doesNotThrow(() =>
    execFileSync(
      process.execPath,
      ["-e", `import(${JSON.stringify(modulePath)}).then(() => process.exit(0))`],
      { stdio: "pipe" },
    ),
  );
});

test("whitespace-only env는 throw", () => {
  assert.throws(
    () => resolveDeployTarget({ target: "prod", env: { SUPABASE_DB_URL_PROD: "  \n\t ", CONFIRM_PROD: "yes" } }),
    /SUPABASE_DB_URL_PROD/,
  );
});

test("CONFIRM_PROD 변형값(YES/true/yes 공백)은 거부", () => {
  for (const bad of ["YES", "true", "yes ", "1"]) {
    assert.throws(
      () =>
        resolveDeployTarget({
          target: "prod",
          env: { SUPABASE_DB_URL_PROD: prodUrl, CONFIRM_PROD: bad },
        }),
      /CONFIRM_PROD/,
      `CONFIRM_PROD="${bad}" 는 거부돼야 함`,
    );
  }
});
