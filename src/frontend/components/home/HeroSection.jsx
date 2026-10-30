import { Link } from "react-router-dom";

function formatDuration(hours) {
  const parsedHours = Number(hours);
  if (!Number.isFinite(parsedHours) || parsedHours <= 0) return "Horas no informadas";
  const totalMinutes = Math.round(parsedHours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${wholeHours} h ${minutes} min` : `${wholeHours} h`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

export const HeroSection = ({ user, summary, isSummaryLoading, onOpenDemo }) => {
  const userName = user?.name || user?.username || user?.email || null;
  const latestEntry = summary?.recent_entries?.[0];
  const latestInterpretation = latestEntry?.analysis?.interpretation;
  const sleepSummary = summary?.sleep_summary;

  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      <div className="row align-items-center g-5">
        {/* Left Column: Brand, Pitch & CTAs */}
        <div className="col-12 col-lg-7 d-flex flex-column gap-4">
          {/* Version badge */}
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill w-fit"
            style={{
              background: "rgba(34, 42, 58, 0.85)",
              border: "1px solid rgba(0, 229, 255, 0.2)",
              backdropFilter: "blur(8px)",
              width: "fit-content",
            }}
          >
            <span className="pulse-dot-cyan" />
            <span className="font-label small fw-semibold text-gradient-cyan text-uppercase tracking-wider">
              Neuro-Monitoreo Circadiano • v2.6 Activa
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline display-5 fw-bold text-light mb-0" style={{ lineHeight: 1.15 }}>
            Descifra la conexión entre tus días y{" "}
            <span className="text-gradient-cyan">tus sueños</span>
          </h1>

          {/* Pitch Text */}
          <p className="font-body text-secondary lead mb-0" style={{ maxWidth: "580px", color: "var(--eusomnia-text-muted)" }}>
            Reunimos tus hábitos registrados, el contexto nutricional y el
            análisis onírico generativo para ayudarte a explorar patrones entre
            tus días y tus sueños.
          </p>

          {/* Action CTAs */}
          <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
            <Link
              to="/registro-diario"
              className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-3"
            >
              <span className="material-symbols-outlined fs-5">play_arrow</span>
              <span>Comenzar Registro Diario</span>
            </Link>

            <button
              type="button"
              onClick={onOpenDemo}
              className="btn btn-eusomnia-secondary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-3"
            >
              <span className="material-symbols-outlined fs-5" style={{ color: "var(--eusomnia-primary)" }}>
                auto_fix_high
              </span>
              <span>Ver Demo de Análisis</span>
            </button>
          </div>

          {/* Dynamic User Session Indicator */}
          <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
            {userName ? (
              <div
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                style={{ background: "var(--eusomnia-surface-low)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--eusomnia-primary)", fontSize: "18px" }}
                >
                  verified_user
                </span>
                <span className="font-label small text-secondary">
                  Sesión activa de: <strong className="text-light">{userName}</strong>
                </span>
              </div>
            ) : (
              <div
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                style={{ background: "var(--eusomnia-surface-low)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>
                  account_circle
                </span>
                <span className="font-label small text-secondary">
                  Modo Explorador: <strong className="text-light">Invitado</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none ms-1 font-label"
                  style={{ color: "var(--eusomnia-primary)" }}
                  data-bs-toggle="modal"
                  data-bs-target="#loginModal"
                >
                  Identificarse
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Personal record summary */}
        <div className="col-12 col-lg-5 position-relative">
          <div className="eusomnia-hud-card p-4 d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-secondary border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-3 d-flex align-items-center justify-center p-2"
                  style={{ background: "var(--eusomnia-surface)" }}
                >
                  <span
                    className="material-symbols-outlined fs-5"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    psychology
                  </span>
                </div>
                <div>
                  <div className="font-label fw-bold text-light lh-1">Sinapsis Nocturna</div>
                  <div className="font-label small text-secondary" style={{ fontSize: "0.75rem" }}>
                    Resumen de tus registros
                  </div>
                </div>
              </div>
              <span className="badge badge-eusomnia-cyan rounded-pill px-2 py-1 small">
                {latestEntry ? "REGISTRO REAL" : "SIN REGISTROS"}
              </span>
            </div>

            <div
              className="p-3 rounded-3 d-flex align-items-center gap-3"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <span className="material-symbols-outlined fs-2" style={{ color: "var(--eusomnia-primary)" }}>
                bedtime
              </span>
              <div>
                <div className="font-headline fw-semibold text-light">
                  {latestEntry
                    ? formatDuration(latestEntry.sleep_hours)
                    : isSummaryLoading
                      ? "Cargando tus datos..."
                      : "Tu descanso, sin inventar métricas"}
                </div>
                <div className="font-body small text-secondary" style={{ fontSize: "0.8rem" }}>
                  {latestEntry
                    ? `Horas declaradas · ${latestEntry.sleep_quality || "calidad no indicada"}`
                    : userName
                      ? "Guarda un registro para ver aquí tu resumen."
                      : "Inicia sesión para consultar tus registros personales."}
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-3 d-flex flex-column gap-2"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <div className="font-label small text-secondary">
                {latestEntry
                  ? `Último registro${formatDate(latestEntry.date) ? ` · ${formatDate(latestEntry.date)}` : ""}`
                  : "Resumen personal"}
              </div>
              <p className="font-body small text-light mb-0">
                {latestInterpretation
                  ? latestInterpretation
                  : latestEntry?.excerpt
                    ? latestEntry.excerpt
                    : "Las horas y la calidad proceden de lo que registras; no se estiman fases de sueño ni datos de sensores."}
              </p>
              {latestEntry && (
                <Link
                  to={`/resultado-del-dia?entryId=${latestEntry.id}`}
                  className="font-label small text-decoration-none"
                  style={{ color: "var(--eusomnia-primary)" }}
                >
                  Abrir este resultado
                </Link>
              )}
            </div>
            {userName && sleepSummary && (
              <div
                className="p-3 rounded-3"
                style={{ background: "var(--eusomnia-surface)" }}
              >
                <div className="font-label small fw-bold text-light">
                  Promedio declarado · últimos 7 días
                </div>
                <div className="font-body small text-secondary mt-1">
                  {sleepSummary.current_average_hours !== null
                    ? `${sleepSummary.current_average_hours} h en ${sleepSummary.current_sample_size} ${
                        sleepSummary.current_sample_size === 1
                          ? "registro"
                          : "registros"
                      }`
                    : "Aún no hay horas de sueño registradas."}
                </div>
                <div className="font-body small text-secondary mt-1">
                  {sleepSummary.comparison_available
                    ? `Cambio frente a los 7 días previos: ${
                        sleepSummary.comparison_hours > 0 ? "+" : ""
                      }${sleepSummary.comparison_hours} h`
                    : "La comparación requiere al menos 3 registros en cada periodo."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
