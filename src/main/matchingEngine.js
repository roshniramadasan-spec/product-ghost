const {
  getAllEntries,
  searchByTriggers,
  getRecentNudgeIds,
  getSetting,
} = require("./database");

/**
 * Broad context mapping: maps general app categories / activities
 * to PM topics so we always have something relevant to say.
 */
const BROAD_CONTEXT_MAP = {
  // Chat / messaging apps → communication & management frameworks
  chat: ["communication", "team", "feedback", "stakeholder", "manager", "1:1"],
  messaging: ["communication", "team", "feedback", "stakeholder", "manager"],
  // General productivity → strategy & prioritization
  productivity: ["prioritization", "strategy", "planning", "decision"],
  // Coding → execution & shipping
  coding: ["ship", "launch", "mvp", "sprint planning", "decision"],
  development: ["ship", "launch", "mvp", "sprint planning"],
  // Browsing → research & strategy
  browsing: ["research", "strategy", "competitive analysis"],
  research: ["user research", "discovery", "customer interview"],
  // Meetings → management & communication
  meeting: ["meeting", "1:1", "manager", "feedback", "communication"],
  // Writing → specs & strategy
  writing: ["product spec", "prd", "strategy", "planning"],
  // Design → user experience
  design: ["design", "prototype", "user research", "discovery"],
  // Email → stakeholder communication
  email: ["communication", "stakeholder", "feedback"],
  // General / unknown → rotate through useful general frameworks
  general: ["strategy", "prioritization", "decision", "planning", "ship"],
};

/**
 * Given a screen context, find the best matching knowledge base entries.
 * Uses keyword-based matching with context triggers + recency filtering.
 * Falls back to broad context matching so there's always a nudge to deliver.
 */
function findMatches(screenContext) {
  const { app, work_type, topics, description } = screenContext;

  // Build keyword list from all context signals
  const keywords = [
    ...(topics || []),
    app,
    work_type,
    ...extractKeywords(description || ""),
  ].filter(Boolean);

  if (keywords.length === 0) return [];

  // Search knowledge base with direct keyword matching
  let candidates = searchByTriggers(keywords);

  // Filter out recently shown nudges
  const cooldownHours = parseInt(getSetting("cooldown_hours") || "48", 10);
  const recentIds = getRecentNudgeIds(cooldownHours);
  let fresh = candidates.filter((c) => !recentIds.includes(c.id));

  // If no direct matches, try broad context matching
  if (fresh.length === 0) {
    const broadKeywords = getBroadKeywords(work_type, topics, app);
    if (broadKeywords.length > 0) {
      candidates = searchByTriggers(broadKeywords);
      fresh = candidates.filter((c) => !recentIds.includes(c.id));
    }
  }

  // If STILL no matches (all recently shown), pick a random unshown entry
  if (fresh.length === 0) {
    const allEntries = getAllEntries();
    const unshown = allEntries.filter((e) => !recentIds.includes(e.id));
    if (unshown.length > 0) {
      // Pick a random one and give it a score
      const pick = unshown[Math.floor(Math.random() * unshown.length)];
      pick.relevance_score = 1;
      fresh = [pick];
    } else {
      // Everything has been shown within cooldown — nothing to show
      return [];
    }
  }

  // Apply relevance threshold (only for keyword-matched candidates)
  const threshold = parseFloat(getSetting("relevance_threshold") || "0.3");
  const maxScore = fresh[0].relevance_score || 1;
  const qualified = fresh.filter(
    (c) => maxScore > 0 && (c.relevance_score || 0) / maxScore >= threshold
  );

  // If threshold filtered everything out, just take the best match
  const pool = qualified.length > 0 ? qualified : fresh.slice(0, 3);

  // Apply topic preferences (soft filter — prefer matching, don't require)
  const topicPrefsRaw = getSetting("topic_preferences");
  let topicPrefs = null;
  try {
    topicPrefs = JSON.parse(topicPrefsRaw);
  } catch {
    topicPrefs = null;
  }

  let results = pool;
  if (topicPrefs && Array.isArray(topicPrefs) && topicPrefs.length > 0) {
    const prefSet = new Set(topicPrefs.map((t) => t.toLowerCase()));
    const preferred = results.filter((r) =>
      r.tags.some((tag) => prefSet.has(tag.toLowerCase()))
    );
    if (preferred.length > 0) {
      results = preferred;
    }
  }

  return results.slice(0, 3);
}

/**
 * Get broad keywords based on the general type of work being done.
 */
function getBroadKeywords(workType, topics, app) {
  const keywords = [];
  const wt = (workType || "").toLowerCase();
  const appLower = (app || "").toLowerCase();

  // Map work_type to broad categories
  for (const [category, broadTopics] of Object.entries(BROAD_CONTEXT_MAP)) {
    if (wt.includes(category) || appLower.includes(category)) {
      keywords.push(...broadTopics);
    }
  }

  // Map specific well-known apps to broad topics
  const appTopicMap = {
    whatsapp: ["communication", "team", "feedback", "manager", "1:1"],
    telegram: ["communication", "team", "feedback"],
    discord: ["communication", "team", "community"],
    claude: ["strategy", "planning", "product spec", "decision", "research"],
    chatgpt: ["strategy", "planning", "product spec", "research"],
    chrome: ["research", "browsing", "competitive analysis"],
    firefox: ["research", "browsing"],
    edge: ["research", "browsing"],
    brave: ["research", "browsing"],
    spotify: ["productivity"],
    "file explorer": ["organization"],
    explorer: ["organization"],
    finder: ["organization"],
    notepad: ["writing", "planning", "product spec"],
    "notepad++": ["writing", "planning"],
    obsidian: ["writing", "planning", "strategy", "research"],
    "vs code": ["coding", "development", "ship"],
    cursor: ["coding", "development", "ship"],
    terminal: ["coding", "development"],
    powershell: ["coding", "development"],
  };

  for (const [appName, appTopics] of Object.entries(appTopicMap)) {
    if (appLower.includes(appName)) {
      keywords.push(...appTopics);
    }
  }

  // If nothing matched, use general topics
  if (keywords.length === 0) {
    keywords.push(...BROAD_CONTEXT_MAP.general);
  }

  return [...new Set(keywords)];
}

/**
 * Extract simple keywords from a description string.
 */
function extractKeywords(description) {
  const stopWords = new Set([
    "the", "a", "an", "is", "in", "at", "of", "on", "for", "to", "and",
    "or", "with", "their", "they", "this", "that", "user", "appears",
    "be", "are", "was", "were", "has", "have", "been", "being",
    "working", "window", "looks", "like",
  ]);

  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

module.exports = { findMatches };
