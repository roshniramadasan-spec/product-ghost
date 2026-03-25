const {
  searchByTriggers,
  getRecentNudgeIds,
  getSetting,
} = require("./database");

/**
 * Given an AI-generated screen context, find the best matching knowledge base entries.
 * Uses keyword-based matching with context triggers + recency filtering.
 *
 * Returns top 1-3 matches that pass the relevance threshold.
 */
function findMatches(screenContext) {
  const { app, work_type, topics, description } = screenContext;

  // Build keyword list from all context signals
  const keywords = [
    ...(topics || []),
    app,
    work_type,
    // Extract additional keywords from description
    ...extractKeywords(description || ""),
  ].filter(Boolean);

  if (keywords.length === 0) return [];

  // Search knowledge base
  const candidates = searchByTriggers(keywords);

  // Filter out recently shown nudges
  const cooldownHours = parseInt(getSetting("cooldown_hours") || "48", 10);
  const recentIds = getRecentNudgeIds(cooldownHours);
  const fresh = candidates.filter((c) => !recentIds.includes(c.id));

  // Apply relevance threshold
  const threshold = parseFloat(getSetting("relevance_threshold") || "0.3");
  // Normalize scores: the max possible varies, so we use a simple cutoff
  const maxScore = fresh.length > 0 ? fresh[0].relevance_score : 1;
  const qualified = fresh.filter(
    (c) => maxScore > 0 && c.relevance_score / maxScore >= threshold
  );

  // Apply topic preferences
  const topicPrefsRaw = getSetting("topic_preferences");
  let topicPrefs = null;
  try {
    topicPrefs = JSON.parse(topicPrefsRaw);
  } catch {
    topicPrefs = null;
  }

  let results = qualified;
  if (topicPrefs && Array.isArray(topicPrefs) && topicPrefs.length > 0) {
    const prefSet = new Set(topicPrefs.map((t) => t.toLowerCase()));
    const preferred = results.filter((r) =>
      r.tags.some((tag) => prefSet.has(tag.toLowerCase()))
    );
    // If we have preferred results use them, otherwise fall back to all qualified
    if (preferred.length > 0) {
      results = preferred;
    }
  }

  // Return top 3
  return results.slice(0, 3);
}

/**
 * Extract simple keywords from a description string.
 */
function extractKeywords(description) {
  const stopWords = new Set([
    "the", "a", "an", "is", "in", "at", "of", "on", "for", "to", "and",
    "or", "with", "their", "they", "this", "that", "user", "appears",
    "be", "are", "was", "were", "has", "have", "been", "being",
  ]);

  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

module.exports = { findMatches };
