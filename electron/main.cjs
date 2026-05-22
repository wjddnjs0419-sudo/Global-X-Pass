const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("node:path");
const os = require("node:os");
const https = require("node:https");
const { pathToFileURL } = require("node:url");
const { execFile, spawn } = require("node:child_process");

const fs = require("node:fs");

const isDev = process.env.GXP_ARCHITECTURE_APP_DEV === "1";
const architectureEntry = isDev
  ? process.env.GXP_ARCHITECTURE_APP_URL || "http://127.0.0.1:5175/architecture.html"
  : path.join(app.getAppPath(), "dist-architecture", "architecture.html");

// dev: electron/main.cjs 의 부모 = 프로젝트 루트
// packaged: .app/Contents/MacOS/binary 에서 5단계 위 = release/mac-arm64 → release → 프로젝트
function resolveProjectRoot() {
  if (isDev) return path.resolve(__dirname, "..");
  const exeDir = path.dirname(app.getPath("exe"));
  const candidate = path.resolve(exeDir, "..", "..", "..", "..", "..");
  return fs.existsSync(path.join(candidate, "package.json")) ? candidate : os.homedir();
}

let projectRoot = isDev ? path.resolve(__dirname, "..") : null;

const GITHUB_OWNER = "wjddnjs0419-sudo";
const GITHUB_REPO = "Global-X-Pass";
const QA_WORKFLOW_FILE = "qa-dispatch.yml";
const QA_WORKFLOW_REF = "main";
const GITHUB_TOKEN_FILE = "github-token.txt";
const QA_CREDENTIALS_FILE = "qa-credentials.env";
const QA_TEST_SUITES = new Set([
  "smoke",
  "admin-auth",
  "auth-negative",
  "admin-post-cud",
  "admin-program-mgmt",
  "user-event-application",
  "user-consulting-booking",
  "user-founders-club",
  "user-flows",
  "all",
]);
const QA_SUITES_REQUIRING_USER = new Set([
  "auth-negative",
  "user-event-application",
  "user-consulting-booking",
  "user-founders-club",
  "user-flows",
  "all",
]);
const QA_VISIBLE_SPECS_BY_SUITE = {
  smoke: ["tests/qa/production-smoke.spec.ts", "tests/qa/admin-complex.spec.ts"],
  "admin-auth": ["tests/qa/admin-auth.spec.ts"],
  "auth-negative": ["tests/qa/admin-auth-negative.spec.ts"],
  "admin-post-cud": ["tests/qa/admin-post-cud.spec.ts"],
  "admin-program-mgmt": ["tests/qa/admin-program-mgmt.spec.ts"],
  "user-event-application": ["tests/qa/user-event-application.spec.ts"],
  "user-consulting-booking": ["tests/qa/user-consulting-booking.spec.ts"],
  "user-founders-club": ["tests/qa/user-founders-club.spec.ts"],
  "user-flows": [
    "tests/qa/user-event-application.spec.ts",
    "tests/qa/user-consulting-booking.spec.ts",
    "tests/qa/user-founders-club.spec.ts",
  ],
  all: [],
};
const MAX_BLOG_ARTICLE_CHARS = 3000;

function getGithubTokenPath() {
  return path.join(app.getPath("userData"), GITHUB_TOKEN_FILE);
}

function getQaCredentialsPath() {
  return path.join(app.getPath("userData"), QA_CREDENTIALS_FILE);
}

function readStoredGithubToken() {
  try {
    return fs.readFileSync(getGithubTokenPath(), "utf8").trim();
  } catch {
    return "";
  }
}

function writeStoredGithubToken(token) {
  const clean = String(token || "").trim();
  if (!clean) throw new Error("GitHub token is empty");
  const tokenPath = getGithubTokenPath();
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, clean, { mode: 0o600 });
}

function clearStoredGithubToken() {
  try {
    fs.rmSync(getGithubTokenPath(), { force: true });
  } catch {}
}

function escapeEnvValue(value) {
  return String(value ?? "").replace(/'/g, "'\\''");
}

function hasStoredQaCredentials() {
  return fs.existsSync(getQaCredentialsPath());
}

function writeStoredQaCredentials(credentials) {
  const email = String(credentials?.email || "").trim();
  const password = String(credentials?.password || "");
  const mfaSecret = String(credentials?.mfaSecret || "").trim();
  if (!email || !password || !mfaSecret) {
    throw new Error("QA email, password, and MFA secret are required");
  }

  const credentialsPath = getQaCredentialsPath();
  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
  fs.writeFileSync(
    credentialsPath,
    [
      `QA_ADMIN_EMAIL='${escapeEnvValue(email)}'`,
      `QA_ADMIN_PASSWORD='${escapeEnvValue(password)}'`,
      `QA_ADMIN_MFA_SECRET='${escapeEnvValue(mfaSecret)}'`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
}

function clearStoredQaCredentials() {
  try {
    fs.rmSync(getQaCredentialsPath(), { force: true });
  } catch {}
}

function resolveProjectPath(filePath) {
  const targetPath = String(filePath || "").trim();
  if (!targetPath) return "";
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(projectRoot, targetPath);
}

function importProjectModule(relativePath) {
  const modulePath = path.join(projectRoot, ...String(relativePath).split("/"));
  return import(pathToFileURL(modulePath).href);
}

function deriveGuidePath(profilePath) {
  const ext = path.extname(profilePath);
  const dir = path.dirname(profilePath);
  const base = path.basename(profilePath, ext || undefined);
  const guideBase = base.endsWith("-profile")
    ? `${base.slice(0, -"profile".length)}guide`
    : `${base}-guide`;
  return path.join(dir, `${guideBase}.md`);
}

async function loadBlogAiModules() {
  const [aiStyleAnalyzer, articleExtractor, blogStyleProfile] = await Promise.all([
    importProjectModule("scripts/utils/aiStyleAnalyzer.mjs"),
    importProjectModule("scripts/utils/articleExtractor.mjs"),
    importProjectModule("scripts/utils/blogStyleProfile.mjs"),
  ]);

  return { aiStyleAnalyzer, articleExtractor, blogStyleProfile };
}

async function resolveBlogArticleText(inputMode, articleUrl, articleText, fetchArticleText) {
  if (inputMode === "url") {
    const normalizedUrl = String(articleUrl || "").trim();
    if (!normalizedUrl) {
      throw new Error("기사 URL을 입력해 주세요.");
    }
    const extractedText = await fetchArticleText(normalizedUrl, { maxChars: MAX_BLOG_ARTICLE_CHARS });
    return { articleText: extractedText, articleUrl: normalizedUrl };
  }

  const normalizedText = String(articleText || "").trim().slice(0, MAX_BLOG_ARTICLE_CHARS);
  if (!normalizedText) {
    throw new Error("기사 본문을 입력해 주세요.");
  }
  return { articleText: normalizedText, articleUrl: null };
}

async function analyzeBlogStyleProfile({ sampleCount, profilePath } = {}) {
  const { aiStyleAnalyzer, blogStyleProfile } = await loadBlogAiModules();
  const parsedSampleCount = Number.parseInt(String(sampleCount ?? "27"), 10);
  const boundedSampleCount = Math.min(30, Math.max(1, Number.isFinite(parsedSampleCount) ? parsedSampleCount : 27));
  const requestedProfilePath = String(profilePath || "").trim();
  const targetProfilePath = requestedProfilePath
    ? resolveProjectPath(requestedProfilePath)
    : blogStyleProfile.DEFAULT_STYLE_PROFILE_PATH;
  const targetGuidePath = requestedProfilePath
    ? deriveGuidePath(targetProfilePath)
    : blogStyleProfile.DEFAULT_STYLE_GUIDE_PATH;

  const { profile, sampleCount: actualSampleCount } = await aiStyleAnalyzer.analyzeStyleProfile(
    boundedSampleCount,
  );
  const written = blogStyleProfile.writeStyleProfile({
    profile,
    profilePath: targetProfilePath,
    guidePath: targetGuidePath,
  });

  return {
    ok: true,
    sampleCount: actualSampleCount,
    profilePath: written.profilePath,
    guidePath: written.guidePath,
  };
}

async function generateBlogDraft({
  inputMode,
  articleUrl,
  articleText,
  profilePath,
} = {}) {
  const { aiStyleAnalyzer, articleExtractor, blogStyleProfile } = await loadBlogAiModules();
  const requestedProfilePath = String(profilePath || "").trim();
  const resolvedProfilePath = requestedProfilePath
    ? resolveProjectPath(requestedProfilePath)
    : blogStyleProfile.DEFAULT_STYLE_PROFILE_PATH;
  const resolvedInput = await resolveBlogArticleText(
    inputMode,
    articleUrl,
    articleText,
    articleExtractor.fetchArticleText,
  );
  const draft = await aiStyleAnalyzer.generatePost(resolvedInput.articleText, {
    profilePath: resolvedProfilePath,
  });

  return {
    ok: true,
    profilePath: resolvedProfilePath,
    inputMode: inputMode === "url" ? "url" : "text",
    articleUrl: resolvedInput.articleUrl,
    articleText: resolvedInput.articleText,
    articleTextLength: resolvedInput.articleText.length,
    draft,
  };
}

async function reviseBlogDraft({
  articleText,
  draft,
  instruction,
  profilePath,
} = {}) {
  const { aiStyleAnalyzer, blogStyleProfile } = await loadBlogAiModules();
  const requestedProfilePath = String(profilePath || "").trim();
  const resolvedProfilePath = requestedProfilePath
    ? resolveProjectPath(requestedProfilePath)
    : blogStyleProfile.DEFAULT_STYLE_PROFILE_PATH;
  const normalizedArticleText = String(articleText || "").trim().slice(0, MAX_BLOG_ARTICLE_CHARS);
  if (!normalizedArticleText) {
    throw new Error("수정할 원본 기사 본문이 없습니다. 먼저 초안을 생성해 주세요.");
  }
  if (!draft || !Array.isArray(draft.titles) || typeof draft.content !== "string" || typeof draft.tags !== "string") {
    throw new Error("수정할 현재 초안 형식이 올바르지 않습니다.");
  }

  const revisedDraft = await aiStyleAnalyzer.revisePost(
    normalizedArticleText,
    draft,
    instruction,
    { profilePath: resolvedProfilePath },
  );

  return {
    ok: true,
    profilePath: resolvedProfilePath,
    articleText: normalizedArticleText,
    articleTextLength: normalizedArticleText.length,
    draft: revisedDraft,
  };
}

function githubRequest(apiPath, options = {}) {
  const method = options.method || "GET";
  const body = options.body ?? null;
  const token = readStoredGithubToken() || process.env.GXP_GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "global-x-pass-architecture-app",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.github.com",
      path: apiPath,
      method,
      headers,
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        let json = null;
        try {
          json = body ? JSON.parse(body) : null;
        } catch {
          json = null;
        }

        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(json);
          return;
        }

        const message = json?.message || `GitHub API ${res.statusCode}`;
        const error = new Error(message);
        error.statusCode = res.statusCode;
        reject(error);
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function normalizeFailedStep(job) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  const failedStep = steps.find((step) => ["failure", "timed_out", "cancelled", "action_required"].includes(step?.conclusion));
  if (!failedStep) return null;
  return {
    job: job.name || "unknown job",
    step: failedStep.name || "unknown step",
    conclusion: failedStep.conclusion || "failure",
  };
}

function normalizeQaSuite(input) {
  const suite = String(input || "smoke").trim();
  if (!QA_TEST_SUITES.has(suite)) {
    const error = new Error(`Unsupported QA suite: ${suite}`);
    error.statusCode = 400;
    throw error;
  }
  return suite;
}

function extractQaSuite(run) {
  const title = `${run.display_title || ""} ${run.name || ""}`;
  const match = title.match(/(?:On-Demand QA\s*\/\s*)?(smoke|admin-auth|auth-negative|admin-post-cud|admin-program-mgmt|user-event-application|user-consulting-booking|user-founders-club|user-flows|all)/);
  return match?.[1] || null;
}

async function readQaWorkflowRuns() {
  const runsPath = `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${QA_WORKFLOW_FILE}/runs?per_page=20&branch=main`;
  const runsJson = await githubRequest(runsPath);
  const runs = Array.isArray(runsJson?.workflow_runs) ? runsJson.workflow_runs : [];

  const normalized = await Promise.all(runs.map(async (run) => {
    let failedStep = null;
    if (run.conclusion && run.conclusion !== "success" && run.jobs_url) {
      try {
        const jobsUrl = new URL(run.jobs_url);
        const jobsJson = await githubRequest(`${jobsUrl.pathname}${jobsUrl.search || ""}`);
        const jobs = Array.isArray(jobsJson?.jobs) ? jobsJson.jobs : [];
        failedStep = jobs.map(normalizeFailedStep).find(Boolean) ?? null;
      } catch (error) {
        failedStep = { job: "GitHub Actions", step: String(error?.message ?? error), conclusion: "unknown" };
      }
    }

    return {
      id: String(run.id),
      runNumber: run.run_number,
      runAttempt: run.run_attempt,
      name: run.name || "On-Demand QA",
      displayTitle: run.display_title || run.name || "On-Demand QA",
      event: run.event || "unknown",
      status: run.status || "unknown",
      conclusion: run.conclusion || null,
      branch: run.head_branch || "main",
      actor: run.actor?.login || null,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
      suite: extractQaSuite(run),
      failedStep,
    };
  }));

  return {
    ok: true,
    repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    workflow: QA_WORKFLOW_FILE,
    runs: normalized,
    fetchedAt: new Date().toISOString(),
  };
}

async function triggerQaWorkflowRun(suiteInput) {
  const suite = normalizeQaSuite(suiteInput);
  await githubRequest(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${QA_WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      body: { ref: QA_WORKFLOW_REF, inputs: { test_suite: suite } },
    },
  );

  return {
    ok: true,
    workflow: QA_WORKFLOW_FILE,
    branch: QA_WORKFLOW_REF,
    suite,
    triggeredAt: new Date().toISOString(),
  };
}

function escapeAppleScriptString(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildShellCommand(command) {
  const escapedRoot = projectRoot.replace(/'/g, "'\\''");
  return command
    ? `cd '${escapedRoot}' && ${command}`
    : `cd '${escapedRoot}'`;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function buildVisibleQaCommand(suiteInput) {
  const suite = normalizeQaSuite(suiteInput);
  const specs = QA_VISIBLE_SPECS_BY_SUITE[suite] ?? [];
  const requiresUserCredentials = QA_SUITES_REQUIRING_USER.has(suite);
  const specArgs = specs.map(shellQuote).join(" ");
  const testCommand = `npx playwright test${specArgs ? ` ${specArgs}` : ""} --headed --project=chromium`;
  const qaCredentialsPath = getQaCredentialsPath();

  return [
    "run_visible_qa() {",
    `  printf '\\n▶ Local Visible QA: ${suite}\\n';`,
    "  if [ -f .env.qa ]; then",
    "    printf 'Loading .env.qa for QA credentials...\\n';",
    "    set -a; source .env.qa; set +a;",
    "  fi;",
    `  if [ -f ${shellQuote(qaCredentialsPath)} ]; then`,
    "    printf 'Loading saved app QA credentials...\\n';",
    `    set -a; source ${shellQuote(qaCredentialsPath)}; set +a;`,
    "  fi;",
    "  missing=0;",
    "  for name in QA_ADMIN_EMAIL QA_ADMIN_PASSWORD QA_ADMIN_MFA_SECRET; do",
    "    eval \"value=\\${$name:-}\";",
    "    if [ -z \"$value\" ]; then",
    "      printf 'Missing required env: %s\\n' \"$name\";",
    "      missing=1;",
    "    fi;",
    "  done;",
    "  if [ \"$missing\" -eq 1 ]; then",
    "    printf '\\nLocal Visible QA runs on this Mac, so it cannot read GitHub Secrets back from Actions.\\n';",
    "    printf 'Tip for next time: cp .env.qa.example .env.qa && edit .env.qa\\n';",
    "    printf '\\nEnter QA credentials for this run. Leave any value blank to abort.\\n';",
    "    if [ -z \"${QA_ADMIN_EMAIL:-}\" ]; then printf 'QA admin email: '; IFS= read -r QA_ADMIN_EMAIL; export QA_ADMIN_EMAIL; fi;",
    "    if [ -z \"${QA_ADMIN_PASSWORD:-}\" ]; then printf 'QA admin password: '; stty -echo; IFS= read -r QA_ADMIN_PASSWORD; stty echo; printf '\\n'; export QA_ADMIN_PASSWORD; fi;",
    "    if [ -z \"${QA_ADMIN_MFA_SECRET:-}\" ]; then printf 'QA MFA secret: '; IFS= read -r QA_ADMIN_MFA_SECRET; export QA_ADMIN_MFA_SECRET; fi;",
    "    missing=0;",
    "    for name in QA_ADMIN_EMAIL QA_ADMIN_PASSWORD QA_ADMIN_MFA_SECRET; do",
    "      eval \"value=\\${$name:-}\";",
    "      if [ -z \"$value\" ]; then missing=1; fi;",
    "    done;",
    requiresUserCredentials
      ? "    for name in QA_USER_EMAIL QA_USER_PASSWORD; do eval \"value=\\${$name:-}\"; if [ -z \"$value\" ]; then missing=1; fi; done;"
      : "",
    "    if [ \"$missing\" -eq 1 ]; then",
    "      printf '\\nLocal Visible QA aborted because required credentials were not provided.\\n';",
    "      return 64;",
    "    fi;",
    "  fi;",
    requiresUserCredentials ? "  for name in QA_USER_EMAIL QA_USER_PASSWORD; do eval \"value=\\${$name:-}\"; if [ -z \"$value\" ]; then missing=1; fi; done;" : "",
    requiresUserCredentials ? "  if [ \"$missing\" -eq 1 ]; then" : "",
    requiresUserCredentials ? "    printf '\\nThis suite also needs QA_USER_EMAIL and QA_USER_PASSWORD.\\n';" : "",
    requiresUserCredentials ? "    if [ -z \"${QA_USER_EMAIL:-}\" ]; then printf 'QA user email: '; IFS= read -r QA_USER_EMAIL; export QA_USER_EMAIL; fi;" : "",
    requiresUserCredentials ? "    if [ -z \"${QA_USER_PASSWORD:-}\" ]; then printf 'QA user password: '; stty -echo; IFS= read -r QA_USER_PASSWORD; stty echo; printf '\\n'; export QA_USER_PASSWORD; fi;" : "",
    requiresUserCredentials ? "    missing=0;" : "",
    requiresUserCredentials ? "    for name in QA_USER_EMAIL QA_USER_PASSWORD; do eval \"value=\\${$name:-}\"; if [ -z \"$value\" ]; then missing=1; fi; done;" : "",
    requiresUserCredentials ? "    if [ \"$missing\" -eq 1 ]; then" : "",
    requiresUserCredentials ? "      printf '\\nLocal Visible QA aborted because QA user credentials were not provided.\\n';" : "",
    requiresUserCredentials ? "      return 64;" : "",
    requiresUserCredentials ? "    fi;" : "",
    requiresUserCredentials ? "  fi;" : "",
    `  printf "Running: ${testCommand.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}\\n\\n";`,
    `  ${testCommand};`,
    "};",
    "run_visible_qa;",
    "qa_exit_code=$?;",
    "printf '\\nLocal Visible QA exited with code %s\\n' \"$qa_exit_code\";",
    "printf 'Press Enter to close this terminal...';",
    "read qa_close_prompt;",
  ].join(" ");
}

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

async function openNativeTerminal(command) {
  const shellCmd = buildShellCommand(command);
  const asStr = escapeAppleScriptString(shellCmd);

  // iTerm2 먼저 시도, 없으면 Terminal.app 으로 폴백
  const scripts = [
    [
      "tell application \"iTerm2\" to activate",
      "tell application \"iTerm2\"",
      "  set newWindow to (create window with default profile)",
      "  tell current session of newWindow",
      `    write text "${asStr}"`,
      "  end tell",
      "end tell",
    ].join("\n"),
    [
      "tell application \"Terminal\"",
      "  activate",
      `  do script "${asStr}"`,
      "end tell",
    ].join("\n"),
  ];

  for (const script of scripts) {
    try {
      await runAppleScript(script);
      return;
    } catch {}
  }
}

async function runVisibleQaSuite(suiteInput) {
  const suite = normalizeQaSuite(suiteInput);
  await openNativeTerminal(buildVisibleQaCommand(suite));
  return {
    ok: true,
    suite,
    mode: "local-visible",
    startedAt: new Date().toISOString(),
  };
}

function renderLoadError(win, error) {
  const message = String(error?.message || error || "Unknown load error");
  const escapedMessage = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #0f0f0f;
            color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main {
            width: min(720px, calc(100vw - 48px));
            border: 1px solid #333;
            border-radius: 18px;
            background: #161616;
            padding: 28px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          }
          h1 { margin: 0 0 12px; font-size: 18px; }
          p { margin: 0; color: #b7b7b7; line-height: 1.6; }
          code {
            display: block;
            margin-top: 16px;
            padding: 12px;
            border-radius: 10px;
            background: #0b0b0b;
            color: #ff9aa8;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Architecture Map을 불러오지 못했습니다.</h1>
          <p>앱 패키지 안의 화면 파일을 여는 중 문제가 생겼습니다. 아래 메시지를 확인해 주세요.</p>
          <code>${escapedMessage}</code>
        </main>
      </body>
    </html>
  `)}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    title: "Global X Pass Architecture Map",
    backgroundColor: "#0f0f0f",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  ipcMain.handle("open:terminal", (_event, command) => {
    return openNativeTerminal(command ?? "");
  });

  ipcMain.handle("map:read-data", () => {
    const jsonPath = path.join(projectRoot, "src", "generated", "architectureMap.json");
    try {
      const content = fs.readFileSync(jsonPath, "utf8");
      return { ok: true, data: JSON.parse(content) };
    } catch (err) {
      return { ok: false, error: String(err?.message ?? err) };
    }
  });

  ipcMain.handle("map:refresh", () => {
    return new Promise((resolve) => {
      const scriptPath = path.join(projectRoot, "scripts", "generate-architecture-map.mjs");
      let output = "";
      const child = spawn("/bin/zsh", ["-l", "-c", `node "${scriptPath}"`], { cwd: projectRoot });
      child.stdout.on("data", (d) => { output += d.toString(); });
      child.stderr.on("data", (d) => { output += d.toString(); });
      child.on("close", (code) => resolve({ ok: code === 0, output, code }));
      child.on("error", (err) => resolve({ ok: false, output: err.message, code: -1 }));
    });
  });

  ipcMain.handle("blog-ai:analyze-style", async (_event, payload) => {
    try {
      return await analyzeBlogStyleProfile(payload);
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message ?? err),
      };
    }
  });

  ipcMain.handle("blog-ai:generate", async (_event, payload) => {
    try {
      return await generateBlogDraft(payload);
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message ?? err),
      };
    }
  });

  ipcMain.handle("blog-ai:revise", async (_event, payload) => {
    try {
      return await reviseBlogDraft(payload);
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message ?? err),
      };
    }
  });

  ipcMain.handle("qa:read-runs", async () => {
    try {
      return await readQaWorkflowRuns();
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message ?? err),
        statusCode: err?.statusCode ?? null,
        needsToken: err?.statusCode === 401 || err?.statusCode === 403 || err?.statusCode === 404,
      };
    }
  });

  ipcMain.handle("qa:trigger-run", async (_event, suite) => {
    try {
      return await triggerQaWorkflowRun(suite);
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message ?? err),
        statusCode: err?.statusCode ?? null,
        needsToken: err?.statusCode === 401 || err?.statusCode === 403 || err?.statusCode === 404,
      };
    }
  });

  ipcMain.handle("qa:run-visible", async (_event, suite) => {
    try {
      return await runVisibleQaSuite(suite);
    } catch (err) {
      return {
        ok: false,
        error: String(err?.message ?? err),
        statusCode: err?.statusCode ?? null,
      };
    }
  });

  ipcMain.handle("qa-credentials:get-status", () => {
    return { ok: true, connected: hasStoredQaCredentials() };
  });

  ipcMain.handle("qa-credentials:save", (_event, credentials) => {
    try {
      writeStoredQaCredentials(credentials);
      return { ok: true, connected: true };
    } catch (err) {
      return {
        ok: false,
        connected: false,
        error: String(err?.message ?? err),
      };
    }
  });

  ipcMain.handle("qa-credentials:clear", () => {
    clearStoredQaCredentials();
    return { ok: true, connected: false };
  });

  ipcMain.handle("github-token:get-status", () => {
    return { ok: true, connected: Boolean(readStoredGithubToken()) };
  });

  ipcMain.handle("github-token:save", async (_event, token) => {
    try {
      writeStoredGithubToken(token);
      await readQaWorkflowRuns();
      return { ok: true, connected: true };
    } catch (err) {
      clearStoredGithubToken();
      return {
        ok: false,
        connected: false,
        error: String(err?.message ?? err),
        statusCode: err?.statusCode ?? null,
      };
    }
  });

  ipcMain.handle("github-token:clear", () => {
    clearStoredGithubToken();
    return { ok: true, connected: false };
  });

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    const error = new Error(`${errorDescription} (${errorCode})\n${validatedURL}`);
    console.error("[architecture-app] failed to load", error);
    renderLoadError(win, error);
  });

  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error(`[architecture-app] renderer: ${message} (${sourceId}:${line})`);
    }
  });

  win.on("closed", () => {
    ipcMain.removeHandler("open:terminal");
    ipcMain.removeHandler("map:read-data");
    ipcMain.removeHandler("map:refresh");
    ipcMain.removeHandler("blog-ai:analyze-style");
    ipcMain.removeHandler("blog-ai:generate");
    ipcMain.removeHandler("blog-ai:revise");
    ipcMain.removeHandler("qa:read-runs");
    ipcMain.removeHandler("qa:trigger-run");
    ipcMain.removeHandler("qa:run-visible");
    ipcMain.removeHandler("qa-credentials:get-status");
    ipcMain.removeHandler("qa-credentials:save");
    ipcMain.removeHandler("qa-credentials:clear");
    ipcMain.removeHandler("github-token:get-status");
    ipcMain.removeHandler("github-token:save");
    ipcMain.removeHandler("github-token:clear");
  });

  if (isDev) {
    void win.loadURL(architectureEntry).catch((error) => renderLoadError(win, error));
  } else {
    void win.loadFile(architectureEntry).catch((error) => renderLoadError(win, error));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  if (!projectRoot) projectRoot = resolveProjectRoot();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
