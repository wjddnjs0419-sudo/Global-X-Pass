const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("node:path");
const os = require("node:os");
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

function escapeAppleScriptString(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildShellCommand(command) {
  const escapedRoot = projectRoot.replace(/'/g, "'\\''");
  return command
    ? `cd '${escapedRoot}' && ${command}`
    : `cd '${escapedRoot}'`;
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
