const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openTerminal: (command) => ipcRenderer.invoke("open:terminal", command),
  readMapData: () => ipcRenderer.invoke("map:read-data"),
  refreshMap: () => ipcRenderer.invoke("map:refresh"),
  readQaRuns: () => ipcRenderer.invoke("qa:read-runs"),
  triggerQaRun: (suite) => ipcRenderer.invoke("qa:trigger-run", suite),
  runVisibleQa: (suite) => ipcRenderer.invoke("qa:run-visible", suite),
  getGithubTokenStatus: () => ipcRenderer.invoke("github-token:get-status"),
  saveGithubToken: (token) => ipcRenderer.invoke("github-token:save", token),
  clearGithubToken: () => ipcRenderer.invoke("github-token:clear"),
});
