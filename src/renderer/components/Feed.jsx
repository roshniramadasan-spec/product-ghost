import React, { useState, useEffect } from "react";

const api = window.electronAPI;

export default function Feed({ onLearnMore }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();

    // Listen for new nudges
    const unsub = api?.on?.("nudge-delivered", () => {
      loadHistory();
    });
    return () => unsub?.();
  }, []);

  async function loadHistory() {
    try {
      const data = await api?.nudge.getHistory(50);
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(nudgeId) {
    await api?.nudge.save(nudgeId);
    setHistory((prev) =>
      prev.map((h) => (h.id === nudgeId ? { ...h, saved: 1 } : h))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Nudge Feed</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Your contextual PM insights, delivered as you work.
          </p>
        </div>

        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {history.map((item, i) => (
              <NudgeCard
                key={item.id}
                item={item}
                index={i}
                onLearnMore={onLearnMore}
                onSave={handleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NudgeCard({ item, index, onLearnMore, onSave }) {
  const time = new Date(item.shown_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const tagColors = {
    growth: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    strategy: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    leadership: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    prioritization: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "user-research": "bg-pink-500/10 text-pink-400 border-pink-500/20",
    management: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    analytics: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    shipping: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    retention: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  return (
    <div
      className="group bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/60 transition-all animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <h3 className="text-sm font-semibold text-zinc-100">
            {item.framework}
          </h3>
        </div>
        <span className="text-[11px] text-zinc-500 shrink-0">{time}</span>
      </div>

      {/* Guest & Episode */}
      <p className="text-xs text-zinc-400 mb-2">
        {item.guest} — <span className="text-zinc-500">{item.episode}</span>
      </p>

      {/* Advice */}
      <p className="text-[13px] text-zinc-300 leading-relaxed mb-3">
        {item.advice}
      </p>

      {/* Context */}
      {item.context_description && (
        <p className="text-xs text-zinc-500 mb-3 italic">
          Context: {item.context_description}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(item.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              tagColors[tag] || "bg-zinc-800 text-zinc-400 border-zinc-700/50"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() =>
            onLearnMore({
              id: item.knowledge_id,
              framework: item.framework,
              guest: item.guest,
              episode: item.episode,
              quote: item.quote,
              advice: item.advice,
              tags: item.tags,
            })
          }
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 border border-violet-500/20 transition-colors"
        >
          Learn More
        </button>
        <button
          onClick={() => onSave(item.id)}
          disabled={item.saved === 1}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            item.saved === 1
              ? "bg-zinc-800/50 text-zinc-500 border-zinc-700/30 cursor-default"
              : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 border-zinc-700/50"
          }`}
        >
          {item.saved === 1 ? "✓ Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mb-4">
        👻
      </div>
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">
        No nudges yet
      </h3>
      <p className="text-xs text-zinc-500 max-w-xs">
        ProductGhost is watching your screen and will deliver contextual PM
        insights as you work. Check back soon!
      </p>
      <button
        onClick={async () => {
          try {
            await window.electronAPI?.nudge.triggerManual();
          } catch (e) {
            console.log(e);
          }
        }}
        className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
      >
        Trigger a Test Nudge
      </button>
    </div>
  );
}
