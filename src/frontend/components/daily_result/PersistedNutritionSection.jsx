const formatMetric = (value, unit = "") => {
  if (value === null || value === undefined || value === "") {
    return "No informado";
  }
  const formattedValue =
    typeof value === "number" ? Number(value.toFixed(1)).toString() : value;
  return `${formattedValue}${unit ? ` ${unit}` : ""}`;
};

const buildNutritionMetrics = (nutrition) => [
  { label: "Calorías", value: nutrition?.calories, unit: "kcal" },
  { label: "Grasas", value: nutrition?.fats, unit: "g" },
  { label: "Proteínas", value: nutrition?.protein, unit: "g" },
  { label: "Carbohidratos", value: nutrition?.carbs, unit: "g" },
  { label: "Azúcares", value: nutrition?.sugars, unit: "g" },
  { label: "Sodio", value: nutrition?.sodium, unit: "mg" },
  { label: "Cafeína", value: nutrition?.caffeine, unit: "mg" },
  {
    label: "Triptófano",
    value:
      nutrition?.tryptophan ??
      nutrition?.tryptophan_mg ??
      nutrition?.triptophanMg,
    unit: "mg",
  },
  { label: "Alcohol", value: nutrition?.alcohol_g, unit: "g" },
  { label: "Omega 3", value: nutrition?.omega3 ?? nutrition?.omega3_mg, unit: "mg" },
  { label: "Vitamina B12", value: nutrition?.vitB12, unit: "µg" },
  { label: "Vitamina E", value: nutrition?.vitE, unit: "mg" },
];

export const PersistedNutritionSection = ({ nutrition, nutritionQuery }) => {
  const nutritionMetrics = buildNutritionMetrics(nutrition);

  return (
    <section className="eusomnia-card p-4 p-sm-5 shadow-lg d-flex flex-column gap-4 h-100">
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
          <span className="material-symbols-outlined fs-5">nutrition</span>
        </div>
        <div>
          <h2 className="font-headline h5 fw-bold text-light mb-0">
            Datos del registro y análisis nutricional persistido
          </h2>
        </div>
      </div>

      <div className="d-flex flex-column gap-2">
        <span
          className="font-label small fw-bold text-uppercase"
          style={{
            fontSize: "0.75rem",
            color: "var(--eusomnia-text-muted)",
          }}
        >
          Nutrición
        </span>
        <p className="font-body small text-secondary mb-0">
          Estimación calculada a partir de tus datos.
        </p>
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
    </section>
  );
};

export default PersistedNutritionSection;
