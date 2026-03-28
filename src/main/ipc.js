const { ipcMain } = require("electron");
const {
  getAllEntries,
  getEntryById,
  getNudgeHistory,
  getWeeklyStats,
  getAllSettings,
  getSetting,
  setSetting,
  saveNudge,
} = require("./database");
const {
  startEngine,
  stopEngine,
  restartEngine,
  triggerManualNudge,
} = require("./nudgeManager");

function registerIpcHandlers() {
  // ── Knowledge Base ───────────────────────────────────────────────
  ipcMain.handle("kb:getAll", () => getAllEntries());
  ipcMain.handle("kb:getById", (_e, id) => getEntryById(id));

  // ── Nudge History ────────────────────────────────────────────────
  ipcMain.handle("nudge:getHistory", (_e, limit) => getNudgeHistory(limit));
  ipcMain.handle("nudge:save", (_e, nudgeHistoryId) => {
    saveNudge(nudgeHistoryId);
    return { ok: true };
  });
  ipcMain.handle("nudge:triggerManual", async () => {
    await triggerManualNudge();
    return { ok: true };
  });

  // ── Stats ────────────────────────────────────────────────────────
  ipcMain.handle("stats:weekly", () => getWeeklyStats());

  // ── Settings ─────────────────────────────────────────────────────
  ipcMain.handle("settings:getAll", () => getAllSettings());
  ipcMain.handle("settings:get", (_e, key) => getSetting(key));
  ipcMain.handle("settings:set", (_e, key, value) => {
    setSetting(key, value);

    // React to certain settings changes
    if (key === "enabled") {
      if (value === "true") startEngine();
      else stopEngine();
    }
    if (key === "capture_interval" || key === "max_nudges_per_day") {
      restartEngine();
    }

    return { ok: true };
  });

  // ── Engine Control ───────────────────────────────────────────────
  ipcMain.handle("engine:start", () => {
    startEngine();
    return { ok: true };
  });
  ipcMain.handle("engine:stop", () => {
    stopEngine();
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
