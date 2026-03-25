import React, { useState } from "react";

const slides = [
  {
    emoji: "👻",
    title: "Meet ProductGhost",
    subtitle: "Your silent PM coach",
    description:
      "ProductGhost watches your screen and delivers bite-sized product management wisdom from Lenny Rachitsky's podcast archive — exactly when you need it.",
    details: [
      "Contextual nudges based on what you're working on",
      "20+ frameworks from top product leaders",
      "Works silently in your menu bar",
    ],
  },
  {
    emoji: "🔒",
    title: "Privacy First",
    subtitle: "Your data stays yours",
    description:
      "We believe great tools don't need to spy on you. Here's how ProductGhost protects your privacy:",
    details: [
      "Screenshots are processed and immediately discarded — never saved",
      "Only text descriptions are sent to AI — never raw images",
      "All data stored locally on your machine",
      "No telemetry, no cloud storage, no tracking",
    ],
  },
  {
    emoji: "⚡",
    title: "Make It Yours",
    subtitle: "Customize your coaching experience",
    description:
      "ProductGhost adapts to how you work. Fine-tune your experience:",
    details: [
      "Choose which PM topics matter most to you",
      "Set your preferred nudge frequency (2-10/day)",
      "Pause anytime from the menu bar icon",
      "Save and share the insights you love",
    ],
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  const isLast = step === slides.length - 1;
  const slide = slides[step];

  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950 p-8">
      <div className="w-full max-w-md animate-fade-in" key={step}>
        {/* Progress */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i <= step ? "bg-violet-500 w-8" : "bg-zinc-800 w-4"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-3xl shadow-lg shadow-violet-500/20 mx-auto mb-6">
            {slide.emoji}
          </div>

          <h2 className="text-xl font-bold text-zinc-100 mb-1">
            {slide.title}
          </h2>
          <p className="text-sm text-violet-400 font-medium mb-4">
            {slide.subtitle}
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            {slide.description}
          </p>

          <ul className="text-left space-y-2.5 mb-8">
            {slide.details.map((detail, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-zinc-300"
              >
                <span className="text-violet-400 mt-0.5 shrink-0">✦</span>
                {detail}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setStep((s) => s + 1);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
            >
              {isLast ? "Get Started" : "Continue"}
            </button>
          </div>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="block mx-auto mt-4 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
