import { Link } from "react-router-dom";

const DEFAULT_EXEMPLAR_ENTRIES = [
  {
    id: 1,
    date: "28 OCT • AYER",
    duration: "8h 10m",
    title: "Avión sobre gran ciudad",
    excerpt:
      "Volaba con ventanales infinitos sobre rascacielos iluminados. Sin turbulencia, sensación de liberación tras días de estrés laboral.",
    lucidity: "Alta",
    quality: "92%",
    qualityTheme: "cyan",
  },
  {
    id: 2,
    date: "27 OCT",
    duration: "6h 40m",
    title: "La radio y las lechugas",
    excerpt:
      "Un huerto subterráneo donde los vegetales emitían frecuencias de radio antiguas. Estado emocional confuso pero pacífico.",
    lucidity: "Media",
    quality: "74%",
    qualityTheme: "amber",
  },
  {
    id: 3,
    date: "25 OCT",
    duration: "5h 15m",
    title: "Pesadilla y fragmentación",
    excerpt:
      "Despertares múltiples (3 veces). Sensación de claustrofobia. Correlación directa con café a las 20:00 y discusión previa al descanso.",
    lucidity: "Baja",
    quality: "48%",
    qualityTheme: "error",
  },
];

export const RecentEntriesSection = ({ user, entries }) => {
  const userName = user?.name || user?.username || user?.email ? `${user.name || user.username || user.email}` : "Eusomnia";
  const displayEntries = entries && entries.length > 0 ? entries : DEFAULT_EXEMPLAR_ENTRIES;

  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      {/* Section Header */}
      <div className="d-flex flex-column flex-md-row md:align-items-end justify-content-between mb-4 gap-3">
        <div>
          <span
            className="font-label small fw-bold text-uppercase tracking-widest"
            style={{ color: "var(--eusomnia-primary)", letterSpacing: "2px" }}
          >
            Últimas Entradas Registradas
          </span>
          <h2 className="font-headline display-6 fw-bold text-light mb-1">
            Bitácora de {userName}
          </h2>
          <p className="font-body text-secondary small mb-0">
            Selecciona una tarjeta para explorar la correlación biológica o solicitar re-análisis generativo.
          </p>
        </div>

        <Link
          to="/historial"
          className="d-inline-flex align-items-center gap-1 font-label small fw-semibold text-decoration-none"
          style={{ color: "var(--eusomnia-primary)" }}
        >
          <span>Ver todas las noches</span>
          <span className="material-symbols-outlined fs-6">chevron_right</span>
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="row g-4">
        {displayEntries.map((item) => {
          let badgeClass = "badge-eusomnia-cyan";
          if (item.qualityTheme === "amber") badgeClass = "badge-eusomnia-amber";
          if (item.qualityTheme === "error") badgeClass = "badge-eusomnia-error";

          return (
            <div key={item.id} className="col-12 col-md-4">
              <div className="eusomnia-card h-100 p-4 d-flex flex-column justify-content-between">
                <div className="d-flex flex-column gap-2">
                  {/* Card Header Meta */}
                  <div className="d-flex align-items-center justify-content-between font-label small">
                    <span
                      className="fw-bold"
                      style={{
                        color:
                          item.qualityTheme === "error"
                            ? "var(--eusomnia-error)"
                            : "var(--eusomnia-primary)",
                      }}
                    >
                      {item.date}
                    </span>
                    <div
                      className="d-flex align-items-center gap-1 px-2 py-0.5 rounded-pill"
                      style={{ background: "var(--eusomnia-surface)" }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "14px", color: "var(--eusomnia-primary)" }}
                      >
                        hotel
                      </span>
                      <span className="text-light">{item.duration}</span>
                    </div>
                  </div>

                  {/* Title & Excerpt */}
                  <h3 className="font-headline h6 fw-bold text-light mb-0 pt-1 text-truncate">
                    &quot;{item.title}&quot;
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
                    {item.excerpt}
                  </p>

                  {/* Status Chips */}
                  <div className="d-flex flex-wrap gap-2 pt-2">
                    <span className="badge badge-eusomnia-neutral rounded-pill px-2 py-1 small">
                      Lucidez: {item.lucidity}
                    </span>
                    <span className={`badge ${badgeClass} rounded-pill px-2 py-1 small`}>
                      Calidad: {item.quality}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 d-flex align-items-center justify-content-between border-top border-secondary border-opacity-10 mt-3">
                  <Link
                    to="/resultado-del-dia"
                    className="d-inline-flex align-items-center gap-1 font-label small text-decoration-none"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    <span>Ver Diagnóstico</span>
                    <span className="material-symbols-outlined fs-6">arrow_forward</span>
                  </Link>

                  <button
                    type="button"
                    className="btn btn-sm rounded-3 p-1 d-flex align-items-center justify-content-center"
                    style={{
                      background: "var(--eusomnia-surface)",
                      color: "var(--eusomnia-text-muted)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    title="Re-analizar noche"
                  >
                    <span className="material-symbols-outlined fs-6">refresh</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
