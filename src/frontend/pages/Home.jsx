import { useCallback, useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { apiUrl } from "../api.js";
import { HeroSection } from "../components/home/HeroSection.jsx";
import { PillarsSection } from "../components/home/PillarsSection.jsx";
import { RestArchitectureSection } from "../components/home/RestArchitectureSection.jsx";
import { RecentEntriesSection } from "../components/home/RecentEntriesSection.jsx";
import { QuickAccessSection } from "../components/home/QuickAccessSection.jsx";
import { DemoModal } from "../components/home/DemoModal.jsx";

export const Home = () => {
  const { store } = useGlobalReducer();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const token = store.token || localStorage.getItem("jwt-token");
  const [homeSummary, setHomeSummary] = useState(null);
  const [isHomeLoading, setIsHomeLoading] = useState(Boolean(token));
  const [homeError, setHomeError] = useState("");
  const [reanalyzingEntryId, setReanalyzingEntryId] = useState(null);

  const loadHomeSummary = useCallback(async () => {
    if (!token) {
      setHomeSummary(null);
      setIsHomeLoading(false);
      return;
    }

    setIsHomeLoading(true);
    setHomeError("");
    try {
      const response = await fetch(apiUrl("/api/home-summary"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar el resumen.");
      }
      setHomeSummary(data.results);
    } catch (error) {
      setHomeError(error.message || "No se pudo cargar el resumen.");
    } finally {
      setIsHomeLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let isActive = true;
    void Promise.resolve().then(() => {
      if (isActive) {
        void loadHomeSummary();
      }
    });
    return () => {
      isActive = false;
    };
  }, [loadHomeSummary]);

  const handleReanalyze = async (entryId) => {
    if (!token) return;
    setReanalyzingEntryId(entryId);
    setHomeError("");
    try {
      const response = await fetch(apiUrl(`/api/analysis/${entryId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo reanalizar la entrada.");
      }
      await loadHomeSummary();
    } catch (error) {
      setHomeError(error.message || "No se pudo reanalizar la entrada.");
    } finally {
      setReanalyzingEntryId(null);
    }
  };

  return (
    <div className="eusomnia-canvas position-relative">
      {/* Atmospheric Ambient Glows */}
      <div className="glow-orb-primary" />
      <div className="glow-orb-secondary" />

      {/* 1. Hero Section & Synapse HUD */}
      <HeroSection
        user={store.user}
        summary={homeSummary}
        isSummaryLoading={isHomeLoading}
        onOpenDemo={() => setShowDemoModal(true)}
      />

      {/* 2. The 3 Scientific Pillars */}
      <PillarsSection />

      {/* 3. Rest Architecture & Clinical Environment */}
      <RestArchitectureSection />

      {/* 4. Recent Night Records (User Log) */}
      <RecentEntriesSection
        user={store.user}
        entries={homeSummary?.recent_entries || []}
        isLoading={isHomeLoading}
        error={homeError}
        onRetry={loadHomeSummary}
        onReanalyze={token ? handleReanalyze : undefined}
        reanalyzingEntryId={reanalyzingEntryId}
      />

      {/* 5. Fast Access & Profile Sync */}
      <QuickAccessSection
        user={store.user}
        pendingAnalysisCount={homeSummary?.pending_analysis_count || 0}
      />

      {/* 6. Interactive Neural Engine Simulation Modal */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
};
