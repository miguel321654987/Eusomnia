import { Link } from "react-router-dom";

function formatEntryDate(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatSleepDuration(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0) return "Horas no informadas";
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes
    ? `${wholeHours} h ${remainingMinutes} min`
    : `${wholeHours} h`;
}

export const RecentEntriesSection = ({
  user,
  entries = [],
  isLoading = false,
  error = "",
  onRetry,
  onReanalyze,
  reanalyzingEntryId = null,
}) => {
  const userName = user?.name || user?.username || user?.email || "tu";

  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      <div className="d-flex flex-column flex-md-row justify-content-between mb-4 gap-3">
        <div>
          <span
            className="font-label small fw-bold text-uppercase tracking-widest"
            style={{ color: "var(--eusomnia-primary)", letterSpacing: "2px" }}
          >
            Registros guardados
          </span>
          <h2 className="font-headline display-6 fw-bold text-light mb-1">
            Bitácora de {userName}
          </h2>
          <p className="font-body text-secondary small mb-0">
            Datos declarados por ti y análisis asociados a cada noche.
          </p>
        </div>
        <Link
          to="/historial"
          className="d-inline-flex align-items-center gap-1 font-label small fw-semibold text-decoration-none"
          style={{ color: "var(--eusomnia-primary)" }}
        >
          <span>Ver historial</span>
          <span className="material-symbols-outlined fs-6">chevron_right</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="eusomnia-card p-4 text-secondary" role="status">
          <span className="spinner-border spinner-border-sm me-2" />
          Cargando tus registros...
        </div>
      ) : error ? (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between gap-2">
          <span>{error}</span>
          {onRetry && (
            <button type="button" className="btn btn-sm btn-outline-light" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      ) : entries.length === 0 ? (
        <div className="eusomnia-card p-4 p-sm-5 text-center">
          <span
            className="material-symbols-outlined fs-1 mb-2"
            style={{ color: "var(--eusomnia-primary)" }}
          >
            bedtime
          </span>
          <h3 className="font-headline h5 fw-bold text-light">
            Aún no hay registros para mostrar
          </h3>
          <p className="font-body small text-secondary mb-3">
            Guarda una entrada para ver aquí tus horas de sueño declaradas y su análisis.
          </p>
          <Link to="/registro-diario" className="btn btn-primary">
            Crear primer registro
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {entries.map((item) => (
            <div key={item.id} className="col-12 col-md-4">
              <article className="eusomnia-card h-100 p-4 d-flex flex-column justify-content-between">
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center justify-content-between font-label small">
                    <span
                      className="fw-bold text-uppercase"
                      style={{ color: "var(--eusomnia-primary)" }}
                    >
                      {formatEntryDate(item.date)}
                    </span>
                    <span className="text-light">
                      {formatSleepDuration(item.sleep_hours)}
                    </span>
                  </div>
                  <h3 className="font-headline h6 fw-bold text-light mb-0 pt-1">
                    {item.title || "Registro de descanso"}
                  </h3>
                  <p
                    className="font-body text-secondary small mb-0"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.excerpt || "No se guardó un relato para esta entrada."}
                  </p>
                  <div className="d-flex flex-wrap gap-2 pt-2">
                    <span className="badge badge-eusomnia-neutral rounded-pill px-2 py-1 small">
                      Calidad declarada: {item.sleep_quality || "Sin indicar"}
                    </span>
                    <span className="badge badge-eusomnia-cyan rounded-pill px-2 py-1 small">
                      {item.has_analysis ? "Análisis disponible" : "Análisis pendiente"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 d-flex align-items-center justify-content-between border-top border-secondary border-opacity-10 mt-3">
                  <Link
                    to={`/resultado-del-dia?entryId=${item.id}`}
                    className="d-inline-flex align-items-center gap-1 font-label small text-decoration-none"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    <span>Ver resultado</span>
                    <span className="material-symbols-outlined fs-6">arrow_forward</span>
                  </Link>
                  {onReanalyze && (
                    <button
                      type="button"
                      className="btn btn-sm rounded-3 p-1 d-flex align-items-center justify-content-center"
                      style={{
                        background: "var(--eusomnia-surface)",
                        color: "var(--eusomnia-text-muted)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      title={`Reanalizar entrada del ${formatEntryDate(item.date)}`}
                      aria-label={`Reanalizar entrada del ${formatEntryDate(item.date)}`}
                      disabled={reanalyzingEntryId === item.id}
                      onClick={() => onReanalyze(item.id)}
                    >
                      {reanalyzingEntryId === item.id ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : (
                        <span className="material-symbols-outlined fs-6">refresh</span>
                      )}
                    </button>
                  )}
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
