import { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { HeroSection } from "../components/home/HeroSection.jsx";
import { PillarsSection } from "../components/home/PillarsSection.jsx";
import { RestArchitectureSection } from "../components/home/RestArchitectureSection.jsx";
import { RecentEntriesSection } from "../components/home/RecentEntriesSection.jsx";
import { QuickAccessSection } from "../components/home/QuickAccessSection.jsx";
import { DemoModal } from "../components/home/DemoModal.jsx";

export const Home = () => {
  const { store } = useGlobalReducer();
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="eusomnia-canvas position-relative">
      {/* Atmospheric Ambient Glows */}
      <div className="glow-orb-primary" />
      <div className="glow-orb-secondary" />

      {/* 1. Hero Section & Synapse HUD */}
      <HeroSection
        user={store.user}
        onOpenDemo={() => setShowDemoModal(true)}
      />

      {/* 2. The 3 Scientific Pillars */}
      <PillarsSection />

      {/* 3. Rest Architecture & Clinical Environment */}
      <RestArchitectureSection />

      {/* 4. Recent Night Records (User Log) */}
      <RecentEntriesSection user={store.user} />

      {/* 5. Fast Access & Profile Sync */}
      <QuickAccessSection user={store.user} />

      {/* 6. Interactive Neural Engine Simulation Modal */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
};
