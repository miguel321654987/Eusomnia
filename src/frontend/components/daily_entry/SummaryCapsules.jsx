export const SummaryCapsules = ({ currentStep, formData, onEdit }) => {
  if (currentStep <= 1) return null;

  const capsules = [
    {
      step: 1,
      title: "1. Hábitos y Actividad física",
      value: formData.physicalActivity,
    },
    {
      step: 2,
      title: "2. Higiene y Calidad del Sueño",
      value: `${formData.sleepHours}h · ${formData.sleepQuality} · Pantallas ${formData.screenTime}`,
    },
    {
      step: 3,
      title: "3. Incidencias Biopsicosociales",
      value:
        formData.incidents.length > 0
          ? formData.incidents.join(" • ")
          : "Sin incidencias destacables",
    },
    {
      step: 4,
      title: "4. Nutrición & Crono-factores",
      value: Object.entries(formData.mealEntries || {})
        .filter(([, meal]) => meal.size || meal.foods)
        .map(([mealId, meal]) => {
          const label = {
            breakfast: "Desayuno",
            mid_morning: "Media mañana",
            lunch: "Comida",
            snack: "Merienda",
            dinner: "Cena",
            other: "Otros",
          }[mealId];
          return `${label}: ${meal.size || "sin tamaño"}${meal.time ? ` · ${meal.time}` : ""}`;
        })
        .join(" • ") || "Sin ingestas detalladas",
    },
  ];

  return (
    <div className="d-flex flex-column gap-2 mb-4">
      {capsules
        .filter((c) => c.step < currentStep)
        .map((cap) => (
          <div
            key={cap.step}
            className="summary-capsule d-flex align-items-center justify-content-between gap-3"
          >
            <div className="d-flex align-items-center gap-3 min-w-0">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "rgba(0, 229, 255, 0.18)",
                  color: "var(--eusomnia-primary)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  check
                </span>
              </div>
              <div className="text-truncate">
                <span
                  className="font-label small text-uppercase tracking-wider d-block"
                  style={{ fontSize: "0.72rem", color: "var(--eusomnia-text-muted)" }}
                >
                  {cap.title}
                </span>
                <span className="font-body small text-light fw-medium text-truncate d-block">
                  {cap.value}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-link p-1 text-decoration-none d-flex align-items-center gap-1 font-label flex-shrink-0"
              style={{ color: "var(--eusomnia-primary)", fontSize: "0.8rem" }}
              onClick={() => onEdit(cap.step)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                edit
              </span>
              <span>Editar</span>
            </button>
          </div>
        ))}
    </div>
  );
};
