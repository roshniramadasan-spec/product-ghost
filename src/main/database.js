const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");
const { seedEntries } = require("./seedData");

let db = null;

function getDbPath() {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "productghost.db");
}

function initDatabase() {
  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id TEXT PRIMARY KEY,
      guest TEXT NOT NULL,
      episode TEXT NOT NULL,
      framework TEXT NOT NULL,
      tags TEXT NOT NULL,
      quote TEXT NOT NULL,
      advice TEXT NOT NULL,
      context_triggers TEXT NOT NULL,
      podcast_url TEXT DEFAULT NULL,
      embedding TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nudge_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_id TEXT NOT NULL,
      context_description TEXT,
      similarity_score REAL,
      shown_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      saved INTEGER DEFAULT 0,
      FOREIGN KEY (knowledge_id) REFERENCES knowledge_base(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      nudges_shown INTEGER DEFAULT 0,
      nudges_saved INTEGER DEFAULT 0,
      top_topic TEXT DEFAULT NULL
    );
  `);

  seedDatabase();
  initDefaultSettings();

  return db;
}

function seedDatabase() {
  const count = db.prepare("SELECT COUNT(*) as c FROM knowledge_base").get();
  if (count.c > 0) return;

  const insert = db.prepare(`
    INSERT INTO knowledge_base (id, guest, episode, framework, tags, quote, advice, context_triggers, podcast_url)
    VALUES (@id, @guest, @episode, @framework, @tags, @quote, @advice, @context_triggers, @podcast_url)
  `);

  const tx = db.transaction(() => {
    for (const entry of seedEntries) {
      insert.run({
        ...entry,
        tags: JSON.stringify(entry.tags),
        context_triggers: JSON.stringify(entry.context_triggers),
        podcast_url: entry.podcast_url || null,
      });
    }
  });

  tx();
}

function initDefaultSettings() {
  const defaults = {
    enabled: "true",
    frequency: "4",
    capture_interval: "4",
    max_nudges_per_day: "6",
    relevance_threshold: "0.3",
    cooldown_hours: "48",
    topic_preferences: JSON.stringify([
      "growth", "strategy", "leadership", "user-research",
      "metrics", "prioritization", "shipping", "management",
    ]),
    privacy_screen_capture: "true",
    onboarding_complete: "false",
    theme: "system",
    api_key: "",
    api_provider: "openai",
  };

  const upsert = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      upsert.run(key, value);
    }
  });
  tx();
}

/* ── Query Helpers ────────────────────────────────────────────────── */

function getAllEntries() {
  return db
    .prepare("SELECT * FROM knowledge_base")
    .all()
    .map(parseEntry);
}

function getEntryById(id) {
  const row = db.prepare("SELECT * FROM knowledge_base WHERE id = ?").get(id);
  return row ? parseEntry(row) : null;
}

function parseEntry(row) {
  return {
    ...row,
    tags: JSON.parse(row.tags),
    context_triggers: JSON.parse(row.context_triggers),
  };
}

function searchByTriggers(keywords) {
  const entries = getAllEntries();
  const lower = keywords.map((k) => k.toLowerCase());

  return entries
    .map((entry) => {
      const triggers = entry.context_triggers.map((t) => t.toLowerCase());
      const tagList = entry.tags.map((t) => t.toLowerCase());
      let score = 0;

      for (const kw of lower) {
        for (const trigger of triggers) {
          if (trigger.includes(kw) || kw.includes(trigger)) score += 2;
        }
        for (const tag of tagList) {
          if (tag.includes(kw) || kw.includes(tag)) score += 1;
        }
        // Also match against framework name and advice text
        if (entry.framework.toLowerCase().includes(kw)) score += 3;
        if (entry.advice.toLowerCase().includes(kw)) score += 0.5;
      }

      return { ...entry, relevance_score: score };
    })
    .filter((e) => e.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

/* ── Nudge History ────────────────────────────────────────────────── */

function recordNudge(knowledgeId, contextDescription, similarityScore) {
  // Store local time explicitly so renderer displays correct time
  const now = new Date();
  const localISO = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');
  db.prepare(
    `INSERT INTO nudge_history (knowledge_id, context_description, similarity_score, shown_at)
     VALUES (?, ?, ?, ?)`
  ).run(knowledgeId, contextDescription, similarityScore, localISO);

  // Update daily stats
  const today = new Date().toISOString().split("T")[0];
  db.prepare(
    `INSERT INTO daily_stats (date, nudges_shown, nudges_saved)
     VALUES (?, 1, 0)
     ON CONFLICT(date) DO UPDATE SET nudges_shown = nudges_shown + 1`
  ).run(today);
}

function saveNudge(nudgeHistoryId) {
  db.prepare("UPDATE nudge_history SET saved = 1 WHERE id = ?").run(
    nudgeHistoryId
  );

  const today = new Date().toISOString().split("T")[0];
  db.prepare(
    `UPDATE daily_stats SET nudges_saved = nudges_saved + 1 WHERE date = ?`
  ).run(today);
}

function getRecentNudgeIds(hoursBack = 48) {
  const cutoff = new Date(Date.now() - hoursBack * 3600000).toISOString();
  return db
    .prepare(
      "SELECT knowledge_id FROM nudge_history WHERE shown_at > ? GROUP BY knowledge_id"
    )
    .all(cutoff)
    .map((r) => r.knowledge_id);
}

function getNudgesShownToday() {
  const today = new Date().toISOString().split("T")[0];
  const row = db
    .prepare("SELECT nudges_shown FROM daily_stats WHERE date = ?")
    .get(today);
  return row ? row.nudges_shown : 0;
}

function getNudgeHistory(limit = 50) {
  return db
    .prepare(
      `SELECT nh.*, kb.framework, kb.guest, kb.advice, kb.quote, kb.episode, kb.tags
       FROM nudge_history nh
       JOIN knowledge_base kb ON nh.knowledge_id = kb.id
       ORDER BY nh.shown_at DESC
       LIMIT ?`
    )
    .all(limit)
    .map((row) => ({
      ...row,
      tags: JSON.parse(row.tags),
    }));
}

function getWeeklyStats() {
  const weekAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const rows = db
    .prepare("SELECT * FROM daily_stats WHERE date >= ? ORDER BY date")
    .all(weekAgo);

  const totalShown = rows.reduce((s, r) => s + r.nudges_shown, 0);
  const totalSaved = rows.reduce((s, r) => s + r.nudges_saved, 0);

  // Top topic from recent nudges
  const topTopic = db
    .prepare(
      `SELECT kb.tags, COUNT(*) as cnt
       FROM nudge_history nh
       JOIN knowledge_base kb ON nh.knowledge_id = kb.id
       WHERE nh.shown_at > ?
       GROUP BY kb.tags
       ORDER BY cnt DESC
       LIMIT 1`
    )
    .get(new Date(Date.now() - 7 * 86400000).toISOString());

  return {
    nudges_shown: totalShown,
    nudges_saved: totalSaved,
    top_topic: topTopic ? JSON.parse(topTopic.tags)[0] : "—",
    days: rows,
  };
}

/* ── Settings ─────────────────────────────────────────────────────── */

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
  ).run(key, value, value);
}

function getAllSettings() {
  const rows = db.prepare("SELECT * FROM settings").all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

module.exports = {
  initDatabase,
  getAllEntries,
  getEntryById,
  searchByTriggers,
  recordNudge,
  saveNudge,
  getRecentNudgeIds,
  getNudgesShownToday,
  getNudgeHistory,
  getWeeklyStats,
  getSetting,
  setSetting,
  getAllSettings,
};
