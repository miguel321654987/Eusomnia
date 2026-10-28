const formatMetric = (value, unit = "") => {
  if (value === null || value === undefined || value === "") {
    return "No informado";
  }
  return `${value}${unit ? ` ${unit}` : ""}`;
};

export const HabitCorrelationsSection = ({
  context = {},
  nutrition,
  nutritionQuery,
  prescriptions = [],
}) => {
  const nutritionMetrics = [
    { label: "Calorías", value: nutrition?.calories, unit: "kcal" },
    { label: "Grasas", value: nutrition?.fats, unit: "g" },
    { label: "Proteínas", value: nutrition?.protein, unit: "g" },
    { label: "Carbohidratos", value: nutrition?.carbs, unit: "g" },
    { label: "Azúcares", value: nutrition?.sugars, unit: "g" },
    { label: "Sodio", value: nutrition?.sodium, unit: "mg" },
    { label: "Vitamina B12", value: nutrition?.vitB12, unit: "µg" },
    { label: "Vitamina E", value: nutrition?.vitE, unit: "mg" },
  ];

  const contextMetrics = [
    { label: "Actividad física", value: context.activity, icon: "fitness_center" },
    { label: "Pantallas", value: context.screens, icon: "devices" },
    { label: "Calidad percibida", value: context.mood, icon: "self_improvement" },
    { label: "Cena registrada", value: context.dinner, icon: "restaurant" },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <section className="eusomnia-card p-4 p-sm-5 shadow-lg d-flex flex-column gap-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
            style={{
              width: "44px",
              height: "44px",
              background: "var(--eusomnia-surface-high)",
              color: "var(--eusomnia-secondary)",
            }}
          >
            <span className="material-symbols-outlined fs-5">compare_arrows</span>
          </div>
          <div>
            <h2 className="font-headline h5 fw-bold text-light mb-0">
              Hábitos y fisiología
            </h2>
            <p className="font-body small text-secondary mb-0">
              Datos del registro y análisis nutricional persistido
            </p>
          </div>
        </div>

        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span
              className="font-label small fw-bold text-uppercase"
              style={{ fontSize: "0.75rem", color: "var(--eusomnia-text-muted)" }}
            >
              Nutrición
            </span>
            <span style={{ color: "var(--eusomnia-primary)", fontSize: "0.75rem" }}>
              Edamam
            </span>
          </div>
          {nutrition ? (
            <div className="row g-2">
              {nutritionMetrics.map((metric) => (
                <div className="col-6" key={metric.label}>
                  <div
                    className="p-3 rounded-3 h-100"
                    style={{ background: "var(--eusomnia-surface)" }}
                  >
                    <span className="font-label small text-secondary d-block">
                      {metric.label}
                    </span>
                    <span className="font-headline h6 fw-bold text-light mb-0">
                      {formatMetric(metric.value, metric.unit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body small text-secondary mb-0">
              {nutritionQuery
                ? "El análisis nutricional de esta consulta aún no está disponible."
                : "Este registro no incluye una descripción de alimentos para analizar."}
            </p>
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <span
            className="font-label small fw-bold text-uppercase"
            style={{ fontSize: "0.72rem", color: "var(--eusomnia-text-muted)" }}
          >
            Contexto registrado
          </span>
          <div className="row g-2 font-body small">
            {contextMetrics.map((metric) => (
              <div
                className="col-6 d-flex align-items-center gap-2 text-secondary"
                key={metric.label}
              >
                <span
                  className="material-symbols-outlined fs-6"
                  style={{ color: "var(--eusomnia-secondary)" }}
                  aria-hidden="true"
                >
                  {metric.icon}
                </span>
                <span>
                  {metric.label}:{" "}
                  <strong className="text-light">
                    {formatMetric(metric.value)}
                  </strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="eusomnia-card p-4 p-sm-5 shadow-lg d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-2">
          <span
            className="material-symbols-outlined fs-5"
            style={{ color: "var(--eusomnia-primary)" }}
            aria-hidden="true"
          >
            recommend
          </span>
          <h3 className="font-headline h6 fw-bold text-light mb-0">
            Recomendaciones del análisis
          </h3>
        </div>

        {prescriptions.length ? (
          <div className="d-flex flex-column gap-2">
            {prescriptions.map((item) => (
              <div className="prescription-card" key={item.num}>
                <div className="prescription-number">{item.num}</div>
                <div>
                  <p className="font-label small text-light fw-bold mb-0">
                    {item.title}
                  </p>
                  {item.desc && (
                    <p className="font-body small text-secondary mt-1 mb-0">
                      {item.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body small text-secondary mb-0">
            El análisis no ha devuelto recomendaciones.
          </p>
        )}
      </section>
    </div>
  );
};
