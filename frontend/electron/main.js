const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// ── Tray-Icon (16x16 PNG als Base64 — blauer Punkt) ───────────────────────────
// Wird zur Laufzeit erzeugt, kein externes Asset nötig
function createTrayIcon() {
  const { nativeImage } = require("electron");
  // 16x16 blauer Kreis als PNG (base64)
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA" +
    "AXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABzSURBVHgB7ZKxCcAgEEW/kQTcQnAHl3ALYR0H" +
    "cAFHcAkHcBEHcAHJAoKFkCtYWAQCKf5XHDz43n8P4A9SSu0RQngAuABYPqoHgFJKtdbWe+8BYFVV" +
    "1RjDGEMpJedcaq0NIQQAYIzRWmuMMcYYAMCvB3ECMTQXpKAAAAAASUVORK5CYII="
  );
  return icon;
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width - 100),
    height: Math.min(900, height - 60),
    minWidth: 900,
    minHeight: 600,
    // Rahmenloses Fenster
    frame: false,
    titleBarStyle: "hidden",
    transparent: false,
    backgroundColor: "#050508",
    // Fenster-Eigenschaften
    show: false,
    center: true,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      // Mikrofon erlauben ohne Nachfrage
      webSecurity: true,
    },
  });

  // Dev: Vite Dev Server, Prod: gebaute Dateien
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // DevTools nur in Dev
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Schließen → in Tray minimieren statt beenden
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      if (process.platform === "darwin") app.dock?.hide();
    }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

function createTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "JARVIS öffnen",
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        else createWindow();
        if (process.platform === "darwin") app.dock?.show();
      },
    },
    { type: "separator" },
    {
      label: "Beenden",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("JARVIS — System bereit");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });

  // Windows: Single-click öffnet auch
  tray.on("click", () => {
    if (process.platform === "win32") {
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    }
  });
}

// ── IPC Handler ───────────────────────────────────────────────────────────────
// Fenster-Steuerung von der React-App aus

ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});

ipcMain.on("window-close", () => {
  mainWindow?.hide();
});

ipcMain.handle("window-is-maximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

// Mikrofon-Berechtigung
app.on("web-contents-created", (_, contents) => {
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media" || permission === "microphone") {
      callback(true); // Automatisch erlauben
    } else {
      callback(false);
    }
  });
});

// ── App-Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createTray();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else { mainWindow?.show(); mainWindow?.focus(); }
  });
});

app.on("window-all-closed", () => {
  // Nicht beenden — läuft im Tray weiter
  if (process.platform !== "darwin") {
    // app.quit() bewusst nicht aufrufen
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});
