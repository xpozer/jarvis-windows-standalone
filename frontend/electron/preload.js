const { contextBridge, ipcRenderer } = require("electron");

// Sicherer IPC-Bridge zwischen Electron und React
contextBridge.exposeInMainWorld("electronAPI", {
  // Fenster-Steuerung
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close:    () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // Plattform-Info
  platform: process.platform,
  isElectron: true,
});
