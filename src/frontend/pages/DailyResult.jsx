import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

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

const safeJsonParse = (val, fallback = []) => {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  try {
    const res = JSON.parse(val);
    return Array.isArray(res) ? res : [res];
  } catch {
    return [String(val)];
  }
};

export const DailyResult = () => {
  const { dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [entry, setEntry] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/entries`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const err = await response.json();
          const msg = err.message || "Error al obtener entradas";
          if (!isCancelled) {
            setError(msg);
            toast.error(msg);
            dispatch({
              type: "SET_MESSAGE",
              payload: { msg: `⚠️ ${msg}`, status: response.status },
            });
          }
          return;
        }
        const data = await response.json();
        const today = new Date().toISOString().split("T")[0];
        const todaysEntry = (data.results || []).find(
          (e) => e.entry_date === today
        );
        if (!isCancelled) {
          setEntry(todaysEntry || null);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setError(err.message);
          toast.error("Error de conexión");
          dispatch({
            type: "SET_MESSAGE",
            payload: { msg: `⚠️ ${err.message}`, status: 500 },
          });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, refreshTrigger]);

  const handleReanalyze = async () => {
    if (!entry) return;
    setReanalyzing(true);
    toast.info("Regenerando análisis con IA...", { autoClose: 2000 });
    try {
      const response = await fetch(`${BACKEND_URL}/api/analysis/${entry.id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("No se pudo regenerar el análisis");
      }
      toast.success("Análisis actualizado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al re-analizar");
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center bg-dark text-white"
        style={{ minHeight: "80vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando resultado...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-white">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error al cargar el resultado</h4>
          <p>{error}</p>
          <hr />
          <button
            className="btn btn-outline-danger"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container py-5 text-center text-white">
        <div
          className="card p-5 border-0 shadow-sm mx-auto"
          style={{
            maxWidth: "600px",
            backgroundColor: "var(--color-surface, #1e1e24)",
          }}
        >
          <h2 className="mb-3">📅 Sin registro para hoy</h2>
          <p className="text-muted mb-4">
            Aún no has completado tu registro de hábitos y sueño del día de hoy.
          </p>
          <Link to="/daily-log" className="btn btn-primary btn-lg">
            Comenzar Registro Diario
          </Link>
        </div>
      </div>
    );
  }

  const { sleep_report, habit_log, nutrition_log, analysis } = entry;

  const emotions = safeJsonParse(analysis?.predominant_emotions);
  const symbols = safeJsonParse(analysis?.detected_symbols);
  const recommendations = safeJsonParse(analysis?.recommendations);
  const alerts = safeJsonParse(analysis?.alerts);

  return (
    <section className="dailyresult py-5 bg-dark text-white min-vh-100">
      <div className="container">
        {/* Encabezado */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <div>
            <h1 className="h2 fw-bold mb-1" style={{ color: "var(--color-primary, #6366f1)" }}>
              ✨ Análisis Integral de Hoy
            </h1>
            <p className="text-muted mb-0">
              Fecha: <strong>{entry.entry_date}</strong>
            </p>
          </div>
          <div className="d-flex gap-2 mt-2 mt-sm-0">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleReanalyze}
              disabled={reanalyzing}
            >
              {reanalyzing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" />
                  Analizando...
                </>
              ) : (
                "🔄 Re-analizar con IA"
              )}
            </button>
            <Link to="/daily-log" className="btn btn-outline-light btn-sm">
              ✏️ Modificar / Siesta
            </Link>
          </div>
        </div>

        {/* ALERTAS CRÍTICAS DE SALUD O SUEÑO */}
        {alerts.length > 0 && (
          <div className="alert alert-warning border-0 shadow-sm mb-4">
            <h5 className="alert-heading mb-2">⚠️ Alertas de Higiene y Hábitos</h5>
            <ul className="mb-0 ps-3">
              {alerts.map((alertText, idx) => (
                <li key={idx}>{alertText}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. INTERPRETACIÓN DEL SUEÑO (ONÍRICA) */}
        <div
          className="card p-4 border-0 shadow-sm mb-4"
          style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h4 text-primary mb-0">🔮 Interpretación del Sueño</h3>
            <span className="badge bg-primary">Motor IA Unificado</span>
          </div>

          <p className="lead fs-6 mb-4" style={{ lineHeight: "1.7" }}>
            {analysis?.interpretation || (
              <span className="text-muted italic">
                El análisis aún no se ha generado o está en proceso. Pulsa
                "Re-analizar con IA" para obtener la lectura.
              </span>
            )}
          </p>

          {/* Emociones y Símbolos en Badges */}
          <div className="row g-3">
            <div className="col-md-6">
              <h6 className="text-muted text-uppercase small fw-bold">
                🎭 Emociones Predominantes
              </h6>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {emotions.length > 0 ? (
                  emotions.map((emo, idx) => (
                    <span
                      key={idx}
                      className="badge bg-info text-dark px-3 py-2 fs-6 rounded-pill"
                    >
                      {emo}
                    </span>
                  ))
                ) : (
                  <span className="text-muted small">Sin emociones registradas</span>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <h6 className="text-muted text-uppercase small fw-bold">
                🗝️ Símbolos Oníricos Detectados
              </h6>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {symbols.length > 0 ? (
                  symbols.map((sym, idx) => (
                    <span
                      key={idx}
                      className="badge bg-secondary px-3 py-2 fs-6 rounded-pill"
                    >
                      {sym}
                    </span>
                  ))
                ) : (
                  <span className="text-muted small">Sin símbolos detectados</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. CRUCE DE HÁBITOS Y NUTRICIÓN */}
        <div className="row g-4 mb-4">
          {/* Lectura de hábitos por la IA */}
          <div className="col-lg-7">
            <div
              className="card h-100 p-4 border-0 shadow-sm"
              style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
            >
              <h4 className="h5 text-info mb-3">
                🌿 Lectura de Hábitos y Contexto
              </h4>
              <p className="text-white-50" style={{ lineHeight: "1.6" }}>
                {analysis?.habits_reading ||
                  "La IA relaciona tus actividades nocturnas con el descanso obtenido."}
              </p>

              <hr className="border-secondary my-3" />

              <h6 className="text-muted small text-uppercase fw-bold mb-3">
                Resumen de Hábitos Registrados
              </h6>
              <div className="row g-2 small">
                <div className="col-6">
                  <strong>Actividad física:</strong>{" "}
                  <span className="text-capitalize">
                    {habit_log?.physical_activity || "No registrada"}
                  </span>
                </div>
                <div className="col-6">
                  <strong>Tipo de cena:</strong>{" "}
                  <span className="text-capitalize">
                    {habit_log?.dinner_type || "No registrada"}
                  </span>
                </div>
                <div className="col-6">
                  <strong>Ánimo al dormir:</strong>{" "}
                  <span className="text-capitalize">
                    {habit_log?.bedtime_mood || "No registrado"}
                  </span>
                </div>
                <div className="col-6">
                  <strong>Uso de pantallas:</strong>{" "}
                  <span className="text-capitalize">
                    {habit_log?.screen_time || "No registrado"}
                  </span>
                </div>
                {habit_log?.incidents && (
                  <div className="col-12 mt-2">
                    <strong>Incidencias:</strong>{" "}
                    <span className="badge bg-dark border border-secondary text-white-50">
                      {habit_log.incidents}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque Nutricional (Edamam) */}
          <div className="col-lg-5">
            <div
              className="card h-100 p-4 border-0 shadow-sm"
              style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
            >
              <h4 className="h5 text-success mb-3">
                🥗 Impacto Nutricional (Edamam)
              </h4>

              {nutrition_log ? (
                <>
                  <div className="row text-center g-2 mb-3">
                    <div className="col-6">
                      <div className="p-3 bg-dark rounded border border-secondary">
                        <div className="small text-muted">Calorías</div>
                        <div className="fs-5 fw-bold text-white">
                          {nutrition_log.calories} kcal
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-dark rounded border border-secondary">
                        <div className="small text-muted">Cafeína</div>
                        <div className="fs-5 fw-bold text-warning">
                          {nutrition_log.caffeine_mg} mg
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-dark rounded border border-secondary">
                        <div className="small text-muted">Azúcares</div>
                        <div className="fs-5 fw-bold text-white">
                          {nutrition_log.sugar_g} g
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-dark rounded border border-secondary">
                        <div className="small text-muted">Alcohol</div>
                        <div className="fs-5 fw-bold text-danger">
                          {nutrition_log.alcohol_g} g
                        </div>
                      </div>
                    </div>
                  </div>
                  {habit_log?.food_notes && (
                    <div className="small text-muted mt-2">
                      <em>Notas: "{habit_log.food_notes}"</em>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p>No se registraron alimentos o cena para esta fecha.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. PATRONES DETECTADOS Y RECOMENDACIONES */}
        <div className="row g-4 mb-4">
          {/* Patrones */}
          {analysis?.patterns_detected && (
            <div className="col-12">
              <div
                className="card p-4 border-0 shadow-sm"
                style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
              >
                <h4 className="h5 text-warning mb-2">
                  📈 Patrones y Correlaciones con el Histórico
                </h4>
                <p className="mb-0 text-white-50" style={{ lineHeight: "1.6" }}>
                  {analysis.patterns_detected}
                </p>
              </div>
            </div>
          )}

          {/* Recomendaciones personalizadas */}
          <div className="col-12">
            <div
              className="card p-4 border-0 shadow-sm"
              style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
            >
              <h4 className="h5 text-primary mb-3">
                💡 Recomendaciones Personalizadas de Higiene del Sueño
              </h4>
              <div className="row g-3">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, idx) => (
                    <div className="col-md-6" key={idx}>
                      <div
                        className="p-3 rounded h-100 border border-secondary"
                        style={{ backgroundColor: "#15151c" }}
                      >
                        <div className="d-flex align-items-start">
                          <span className="badge bg-primary me-2 mt-1">
                            {idx + 1}
                          </span>
                          <span className="text-white-50">{rec}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-muted">
                    No hay recomendaciones adicionales generadas.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. RELATO ORIGINAL DEL SUEÑO */}
        <div
          className="card p-4 border-0 shadow-sm"
          style={{ backgroundColor: "var(--color-surface, #1e1e24)" }}
        >
          <h4 className="h6 text-muted text-uppercase fw-bold mb-3">
            📖 Relato Original Registrado
          </h4>
          <div
            className="p-3 rounded text-white-50"
            style={{
              backgroundColor: "#121217",
              whiteSpace: "pre-wrap",
              lineHeight: "1.6",
            }}
          >
            {sleep_report?.raw_text || "Sin relato disponible."}
          </div>
        </div>
      </div>
    </section>
  );
};
