import { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { StepperHeader } from "../components/daily_entry/StepperHeader.jsx";
import { SummaryCapsules } from "../components/daily_entry/SummaryCapsules.jsx";
import { StepActivity } from "../components/daily_entry/StepActivity.jsx";
import { StepSleepHygiene } from "../components/daily_entry/StepSleepHygiene.jsx";
import { StepIncidents } from "../components/daily_entry/StepIncidents.jsx";
import { StepNutrition } from "../components/daily_entry/StepNutrition.jsx";
import { StepDreamJournal } from "../components/daily_entry/StepDreamJournal.jsx";
import { SuccessScreen } from "../components/daily_entry/SuccessScreen.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const STEP_TITLES = {
  1: "Hábitos y Actividad física",
  2: "Higiene y Descanso",
  3: "Incidencias del Día",
  4: "Crononutrición",
  5: "Relato del Sueño",
};

export const RegistroDiario = () => {
  const { store } = useGlobalReducer();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    physicalActivity: "Media (Ejercicio regular)",
    sleepHours: 7.5,
    sleepQuality: "Profundo",
    screenTime: "< 1 hora (Filtro cálido)",
    incidents: ["🕊️ Día tranquilo y neutro"],
    nutrition: ["Cena ligera / temprana"],
    dreamNarrative: "",
  });

  // Step 1: Activity
  const handleActivityChange = (act) => {
    setFormData((prev) => ({ ...prev, physicalActivity: act }));
  };

  // Step 2: Sleep Hygiene
  const handleHoursChange = (hours) => {
    setFormData((prev) => ({ ...prev, sleepHours: hours }));
  };
  const handleQualityChange = (quality) => {
    setFormData((prev) => ({ ...prev, sleepQuality: quality }));
  };
  const handleScreensChange = (screens) => {
    setFormData((prev) => ({ ...prev, screenTime: screens }));
  };

  // Step 3: Incidents (multi-select)
  const handleToggleIncident = (incident) => {
    setFormData((prev) => {
      const exists = prev.incidents.includes(incident);
      if (exists) {
        return {
          ...prev,
          incidents: prev.incidents.filter((i) => i !== incident),
        };
      } else {
        return {
          ...prev,
          incidents: [...prev.incidents, incident],
        };
      }
    });
  };

  // Step 4: Nutrition (multi-select)
  const handleToggleNutrition = (nutr) => {
    setFormData((prev) => {
      const exists = prev.nutrition.includes(nutr);
      if (exists) {
        return {
          ...prev,
          nutrition: prev.nutrition.filter((n) => n !== nutr),
        };
      } else {
        return {
          ...prev,
          nutrition: [...prev.nutrition, nutr],
        };
      }
    });
  };

  // Step 5: Dream Narrative
  const handleNarrativeChange = (textOrFn) => {
    setFormData((prev) => ({
      ...prev,
      dreamNarrative:
        typeof textOrFn === "function" ? textOrFn(prev.dreamNarrative) : textOrFn,
    }));
  };

  // Save Draft (Local)
  const handleSaveDraft = () => {
    localStorage.setItem("eusomnia_daily_entry_draft", JSON.stringify(formData));
    setStatusMessage({
      type: "success",
      text: "Borrador guardado localmente con éxito.",
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Final Submit
  const handleSubmit = async () => {
    if (!formData.dreamNarrative.trim()) return;

    setIsSubmitting(true);
    const token = store.token || localStorage.getItem("jwt-token");

    const payload = {
      date: new Date().toISOString().split("T")[0],
      sleep: {
        raw_text: formData.dreamNarrative,
        final_text: formData.dreamNarrative,
      },
      habits: {
        physical_activity: formData.physicalActivity,
        dinner_type: formData.nutrition.join(", "),
        bedtime_mood: formData.sleepQuality,
        screen_time: formData.screenTime,
        incidents: formData.incidents.join(", "),
        food_notes: `Horas de descanso: ${formData.sleepHours}`,
      },
    };

    try {
      if (token) {
        const response = await fetch(`${BACKEND_URL}/api/daily_entries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Error al guardar la entrada en el servidor.");
        }
      } else {
        // Guest mode fallback
        localStorage.setItem(
          "eusomnia_guest_daily_entry",
          JSON.stringify(payload)
        );
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Submission error:", error);
      // Fallback local persistence
      localStorage.setItem(
        "eusomnia_guest_daily_entry",
        JSON.stringify(payload)
      );
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      physicalActivity: "Media (Ejercicio regular)",
      sleepHours: 7.5,
      sleepQuality: "Profundo",
      screenTime: "< 1 hora (Filtro cálido)",
      incidents: ["🕊️ Día tranquilo y neutro"],
      nutrition: ["Cena ligera / temprana"],
      dreamNarrative: "",
    });
    setCurrentStep(1);
    setIsSubmitted(false);
  };

  return (
    <div className="eusomnia-canvas py-5 position-relative">
      {/* Ambient background glows */}
      <div className="glow-orb-primary" />
      <div className="glow-orb-secondary" />

      <div className="container position-relative" style={{ maxWidth: "860px", zIndex: 1 }}>
        {statusMessage && (
          <div
            className="alert alert-info py-2 px-3 mb-4 rounded-3 text-center font-label small"
            style={{
              background: "rgba(0, 229, 255, 0.15)",
              color: "var(--eusomnia-primary)",
              border: "1px solid rgba(0, 229, 255, 0.3)",
            }}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Stepper Header */}
        <StepperHeader
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
          stepTitles={STEP_TITLES}
        />

        {/* Success or Active Steps */}
        {isSubmitted ? (
          <SuccessScreen onReset={handleReset} />
        ) : (
          <div className="d-flex flex-column gap-3">
            {/* Summary of completed steps with Edit action */}
            <SummaryCapsules
              currentStep={currentStep}
              formData={formData}
              onEdit={(step) => setCurrentStep(step)}
            />

            {/* Wizard Steps */}
            {currentStep === 1 && (
              <StepActivity
                value={formData.physicalActivity}
                onChange={handleActivityChange}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <StepSleepHygiene
                sleepHours={formData.sleepHours}
                sleepQuality={formData.sleepQuality}
                screenTime={formData.screenTime}
                onChangeHours={handleHoursChange}
                onChangeQuality={handleQualityChange}
                onChangeScreens={handleScreensChange}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 3 && (
              <StepIncidents
                selectedIncidents={formData.incidents}
                onToggleIncident={handleToggleIncident}
                onBack={() => setCurrentStep(2)}
                onNext={() => setCurrentStep(4)}
              />
            )}

            {currentStep === 4 && (
              <StepNutrition
                selectedNutrition={formData.nutrition}
                onToggleNutrition={handleToggleNutrition}
                onBack={() => setCurrentStep(3)}
                onNext={() => setCurrentStep(5)}
              />
            )}

            {currentStep === 5 && (
              <StepDreamJournal
                narrative={formData.dreamNarrative}
                onChangeNarrative={handleNarrativeChange}
                onBack={() => setCurrentStep(4)}
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {/* Sleep Science Tip Footer */}
            <div
              className="mt-4 p-3 rounded-3 d-flex align-items-center gap-3"
              style={{
                background: "rgba(19, 28, 43, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <span
                className="material-symbols-outlined fs-4 flex-shrink-0"
                style={{ color: "var(--eusomnia-primary)" }}
              >
                lightbulb
              </span>
              <span className="font-body small text-secondary" style={{ fontSize: "0.82rem" }}>
                <strong>Dato neurofisiológico:</strong> Registrar los fragmentos del
                sueño dentro de los primeros 10 minutos al despertar maximiza la
                retención hipnagógica antes de que se reactiven los filtros
                corticales diurnos.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

