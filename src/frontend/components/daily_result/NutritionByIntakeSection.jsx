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
  { key: "omega3_mg", label: "Omega 3", unit: "mg" },
  { key: "alcohol_g", label: "Alcohol", unit: "g" },
  { key: "caffeine_mg", label: "Cafeína", unit: "mg" },
  { key: "sodium_mg", label: "Sodio", unit: "mg" },
  { key: "tryptophan_mg", label: "Triptófano", unit: "mg" },
  { key: "vitamin_e_mg", label: "Vitamina E", unit: "mg" },
  { key: "vitamin_b12_ug", label: "Vitamina B12", unit: "µg" },
  { key: "total_weight_g", label: "Peso total analizado", unit: "g" },
];

export const NutritionByIntakeSection = ({ nutrition }) => {
  const mealBreakdown = nutrition?.mealBreakdown;
  const mealItems = Array.isArray(mealBreakdown?.items)
    ? mealBreakdown.items
    : [];

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
          <span className="material-symbols-outlined fs-5">table_chart</span>
        </div>
        <div>
          <h2 className="font-headline h5 fw-bold text-light mb-0">
            Valores por ingesta y procedencia
          </h2>
        </div>
      </div>

      {mealItems.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-dark table-sm align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Ingesta</th>
                <th scope="col">Fuente</th>
                {MEAL_NUTRIENTS.map((nutrient) => (
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
                  {MEAL_NUTRIENTS.map((nutrient) => (
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
                {MEAL_NUTRIENTS.map((nutrient) => (
                  <td key={nutrient.key}>
                    {formatMetric(
                      mealBreakdown?.totals?.[nutrient.key],
                      nutrient.unit,
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-body small text-secondary mb-0">
          No hay valores por ingesta disponibles para este registro.
        </p>
      )}
    </section>
  );
};

export default NutritionByIntakeSection;
