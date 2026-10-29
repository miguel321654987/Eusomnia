import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateLabel(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(date);
}

function parseList(value) {
  return typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

async function requestApi(path, token, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    if (response.ok) {
      throw new Error("El servidor devolvió una respuesta no válida.");
    }
  }

  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud.");
  }
  return data.results;
}

export const RegistroDiario = () => {
  const { store } = useGlobalReducer();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const entryId = searchParams.get("entryId");
  const token = store.token || localStorage.getItem("jwt-token");
  const isEditing = Boolean(entryId);
  const hasSession = Boolean(token);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(
    Boolean(entryId && token),
  );
  const [loadError, setLoadError] = useState("");
  const [entryDate, setEntryDate] = useState(getTodayDate);
  const [originalEntryDate, setOriginalEntryDate] = useState("");

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

  useEffect(() => {
    if (!entryId || !token) return undefined;

    let isActive = true;
    const loadEntry = async () => {
      await Promise.resolve();
      if (!isActive) return;
      setIsLoadingEntry(true);
      setLoadError("");

      const parsedEntryId = Number(entryId);
      if (!Number.isInteger(parsedEntryId) || parsedEntryId < 1) {
        setLoadError("El identificador del registro no es válido.");
        setIsLoadingEntry(false);
        return;
      }

      try {
        const entry = await requestApi(`/api/entries/${parsedEntryId}`, token);
        if (!isActive) return;
        if (!entry) {
          throw new Error("No se encontró el registro que quieres editar.");
        }

        const habits = entry.habit_log || {};
        const savedDate = entry.entry_date || getTodayDate();
        setEditingEntry(entry);
        setEntryDate(savedDate);
        setOriginalEntryDate(entry.original_entry_date || savedDate);
        setFormData({
          physicalActivity: habits.physical_activity || "",
          sleepHours:
            Number(habits.total_sleep_hours ?? habits.sleep_hours) || 7.5,
          sleepQuality:
            habits.sleep_quality || habits.bedtime_mood || "Profundo",
          screenTime: habits.screen_time || "",
          incidents: parseList(habits.incidents),
          nutrition: parseList(habits.dinner_type),
          foodDescription:
            habits.food_notes || habits.nutrition_query || "",
          dreamNarrative:
            entry.sleep_report?.final_text ||
            entry.sleep_report?.raw_text ||
            "",
        });
      } catch (error) {
        if (isActive) {
            setLoadError(error.message || "No se pudo cargar el registro.");
        }
      } finally {
        if (isActive) setIsLoadingEntry(false);
      }
    };
    void loadEntry();

    return () => {
      isActive = false;
    };
  }, [entryId, token]);

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

    if (isEditing && !entryDate) {
      setStatusMessage({
        type: "error",
        text: "Selecciona la fecha efectiva del registro.",
      });
      return;
    }

    if (!token) {
      setStatusMessage({
        type: "error",
        text: "Inicia sesión para guardar el registro y generar el análisis.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const foodDescription = formData.foodDescription.trim();
    const payload = {
      date: entryDate,
      sleep: {
        raw_text: formData.dreamNarrative,
        final_text: formData.dreamNarrative,
      },
      habits: {
        physical_activity: formData.physicalActivity,
        dinner_type: formData.nutrition.join(", "),
        bedtime_mood: formData.sleepQuality,
        sleep_quality: formData.sleepQuality,
        screen_time: formData.screenTime,
        incidents: formData.incidents.join(", "),
        total_sleep_hours: Number(formData.sleepHours),
        food_notes: foodDescription || null,
      },
    };

    try {
      if (isEditing && editingEntry) {
        await requestApi(
          `/api/entries/${editingEntry.id}`,
          token,
          {
            method: "PATCH",
            body: payload,
          },
        );
        const previousHabits = editingEntry.habit_log || {};
        const previousFood =
          previousHabits.food_notes || previousHabits.nutrition_query || "";
        const foodChanged =
          previousFood.trim() !== foodDescription;
        const normalizedList = (value) =>
          parseList(value).join(", ").toLocaleLowerCase("es");
        const habitsChanged =
          String(previousHabits.physical_activity || "") !==
            formData.physicalActivity ||
          normalizedList(previousHabits.dinner_type) !==
            normalizedList(formData.nutrition.join(", ")) ||
          String(
            previousHabits.sleep_quality ||
              previousHabits.bedtime_mood ||
              "",
          ) !== formData.sleepQuality ||
          String(previousHabits.screen_time || "") !== formData.screenTime ||
          normalizedList(previousHabits.incidents) !==
            normalizedList(formData.incidents.join(", ")) ||
          Number(previousHabits.total_sleep_hours) !==
            Number(formData.sleepHours);
        const sleepChanged =
          (editingEntry.sleep_report?.raw_text ||
            editingEntry.sleep_report?.final_text ||
            "") !== formData.dreamNarrative;
        const dateChanged = editingEntry.entry_date !== entryDate;
        const warnings = [];
        let nutritionRefreshFailed = false;

        if (foodChanged) {
          try {
            if (foodDescription) {
              await requestApi("/api/nutrition/log", token, {
                method: "POST",
                body: {
                  entry_id: editingEntry.id,
                  ingredients: [foodDescription],
                },
              });
            } else if (editingEntry.nutrition_log) {
              await requestApi(
                `/api/nutrition/log/${editingEntry.id}`,
                token,
                { method: "DELETE" },
              );
            }
          } catch (error) {
            nutritionRefreshFailed = true;
            warnings.push(
              `No se pudo actualizar el análisis nutricional: ${error.message}`,
            );
          }
        }

        if (
          editingEntry.analysis &&
          (sleepChanged || habitsChanged || foodChanged || dateChanged) &&
          !nutritionRefreshFailed
        ) {
          try {
            await requestApi(`/api/analysis/${editingEntry.id}`, token, {
              method: "POST",
            });
          } catch (error) {
            warnings.push(
              `No se pudo regenerar el análisis onírico: ${error.message}`,
            );
          }
        }

        const notice = warnings.length
          ? {
              type: "warning",
              text: `El registro se guardó, pero ${warnings.join(" ")}`,
            }
          : {
              type: "success",
              text: "El registro se actualizó correctamente.",
            };
        navigate(`/historial?entryId=${editingEntry.id}`, {
          state: { notice },
        });
        return;
      }

      const savedEntry = await requestApi("/api/entries", token, {
        method: "POST",
        body: payload,
      });
      const createdEntryId = savedEntry?.id;
      if (!createdEntryId) {
        throw new Error("El servidor no devolvió el ID del registro guardado.");
      }

      setSavedEntryId(createdEntryId);
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

        {isLoadingEntry ? (
          <div className="eusomnia-card p-4 text-center text-secondary" role="status">
            <span className="spinner-border spinner-border-sm me-2" />
            Cargando el registro...
          </div>
        ) : loadError ? (
          <div className="eusomnia-card p-4 text-center">
            <h1 className="font-headline h4 text-light">
              No se pudo cargar el registro
            </h1>
            <p className="text-secondary">{loadError}</p>
            <Link to="/historial" className="btn btn-eusomnia-secondary">
              Volver al historial
            </Link>
          </div>
        ) : (
          <>
            {isEditing && editingEntry && (
              <section className="eusomnia-card p-3 p-sm-4 mb-4">
                <div className="row g-3 align-items-center">
                  <div className="col-12 col-md-6">
                    <span className="font-label small text-secondary d-block">
                      Fecha original
                    </span>
                    <strong className="font-body text-light">
                      {getDateLabel(originalEntryDate)}
                    </strong>
                  </div>
                  <div className="col-12 col-md-6">
                    <label
                      className="font-label small text-light d-block mb-1"
                      htmlFor="entry-effective-date"
                    >
                      Fecha efectiva
                    </label>
                    <input
                      id="entry-effective-date"
                      className="form-control"
                      type="date"
                      value={entryDate}
                      onChange={(event) => setEntryDate(event.target.value)}
                      required
                    />
                  </div>
                </div>
              </section>
            )}

            <StepperHeader
              currentStep={currentStep}
              onStepClick={(step) => setCurrentStep(step)}
              stepTitles={STEP_TITLES}
              isEditing={isEditing}
            />

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
                submitLabel={
                  isEditing ? "Guardar cambios" : "Guardar y Analizar con IA"
                }
                submitProgressLabel={
                  isEditing ? "Guardando cambios..." : "Procesando con IA..."
                }
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
          </>
        )}
      </div>
    </div>
  );
};
