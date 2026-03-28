import React from "react";

const tabs = [
  { id: "feed", label: "Feed", icon: FeedIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "stats", label: "Stats", icon: StatsIcon },
  { id: "about", label: "About", icon: AboutIcon },
];

export default function Sidebar({ activeTab, onTabChange, settings }) {
  const isEnabled = settings?.enabled !== "false";

  return (
    <aside className="w-56 flex flex-col bg-zinc-950 border-r border-zinc-800/60 pt-12 pb-4 shrink-0">
      {/* Logo */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg
              ${isEnabled ? "bg-violet-600/20 animate-pulse-glow" : "bg-zinc-800"}`}
          >
            👻
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 leading-none">
              ProductGhost
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {isEnabled ? "Active" : "Paused"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`no-drag w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
              ${
                activeTab === id
                  ? "bg-zinc-800/80 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
          >
            <Icon active={activeTab === id} />
            {label}
          </button>
        ))}
      </nav>

      {/* Quick Actions */}
      <div className="px-3 space-y-1">
        <button
          onClick={async () => {
            try {
              await window.electronAPI?.nudge.triggerManual();
            } catch (e) {
              console.log("Trigger nudge:", e);
            }
          }}
          className="no-drag w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-violet-400 hover:bg-violet-600/10 hover:text-violet-300 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Nudge Now
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-500">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isEnabled ? "bg-emerald-500" : "bg-zinc-600"
            }`}
          />
          {isEnabled ? "Monitoring screen" : "Screen capture paused"}
        </div>
      </div>
    </aside>
  );
}

/* ── Tab Icons ──────────────────────────────────────────────────── */

function FeedIcon({ active }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function StatsIcon({ active }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AboutIcon({ active }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
