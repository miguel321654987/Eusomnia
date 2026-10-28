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
import { apiUrl } from "../api.js";

const STEP_TITLES = {
  1: "Hábitos y Actividad física",
  2: "Higiene y Descanso",
  3: "Incidencias del Día",
  4: "Crononutrición",
  5: "Relato del Sueño",
};

export const RegistroDiario = () => {
  const { store } = useGlobalReducer();
  const hasSession = Boolean(store.token || localStorage.getItem("jwt-token"));

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    physicalActivity: "Media (Ejercicio regular)",
    sleepHours: 7.5,
    sleepQuality: "Profundo",
    screenTime: "< 1 hora (Filtro cálido)",
    incidents: ["🕊️ Día tranquilo y neutro"],
    nutrition: ["Cena ligera / temprana"],
    foodDescription: "",
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

  const handleFoodDescriptionChange = (foodDescription) => {
    setFormData((prev) => ({ ...prev, foodDescription }));
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

    const token = store.token || localStorage.getItem("jwt-token");
    if (!token) {
      setStatusMessage({
        type: "error",
        text: "Inicia sesión para guardar el registro y generar el análisis.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

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
        sleep_hours: formData.sleepHours,
        nutrition_query: formData.foodDescription.trim() || null,
      },
    };

    try {
      const response = await fetch(apiUrl("/api/entries"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el registro.");
      }

      const entryId = data.results?.id;
      if (!entryId) {
        throw new Error("El servidor no devolvió el ID del registro guardado.");
      }

      setSavedEntryId(entryId);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.message || "No se pudo guardar el registro en el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eusomnia-canvas py-5 position-relative">
      {/* Ambient background glows */}
      <div className="glow-orb-primary" />
      <div className="glow-orb-secondary" />

      <div className="container position-relative" style={{ maxWidth: "860px", zIndex: 1 }}>
        {!hasSession && !isSubmitted && (
          <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>Inicia sesión para guardar entradas y generar análisis reales.</span>
            <button
              type="button"
              className="btn btn-sm btn-eusomnia-secondary"
              data-bs-toggle="modal"
              data-bs-target="#loginModal"
            >
              Iniciar sesión
            </button>
          </div>
        )}
        {statusMessage && (
          <div
            className={`alert ${statusMessage.type === "error" ? "alert-danger" : "alert-info"} py-2 px-3 mb-4 rounded-3 text-center font-label small`}
            style={{
              background:
                statusMessage.type === "error"
                  ? "rgba(255, 180, 171, 0.15)"
                  : "rgba(0, 229, 255, 0.15)",
              color:
                statusMessage.type === "error"
                  ? "var(--eusomnia-error)"
                  : "var(--eusomnia-primary)",
              border:
                statusMessage.type === "error"
                  ? "1px solid rgba(255, 180, 171, 0.3)"
                  : "1px solid rgba(0, 229, 255, 0.3)",
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
          <SuccessScreen entryId={savedEntryId} />
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
                foodDescription={formData.foodDescription}
                onChangeFoodDescription={handleFoodDescriptionChange}
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
