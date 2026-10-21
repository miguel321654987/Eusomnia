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
  const [dinnerType, setDinnerType] = useState("media");
  const [bedtimeMood, setBedtimeMood] = useState("relajada");
  const [screenTime, setScreenTime] = useState("menos_1h");
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [foodNotes, setFoodNotes] = useState("");

  // Campo de Sueño Principal
  const [sleepText, setSleepText] = useState("");

  // Campo específico para Siesta (modo 'nap')
  const [napText, setNapText] = useState("");

  // Previsualización Nutricional (Edamam)
  const [nutritionPreview, setNutritionPreview] = useState(null);

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
            (e) => e.entry_date === today,
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

    // Precargar datos
    if (existingEntry.sleep_report?.raw_text) {
      setSleepText(existingEntry.sleep_report.raw_text);
    }
    if (existingEntry.habit_log) {
      const h = existingEntry.habit_log;
      if (h.physical_activity) setPhysicalActivity(h.physical_activity);
      if (h.dinner_type) setDinnerType(h.dinner_type);
      if (h.bedtime_mood) setBedtimeMood(h.bedtime_mood);
      if (h.screen_time) setScreenTime(h.screen_time);
      if (h.food_notes) setFoodNotes(h.food_notes);
      if (h.incidents) {
        try {
          const parsed = JSON.parse(h.incidents);
          setSelectedIncidents(Array.isArray(parsed) ? parsed : [h.incidents]);
        } catch {
          setSelectedIncidents(h.incidents.split(",").map((s) => s.trim()));
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
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val],
    );
  };

  // 2. Previsualización Nutricional con Edamam
  const handleAnalyzeNutrition = async () => {
    if (!foodNotes.trim()) {
      toast.warning("Introduce algún alimento o cena en el campo de comida.");
      return;
    }

    setAnalyzingNutrition(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/nutrition/analyze`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query: foodNotes,
          meal_type: dinnerType === "nada" ? null : dinnerType,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.message || "Error al analizar la comida con Edamam",
        );
      }

      const data = await response.json();
      setNutritionPreview(data.results);
      toast.success("Análisis nutricional calculado correctamente.");
    } catch (err) {
      console.error(err);
      toast.error(
        err.message || "Error conectando con el servicio nutricional",
      );
    } finally {
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
          },
        );

        if (!updateResp.ok) {
          throw new Error("No se pudo actualizar el registro con la siesta.");
        }
      }
      // CASO B: Modo Nuevo o Edición Completa
      else {
        const payload = {
          date: new Date().toISOString().split("T")[0],
          sleep: {
            raw_text: sleepText.trim(),
          },
          habits: {
            physical_activity: physicalActivity,
            dinner_type: dinnerType,
            bedtime_mood: bedtimeMood,
            screen_time: screenTime,
            incidents: JSON.stringify(selectedIncidents),
            food_notes: foodNotes.trim(),
          },
        };

        if (mode === "edit" && existingEntry) {
          const editResp = await fetch(
            `${BACKEND_URL}/api/entries/${existingEntry.id}`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify(payload),
            },
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
            throw new Error(
              errData.message || "Error al crear la entrada diaria",
            );
          }
          const createdData = await createResp.json();
          targetEntryId = createdData.results.id;
        }

        // Persistir información nutricional si hay alimentos
        if (foodNotes.trim() && targetEntryId) {
          try {
            await fetch(`${BACKEND_URL}/api/nutrition/log`, {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                entry_id: targetEntryId,
                ingredients: [foodNotes.trim()],
                meal_type: dinnerType === "nada" ? null : dinnerType,
              }),
            });
          } catch (nutrErr) {
            console.warn(
              "Error guardando NutritionLog (no bloqueante):",
              nutrErr,
            );
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
            },
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
          : "¡Registro completado y analizado!",
      );
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: "✅ Entrada procesada con éxito", status: 200 },
      });

      // Redirigir a DailyResult
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
                    Detectamos una entrada completada hoy con el sueño
                    principal. ¿Qué deseas hacer?
                  </p>
                  <div className="d-grid gap-3 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-info text-start p-3"
                      onClick={handleSelectNap}
                    >
                      <strong>
                        💤 Añadir una Siesta / Sueño complementario
                      </strong>
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
                        Modifica hábitos, comida o el relato nocturno principal.
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
                    Describe lo que experimentaste o soñaste durante tu siesta.
                    El motor de IA lo vinculará con tu sueño anterior.
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
                /* FORMULARIO COMPLETO: HÁBITOS + NUTRICIÓN + SUEÑO */
                <>
                  {/* BLOQUE 1: HÁBITOS DEL DÍA */}
                  <div
                    className="card p-4 border-0 shadow-sm mb-4 text-secondary"
                    style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
                  >
                    <h3 className="h5 mb-4 text-primary">
                      📋 1. Hábitos e Higiene del Sueño
                    </h3>

                    <div className="row g-3">
                      {/* Actividad física */}
                      <div className="col-md-6">
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

                      {/* Tipo de cena */}
                      <div className="col-md-6">
                        <label className="form-label">Tipo de cena:</label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={dinnerType}
                          onChange={(e) => setDinnerType(e.target.value)}
                        >
                          <option value="nada">Sin cena / Ayuno</option>
                          <option value="ligera">
                            Ligera (ensalada, fruta)
                          </option>
                          <option value="media">
                            Media (plato balanceado)
                          </option>
                          <option value="pesada">
                            Pesada (frituras, copiosa, tardía)
                          </option>
                        </select>
                      </div>

                      {/* Sensación antes de dormir */}
                      <div className="col-md-6">
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
                      <div className="col-md-6">
                        <label className="form-label">
                          Uso de pantallas antes de dormir:
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

                      {/* Incidencias */}
                      <div className="col-12 mt-3">
                        <label className="form-label d-block">
                          Incidencias puntuales del día:
                        </label>
                        <div className="d-flex flex-wrap gap-2">
                          {INCIDENT_OPTIONS.map((inc) => {
                            const isSelected = selectedIncidents.includes(
                              inc.value,
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

                      {/* Comida / Cena para Edamam */}
                      <div className="col-12 mt-4">
                        <label className="form-label">
                          Alimentos y bebidas consumidos (Cena o noche):
                        </label>
                        <textarea
                          className="form-control bg-dark text-white border-secondary"
                          rows={2}
                          value={foodNotes}
                          onChange={(e) => setFoodNotes(e.target.value)}
                          placeholder="Ej: 2 tazas de té verde, 150g salmón, ensalada de espinacas y 1 copa de vino"
                        />
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="small text-light opacity-75">
                            Se enviará a Edamam para calcular nutrientes e
                            impacto en el sueño.
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm"
                            onClick={handleAnalyzeNutrition}
                            disabled={analyzingNutrition || !foodNotes.trim()}
                          >
                            {analyzingNutrition
                              ? "Calculando..."
                              : "🔍 Calcular Nutrición"}
                          </button>
                        </div>
                      </div>

                      {/* PREVIEW NUTRICIONAL */}
                      {nutritionPreview && (
                        <div className="col-12 mt-3">
                          <div
                            className="p-3 rounded border border-info"
                            style={{
                              backgroundColor: "rgba(13, 202, 240, 0.08)",
                            }}
                          >
                            <h6 className="text-info mb-2">
                              ✨ Vista Previa Nutricional (Edamam)
                            </h6>
                            <div className="row text-center g-2 small">
                              <div className="col-3">
                                <strong>Calorías</strong>
                                <div>{nutritionPreview.calories || 0} kcal</div>
                              </div>
                              <div className="col-3">
                                <strong>Cafeína</strong>
                                <div>
                                  {nutritionPreview.caffeine_mg || 0} mg
                                </div>
                              </div>
                              <div className="col-3">
                                <strong>Azúcar</strong>
                                <div>{nutritionPreview.sugars_g || 0} g</div>
                              </div>
                              <div className="col-3">
                                <strong>Alcohol</strong>
                                <div>{nutritionPreview.alcohol_g || 0} g</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOQUE 2: RELATO DEL SUEÑO */}
                  <div
                    className="card p-4 border-0 shadow-sm mb-4"
                    style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
                  >
                    <h3 className="h5 mb-3 text-primary">
                      🌙 2. Relato del Sueño
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
