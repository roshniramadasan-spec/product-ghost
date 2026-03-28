import React, { useState, useEffect } from "react";

const api = window.electronAPI;

const topicOptions = [
  { id: "growth", label: "Growth", emoji: "📈" },
  { id: "strategy", label: "Strategy", emoji: "🎯" },
  { id: "leadership", label: "Leadership", emoji: "👑" },
  { id: "user-research", label: "User Research", emoji: "🔍" },
  { id: "prioritization", label: "Prioritization", emoji: "📋" },
  { id: "shipping", label: "Shipping", emoji: "🚀" },
  { id: "management", label: "Management", emoji: "🤝" },
  { id: "metrics", label: "Metrics & Analytics", emoji: "📊" },
  { id: "retention", label: "Retention", emoji: "🔄" },
  { id: "positioning", label: "Positioning", emoji: "🏷️" },
  { id: "sales", label: "Sales & GTM", emoji: "💰" },
  { id: "process", label: "Process", emoji: "⚙️" },
];

export default function Settings({ settings: initialSettings, onUpdate }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings || {});
  }, [initialSettings]);

  async function updateSetting(key, value) {
    setSaving(true);
    setSettings((prev) => ({ ...prev, [key]: value }));
    await api?.settings.set(key, value);
    setSaving(false);
    onUpdate?.();
  }

  const enabled = settings.enabled !== "false";
  const frequency = parseInt(settings.max_nudges_per_day || "6", 10);
  const captureInterval = parseInt(settings.capture_interval || "4", 10);
  const selectedTopics = (() => {
    try { return JSON.parse(settings.topic_preferences || "[]"); }
    catch { return []; }
  })();
  const screenCapture = settings.privacy_screen_capture !== "false";

  function toggleTopic(topicId) {
    const next = selectedTopics.includes(topicId)
      ? selectedTopics.filter((t) => t !== topicId)
      : [...selectedTopics, topicId];
    updateSetting("topic_preferences", JSON.stringify(next));
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Customize how ProductGhost coaches you.
          </p>
        </div>

        {/* ── Main Toggle ──────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                ProductGhost
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {enabled ? "Actively watching & coaching" : "Paused — no screen capture or nudges"}
              </p>
            </div>
            <Toggle checked={enabled} onChange={(v) => updateSetting("enabled", v ? "true" : "false")} />
          </div>
        </Card>

        {/* ── Frequency ────────────────────────────────────────────── */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            Nudge Frequency
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Maximum nudges per day: <span className="text-zinc-300 font-medium">{frequency}</span>
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={frequency}
            onChange={(e) => updateSetting("max_nudges_per_day", e.target.value)}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
            <span>Minimal (1/day)</span>
            <span>Active Coach (10/day)</span>
          </div>
        </Card>

        {/* ── Capture Interval ─────────────────────────────────────── */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            Screen Check Interval
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Check screen every <span className="text-zinc-300 font-medium">{captureInterval} minutes</span>
          </p>
          <input
            type="range"
            min={1}
            max={15}
            value={captureInterval}
            onChange={(e) => updateSetting("capture_interval", e.target.value)}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
            <span>Every minute</span>
            <span>Every 15 min</span>
          </div>
        </Card>

        {/* ── Topics ───────────────────────────────────────────────── */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            Topic Preferences
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Choose which PM topics you want coaching on.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {topicOptions.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-violet-600/10 text-violet-300 border-violet-500/30"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/60"
                  }`}
                >
                  <span>{topic.emoji}</span>
                  {topic.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── API Key ──────────────────────────────────────────────── */}
        <Card>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            AI Provider
          </h3>
          <p className="text-xs text-zinc-500 mb-3">
            Optional — without an API key, ProductGhost uses simulated screen context for demos.
          </p>
          <div className="space-y-3">
            <select
              value={settings.api_provider || "openai"}
              onChange={(e) => updateSetting("api_provider", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 outline-none"
            >
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
            <input
              type="password"
              placeholder="Enter API key..."
              value={settings.api_key || ""}
              onChange={(e) => updateSetting("api_key", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500 outline-none"
            />
          </div>
        </Card>

        {/* ── Privacy ──────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-100">
                Privacy-First Design
              </h3>
              <ul className="text-xs text-zinc-400 mt-2 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Screenshots are processed and immediately discarded — never saved to disk
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Only a text description is sent to the AI API, not the raw screenshot
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  Knowledge base is fully local — no data leaves your machine
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  All nudge history is stored locally in SQLite
                </li>
              </ul>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/60">
                <span className="text-xs text-zinc-400">Screen capture</span>
                <Toggle
                  checked={screenCapture}
                  onChange={(v) => updateSetting("privacy_screen_capture", v ? "true" : "false")}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="h-6" />
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${
        checked ? "bg-violet-600" : "bg-zinc-700"
      }`}
    >
      <div
        className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
