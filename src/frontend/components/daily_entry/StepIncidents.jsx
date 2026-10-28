export const StepIncidents = ({ selectedIncidents, onToggleIncident, onBack, onNext }) => {
  const options = [
    "🎉 Buenas noticias / Logro",
    "💼 Estrés laboral intenso",
    "🗣️ Discusión / Conflicto",
    "⚠️ Accidente o susto repentino",
    "🩺 Malestar físico / Dolor de cabeza",
    "🕊️ Día tranquilo y neutro",
  ];

  return (
    <section className="eusomnia-card p-4 p-sm-5 shadow-lg position-relative">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
        <div>
          <span
            className="font-label small fw-bold text-uppercase tracking-wider"
            style={{ color: "var(--eusomnia-primary)" }}
          >
            Paso 3 de 5
          </span>
          <h2 className="font-headline h4 fw-bold text-light mt-1 mb-1">
            Incidencias y estado emocional del día
          </h2>
          <p className="font-body text-secondary small mb-0">
            Selecciona los sucesos que hayan alterado tus niveles de cortisol o adrenalina.
          </p>
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
          style={{ background: "var(--eusomnia-surface-high)", color: "var(--eusomnia-tertiary-container)" }}
        >
          <span className="material-symbols-outlined fs-4">psychology</span>
        </div>
      </div>

      {/* Multi-chips Container */}
      <div className="d-flex flex-wrap gap-2 mb-5">
        {options.map((item) => {
          const isSelected = selectedIncidents.includes(item);

          return (
            <button
              key={item}
              type="button"
              className={`daily-multichip ${isSelected ? "active-multichip" : ""}`}
              onClick={() => onToggleIncident(item)}
            >
              <span>{item}</span>
              {isSelected ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", color: "var(--eusomnia-primary)" }}
                >
                  done
                </span>
              ) : (
                <span
                  className="material-symbols-outlined text-secondary opacity-50"
                  style={{ fontSize: "16px" }}
                >
                  add
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-10">
        <button
          type="button"
          className="btn btn-eusomnia-secondary px-3 py-2 d-inline-flex align-items-center gap-2"
          onClick={onBack}
        >
          <span className="material-symbols-outlined fs-6">arrow_back</span>
          <span>Atrás</span>
        </button>

        <button
          type="button"
          className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2"
          onClick={onNext}
        >
          <span>Continuar a Nutrición</span>
          <span className="material-symbols-outlined fs-6">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};

