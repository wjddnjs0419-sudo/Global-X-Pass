const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("node:path");
const os = require("node:os");
const https = require("node:https");
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
const QA_TEST_SUITES = new Set(["smoke", "admin-auth", "admin-post-cud", "admin-program-mgmt", "all"]);
const QA_VISIBLE_SPECS_BY_SUITE = {
  smoke: ["tests/qa/production-smoke.spec.ts", "tests/qa/admin-complex.spec.ts"],
  "admin-auth": ["tests/qa/admin-auth.spec.ts"],
  "admin-post-cud": ["tests/qa/admin-post-cud.spec.ts"],
  "admin-program-mgmt": ["tests/qa/admin-program-mgmt.spec.ts"],
  all: [],
};

function getGithubTokenPath() {
  return path.join(app.getPath("userData"), GITHUB_TOKEN_FILE);
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
  const match = title.match(/(?:On-Demand QA\s*\/\s*)?(smoke|admin-auth|admin-post-cud|admin-program-mgmt|all)/);
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
  const specArgs = specs.map(shellQuote).join(" ");
  const testCommand = `npx playwright test${specArgs ? ` ${specArgs}` : ""} --headed --project=chromium`;

  return [
    "run_visible_qa() {",
    `  printf '\\n▶ Local Visible QA: ${suite}\\n';`,
    "  if [ -f .env.qa ]; then",
    "    printf 'Loading .env.qa for QA credentials...\\n';",
    "    set -a; source .env.qa; set +a;",
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
    "    printf 'Create .env.qa in the project root, or export QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD, QA_ADMIN_MFA_SECRET, then run again.\\n';",
    "    printf 'Tip: cp .env.qa.example .env.qa && edit .env.qa\\n';",
    "    return 64;",
    "  fi;",
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
    ipcMain.removeHandler("qa:read-runs");
    ipcMain.removeHandler("qa:trigger-run");
    ipcMain.removeHandler("qa:run-visible");
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
