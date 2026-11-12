export const StepperHeader = ({
  currentStep,
  onStepClick,
  stepTitles,
  isEditing = false,
}) => {
  const percentage = Math.round((currentStep / 5) * 100);

  const stepsMeta = [
    { num: 1, label: "1. Hábitos" },
    { num: 2, label: "2. Higiene" },
    { num: 3, label: "3. Incidencias" },
    { num: 4, label: "4. Nutrición" },
    { num: 5, label: "5. Sueño" },
  ];

  return (
    <header className="relative z-10 d-flex flex-column align-items-center text-center mb-4 mb-sm-5">
      {/* Calm Wake-up Protocol Pill */}
      <div
        className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
        style={{
          background: "var(--eusomnia-surface-high)",
          border: "1px solid rgba(0, 229, 255, 0.2)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "16px", color: "var(--eusomnia-primary)" }}
        >
          routine
        </span>
        <span
          className="font-label small text-uppercase tracking-wider"
          style={{ color: "var(--eusomnia-text-muted)", fontSize: "0.75rem" }}
        >
          Protocolo Matutino Guiado
        </span>
      </div>

      {/* Main Title */}
      <h1 className="font-headline display-6 fw-bold text-light mb-2 d-flex align-items-center justify-content-center gap-2">
        <span style={{ color: "var(--eusomnia-tertiary-container)" }}>🌙</span>
        <span>
          {isEditing ? "Editar Registro Diario" : "Registro Diario Integral"}
        </span>
      </h1>

      <p className="font-body text-secondary small mb-0" style={{ maxWidth: "560px" }}>
        Diseñado para la calma de tu despertar. Un toque a la vez, sin sobrecarga
        cognitiva ni pantallas invasivas.
      </p>

      {/* Stepper HUD Progress Box */}
      <div
        className="w-100 mt-4 p-3 p-sm-4 rounded-4 shadow-sm"
        style={{
          maxWidth: "680px",
          background: "rgba(19, 28, 43, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="d-flex align-items-center justify-content-between font-label small mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="pulse-dot-cyan" />
            <span className="text-light fw-bold">
              Paso {currentStep} de 5: {stepTitles[currentStep]}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 font-label small">
            <span className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: "0.8rem" }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "14px", color: "var(--eusomnia-primary)" }}
              >
                timer
              </span>
              ~2 min
            </span>
            <span className="fw-bold" style={{ color: "var(--eusomnia-primary)" }}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div
          className="w-100 rounded-pill overflow-hidden"
          style={{ height: "7px", background: "var(--eusomnia-surface-highest)" }}
        >
          <div
            className="stepper-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Steps Micro Pills / Dots */}
        <div className="row g-1 mt-2 text-center font-label">
          {stepsMeta.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <div key={s.num} className="col">
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none w-100 d-flex align-items-center justify-content-center gap-1"
                  style={{
                    color: isCurrent
                      ? "var(--eusomnia-primary)"
                      : isCompleted
                      ? "var(--eusomnia-primary-light)"
                      : "var(--eusomnia-text-muted)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                  onClick={() => onStepClick(s.num)}
                >
                  <span
                    className="rounded-circle d-inline-block"
                    style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: isCurrent
                        ? "var(--eusomnia-primary)"
                        : isCompleted
                        ? "var(--eusomnia-primary-light)"
                        : "rgba(255, 255, 255, 0.2)",
                    }}
                  />
                  <span className="d-none d-sm-inline fw-semibold">{s.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
