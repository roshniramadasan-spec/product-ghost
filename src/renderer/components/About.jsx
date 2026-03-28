import React from "react";

export default function About() {
  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-100">About</h2>
          <p className="text-sm text-zinc-500 mt-1">
            ProductGhost — your silent PM coach.
          </p>
        </div>

        {/* Logo & Description */}
        <div className="flex flex-col items-center text-center py-8 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-4xl shadow-lg shadow-violet-500/20 mb-4">
            👻
          </div>
          <h1 className="text-xl font-bold text-zinc-100">ProductGhost</h1>
          <p className="text-sm text-zinc-400 mt-1">Version 1.0.0</p>
          <p className="text-sm text-zinc-500 mt-3 max-w-sm">
            A silent PM coach that watches your screen and delivers contextual
            product management wisdom from the best in the industry.
          </p>
        </div>

        {/* Credits */}
        <Card title="📚 Knowledge Source">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Frameworks and insights curated from{" "}
            <span className="text-violet-400 font-medium">
              Lenny Rachitsky's Newsletter & Podcast
            </span>
            , featuring wisdom from product leaders like Shreyas Doshi, Brian
            Chesky, April Dunford, Teresa Torres, Marty Cagan, and more.
          </p>
        </Card>

        <Card title="🔒 Privacy">
          <p className="text-xs text-zinc-400 leading-relaxed">
            ProductGhost is built privacy-first. Screen captures are processed
            and immediately discarded. Only text descriptions are sent to AI
            APIs. All data is stored locally on your machine. No telemetry, no
            tracking, no cloud storage.
          </p>
        </Card>

        <Card title="⚡ How It Works">
          <ol className="text-xs text-zinc-400 leading-relaxed space-y-2">
            <li className="flex gap-2">
              <span className="text-zinc-500 font-mono">1.</span>
              Periodically captures your screen to understand what you're
              working on
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500 font-mono">2.</span>
              Uses AI to describe the context (app, task type, visible topics)
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500 font-mono">3.</span>
              Matches against a local knowledge base of PM frameworks
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500 font-mono">4.</span>
              Delivers a contextual nudge via native OS notification
            </li>
          </ol>
        </Card>

        <Card title="🛠 Tech Stack">
          <div className="grid grid-cols-2 gap-2">
            {[
              "Electron",
              "React",
              "Tailwind CSS",
              "SQLite",
              "OpenAI / Claude API",
              "desktopCapturer",
            ].map((tech) => (
              <div
                key={tech}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/40 text-xs text-zinc-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {tech}
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center py-8">
          <p className="text-xs text-zinc-600">
            Built with 💜 for product managers everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 mb-3">
      <h3 className="text-sm font-semibold text-zinc-100 mb-3">{title}</h3>
      {children}
    </div>
  );
}
