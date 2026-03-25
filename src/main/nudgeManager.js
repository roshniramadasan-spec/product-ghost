const { Notification } = require("electron");
const { captureScreen, analyzeScreenContext } = require("./captureEngine");
const { findMatches } = require("./matchingEngine");
const {
  recordNudge,
  getNudgesShownToday,
  getSetting,
} = require("./database");

let captureInterval = null;
let mainWindowRef = null;

function setMainWindow(win) {
  mainWindowRef = win;
}

/**
 * Start the periodic screen capture → analysis → nudge cycle.
 */
function startEngine() {
  if (captureInterval) return;

  const intervalMin = parseInt(getSetting("capture_interval") || "4", 10);
  const intervalMs = intervalMin * 60 * 1000;

  console.log(`[NudgeManager] Starting engine, interval: ${intervalMin}min`);

  // Run once after a short delay, then on interval
  setTimeout(() => runCycle(), 10000);
  captureInterval = setInterval(() => runCycle(), intervalMs);
}

function stopEngine() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  console.log("[NudgeManager] Engine stopped");
}

function restartEngine() {
  stopEngine();
  startEngine();
}

async function runCycle() {
  try {
    const enabled = getSetting("enabled");
    if (enabled === "false") return;

    // Check daily limit
    const maxPerDay = parseInt(getSetting("max_nudges_per_day") || "6", 10);
    const shownToday = getNudgesShownToday();
    if (shownToday >= maxPerDay) {
      console.log("[NudgeManager] Daily nudge limit reached");
      return;
    }

    // 1. Capture screen
    const captureData = await captureScreen();

    let screenContext;
    if (captureData) {
      // 2. Analyze with AI
      screenContext = await analyzeScreenContext(captureData);
    } else {
      // Screen capture disabled or unchanged — use mock for demo
      screenContext = await analyzeScreenContext(null);
    }

    if (!screenContext) return;

    console.log("[NudgeManager] Screen context:", screenContext.description);

    // 3. Find matching frameworks
    const matches = findMatches(screenContext);
    if (matches.length === 0) {
      console.log("[NudgeManager] No relevant matches found");
      return;
    }

    // 4. Deliver the top match as a nudge
    const topMatch = matches[0];
    deliverNudge(topMatch, screenContext);
  } catch (err) {
    console.error("[NudgeManager] Cycle error:", err.message);
  }
}

function deliverNudge(entry, screenContext) {
  const notification = new Notification({
    title: `💡 ${entry.framework}`,
    body: buildNudgeBody(entry, screenContext),
    silent: true,
    timeoutType: "default",
  });

  notification.on("click", () => {
    // Open "Learn More" window via IPC
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send("show-learn-more", entry);
      mainWindowRef.show();
    }
  });

  notification.show();

  // Record in history
  recordNudge(
    entry.id,
    screenContext.description,
    entry.relevance_score || 0
  );

  // Notify renderer to update feed
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send("nudge-delivered", {
      entry,
      context: screenContext.description,
      timestamp: Date.now(),
    });
  }

  console.log(`[NudgeManager] Nudge delivered: ${entry.framework}`);
}

function buildNudgeBody(entry, screenContext) {
  const appMention = screenContext.app
    ? `Looks like you're in ${screenContext.app}. `
    : "";
  const guestMention = entry.guest ? `${entry.guest} suggests: ` : "";

  // Keep it short for notification
  const advice = entry.advice.length > 120
    ? entry.advice.substring(0, 117) + "…"
    : entry.advice;

  return `${appMention}${guestMention}${advice}`;
}

/**
 * Manually trigger a nudge cycle (for testing / demo).
 */
async function triggerManualNudge() {
  await runCycle();
}

module.exports = {
  startEngine,
  stopEngine,
  restartEngine,
  setMainWindow,
  triggerManualNudge,
};
