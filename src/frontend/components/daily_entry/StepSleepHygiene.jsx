export const StepSleepHygiene = ({
  sleepHours,
  sleepQuality,
  screenTime,
  onChangeHours,
  onChangeQuality,
  onChangeScreens,
  onBack,
  onNext,
}) => {
  const qualities = [
    { label: "Profundo", emoji: "⚡️", desc: "Descanso reparador" },
    { label: "Intermedio", emoji: "🌱", desc: "Aceptable y lúcido" },
    { label: "Fragmentado", emoji: "🌊", desc: "Interrupciones leves" },
    { label: "Insomnio", emoji: "🌪️", desc: "Dificultad de conciliar" },
  ];

  const screenOptions = [
    "0 min (Lectura / Sin luz azul)",
    "< 1 hora (Filtro cálido)",
    "> 2 horas (Uso continuo)",
  ];

  const handleHours = (delta) => {
    const nextVal = Math.max(3.0, Math.min(14.0, Math.round((sleepHours + delta) * 10) / 10));
    onChangeHours(nextVal);
  };

  return (
    <section className="eusomnia-card p-4 p-sm-5 shadow-lg position-relative">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
        <div>
          <span
            className="font-label small fw-bold text-uppercase tracking-wider"
            style={{ color: "var(--eusomnia-primary)" }}
          >
            Paso 2 de 5
          </span>
          <h2 className="font-headline h4 fw-bold text-light mt-1 mb-1">
            ¿Cómo descansaste anoche?
          </h2>
          <p className="font-body text-secondary small mb-0">
            Registra la arquitectura percibida de tu noche para calcular el índice de recuperación.
          </p>
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
          style={{ background: "var(--eusomnia-surface-high)", color: "var(--eusomnia-primary)" }}
        >
          <span className="material-symbols-outlined fs-4">bedtime</span>
        </div>
      </div>

      {/* 1. Hours of Sleep Stepper */}
      <div
        className="p-3 p-sm-4 rounded-3 mb-4"
        style={{
          background: "var(--eusomnia-surface)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
          <div>
            <span className="font-label small fw-bold text-light text-uppercase tracking-wider d-block">
              Horas totales de sueño
            </span>
            <span className="font-body small text-secondary">
              Incluyendo pequeños despertares no conscientes
            </span>
          </div>

          <div
            className="d-flex align-items-center gap-3 p-1 rounded-3"
            style={{ background: "var(--eusomnia-surface-high)" }}
          >
            <button
              type="button"
              className="btn btn-sm btn-eusomnia-secondary d-flex align-items-center justify-content-center"
              style={{ width: "36px", height: "36px" }}
              onClick={() => handleHours(-0.5)}
              aria-label="Restar media hora"
            >
              <span className="material-symbols-outlined fs-6">remove</span>
            </button>

            <div className="text-center px-3">
              <span className="font-headline h3 fw-bold mb-0 text-light d-block" style={{ color: "var(--eusomnia-primary)" }}>
                {sleepHours.toFixed(1)}
              </span>
              <span className="font-label small text-secondary text-uppercase" style={{ fontSize: "0.72rem" }}>
                horas
              </span>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-eusomnia-secondary d-flex align-items-center justify-content-center"
              style={{ width: "36px", height: "36px" }}
              onClick={() => handleHours(0.5)}
              aria-label="Sumar media hora"
            >
              <span className="material-symbols-outlined fs-6">add</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sleep Quality Cards */}
      <div className="mb-4">
        <label className="font-label small fw-bold text-light text-uppercase tracking-wider d-block mb-2">
          Calidad subjetiva del despertar
        </label>
        <div className="row g-2 g-sm-3">
          {qualities.map((q) => {
            const isSelected = sleepQuality === q.label;

            return (
              <div key={q.label} className="col-6 col-sm-3">
                <button
                  type="button"
                  className={`daily-option-chip h-100 d-flex flex-column justify-content-between p-3 ${
                    isSelected ? "active-chip" : ""
                  }`}
                  style={{ minHeight: "105px" }}
                  onClick={() => onChangeQuality(q.label)}
                >
                  <span className="fs-3 mb-1">{q.emoji}</span>
                  <div>
                    <span
                      className="font-headline small fw-bold d-block text-light"
                      style={{ color: isSelected ? "var(--eusomnia-primary)" : "inherit" }}
                    >
                      {q.label}
                    </span>
                    <span className="font-body small text-secondary" style={{ fontSize: "0.75rem" }}>
                      {q.desc}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Pre-sleep Screen Exposure */}
      <div className="mb-4">
        <label className="font-label small fw-bold text-light text-uppercase tracking-wider d-block mb-2">
          Exposición a pantallas (últimas 2h antes de dormir)
        </label>
        <div className="row g-2">
          {screenOptions.map((opt) => {
            const isSelected = screenTime === opt;

            return (
              <div key={opt} className="col-12 col-sm-4">
                <button
                  type="button"
                  className={`daily-option-chip d-flex align-items-center justify-content-between py-2 px-3 ${
                    isSelected ? "active-chip" : ""
                  }`}
                  onClick={() => onChangeScreens(opt)}
                >
                  <span
                    className="font-body small text-light"
                    style={{ color: isSelected ? "var(--eusomnia-primary)" : "inherit", fontSize: "0.82rem" }}
                  >
                    {opt}
                  </span>
                  {isSelected && (
                    <span
                      className="material-symbols-outlined fs-6 flex-shrink-0"
                      style={{ color: "var(--eusomnia-primary)" }}
                    >
                      check
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation Buttons */}
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
          <span>Aceptar y Siguiente</span>
          <span className="material-symbols-outlined fs-6">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};

