import { useEffect, useState } from "react";
import {
  Link,
  useBlocker,
  useBeforeUnload,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
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
import { getSleepDurationHours } from "../utils/sleepTime.js";

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

function createDefaultMealEntries() {
  return {
    breakfast: { size: null, time: "", foods: "", inputMode: "" },
    mid_morning: { size: null, time: "", foods: "", inputMode: "" },
    lunch: { size: null, time: "", foods: "", inputMode: "" },
    snack: { size: null, time: "", foods: "", inputMode: "" },
    dinner: { size: null, time: "", foods: "", inputMode: "" },
    other: { size: null, time: "", foods: "", inputMode: "" },
  };
}

function normalizeSleepContext(context = {}) {
  return {
    bedtime: context.bedtime || "",
    wake_time: context.wake_time || "",
    last_caffeine_time: context.last_caffeine_time || "",
    room_temperature_c:
      context.room_temperature_c === null ||
      context.room_temperature_c === undefined
        ? ""
        : String(context.room_temperature_c),
    room_light: context.room_light || "",
  };
}

function getSleepContextPayload(context) {
  const temperature = context.room_temperature_c.trim();
  return {
    bedtime: context.bedtime || null,
    wake_time: context.wake_time || null,
    last_caffeine_time: context.last_caffeine_time || null,
    room_temperature_c: temperature ? Number(temperature) : null,
    room_light: context.room_light || null,
  };
}

function normalizeMealEntries(mealEntries, legacyFoodNotes = "") {
  const defaults = createDefaultMealEntries();
  if (!mealEntries || typeof mealEntries !== "object") {
    defaults.dinner.foods = legacyFoodNotes || "";
    defaults.dinner.inputMode = legacyFoodNotes?.trim()
      ? "detailed"
      : defaults.dinner.size
        ? "generic"
        : "";
    return defaults;
  }

  for (const [mealId, defaultValue] of Object.entries(defaults)) {
    const savedValue = mealEntries[mealId];
    if (!savedValue || typeof savedValue !== "object") continue;
    const foods = typeof savedValue.foods === "string" ? savedValue.foods : "";
    const size = savedValue.size || null;
    defaults[mealId] = {
      ...defaultValue,
      size,
      time: Object.hasOwn(savedValue, "time")
        ? savedValue.time || ""
        : defaultValue.time,
      foods,
      inputMode: foods.trim() ? "detailed" : size ? "generic" : "",
    };
  }
  return defaults;
}

function getMealEntriesPayload(mealEntries) {
  return Object.fromEntries(
    Object.entries(mealEntries).map(([mealId, meal]) => [
      mealId,
      {
        size: meal.inputMode === "generic" ? meal.size || null : null,
        time: meal.time || null,
        foods: meal.inputMode === "detailed" ? meal.foods.trim() : "",
      },
    ]),
  );
}

function getFormSnapshot(formData, entryDate) {
  return JSON.stringify({
    entryDate,
    physicalActivity: formData.physicalActivity,
    sleepHours: formData.sleepHours,
    sleepQuality: formData.sleepQuality,
    screenTime: formData.screenTime,
    incidents: formData.incidents,
    emotionalState: formData.emotionalState,
    mealEntries: getMealEntriesPayload(formData.mealEntries),
    sleepContext: getSleepContextPayload(formData.sleepContext),
    dreamNarrative: formData.dreamNarrative,
  });
}

function getCombinedFoodNotes(mealEntries) {
  return Object.entries(mealEntries)
    .filter(([, meal]) => meal.foods.trim())
    .map(([mealId, meal]) => `${mealId}: ${meal.foods.trim()}`)
    .join("\n");
}

function createDefaultFormData() {
  return {
    physicalActivity: "Media (Ejercicio regular)",
    sleepHours: 7.5,
    sleepQuality: "Profundo",
    screenTime: "< 1 hora (Filtro cálido)",
    incidents: ["🕊️ Día tranquilo y neutro"],
    emotionalState: [],
    mealEntries: createDefaultMealEntries(),
    sleepContext: normalizeSleepContext(),
    dreamNarrative: "",
  };
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
  const location = useLocation();
  const navigate = useNavigate();
  const entryId = searchParams.get("entryId");
  const token = store.token || localStorage.getItem("jwt-token");
  const isEditing = Boolean(entryId);
  const hasSession = Boolean(token);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(
    Boolean(location.state?.savedEntryId),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState(
    location.state?.savedEntryId || null,
  );
  const [statusMessage, setStatusMessage] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(
    Boolean(entryId && token),
  );
  const [loadError, setLoadError] = useState("");
  const [entryDate, setEntryDate] = useState(getTodayDate);
  const [originalEntryDate, setOriginalEntryDate] = useState("");

  const [formData, setFormData] = useState(createDefaultFormData);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const currentSnapshot = getFormSnapshot(formData, entryDate);
  const isDirty =
    !isSubmitted &&
    !isLoadingEntry &&
    !isSubmitting &&
    initialSnapshot !== null &&
    currentSnapshot !== initialSnapshot;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search ||
        currentLocation.hash !== nextLocation.hash),
  );

  useEffect(() => {
    if (!isEditing && initialSnapshot === null) {
      const snapshot = getFormSnapshot(formData, entryDate);
      void Promise.resolve().then(() => {
        setInitialSnapshot(snapshot);
      });
    }
  }, [entryDate, formData, isEditing, initialSnapshot]);

  useBeforeUnload((event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = "";
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
        const sleepContext = normalizeSleepContext(habits.sleep_context);
        const derivedSleepHours = getSleepDurationHours(
          sleepContext.bedtime,
          sleepContext.wake_time,
        );
        const loadedFormData = {
          physicalActivity: habits.physical_activity || "",
          sleepHours:
            derivedSleepHours ??
            (Number(habits.total_sleep_hours ?? habits.sleep_hours) || 7.5),
          sleepQuality:
            habits.sleep_quality || habits.bedtime_mood || "Profundo",
          screenTime: habits.screen_time || "",
          incidents: parseList(habits.incidents),
          emotionalState: parseList(habits.emotional_state),
          mealEntries: normalizeMealEntries(
            habits.meal_entries,
            habits.food_notes || habits.nutrition_query || "",
          ),
          sleepContext,
          dreamNarrative:
            entry.sleep_report?.final_text ||
            entry.sleep_report?.raw_text ||
            "",
        };
        setEditingEntry(entry);
        setEntryDate(savedDate);
        setOriginalEntryDate(entry.original_entry_date || savedDate);
        setFormData(loadedFormData);
        setInitialSnapshot(getFormSnapshot(loadedFormData, savedDate));
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
  const handleSleepContextChange = (changes) => {
    setFormData((prev) => {
      const sleepContext = { ...prev.sleepContext, ...changes };
      const derivedSleepHours = getSleepDurationHours(
        sleepContext.bedtime,
        sleepContext.wake_time,
      );
      return {
        ...prev,
        sleepContext,
        sleepHours: derivedSleepHours ?? prev.sleepHours,
      };
    });
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

  // Step 3: Emotional state (multi-select)
  const handleToggleEmotionalState = (emotion) => {
    setFormData((prev) => {
      const exists = prev.emotionalState.includes(emotion);
      if (exists) {
        return {
          ...prev,
          emotionalState: prev.emotionalState.filter((item) => item !== emotion),
        };
      }

      return {
        ...prev,
        emotionalState: [...prev.emotionalState, emotion],
      };
    });
  };

  const handleMealEntryChange = (mealId, changes) => {
    setFormData((prev) => ({
      ...prev,
      mealEntries: {
        ...prev.mealEntries,
        [mealId]: {
          ...prev.mealEntries[mealId],
          ...changes,
          ...(changes.inputMode === "generic"
            ? { foods: "", detailsExpanded: false }
            : {}),
          ...(changes.inputMode === "detailed"
            ? { size: null, detailsExpanded: true }
            : {}),
        },
      },
    }));
  };

  // Step 5: Dream Narrative
  const handleNarrativeChange = (textOrFn) => {
    setFormData((prev) => ({
      ...prev,
      dreamNarrative:
        typeof textOrFn === "function" ? textOrFn(prev.dreamNarrative) : textOrFn,
    }));
  };

  const persistLocalDraft = () => {
    localStorage.setItem(
      "eusomnia_daily_entry_draft",
      JSON.stringify({
        version: 1,
        entryId: editingEntry?.id || null,
        entryDate,
        currentStep,
        formData,
        savedAt: new Date().toISOString(),
      }),
    );
    setInitialSnapshot(getFormSnapshot(formData, entryDate));
  };

  // Save Draft (Local)
  const handleSaveDraft = () => {
    try {
      persistLocalDraft();
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: `No se pudo guardar el borrador local: ${error.message}`,
      });
      return;
    }
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

    const mealEntries = getMealEntriesPayload(formData.mealEntries);
    const foodNotes = getCombinedFoodNotes(formData.mealEntries);
    const sleepContext = getSleepContextPayload(formData.sleepContext);
    const payload = {
      date: entryDate,
      sleep: {
        raw_text: formData.dreamNarrative,
        final_text: formData.dreamNarrative,
      },
      habits: {
        physical_activity: formData.physicalActivity,
        dinner_type: mealEntries.dinner.size || "",
        bedtime_mood: formData.sleepQuality,
        sleep_quality: formData.sleepQuality,
        screen_time: formData.screenTime,
        incidents: formData.incidents.join(", "),
        emotional_state: formData.emotionalState.join(", "),
        total_sleep_hours: Number(formData.sleepHours),
        food_notes: foodNotes || null,
        meal_entries: mealEntries,
        sleep_context: sleepContext,
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
        const previousMeals = normalizeMealEntries(
          previousHabits.meal_entries,
          previousHabits.food_notes || previousHabits.nutrition_query || "",
        );
        const foodChanged =
          JSON.stringify(getMealEntriesPayload(previousMeals)) !==
          JSON.stringify(mealEntries);
        const sleepContextChanged =
          JSON.stringify(
            getSleepContextPayload(
              normalizeSleepContext(previousHabits.sleep_context),
            ),
          ) !== JSON.stringify(sleepContext);
        const normalizedList = (value) =>
          parseList(value).join(", ").toLocaleLowerCase("es");
        const habitsChanged =
          String(previousHabits.physical_activity || "") !==
            formData.physicalActivity ||
          normalizedList(previousHabits.dinner_type) !==
            normalizedList(mealEntries.dinner.size || "") ||
          String(
            previousHabits.sleep_quality ||
              previousHabits.bedtime_mood ||
              "",
          ) !== formData.sleepQuality ||
          String(previousHabits.screen_time || "") !== formData.screenTime ||
          normalizedList(previousHabits.incidents) !==
            normalizedList(formData.incidents.join(", ")) ||
          normalizedList(previousHabits.emotional_state) !==
            normalizedList(formData.emotionalState.join(", ")) ||
          Number(previousHabits.total_sleep_hours) !==
            Number(formData.sleepHours) ||
          sleepContextChanged;
        const sleepChanged =
          (editingEntry.sleep_report?.raw_text ||
            editingEntry.sleep_report?.final_text ||
            "") !== formData.dreamNarrative;
        const dateChanged = editingEntry.entry_date !== entryDate;
        const warnings = [];
        let nutritionRefreshFailed = false;

        if (foodChanged) {
          try {
            if (Object.values(mealEntries).some(
              (meal) => meal.size || meal.foods,
            )) {
              await requestApi("/api/nutrition/log", token, {
                method: "POST",
                body: {
                  entry_id: editingEntry.id,
                  meals: mealEntries,
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
      navigate("/registro-diario", {
        replace: true,
        state: { savedEntryId: createdEntryId },
      });
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

  const handleStartNewEntry = () => {
    const newFormData = createDefaultFormData();
    setFormData(newFormData);
    setEntryDate(getTodayDate());
    setCurrentStep(1);
    setSavedEntryId(null);
    setIsSubmitted(false);
    setStatusMessage(null);
    setEditingEntry(null);
    setInitialSnapshot(getFormSnapshot(newFormData, getTodayDate()));
    navigate("/registro-diario", { replace: true, state: null });
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

        {blocker.state === "blocked" && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 1100, background: "rgba(4, 10, 20, 0.82)" }}
          >
            <section
              className="eusomnia-card p-4 shadow-lg w-100"
              style={{ maxWidth: "520px" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="unsaved-entry-title"
              aria-describedby="unsaved-entry-description"
            >
              <h2
                id="unsaved-entry-title"
                className="font-headline h5 text-light"
              >
                Tienes cambios sin guardar
              </h2>
              <p
                id="unsaved-entry-description"
                className="font-body text-secondary"
              >
                Puedes seguir editando, conservar un borrador local o salir sin
                guardar estos cambios.
              </p>
              <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-eusomnia-secondary"
                  onClick={() => blocker.reset()}
                >
                  Seguir editando
                </button>
                <button
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={() => {
                    try {
                      persistLocalDraft();
                      blocker.proceed();
                    } catch (error) {
                      blocker.reset();
                      setStatusMessage({
                        type: "error",
                        text: `No se pudo guardar el borrador local: ${error.message}`,
                      });
                    }
                  }}
                >
                  Guardar borrador y salir
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => blocker.proceed()}
                >
                  Salir sin guardar
                </button>
              </div>
            </section>
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
              <SuccessScreen
                entryId={savedEntryId}
                onStartNew={handleStartNewEntry}
              />
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
                sleepContext={formData.sleepContext}
                onChangeSleepContext={handleSleepContextChange}
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
                selectedEmotionalStates={formData.emotionalState}
                onToggleIncident={handleToggleIncident}
                onToggleEmotionalState={handleToggleEmotionalState}
                onBack={() => setCurrentStep(2)}
                onNext={() => setCurrentStep(4)}
              />
            )}

            {currentStep === 4 && (
              <StepNutrition
                mealEntries={formData.mealEntries}
                sleepContext={formData.sleepContext}
                token={token}
                onChangeMealEntry={handleMealEntryChange}
                onChangeSleepContext={handleSleepContextChange}
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
