const { BrowserWindow, screen } = require("electron");
const path = require("path");

let nudgeWindow = null;
let dismissTimer = null;

const NUDGE_WIDTH = 420;
const NUDGE_HEIGHT = 220;
const MARGIN = 16;
const AUTO_DISMISS_MS = 15000; // 15 seconds

/**
 * Show a floating overlay nudge in the bottom-right corner of the screen.
 * This is an always-on-top frameless window that appears over everything.
 */
function showNudgeOverlay(entry, screenContext, onLearnMore) {
  // If already showing, close the old one first
  if (nudgeWindow && !nudgeWindow.isDestroyed()) {
    nudgeWindow.close();
    nudgeWindow = null;
  }
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;

  nudgeWindow = new BrowserWindow({
    width: NUDGE_WIDTH,
    height: NUDGE_HEIGHT,
    x: screenW - NUDGE_WIDTH - MARGIN,
    y: screenH - NUDGE_HEIGHT - MARGIN,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const appMention = screenContext?.app
    ? `Looks like you're in ${screenContext.app}. `
    : "";
  const body = `${appMention}${entry.advice}`;

  const html = buildNudgeHTML(entry, body);
  nudgeWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  nudgeWindow.once("ready-to-show", () => {
    if (nudgeWindow && !nudgeWindow.isDestroyed()) {
      nudgeWindow.showInactive();
    }
  });

  // Listen for dismiss/learn-more clicks from the nudge window
  const { ipcMain } = require("electron");

  const dismissHandler = () => {
    closeNudgeOverlay();
  };

  const learnMoreHandler = () => {
    closeNudgeOverlay();
    if (onLearnMore) onLearnMore(entry);
  };

  ipcMain.once("nudge-overlay-dismiss", dismissHandler);
  ipcMain.once("nudge-overlay-learn-more", learnMoreHandler);

  // Auto-dismiss after 15 seconds
  dismissTimer = setTimeout(() => {
    closeNudgeOverlay();
  }, AUTO_DISMISS_MS);

  nudgeWindow.on("closed", () => {
    nudgeWindow = null;
    ipcMain.removeListener("nudge-overlay-dismiss", dismissHandler);
    ipcMain.removeListener("nudge-overlay-learn-more", learnMoreHandler);
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  });
}

function closeNudgeOverlay() {
  if (nudgeWindow && !nudgeWindow.isDestroyed()) {
    nudgeWindow.close();
    nudgeWindow = null;
  }
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

function buildNudgeHTML(entry, body) {
  const tags = Array.isArray(entry.tags)
    ? entry.tags
    : (() => { try { return JSON.parse(entry.tags); } catch { return []; } })();

  const tagHTML = tags
    .slice(0, 3)
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: transparent;
    overflow: hidden;
    -webkit-app-region: no-drag;
    cursor: default;
  }
  .card {
    background: #18181b;
    border: 1px solid #3f3f46;
    border-radius: 16px;
    padding: 18px 20px 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15);
    width: ${NUDGE_WIDTH - 2}px;
    max-height: ${NUDGE_HEIGHT - 2}px;
    overflow: hidden;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ghost { font-size: 16px; }
  .label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #a78bfa;
  }
  .close-btn {
    background: none;
    border: none;
    color: #71717a;
    font-size: 18px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    line-height: 1;
  }
  .close-btn:hover { background: #27272a; color: #a1a1aa; }
  .framework {
    font-size: 15px;
    font-weight: 700;
    color: #f4f4f5;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .guest {
    font-size: 11px;
    color: #a1a1aa;
    margin-bottom: 6px;
  }
  .body {
    font-size: 12.5px;
    color: #d4d4d8;
    line-height: 1.55;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tags { display: flex; gap: 4px; }
  .tag {
    font-size: 10px;
    padding: 2px 8px;
    background: #27272a;
    color: #a1a1aa;
    border-radius: 4px;
  }
  .learn-more {
    background: #7c3aed;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .learn-more:hover { background: #6d28d9; }
  .progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: #7c3aed;
    border-radius: 0 0 16px 16px;
    animation: shrink ${AUTO_DISMISS_MS}ms linear forwards;
  }
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title-row">
        <span class="ghost">👻</span>
        <span class="label">ProductGhost</span>
      </div>
      <button class="close-btn" onclick="dismiss()">×</button>
    </div>
    <div class="framework">💡 ${escapeHTML(entry.framework)}</div>
    <div class="guest">${escapeHTML(entry.guest)} · ${escapeHTML(entry.episode)}</div>
    <div class="body">${escapeHTML(body)}</div>
    <div class="footer">
      <div class="tags">${tagHTML}</div>
      <button class="learn-more" onclick="learnMore()">Learn More</button>
    </div>
    <div class="progress"></div>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    function dismiss() { ipcRenderer.send('nudge-overlay-dismiss'); }
    function learnMore() { ipcRenderer.send('nudge-overlay-learn-more'); }
  </script>
</body>
</html>`;
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { showNudgeOverlay, closeNudgeOverlay };
