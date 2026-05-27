const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openTerminal: (command) => ipcRenderer.invoke("open:terminal", command),
  readMapData: () => ipcRenderer.invoke("map:read-data"),
  refreshMap: () => ipcRenderer.invoke("map:refresh"),
  analyzeBlogStyle: (payload) => ipcRenderer.invoke("blog-ai:analyze-style", payload),
  generateBlogDraft: (payload) => ipcRenderer.invoke("blog-ai:generate", payload),
  reviseBlogDraft: (payload) => ipcRenderer.invoke("blog-ai:revise", payload),
  readQaRuns: () => ipcRenderer.invoke("qa:read-runs"),
  readCompanyNewsRuns: () => ipcRenderer.invoke("company-news:read-runs"),
  triggerQaRun: (suite) => ipcRenderer.invoke("qa:trigger-run", suite),
  runVisibleQa: (suite) => ipcRenderer.invoke("qa:run-visible", suite),
  getQaCredentialsStatus: () => ipcRenderer.invoke("qa-credentials:get-status"),
  saveQaCredentials: (credentials) => ipcRenderer.invoke("qa-credentials:save", credentials),
  clearQaCredentials: () => ipcRenderer.invoke("qa-credentials:clear"),
  getGithubTokenStatus: () => ipcRenderer.invoke("github-token:get-status"),
  saveGithubToken: (token) => ipcRenderer.invoke("github-token:save", token),
  clearGithubToken: () => ipcRenderer.invoke("github-token:clear"),
});
