import { Link } from "react-router-dom";

export const TelemetryHeader = ({
  date,
  sessionId,
  isReanalyzing,
  onReanalyze,
}) => {
  const handleExport = () => {
    window.print();
  };

  return (
    <header className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4 p-4 rounded-4 shadow-lg eusomnia-card position-relative" style={{ zIndex: 2 }}>
      {/* Brand & Date Meta */}
      <div className="d-flex align-items-center gap-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-3 flex-shrink-0"
          style={{
            width: "52px",
            height: "52px",
            background: "var(--eusomnia-surface-high)",
            color: "var(--eusomnia-primary)",
            boxShadow: "inset 0 0 10px rgba(0, 229, 255, 0.2)",
          }}
        >
          <span className="material-symbols-outlined fs-3">neurology</span>
        </div>

        <div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h1 className="font-headline h4 fw-bold text-light mb-0">
              Resultado del Día
            </h1>
            <span
              className="badge rounded-pill px-2.5 py-1 font-label small d-inline-flex align-items-center gap-1.5"
              style={{
                background: "var(--eusomnia-surface-highest)",
                color: "var(--eusomnia-primary)",
                border: "1px solid rgba(0, 229, 255, 0.25)",
                fontSize: "0.72rem",
              }}
            >
              <span className="pulse-dot-cyan" style={{ width: "6px", height: "6px" }} />
              <span>Registro y análisis</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 mt-1 font-label small text-secondary">
            <span className="d-inline-flex align-items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                calendar_today
              </span>
              <span>{date}</span>
            </span>
            <span>•</span>
            <span style={{ color: "var(--eusomnia-secondary)" }}>ID Sesión: {sessionId}</span>
          </div>
        </div>
      </div>

      {/* Control Actions Suite */}
      <div className="d-flex align-items-center flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary px-3 py-2 d-inline-flex align-items-center gap-2 font-label small"
          onClick={onReanalyze}
          disabled={isReanalyzing}
        >
          {isReanalyzing ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span>Procesando redes neuronales...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined fs-6">auto_awesome</span>
              <span>Re-analizar con IA</span>
            </>
          )}
        </button>

        <Link
          to="/registro-diario"
          className="btn btn-eusomnia-secondary px-3 py-2 d-inline-flex align-items-center gap-2 font-label small text-decoration-none"
        >
          <span className="material-symbols-outlined fs-6" style={{ color: "var(--eusomnia-primary)" }}>
            edit_calendar
          </span>
          <span>Modificar / Siesta</span>
        </Link>

        <button
          type="button"
          className="btn btn-eusomnia-secondary px-2.5 py-2 d-inline-flex align-items-center justify-content-center"
          onClick={handleExport}
          title="Exportar Reporte / Imprimir"
          aria-label="Exportar Reporte"
        >
          <span className="material-symbols-outlined fs-6">ios_share</span>
        </button>
      </div>
    </header>
  );
};
