const formatMetric = (value, unit = "") => {
  if (value === null || value === undefined || value === "") {
    return "No informado";
  }
  const formattedValue =
    typeof value === "number" ? Number(value.toFixed(1)).toString() : value;
  return `${formattedValue}${unit ? ` ${unit}` : ""}`;
};

const MEAL_NUTRIENTS = [
  { key: "calories", label: "Energía", unit: "kcal" },
  { key: "protein_g", label: "Proteínas", unit: "g" },
  { key: "carbohydrates_g", label: "Carbohidratos", unit: "g" },
  { key: "sugars_g", label: "Azúcares", unit: "g" },
  { key: "fat_g", label: "Grasas", unit: "g" },
  { key: "sodium_mg", label: "Sodio", unit: "mg" },
  { key: "caffeine_mg", label: "Cafeína", unit: "mg" },
];

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
    { label: "Hora de acostarse declarada", value: context.bedtime, icon: "bedtime" },
    { label: "Hora de despertar declarada", value: context.wakeTime, icon: "alarm" },
    { label: "Última cafeína declarada", value: context.lastCaffeineTime, icon: "coffee" },
    { label: "Temperatura declarada", value: context.roomTemperature, icon: "thermostat" },
    { label: "Luz declarada", value: context.roomLight, icon: "light_mode" },
  ];
  const mealBreakdown = nutrition?.mealBreakdown;
  const mealItems = Array.isArray(mealBreakdown?.items)
    ? mealBreakdown.items
    : [];
  const nutritionTotals = mealBreakdown?.totals || {};

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
              Hábitos y nutrición
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
              {nutrition?.sourceLabel || "Edamam"}
            </span>
          </div>
          {mealBreakdown?.generic_reference && (
            <p className="font-body small text-secondary mb-0">
              Estimación media genérica definida como referencia interna por
              Eusomnia: no se calcula a partir de tus alimentos ni es una
              medición. Añade alimentos y cantidades para un análisis más
              específico con Edamam.
            </p>
          )}
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
          {mealItems.length > 0 && (
            <div className="table-responsive">
              <table className="table table-dark table-sm align-middle mb-0">
                <caption className="caption-top text-secondary small">
                  Valores por ingesta y procedencia
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Ingesta</th>
                    <th scope="col">Fuente</th>
                    {MEAL_NUTRIENTS.slice(0, 5).map((nutrient) => (
                      <th scope="col" key={nutrient.key}>
                        {nutrient.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mealItems.map((meal) => (
                    <tr key={meal.meal_type}>
                      <th scope="row">
                        {meal.label}
                        {meal.time ? ` · ${meal.time}` : ""}
                      </th>
                      <td>
                        {meal.source === "generic"
                          ? `Estimación · ${meal.reference_portion_g} g de referencia`
                          : meal.source === "edamam"
                            ? "Edamam"
                            : "No disponible"}
                        {meal.error && (
                          <span className="d-block text-warning small">
                            {meal.error}
                          </span>
                        )}
                      </td>
                      {MEAL_NUTRIENTS.slice(0, 5).map((nutrient) => (
                        <td key={nutrient.key}>
                          {formatMetric(
                            meal.values?.[nutrient.key],
                            nutrient.unit,
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="fw-bold">
                    <th scope="row">Total disponible</th>
                    <td>{nutrition?.sourceLabel || "—"}</td>
                    {MEAL_NUTRIENTS.slice(0, 5).map((nutrient) => (
                      <td key={nutrient.key}>
                        {formatMetric(
                          nutritionTotals[nutrient.key],
                          nutrient.unit,
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <span
            className="font-label small fw-bold text-uppercase"
            style={{ fontSize: "0.72rem", color: "var(--eusomnia-text-muted)" }}
          >
            Contexto registrado
          </span>
          <p className="font-body small text-secondary mb-0">
            Hábitos y entorno declarados por ti; no son mediciones de sensores.
          </p>
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
