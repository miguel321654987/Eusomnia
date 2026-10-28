import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { toast } from "react-toastify";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("jwt-token");
  if (!token || token === "undefined" || token === "null") {
    return { "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const INCIDENT_OPTIONS = [
  { value: "accidente", label: "Accidente / Susto" },
  { value: "buenas_noticias", label: "Buenas noticias" },
  { value: "malas_noticias", label: "Malas noticias" },
  { value: "premios", label: "Premios / Logros" },
  { value: "multas", label: "Multa / Problema legal" },
  { value: "discusion", label: "Discusión familiar/laboral" },
  { value: "enfermedad", label: "Malestar físico / Dolor" },
];

// Función para clasificar la pesadez de la cena a partir de los nutrientes reales
const classifyDinner = (dinnerNutrients) => {
  if (!dinnerNutrients || dinnerNutrients.calories === 0) {
    return { type: "nada", label: "Sin cena / Ayuno", badgeClass: "bg-secondary" };
  }
  const cal = dinnerNutrients.totalCalories || dinnerNutrients.calories;
  const alc = dinnerNutrients.alcohol_g || 0;
  const caf = dinnerNutrients.caffeine_mg || 0;
  const sug = dinnerNutrients.sugars_g || 0;
  const fat = dinnerNutrients.fat_g || 0;

  if (cal > 750 || alc > 14 || caf > 30 || sug > 35 || fat > 35) {
    return { type: "pesada", label: "Pesada (digestión lenta o excitantes)", badgeClass: "bg-danger" };
  }
  if (cal >= 400 || alc > 0 || caf > 10 || sug > 20 || fat > 20) {
    return { type: "media", label: "Media (balanceada)", badgeClass: "bg-warning text-dark" };
  }
  return { type: "ligera", label: "Ligera (fácil descanso)", badgeClass: "bg-success" };
};

export const DailyLog = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  // Estados de control de flujo
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingNutrition, setAnalyzingNutrition] = useState(false);
  const [mode, setMode] = useState("new"); // "new" | "edit" | "nap"
  const [existingEntry, setExistingEntry] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Campos de Hábitos
  const [physicalActivity, setPhysicalActivity] = useState("media");
  const [bedtimeMood, setBedtimeMood] = useState("relajada");
  const [screenTime, setScreenTime] = useState("menos_1h");
  const [totalSleepHours, setTotalSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("intermedia");
  const [selectedIncidents, setSelectedIncidents] = useState([]);

  // 4 Tomas de Alimentos del Día (JSON specification)
  const [meals, setMeals] = useState({
    breakfast: "",
    lunch: "",
    snack: "",
    dinner: "",
  });

  // Campo de Sueño Principal
  const [sleepText, setSleepText] = useState("");

  // Campo específico para Siesta (modo 'nap')
  const [napText, setNapText] = useState("");

  // Previsualización Nutricional Consolidada (Edamam)
  const [nutritionPreview, setNutritionPreview] = useState(null);
  const [dinnerClassification, setDinnerClassification] = useState(null);

  // Validación
  const [errors, setErrors] = useState({});

  // 1. Detección de entrada existente para hoy
  useEffect(() => {
    const checkTodayEntry = async () => {
      if (!store.token) {
        setLoadingInitial(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/entries`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          const today = new Date().toISOString().split("T")[0];
          const todayEntry = (data.results || []).find(
            (e) => e.entry_date === today
          );

          if (todayEntry) {
            setExistingEntry(todayEntry);
            setShowDuplicateModal(true);
          }
        }
      } catch (err) {
        console.error("Error comprobando entrada previa:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    checkTodayEntry();
  }, [store.token]);

  // Selección de modo desde el modal
  const handleSelectEdit = () => {
    if (!existingEntry) return;
    setMode("edit");
    setShowDuplicateModal(false);

    if (existingEntry.sleep_report?.raw_text) {
      setSleepText(existingEntry.sleep_report.raw_text);
    }
    if (existingEntry.habit_log) {
      const h = existingEntry.habit_log;
      if (h.physical_activity) setPhysicalActivity(h.physical_activity);
      if (h.bedtime_mood) setBedtimeMood(h.bedtime_mood);
      if (h.screen_time) setScreenTime(h.screen_time);
      if (h.total_sleep_hours !== null && h.total_sleep_hours !== undefined) {
        setTotalSleepHours(String(h.total_sleep_hours));
      }
      if (h.sleep_quality) setSleepQuality(h.sleep_quality);
      if (h.incidents) {
        try {
          const parsed = JSON.parse(h.incidents);
          setSelectedIncidents(Array.isArray(parsed) ? parsed : [h.incidents]);
        } catch {
          setSelectedIncidents(h.incidents.split(",").map((s) => s.trim()));
        }
      }
      if (h.food_notes) {
        // Intentar parsear si se guardó estructurado como JSON o texto plano
        try {
          const parsedMeals = JSON.parse(h.food_notes);
          if (typeof parsedMeals === "object" && parsedMeals !== null) {
            setMeals({
              breakfast: parsedMeals.breakfast || "",
              lunch: parsedMeals.lunch || "",
              snack: parsedMeals.snack || "",
              dinner: parsedMeals.dinner || "",
            });
          } else {
            setMeals((prev) => ({ ...prev, dinner: h.food_notes }));
          }
        } catch {
          setMeals((prev) => ({ ...prev, dinner: h.food_notes }));
        }
      }
    }
    toast.info("Modo edición activado para el registro de hoy.");
  };

  const handleSelectNap = () => {
    setMode("nap");
    setShowDuplicateModal(false);
    toast.info("Añadiendo siesta / sueño complementario a la entrada de hoy.");
  };

  const handleToggleIncident = (val) => {
    setSelectedIncidents((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const handleMealChange = (mealKey, val) => {
    setMeals((prev) => ({ ...prev, [mealKey]: val }));
  };

  // 2. Previsualización y Análisis Nutricional Consolidado
  const handleAnalyzeNutrition = async () => {
    const hasAnyMeal = Object.values(meals).some((m) => m.trim().length > 0);
    if (!hasAnyMeal) {
      toast.warning("Introduce al menos una comida o bebida para calcular la nutrición.");
      return;
    }

    setAnalyzingNutrition(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      // Analyze every meal in parallel instead of waiting for up to four
      // sequential requests, and surface a real error when a request fails.
      const mealKeys = ["breakfast", "lunch", "snack", "dinner"];
      const mealEntries = mealKeys
        .filter((key) => meals[key].trim().length > 0)
        .map(async (key) => {
          const text = meals[key].trim();
          const resp = await fetch(`${BACKEND_URL}/api/nutrition/analyze`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              query: text,
              meal_type: key,
            }),
            signal: controller.signal,
          });
          if (!resp.ok) {
            let message = `Error ${resp.status} al analizar ${key}`;
            try {
              const errorData = await resp.json();
              message = errorData?.message || errorData?.error || message;
            } catch {
              // Keep the HTTP status message when the body is not JSON.
            }
            throw new Error(message);
          }
          const data = await resp.json();
          return { key, result: data.results };
        });

      const completed = await Promise.all(mealEntries);
      const resultsPerMeal = {};
      completed.forEach(({ key, result }) => {
        resultsPerMeal[key] = result;
      });

      // Consolidación de nutrientes y suma de calorías metabólicas del alcohol (7 kcal/g)
      const totals = {
        calories: 0,
        totalCalories: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        sugars_g: 0,
        fat_g: 0,
        caffeine_mg: 0,
        alcohol_g: 0,
        alcohol_calories: 0,
        sodium_mg: 0,
        vitamin_e_mg: 0,
        vitamin_b12_ug: 0,
        omega3_mg: 0,
      };

      Object.values(resultsPerMeal).forEach((r) => {
        totals.calories += Number(r.calories || 0);
        totals.protein_g += Number(r.protein_g || 0);
        totals.carbohydrates_g += Number(r.carbohydrates_g || 0);
        totals.sugars_g += Number(r.sugars_g || 0);
        totals.fat_g += Number(r.fat_g || 0);
        totals.caffeine_mg += Number(r.caffeine_mg || 0);
        totals.alcohol_g += Number(r.alcohol_g || 0);
        totals.sodium_mg += Number(r.sodium_mg || 0);
        totals.vitamin_e_mg += Number(r.vitamin_e_mg || 0);
        totals.vitamin_b12_ug += Number(r.vitamin_b12_ug || 0);
        totals.omega3_mg += Number(r.omega3_mg || 0);
      });

      // Cálculo exacto del alcohol: 7 kcal por gramo
      totals.alcohol_calories = Math.round(totals.alcohol_g * 7 * 10) / 10;
      totals.totalCalories = Math.round((totals.calories + totals.alcohol_calories) * 10) / 10;

      // Redondeos limpios
      Object.keys(totals).forEach((k) => {
        totals[k] = Math.round(totals[k] * 10) / 10;
      });

      // Clasificación de la cena
      const dinnerRes = resultsPerMeal["dinner"];
      const classification = classifyDinner(dinnerRes);

      setNutritionPreview(totals);
      setDinnerClassification(classification);
      toast.success("Nutrición del día calculada exitosamente.");
    } catch (err) {
      console.error(err);
      let message = err?.message || "Error al conectar con el servicio nutricional";
      if (err?.name === "AbortError") {
        message = "El análisis nutricional ha tardado demasiado y fue cancelado";
      }
      toast.error(message);
    } finally {
      clearTimeout(timeoutId);
      setAnalyzingNutrition(false);
    }
  };

  // 3. Envío y Orquestación Completa
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "nap") {
      if (!napText.trim()) {
        setErrors({ napText: "Por favor describe el sueño de tu siesta." });
        return;
      }
    } else {
      if (!sleepText.trim()) {
        setErrors({ sleepText: "El relato del sueño es obligatorio." });
        return;
      }
      const hoursTrimmed = totalSleepHours.trim();
      if (hoursTrimmed !== "") {
        const parsedHours = Number(hoursTrimmed);
        if (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 24) {
          setErrors({ totalSleepHours: "Las horas totales deben estar entre 0 y 24." });
          return;
        }
      }
    }

    setSubmitting(true);
    setErrors({});

    try {
      let targetEntryId = existingEntry?.id;

      // CASO A: Modo Siesta
      if (mode === "nap") {
        const previousRaw = existingEntry?.sleep_report?.raw_text || "";
        const updatedSleepText = `${previousRaw}\n\n[Siesta / Registro complementario]: ${napText.trim()}`;

        const updateResp = await fetch(
          `${BACKEND_URL}/api/entries/${existingEntry.id}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              sleep: { raw_text: updatedSleepText },
            }),
          }
        );

        if (!updateResp.ok) {
          throw new Error("No se pudo actualizar el registro con la siesta.");
        }
      }
      // CASO B: Modo Nuevo o Edición Completa
      else {
        // Determinamos la clasificación de la cena
        let computedDinnerType = dinnerClassification?.type;
        if (!computedDinnerType) {
          computedDinnerType = meals.dinner.trim() ? "media" : "nada";
        }

        // Serializamos las 4 comidas en food_notes para preservarlas y pasarlas al LLM
        const serializedFoodNotes = JSON.stringify({
          breakfast: meals.breakfast.trim(),
          lunch: meals.lunch.trim(),
          snack: meals.snack.trim(),
          dinner: meals.dinner.trim(),
        });

        const payload = {
          date: new Date().toISOString().split("T")[0],
          sleep: {
            raw_text: sleepText.trim(),
          },
          habits: {
            physical_activity: physicalActivity,
            dinner_type: computedDinnerType,
            bedtime_mood: bedtimeMood,
            screen_time: screenTime,
            incidents: JSON.stringify(selectedIncidents),
            food_notes: serializedFoodNotes,
            total_sleep_hours: totalSleepHours.trim() === "" ? null : Number(totalSleepHours),
            sleep_quality: sleepQuality,
          },
        };

        if (mode === "edit" && existingEntry) {
          const editResp = await fetch(
            `${BACKEND_URL}/api/entries/${existingEntry.id}`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify(payload),
            }
          );
          if (!editResp.ok) {
            throw new Error("No se pudo actualizar la entrada existente.");
          }
          targetEntryId = existingEntry.id;
        } else {
          const createResp = await fetch(`${BACKEND_URL}/api/entries`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });
          if (!createResp.ok) {
            const errData = await createResp.json();
            throw new Error(errData.message || "Error al crear la entrada diaria");
          }
          const createdData = await createResp.json();
          targetEntryId = createdData.results.id;
        }

        // Persistir información nutricional consolidada si hay alimentos
        // NOTE: Do NOT add meal-type prefixes here — Edamam cannot parse
        // lines like "Desayuno: 1 café con leche" and returns 0 for all nutrients.
        const allFoodLines = [
          meals.breakfast,
          meals.lunch,
          meals.snack,
          meals.dinner,
        ].filter((line) => line && line.trim().length > 0);

        if (allFoodLines.length > 0 && targetEntryId) {
          try {
            await fetch(`${BACKEND_URL}/api/nutrition/log`, {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                entry_id: targetEntryId,
                ingredients: allFoodLines,
                meal_type: "dinner",
              }),
            });
          } catch (nutrErr) {
            console.warn("Error guardando NutritionLog:", nutrErr);
          }
        }
      }

      // Orquestación del Análisis IA
      if (targetEntryId) {
        toast.info("Generando interpretación con IA...", { autoClose: 2000 });
        try {
          const aiResp = await fetch(
            `${BACKEND_URL}/api/analysis/${targetEntryId}`,
            {
              method: "POST",
              headers: getAuthHeaders(),
            }
          );
          if (!aiResp.ok) {
            console.warn("El análisis IA devolvió status:", aiResp.status);
          }
        } catch (aiErr) {
          console.warn("Fallo temporal en llamada IA:", aiErr);
        }
      }

      toast.success(
        mode === "nap"
          ? "¡Siesta añadida y analizada con éxito!"
          : "¡Registro completado y analizado!"
      );
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: "✅ Entrada procesada con éxito", status: 200 },
      });

      navigate("/daily-result");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al guardar el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="dailylog py-5 bg-dark text-white min-vh-100">
      <div className="container">
        {/* Modal de Entrada Duplicada / Siesta */}
        {showDuplicateModal && (
          <div
            className="modal d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content text-white"
                style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
              >
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">
                    📅 Ya tienes un registro para hoy
                  </h5>
                </div>
                <div className="modal-body">
                  <p>
                    Detectamos una entrada completada hoy con el sueño principal.
                    ¿Qué deseas hacer?
                  </p>
                  <div className="d-grid gap-3 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-info text-start p-3"
                      onClick={handleSelectNap}
                    >
                      <strong>💤 Añadir una Siesta / Sueño complementario</strong>
                      <div className="small text-light opacity-75">
                        Agrega este sueño a tu relato sin alterar tus hábitos ni
                        tu nutrición ya calculada.
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning text-start p-3"
                      onClick={handleSelectEdit}
                    >
                      <strong>✏️ Editar el Registro Completo</strong>
                      <div className="small text-light opacity-75">
                        Modifica hábitos, comidas o el relato nocturno principal.
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate("/daily-result")}
                    >
                      Ver resultado del día actual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-4">
          <h1
            className="display-5 fw-bold"
            style={{ color: "var(--color-primary, #00bcd4)" }}
          >
            {mode === "nap"
              ? "💤 Añadir Siesta / Sueño Complementario"
              : mode === "edit"
              ? "✏️ Editar Registro Diario"
              : "🌙 Registro Diario Integral"}
          </h1>
          <p className="lead fs-6 text-light opacity-75">
            {mode === "nap"
              ? "Este sueño complementario se añadirá a tu análisis de hoy para evaluar su impacto."
              : "Hábitos, nutrición y sueño se procesan conjuntamente para un análisis profundo."}
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-9">
            <form onSubmit={handleSubmit}>
              {/* FORMULARIO MODO SIESTA */}
              {mode === "nap" ? (
                <div
                  className="card p-4 border-0 shadow-sm mb-4"
                  style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
                >
                  <h4 className="mb-3 text-info">Relato de la Siesta</h4>
                  <p className="small text-light opacity-75">
                    Describe lo que experimentaste o soñaste durante tu siesta. El
                    motor de IA lo vinculará con tu sueño anterior.
                  </p>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows={5}
                      value={napText}
                      onChange={(e) => setNapText(e.target.value)}
                      placeholder="Ej: Me quedé dormido unos 40 minutos después de comer. Soñé que caminaba por un pasillo infinito con luz cálida..."
                      style={{
                        backgroundColor: "#121217",
                        color: "#fff",
                        borderColor: "#333",
                      }}
                    />
                    {errors.napText && (
                      <div className="text-danger small mt-1">
                        {errors.napText}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* FORMULARIO COMPLETO: HÁBITOS + NUTRICIÓN (4 COMIDAS) + SUEÑO */
                <>
                  {/* BLOQUE 1: HÁBITOS DEL DÍA */}
                  <div
                    className="card p-4 border-0 shadow-sm mb-4"
                    style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
                  >
                    <h3 className="h5 mb-4 text-primary">
                      📋 1. Hábitos e Higiene del Sueño
                    </h3>

                    <div className="row g-3">
                      {/* Actividad física */}
                      <div className="col-md-4">
                        <label className="form-label">
                          Actividad física del día:
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={physicalActivity}
                          onChange={(e) => setPhysicalActivity(e.target.value)}
                        >
                          <option value="nada">Ninguna / Sedentario</option>
                          <option value="baja">Baja (caminata suave)</option>
                          <option value="media">
                            Media (ejercicio regular)
                          </option>
                          <option value="alta">
                            Alta (entrenamiento intenso)
                          </option>
                        </select>
                      </div>

                      {/* Sensación antes de dormir */}
                      <div className="col-md-4">
                        <label className="form-label">
                          Sensación antes de dormir:
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={bedtimeMood}
                          onChange={(e) => setBedtimeMood(e.target.value)}
                        >
                          <option value="relajada">Relajada / En paz</option>
                          <option value="cansada">Cansada físicamente</option>
                          <option value="estresada">
                            Estresada / Preocupada
                          </option>
                          <option value="alegre">Alegre / Motivada</option>
                          <option value="triste">Triste / Desanimada</option>
                        </select>
                      </div>

                      {/* Pantallas */}
                      <div className="col-md-4">
                        <label className="form-label">
                          Pantallas antes de dormir:
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={screenTime}
                          onChange={(e) => setScreenTime(e.target.value)}
                        >
                          <option value="ninguna">
                            Ninguno (apagadas 1h antes)
                          </option>
                          <option value="menos_1h">Menos de 1 hora</option>
                          <option value="1_2h">Entre 1 y 2 horas</option>
                          <option value="mas_2h">
                            Más de 2 horas en la cama
                          </option>
                        </select>
                      </div>

                      {/* Sueño total y calidad */}
                      <div className="col-md-6 mt-3">
                        <label className="form-label">
                          Horas totales dormidas:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          className="form-control bg-dark text-white border-secondary"
                          value={totalSleepHours}
                          onChange={(e) => setTotalSleepHours(e.target.value)}
                          placeholder="Ej: 7.5"
                        />
                        {errors.totalSleepHours && (
                          <div className="text-danger small mt-1">
                            {errors.totalSleepHours}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6 mt-3">
                        <label className="form-label">
                          Calidad del sueño:
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={sleepQuality}
                          onChange={(e) => setSleepQuality(e.target.value)}
                        >
                          <option value="muy_baja">Muy baja (tronco)</option>
                          <option value="baja">Baja</option>
                          <option value="intermedia">Intermedia</option>
                          <option value="alta">Alta</option>
                          <option value="tronco">Tronco duro</option>
                        </select>
                      </div>

                      {/* Incidencias */}
                      <div className="col-12 mt-3">
                        <label className="form-label d-block">
                          Incidencias puntuales del día:
                        </label>
                        <div className="d-flex flex-wrap gap-2">
                          {INCIDENT_OPTIONS.map((inc) => {
                            const isSelected = selectedIncidents.includes(
                              inc.value
                            );
                            return (
                              <button
                                key={inc.value}
                                type="button"
                                className={`btn btn-sm ${
                                  isSelected
                                    ? "btn-primary"
                                    : "btn-outline-secondary"
                                }`}
                                onClick={() => handleToggleIncident(inc.value)}
                              >
                                {inc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE 2: NUTRICIÓN Y 4 COMIDAS DEL DÍA */}
                  <div
                    className="card p-4 border-0 shadow-sm mb-4"
                    style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h3 className="h5 mb-1 text-primary">
                          🥗 2. Nutrición y Comidas del Día
                        </h3>
                        <p className="small text-light opacity-75 mb-0">
                          Introduce lo que comiste o bebiste. Se analizará con
                          Edamam considerando el peso biológico de cada toma en
                          el descanso.
                        </p>
                      </div>
                    </div>

                    <div className="row g-3">
                      {/* Desayuno */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-info">
                          ☀️ Desayuno (Impacto leve: 0.8x)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={meals.breakfast}
                          onChange={(e) =>
                            handleMealChange("breakfast", e.target.value)
                          }
                          placeholder="Ej: 1 café con leche desnatada, 1 tostada de pan integral con tomate"
                        />
                      </div>

                      {/* Almuerzo / Comida */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-info">
                          🍲 Almuerzo / Comida (Impacto medio: 1.0x)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={meals.lunch}
                          onChange={(e) =>
                            handleMealChange("lunch", e.target.value)
                          }
                          placeholder="Ej: 150g lentejas, 1 pechuga de pollo, ensalada verde y 1 manzana"
                        />
                      </div>

                      {/* Merienda */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-warning">
                          ☕ Merienda / Snacks (Impacto excitante: 1.2x)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={meals.snack}
                          onChange={(e) =>
                            handleMealChange("snack", e.target.value)
                          }
                          placeholder="Ej: 1 taza de té verde, 30g nueces o 1 barrita de cereal"
                        />
                      </div>

                      {/* Cena */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-danger">
                          🌙 Cena / Recena (Máximo impacto en sueño: 1.5x)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={meals.dinner}
                          onChange={(e) =>
                            handleMealChange("dinner", e.target.value)
                          }
                          placeholder="Ej: Salmón al horno, espinacas salteadas y 1 copa de vino tinto"
                        />
                      </div>

                      <div className="col-12 mt-3 text-end">
                        <button
                          type="button"
                          className="btn btn-outline-info"
                          onClick={handleAnalyzeNutrition}
                          disabled={
                            analyzingNutrition ||
                            !Object.values(meals).some((m) => m.trim().length > 0)
                          }
                        >
                          {analyzingNutrition ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Calculando con Edamam...
                            </>
                          ) : (
                            "🔍 Calcular Nutrición Completa"
                          )}
                        </button>
                      </div>

                      {/* PREVIEW NUTRICIONAL DETALLADO */}
                      {nutritionPreview && (
                        <div className="col-12 mt-3">
                          <div
                            className="p-3 rounded border border-info"
                            style={{
                              backgroundColor: "rgba(13, 202, 240, 0.08)",
                            }}
                          >
                            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                              <h6 className="text-info mb-0 fw-bold">
                                ✨ Resumen Nutricional Integral del Día
                              </h6>
                              {dinnerClassification && (
                                <span
                                  className={`badge ${dinnerClassification.badgeClass} px-3 py-2 fs-6`}
                                >
                                  Cena deducida: {dinnerClassification.label}
                                </span>
                              )}
                            </div>

                            <div className="row text-center g-2 small">
                              {/* Calorías totales (incluyendo alcohol) */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Calorías Totales</div>
                                  <div className="fs-5 fw-bold text-white">
                                    {nutritionPreview.totalCalories} kcal
                                  </div>
                                  {nutritionPreview.alcohol_calories > 0 && (
                                    <div className="text-danger" style={{ fontSize: "0.75rem" }}>
                                      +{nutritionPreview.alcohol_calories} kcal (alcohol)
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Grasas */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Grasas Totales</div>
                                  <div className="fs-5 fw-bold text-white">
                                    {nutritionPreview.fat_g} g
                                  </div>
                                </div>
                              </div>

                              {/* Carbohidratos y Azúcares */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Carbs / Azúcar</div>
                                  <div className="fs-5 fw-bold text-white">
                                    {nutritionPreview.carbohydrates_g}g /{" "}
                                    <span className="text-warning">
                                      {nutritionPreview.sugars_g}g
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Proteínas */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Proteínas</div>
                                  <div className="fs-5 fw-bold text-white">
                                    {nutritionPreview.protein_g} g
                                  </div>
                                </div>
                              </div>

                              {/* Cafeína y Excitantes */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Cafeína Total</div>
                                  <div className="fs-5 fw-bold text-warning">
                                    {nutritionPreview.caffeine_mg} mg
                                  </div>
                                </div>
                              </div>

                              {/* Alcohol */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Alcohol Puro</div>
                                  <div className="fs-5 fw-bold text-danger">
                                    {nutritionPreview.alcohol_g} g
                                  </div>
                                </div>
                              </div>

                              {/* Micronutrientes clave */}
                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Sodio</div>
                                  <div className="fs-5 fw-bold text-white">
                                    {nutritionPreview.sodium_mg} mg
                                  </div>
                                </div>
                              </div>

                              <div className="col-6 col-md-3">
                                <div className="p-2 bg-dark rounded border border-secondary">
                                  <div className="text-light opacity-75 fw-bold mb-1">Vit. B12 / Vit. E</div>
                                  <div className="fs-6 fw-bold text-white mt-1">
                                    {nutritionPreview.vitamin_b12_ug}µg /{" "}
                                    {nutritionPreview.vitamin_e_mg}mg
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOQUE 3: RELATO DEL SUEÑO */}
                  <div
                    className="card p-4 border-0 shadow-sm mb-4"
                    style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
                  >
                    <h3 className="h5 mb-3 text-primary">
                      🌙 3. Relato del Sueño
                    </h3>
                    <p className="small text-light opacity-75">
                      Escribe con tus propias palabras todo lo que recuerdes:
                      sensaciones, lugares, personas, colores o símbolos.
                    </p>
                    <div className="mb-3">
                      <textarea
                        className="form-control bg-dark text-white border-secondary"
                        rows={6}
                        value={sleepText}
                        onChange={(e) => setSleepText(e.target.value)}
                        placeholder="Esta noche soñé que estaba en una biblioteca flotante sobre el mar. Había tormenta pero dentro reinaba silencio..."
                      />
                      {errors.sleepText && (
                        <div className="text-danger small mt-1">
                          {errors.sleepText}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* BOTÓN FINAL DE SUBMIT */}
              <div className="d-grid gap-2 mb-5">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg fw-bold py-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Procesando y Analizando con IA...
                    </>
                  ) : mode === "nap" ? (
                    "💤 Confirmar Siesta y Re-analizar"
                  ) : (
                    "✨ Confirmar y Analizar Todo"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
