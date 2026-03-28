import React, { useState, useEffect } from "react";

const api = window.electronAPI;

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [weeklyStats, allEntries] = await Promise.all([
        api?.stats.weekly(),
        api?.kb.getAll(),
      ]);
      setStats(weeklyStats);
      setEntries(allEntries || []);
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-lg font-semibold text-zinc-100">Stats</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Your coaching activity this week.
          </p>
        </div>

        {/* ── Summary Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Nudges Shown"
            value={stats?.nudges_shown ?? 0}
            icon="💡"
            color="violet"
          />
          <StatCard
            label="Saved"
            value={stats?.nudges_saved ?? 0}
            icon="🔖"
            color="emerald"
          />
          <StatCard
            label="Top Topic"
            value={stats?.top_topic ?? "—"}
            icon="🏷️"
            color="amber"
            isText
          />
        </div>

        {/* ── Weekly Chart (simplified bar chart) ────────────────── */}
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">
            This Week
          </h3>
          <WeekChart days={stats?.days || []} />
        </div>

        {/* ── Knowledge Base Browser ─────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            Knowledge Base
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            {entries.length} frameworks loaded from Lenny's Podcast archive.
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/40"
              >
                <span className="text-base mt-0.5">📘</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate">
                    {entry.framework}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {entry.guest} — {entry.episode}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(entry.tags || []).slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, isText }) {
  const colorMap = {
    violet: "from-violet-600/10 to-violet-600/5 border-violet-500/20",
    emerald: "from-emerald-600/10 to-emerald-600/5 border-emerald-500/20",
    amber: "from-amber-600/10 to-amber-600/5 border-amber-500/20",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
      </div>
      <div
        className={`${
          isText ? "text-sm" : "text-2xl"
        } font-bold text-zinc-100 capitalize`}
      >
        {value}
      </div>
    </div>
  );
}

function WeekChart({ days }) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxVal = Math.max(1, ...days.map((d) => d.nudges_shown));

  // Build a 7-day array aligned to the current week
  const today = new Date();
  const weekData = dayLabels.map((label, i) => {
    const dayDate = new Date(today);
    const diff = today.getDay() === 0 ? 6 : today.getDay() - 1; // Monday=0
    dayDate.setDate(today.getDate() - diff + i);
    const dateStr = dayDate.toISOString().split("T")[0];
    const match = days.find((d) => d.date === dateStr);
    return {
      label,
      value: match?.nudges_shown || 0,
      date: dateStr,
      isToday: dateStr === today.toISOString().split("T")[0],
    };
  });

  return (
    <div className="flex items-end gap-2 h-32">
      {weekData.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex-1 flex items-end">
            <div
              className={`w-full rounded-t-md transition-all ${
                d.isToday ? "bg-violet-500" : "bg-zinc-700"
              }`}
              style={{
                height: `${Math.max(4, (d.value / maxVal) * 100)}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-zinc-500">{d.value}</span>
          <span
            className={`text-[10px] ${
              d.isToday ? "text-violet-400 font-semibold" : "text-zinc-500"
            }`}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
