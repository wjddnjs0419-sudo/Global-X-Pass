const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openTerminal: (command) => ipcRenderer.invoke("open:terminal", command),
  readMapData: () => ipcRenderer.invoke("map:read-data"),
  refreshMap: () => ipcRenderer.invoke("map:refresh"),
});
