import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { apiUrl } from "../api.js";
import {
  filterHistoryEntries,
  formatHistoryDate,
  getAlerts,
  getAnalysisText,
  hasEntryAlerts,
  getHistoryMetrics,
  getQualityKey,
  getSleepQuality,
  isAnalysisStale,
} from "./historyUtils.js";
import "./Historial.css";

const RANGE_OPTIONS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "all", label: "Todo" },
];

const QUALITY_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "deep", label: "Profundo" },
  { value: "intermediate", label: "Intermedio" },
  { value: "fragmented", label: "Fragmentado" },
  { value: "alerts", label: "Con alertas" },
];

async function requestApi(path, token) {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
    throw new Error(data.message || "No se pudo cargar el historial.");
  }
  return data.results;
}

export const Historial = () => {
  const { store } = useGlobalReducer();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedEntryId = searchParams.get("entryId");
  const token = store.token || localStorage.getItem("jwt-token");
  const [entries, setEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(
    requestedEntryId ? Number(requestedEntryId) : null,
  );
  const [range, setRange] = useState(requestedEntryId ? "all" : "7");
  const [quality, setQuality] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!token) return undefined;

    let isActive = true;
    const loadEntries = async () => {
      await Promise.resolve();
      if (!isActive) return;
      setIsLoading(true);
      setLoadError("");
      try {
        const results = await requestApi("/api/entries", token);
        if (!isActive) return;
        const loadedEntries = Array.isArray(results) ? results : [];
        setEntries(loadedEntries);
        const requestedId = Number(requestedEntryId);
        const requestedExists =
          Number.isInteger(requestedId) &&
          loadedEntries.some((entry) => entry.id === requestedId);
        setSelectedEntryId(
          requestedExists ? requestedId : loadedEntries[0]?.id ?? null,
        );
      } catch (error) {
        if (isActive) {
          setLoadError(error.message || "No se pudo cargar el historial.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void loadEntries();

    return () => {
      isActive = false;
    };
  }, [requestedEntryId, token]);

  const filteredEntries = useMemo(
    () => filterHistoryEntries(entries, { range, quality, search }),
    [entries, range, quality, search],
  );
  const rangeEntries = useMemo(
    () =>
      filterHistoryEntries(entries, {
        range,
        quality: "all",
        search: "",
      }),
    [entries, range],
  );
  const metrics = useMemo(
    () => getHistoryMetrics(rangeEntries),
    [rangeEntries],
  );
  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedEntryId) ||
    filteredEntries[0] ||
    null;

  if (!token) {
    return (
      <div className="eusomnia-canvas history-page py-5">
        <div className="container history-container">
          <div className="eusomnia-card p-4 text-center">
            <h1 className="font-headline h4 text-light">Inicia sesión</h1>
            <p className="text-secondary">
              El historial contiene únicamente tus registros guardados.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#loginModal"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const notice = location.state?.notice;

  return (
    <div className="eusomnia-canvas history-page py-4 py-lg-5">
      <div className="glow-orb-primary" />
      <div className="container history-container position-relative">
        <header className="history-header mb-4">
          <span className="history-eyebrow">
            <span className="pulse-dot-cyan" />
            Sincronización circadiana Eusomnia
          </span>
          <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-end gap-3">
            <div>
              <h1 className="font-headline history-title">
                Historial de Registros &amp; Cronobiología
              </h1>
              <p className="history-subtitle mb-0">
                Revisa la evolución de tus registros de sueño, hábitos y análisis.
              </p>
            </div>
            <div
              className="history-range-switch"
              aria-label="Rango temporal del historial"
            >
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`history-range-button ${
                    range === option.value ? "active" : ""
                  }`}
                  aria-pressed={range === option.value}
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {notice?.text && (
          <div
            className={`alert ${
              notice.type === "warning" ? "alert-warning" : "alert-info"
            } history-notice`}
            role="status"
          >
            {notice.text}
          </div>
        )}

        {loadError && (
          <div className="alert alert-danger" role="alert">
            {loadError}
          </div>
        )}

        <section
          className="history-summary-grid mb-4"
          aria-label="Resumen de registros"
        >
          <article className="history-stat-card">
            <span className="history-stat-label">Duración media del sueño</span>
            <strong className="history-stat-value">
              {metrics.averageSleepHours === null
                ? "—"
                : `${metrics.averageSleepHours.toFixed(1)} h`}
            </strong>
            <span className="history-stat-caption">
              {range === "all" ? "En todo el historial" : `En ${range} días`}
            </span>
          </article>
          <article className="history-stat-card">
            <span className="history-stat-label">Calidad más frecuente</span>
            <strong className="history-stat-value history-stat-value-text">
              {metrics.mostCommonQuality}
            </strong>
            <span className="history-stat-caption">
              Según la calidad registrada
            </span>
          </article>
          <article className="history-stat-card">
            <span className="history-stat-label">Registros con alertas</span>
            <strong className="history-stat-value">
              {metrics.alertCount}
            </strong>
            <span className="history-stat-caption">
              De {metrics.entryCount} registros del periodo
            </span>
          </article>
        </section>

        <section className="history-toolbar mb-4" aria-label="Buscar y filtrar">
          <label className="history-search">
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
            <span className="visually-hidden">Buscar en el historial</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar relato, símbolo o palabra clave..."
            />
          </label>
          <div className="history-quality-filters" aria-label="Filtrar por calidad">
            <span className="history-filter-caption">Calidad:</span>
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`history-filter-button ${
                  quality === option.value ? "active" : ""
                }`}
                aria-pressed={quality === option.value}
                onClick={() => setQuality(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="history-state-card" role="status">
            <span className="spinner-border spinner-border-sm me-2" />
            Cargando tus registros...
          </div>
        ) : !loadError && entries.length === 0 ? (
          <div className="history-state-card text-center">
            <span className="material-symbols-outlined history-state-icon">
              bedtime
            </span>
            <h2 className="font-headline h5 text-light">
              Aún no hay registros
            </h2>
            <p className="text-secondary">
              Guarda tu primer registro diario para verlo aquí.
            </p>
            <Link to="/registro-diario" className="btn btn-primary">
              Crear un registro
            </Link>
          </div>
        ) : !loadError && filteredEntries.length === 0 ? (
          <div className="history-state-card text-center" role="status">
            <h2 className="font-headline h5 text-light">
              No hay resultados para estos filtros
            </h2>
            <p className="text-secondary mb-0">
              Prueba con otro periodo, calidad o término de búsqueda.
            </p>
          </div>
        ) : !loadError ? (
          <div className="row g-4 history-content">
            <section
              className="col-12 col-lg-7"
              aria-labelledby="history-timeline-heading"
            >
              <div className="history-section-heading">
                <h2
                  className="font-headline h5 mb-0"
                  id="history-timeline-heading"
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    view_timeline
                  </span>
                  Cronología de sesiones
                </h2>
                <span className="history-result-count">
                  {filteredEntries.length}{" "}
                  {filteredEntries.length === 1 ? "registro" : "registros"}
                </span>
              </div>
              <div className="history-timeline">
                {filteredEntries.map((entry) => {
                  const entryQuality = getSleepQuality(entry);
                  const sleepHours = entry.habit_log?.total_sleep_hours;
                  const active = selectedEntry?.id === entry.id;
                  const narrative =
                    entry.sleep_report?.final_text ||
                    entry.sleep_report?.raw_text ||
                    "Este registro no incluye un relato del sueño.";
                  return (
                    <button
                      type="button"
                      key={entry.id}
                      className={`history-entry-card ${active ? "active" : ""}`}
                      onClick={() => setSelectedEntryId(entry.id)}
                      aria-pressed={active}
                    >
                      <span className="history-timeline-marker" />
                      <span className="history-entry-topline">
                        <span className="history-entry-date">
                          {formatHistoryDate(entry.entry_date, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          className={`history-quality-badge quality-${getQualityKey(
                            entryQuality,
                          )}`}
                        >
                          {entryQuality}
                        </span>
                      </span>
                      <span className="history-entry-summary">
                        “{narrative}”
                      </span>
                      <span className="history-entry-meta">
                        <span>
                          <span
                            className="material-symbols-outlined"
                            aria-hidden="true"
                          >
                            schedule
                          </span>
                          {Number.isFinite(Number(sleepHours)) &&
                          sleepHours !== null
                            ? `${Number(sleepHours).toFixed(1)} h`
                            : "Duración no indicada"}
                        </span>
                        {hasEntryAlerts(entry) && (
                          <span className="history-alert-indicator">
                            <span
                              className="material-symbols-outlined"
                              aria-hidden="true"
                            >
                              warning
                            </span>
                            Alertas
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedEntry && (
              <aside
                className="col-12 col-lg-5"
                aria-labelledby="history-detail-heading"
              >
                <article className="history-detail-card">
                  <div className="history-detail-heading">
                    <div>
                      <span className="history-eyebrow">
                        Detalle del registro #{selectedEntry.id}
                      </span>
                      <h2
                        className="font-headline h4 mb-0"
                        id="history-detail-heading"
                      >
                        {formatHistoryDate(selectedEntry.entry_date)}
                      </h2>
                    </div>
                    <span
                      className={`history-quality-badge quality-${getQualityKey(
                        getSleepQuality(selectedEntry),
                      )}`}
                    >
                      {getSleepQuality(selectedEntry)}
                    </span>
                  </div>

                  <div className="history-dates-grid">
                    <div>
                      <span>Fecha original</span>
                      <strong>
                        {formatHistoryDate(
                          selectedEntry.original_entry_date ||
                            selectedEntry.entry_date,
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>Fecha efectiva</span>
                      <strong>{formatHistoryDate(selectedEntry.entry_date)}</strong>
                    </div>
                  </div>

                  <section className="history-detail-section">
                    <h3>
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        bedtime
                      </span>
                      Relato del sueño
                    </h3>
                    <blockquote>
                      {selectedEntry.sleep_report?.final_text ||
                        selectedEntry.sleep_report?.raw_text ||
                        "No hay un relato guardado para esta entrada."}
                    </blockquote>
                  </section>

                  <section className="history-detail-section">
                    <h3>
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        monitoring
                      </span>
                      Datos registrados
                    </h3>
                    <div className="history-data-grid">
                      <div>
                        <span>Duración</span>
                        <strong>
                          {Number.isFinite(
                            Number(selectedEntry.habit_log?.total_sleep_hours),
                          ) &&
                          selectedEntry.habit_log?.total_sleep_hours !== null
                            ? `${Number(
                                selectedEntry.habit_log.total_sleep_hours,
                              ).toFixed(1)} h`
                            : "Sin indicar"}
                        </strong>
                      </div>
                      <div>
                        <span>Actividad</span>
                        <strong>
                          {selectedEntry.habit_log?.physical_activity ||
                            "Sin indicar"}
                        </strong>
                      </div>
                      <div>
                        <span>Pantallas</span>
                        <strong>
                          {selectedEntry.habit_log?.screen_time || "Sin indicar"}
                        </strong>
                      </div>
                      <div>
                        <span>Cafeína registrada</span>
                        <strong>
                          {selectedEntry.nutrition_log?.analyzed
                            ? `${Number(
                                selectedEntry.nutrition_log?.caffeine_mg || 0,
                              ).toFixed(0)} mg`
                            : "Sin análisis"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {selectedEntry.analysis ? (
                    <section className="history-detail-section">
                      <h3>
                        <span
                          className="material-symbols-outlined"
                          aria-hidden="true"
                        >
                          auto_awesome
                        </span>
                        Interpretación del análisis
                      </h3>
                      {isAnalysisStale(selectedEntry) && (
                        <p className="history-stale-notice" role="status">
                          El análisis puede estar desactualizado. Puedes
                          regenerarlo desde el resultado completo.
                        </p>
                      )}
                      <p className="history-interpretation">
                        {selectedEntry.analysis.interpretation ||
                          "El análisis no incluye una interpretación."}
                      </p>
                      <div className="history-tag-list">
                        {getAnalysisText(
                          selectedEntry.analysis.detected_symbols,
                        ).map((symbol, index) => (
                          <span className="history-tag" key={`${symbol}-${index}`}>
                            {symbol}
                          </span>
                        ))}
                        {getAnalysisText(
                          selectedEntry.analysis.predominant_emotions,
                        ).map((emotion, index) => (
                          <span
                            className="history-tag history-tag-muted"
                            key={`${emotion}-${index}`}
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <p className="history-pending-note">
                      Este registro aún no tiene un análisis onírico.
                    </p>
                  )}

                  {getAlerts(selectedEntry).length > 0 && (
                    <section className="history-alert-list">
                      <h3>
                        <span
                          className="material-symbols-outlined"
                          aria-hidden="true"
                        >
                          warning
                        </span>
                        Alertas registradas
                      </h3>
                      {getAlerts(selectedEntry).map((alert, index) => (
                        <p key={`${alert}-${index}`}>{alert}</p>
                      ))}
                    </section>
                  )}

                  <div className="history-detail-actions">
                    <Link
                      className="btn btn-primary"
                      to={`/resultado-del-dia?entryId=${selectedEntry.id}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        insights
                      </span>
                      Ver análisis completo
                    </Link>
                    <Link
                      className="btn btn-eusomnia-secondary"
                      to={`/registro-diario?entryId=${selectedEntry.id}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        aria-hidden="true"
                      >
                        edit
                      </span>
                      Editar registro
                    </Link>
                  </div>
                </article>
              </aside>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
