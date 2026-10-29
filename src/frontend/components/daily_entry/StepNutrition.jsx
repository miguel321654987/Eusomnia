export const StepNutrition = ({
  selectedNutrition,
  onToggleNutrition,
  foodDescription,
  onChangeFoodDescription,
  onBack,
  onNext,
}) => {
  const nutritionItems = [
    {
      title: "Cena ligera / temprana",
      emoji: "🥗",
      desc: "> 3h antes de ir a la cama",
    },
    {
      title: "Cena pesada / copiosa",
      emoji: "🍕",
      desc: "Grasas saturadas o azúcares tarde",
    },
    {
      title: "Cafeína tardía (>17:00h)",
      emoji: "☕",
      desc: "Café, té estimulante o energizante",
    },
    {
      title: "Alcohol consumido",
      emoji: "🍷",
      desc: "Fragmentación de fases profundas",
    },
    {
      title: "Infusión relajante / Magnesio",
      emoji: "🍵",
      desc: "Manzanilla, pasiflora o suplemento inductivo",
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
            Paso 4 de 5
          </span>
          <h2 className="font-headline h4 fw-bold text-light mt-1 mb-1">
            Nutrición Express y Cronofactores
          </h2>
          <p className="font-body text-secondary small mb-0">
            Identifica rápidamente agentes excitantes o digestiones pesadas que alteran la fase REM.
          </p>
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
          style={{ background: "var(--eusomnia-surface-high)", color: "var(--eusomnia-tertiary-container)" }}
        >
          <span className="material-symbols-outlined fs-4">restaurant</span>
        </div>
      </div>

      {/* Grid of nutrition cards */}
      <div className="row g-3 mb-5">
        {nutritionItems.map((item) => {
          const isSelected = selectedNutrition.includes(item.title);

          return (
            <div key={item.title} className="col-12 col-sm-6">
              <button
                type="button"
                className={`daily-option-chip d-flex align-items-center justify-content-between p-3 ${
                  isSelected ? "active-chip" : ""
                }`}
                onClick={() => onToggleNutrition(item.title)}
              >
                <div className="d-flex align-items-center gap-3 text-start">
                  <span className="fs-3">{item.emoji}</span>
                  <div>
                    <span
                      className="font-headline small fw-bold d-block text-light"
                      style={{ color: isSelected ? "var(--eusomnia-primary)" : "inherit" }}
                    >
                      {item.title}
                    </span>
                    <span className="font-body small text-secondary" style={{ fontSize: "0.76rem" }}>
                      {item.desc}
                    </span>
                  </div>
                </div>

                <span
                  className="material-symbols-outlined fs-5 flex-shrink-0 ms-2"
                  style={{
                    color: isSelected ? "var(--eusomnia-primary)" : "rgba(255,255,255,0.2)",
                  }}
                >
                  {isSelected ? "check_circle" : "radio_button_unchecked"}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mb-4">
        <label
          htmlFor="food-description"
          className="font-label small fw-bold text-light d-block mb-2"
        >
          Alimentos y cantidades para el análisis Edamam
        </label>
        <textarea
          id="food-description"
          className="form-control"
          rows="3"
          value={foodDescription}
          onChange={(event) => onChangeFoodDescription(event.target.value)}
          placeholder="Ej.: 150 g de arroz, 1 huevo y una taza de café"
          maxLength={1000}
        />
        <p className="font-body small text-secondary mt-2 mb-0">
          Escribe los alimentos y cantidades en español. Se traducirán para
          analizarlos y los datos recibidos se mostrarán en español.
        </p>
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
          <span>Paso final: Relato del Sueño</span>
          <span className="material-symbols-outlined fs-6">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};
