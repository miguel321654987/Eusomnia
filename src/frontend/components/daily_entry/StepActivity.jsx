export const StepActivity = ({ value, onChange, onNext }) => {
  const handleSelect = (activityTitle) => {
    onChange(activityTitle);
  };

  const activities = [
    {
      title: "Ninguna / Sedentario",
      desc: "Día de escritorio, menor a 3.000 pasos",
      icon: "chair",
    },
    {
      title: "Baja (Paseo suave)",
      desc: "Caminata o movilidad ligera (4k-7k pasos)",
      icon: "directions_walk",
    },
    {
      title: "Media (Ejercicio regular)",
      desc: "Gimnasio, running, pilates (30 a 60 min)",
      icon: "directions_run",
    },
    {
      title: "Alta (Entrenamiento intenso)",
      desc: "Crossfit, alta intensidad o >90 minutos",
      icon: "sprint",
    },
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
            Paso 1 de 5
          </span>
          <h2 className="font-headline h4 fw-bold text-light mt-1 mb-1">
            Actividad física de ayer
          </h2>
          <p className="font-body text-secondary small mb-0">
            El gasto metabólico temprano condiciona la presión homeostática del
            sueño (adenosina).
          </p>
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
          style={{ background: "var(--eusomnia-surface-high)", color: "var(--eusomnia-primary)" }}
        >
          <span className="material-symbols-outlined fs-4">fitness_center</span>
        </div>
      </div>

      {/* Options Grid */}
      <div className="row g-3 mb-4">
        {activities.map((act) => {
          const isSelected = value === act.title;

          return (
            <div key={act.title} className="col-12 col-sm-6">
              <button
                type="button"
                className={`daily-option-chip d-flex align-items-start gap-3 ${
                  isSelected ? "active-chip" : ""
                }`}
                onClick={() => handleSelect(act.title)}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: isSelected
                      ? "rgba(0, 229, 255, 0.2)"
                      : "var(--eusomnia-surface)",
                    color: isSelected
                      ? "var(--eusomnia-primary)"
                      : "var(--eusomnia-text-muted)",
                  }}
                >
                  <span className="material-symbols-outlined fs-5">{act.icon}</span>
                </div>

                <div className="flex-grow-1 text-start">
                  <div
                    className="font-headline small fw-bold text-light"
                    style={{ color: isSelected ? "var(--eusomnia-primary)" : "inherit" }}
                  >
                    {act.title}
                  </div>
                  <div className="font-body small text-secondary mt-1" style={{ fontSize: "0.78rem" }}>
                    {act.desc}
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="material-symbols-outlined fs-5 flex-shrink-0"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    check_circle
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Manual Desktop Confirmation Button */}
      <div className="d-flex justify-content-end pt-2">
        <button
          type="button"
          className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2"
          onClick={onNext}
        >
          <span>Confirmar y avanzar</span>
          <span className="material-symbols-outlined fs-6">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};

