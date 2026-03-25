import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Feed from "./components/Feed";
import Settings from "./components/Settings";
import Stats from "./components/Stats";
import About from "./components/About";
import LearnMore from "./components/LearnMore";
import Onboarding from "./components/Onboarding";

const api = window.electronAPI;

export default function App() {
  const [tab, setTab] = useState("feed");
  const [learnMoreEntry, setLearnMoreEntry] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadSettings();

    // Listen for "Learn More" events from nudge notifications
    const unsub = api?.on?.("show-learn-more", (entry) => {
      setLearnMoreEntry(entry);
    });
    return () => unsub?.();
  }, []);

  async function loadSettings() {
    if (!api) return;
    const s = await api.settings.getAll();
    setSettings(s);
    if (s.onboarding_complete !== "true") {
      setShowOnboarding(true);
    }
  }

  async function completeOnboarding() {
    setShowOnboarding(false);
    await api?.settings.set("onboarding_complete", "true");
    setSettings((prev) => ({ ...prev, onboarding_complete: "true" }));
  }

  function openLearnMore(entry) {
    setLearnMoreEntry(entry);
  }

  const panels = {
    feed: <Feed onLearnMore={openLearnMore} />,
    settings: <Settings settings={settings} onUpdate={loadSettings} />,
    stats: <Stats />,
    about: <About />,
  };

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 select-none overflow-hidden">
      {/* Title bar drag region */}
      <div className="drag-region fixed top-0 left-0 right-0 h-10 z-50" />

      <Sidebar activeTab={tab} onTabChange={setTab} settings={settings} />

      <main className="flex-1 overflow-hidden pt-10">
        {panels[tab]}
      </main>

      {learnMoreEntry && (
        <LearnMore
          entry={learnMoreEntry}
          onClose={() => setLearnMoreEntry(null)}
        />
      )}
    </div>
  );
}
