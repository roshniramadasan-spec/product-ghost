const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require("electron");
const path = require("path");
const { initDatabase } = require("./database");
const { registerIpcHandlers } = require("./ipc");
const { startEngine, stopEngine, setMainWindow } = require("./nudgeManager");
const { getSetting } = require("./database");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try { if (require("electron-squirrel-startup")) app.quit(); } catch {}


let mainWindow = null;
let tray = null;
let isQuitting = false;

const isDev = !app.isPackaged;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 700,
    minHeight: 500,
    show: false,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: process.platform === "win32" ? {
      color: "#09090b",
      symbolColor: "#a1a1aa",
      height: 40,
    } : undefined,
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.once("ready-to-show", () => {
    const onboarded = getSetting("onboarding_complete");
    if (onboarded === "true") {
      // Don't auto-show — lives in tray
    } else {
      mainWindow.show();
    }
  });

  setMainWindow(mainWindow);
  return mainWindow;
}

function createTray() {
  // Create a simple ghost icon using nativeImage
  const iconSize = process.platform === "darwin" ? 18 : 24;
  const icon = createGhostIcon(iconSize);

  tray = new Tray(icon);
  tray.setToolTip("ProductGhost — Your silent PM coach");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "👻 ProductGhost",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Open Dashboard",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: "Trigger Nudge Now",
      click: async () => {
        const { triggerManualNudge } = require("./nudgeManager");
        await triggerManualNudge();
      },
    },
    { type: "separator" },
    {
      id: "toggle",
      label: "Enabled",
      type: "checkbox",
      checked: getSetting("enabled") !== "false",
      click: (menuItem) => {
        const { setSetting } = require("./database");
        const newVal = menuItem.checked ? "true" : "false";
        setSetting("enabled", newVal);
        if (newVal === "true") startEngine();
        else stopEngine();
        updateTrayIcon(menuItem.checked);
      },
    },
    { type: "separator" },
    {
      label: "Quit ProductGhost",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createGhostIcon(size) {
  // Create a simple colored circle as tray icon
  // In production, replace with a proper .ico / .png asset
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="#8b5cf6"/>
    <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.6}">👻</text>
  </svg>`;

  // Use a simple approach — create from a data URL buffer
  const buf = Buffer.from(canvas);
  const img = nativeImage.createFromBuffer(buf);
  // Fallback: create a simple 16x16 purple dot
  return nativeImage.createEmpty();
}

function updateTrayIcon(enabled) {
  tray.setToolTip(
    enabled
      ? "ProductGhost — Active"
      : "ProductGhost — Paused"
  );
}

// ── App Lifecycle ──────────────────────────────────────────────────

app.whenReady().then(() => {
  // Initialize database first
  initDatabase();

  // Register IPC handlers
  registerIpcHandlers();

  // Create window and tray
  createMainWindow();
  createTray();

  // Start the capture/nudge engine
  const enabled = getSetting("enabled");
  if (enabled !== "false") {
    startEngine();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  stopEngine();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Don't quit — keep running in tray
  }
});
