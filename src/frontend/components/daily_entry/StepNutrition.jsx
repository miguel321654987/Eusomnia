import { useState } from "react";
import { apiUrl } from "../../api.js";
import { TimeStepper } from "./TimeStepper.jsx";

const MEAL_OPTIONS = [
  { id: "breakfast", title: "Desayuno", suggestedTime: "08:00", icon: "wb_sunny" },
  { id: "mid_morning", title: "Media mañana", suggestedTime: "11:00", icon: "coffee" },
  { id: "lunch", title: "Comida", suggestedTime: "14:00", icon: "lunch_dining" },
  { id: "snack", title: "Merienda", suggestedTime: "17:30", icon: "bakery_dining" },
  { id: "dinner", title: "Cena", suggestedTime: "21:00", icon: "dinner_dining" },
  { id: "other", title: "Otros", suggestedTime: "", icon: "more_horiz" },
];

const MEAL_SIZES = [
  { id: "light", label: "Ligera" },
  { id: "medium", label: "Media" },
  { id: "heavy", label: "Pesada" },
];

export const StepNutrition = ({
  mealEntries,
  sleepContext,
  token,
  onChangeMealEntry,
  onChangeSleepContext,
  onBack,
  onNext,
}) => {
  const [showReferences, setShowReferences] = useState(false);
  const [references, setReferences] = useState(null);
  const [referencesError, setReferencesError] = useState("");
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);

  const toggleReferences = async () => {
    const shouldOpen = !showReferences;
    setShowReferences(shouldOpen);
    if (!shouldOpen || references || isLoadingReferences) return;

    setIsLoadingReferences(true);
    setReferencesError("");
    try {
      const response = await fetch(apiUrl("/api/nutrition/parameters"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar las referencias.");
      }

      const estimates = data.results?.generic_meal_estimates;
      if (!estimates?.sizes) {
        throw new Error("El catálogo no contiene referencias por tamaño.");
      }
      setReferences(estimates);
    } catch (error) {
      setReferencesError(error.message || "No se pudieron cargar las referencias.");
    } finally {
      setIsLoadingReferences(false);
    }
  };

  return (
    <section className="eusomnia-card p-4 p-sm-5 shadow-lg position-relative">
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
            Registra cada ingesta y su horario para contextualizar el análisis del descanso.
          </p>
        </div>
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
          style={{ background: "var(--eusomnia-surface-high)", color: "var(--eusomnia-tertiary-container)" }}
        >
          <span className="material-symbols-outlined fs-4">restaurant</span>
        </div>
      </div>

      <section
        className="p-3 p-sm-4 rounded-3 mb-4"
        style={{ background: "var(--eusomnia-surface)" }}
        aria-labelledby="last-caffeine-heading"
      >
        <h3
          id="last-caffeine-heading"
          className="font-label small fw-bold text-light d-block mb-1"
        >
          Hora de la última ingesta con cafeína (opcional)
        </h3>
        <TimeStepper
          label="Última ingesta con cafeína"
          value={sleepContext.last_caffeine_time}
          suggestedValue="15:00"
          onChange={(last_caffeine_time) =>
            onChangeSleepContext({ last_caffeine_time })
          }
        />
        <p className="font-body small text-secondary mt-2 mb-0">
          Dato autodeclarado para contextualizar el análisis; no se infiere de las comidas.
        </p>
      </section>

      <div className="d-flex flex-column gap-3 mb-4">
        {MEAL_OPTIONS.map((meal) => {
          const value = mealEntries[meal.id] || {};

          return (
            <section
              className="p-3 p-sm-4 rounded-3"
              style={{ background: "var(--eusomnia-surface)" }}
              key={meal.id}
              aria-labelledby={`meal-title-${meal.id}`}
            >
              <div className="d-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "var(--eusomnia-primary)" }}
                    aria-hidden="true"
                  >
                    {meal.icon}
                  </span>
                  <h3
                    id={`meal-title-${meal.id}`}
                    className="font-headline h6 fw-bold text-light mb-0"
                  >
                    {meal.title}
                  </h3>
                </div>
                <TimeStepper
                  label={meal.id === "other" ? "Hora" : "Hora sugerida"}
                  value={value.time || ""}
                  suggestedValue={meal.suggestedTime}
                  onChange={(time) => onChangeMealEntry(meal.id, { time })}
                />
              </div>

              <div
                className="d-flex flex-wrap gap-2 mb-3"
                role="group"
                aria-label={`Modo de registro de ${meal.title.toLocaleLowerCase("es")}`}
              >
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill ${
                    value.inputMode === "generic"
                      ? "btn-primary"
                      : "btn-eusomnia-secondary"
                  }`}
                  aria-pressed={value.inputMode === "generic"}
                  onClick={() =>
                    onChangeMealEntry(meal.id, { inputMode: "generic" })
                  }
                >
                  Estimar por tamaño
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill ${
                    value.inputMode === "detailed"
                      ? "btn-primary"
                      : "btn-eusomnia-secondary"
                  }`}
                  aria-pressed={value.inputMode === "detailed"}
                  onClick={() =>
                    onChangeMealEntry(meal.id, { inputMode: "detailed" })
                  }
                >
                  Detallar alimentos
                </button>
              </div>

              {value.inputMode === "generic" && (
                <div
                  className="d-flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Tamaño de ${meal.title.toLocaleLowerCase("es")}`}
                >
                  {MEAL_SIZES.map((size) => (
                    <button
                      className={`btn btn-sm rounded-pill px-3 ${
                        value.size === size.id
                          ? "btn-primary"
                          : "btn-eusomnia-secondary"
                      }`}
                      type="button"
                      aria-pressed={value.size === size.id}
                      key={size.id}
                      onClick={() =>
                        onChangeMealEntry(meal.id, {
                          inputMode: "generic",
                          size: value.size === size.id ? null : size.id,
                        })
                      }
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              )}

              {value.inputMode === "detailed" && (
                <div className="mt-2">
                  <label
                    className="font-label small fw-bold text-light d-block mb-2"
                    htmlFor={`meal-foods-${meal.id}`}
                  >
                    Alimentos y cantidades
                  </label>
                  <textarea
                    id={`meal-foods-${meal.id}`}
                    className="form-control"
                    rows="2"
                    maxLength={1000}
                    value={value.foods || ""}
                    onChange={(event) =>
                      onChangeMealEntry(meal.id, {
                        inputMode: "detailed",
                        foods: event.target.value,
                      })
                    }
                    placeholder="Ej.: 150 g de arroz, 1 huevo y una taza de café"
                  />
                  <p className="font-body small text-secondary mt-2 mb-0">
                    Con alimentos y cantidades, Edamam puede ofrecer un análisis más específico.
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div
        className="alert mb-3 py-3"
        role="note"
        style={{
          background: "rgba(0, 229, 255, 0.08)",
          border: "1px solid rgba(0, 229, 255, 0.2)",
          color: "var(--eusomnia-text-muted)",
        }}
      >
        El tamaño de una ingesta usa una estimación media interna de Eusomnia,
        no una medición de tus alimentos. Para cada ingesta, elige estimación
        genérica o detalle de alimentos, no ambos. Los horarios son sugerencias
        sin confirmar hasta que los ajustes o confirmes.
        {" "}
        <button
          type="button"
          className="btn btn-link p-0 align-baseline"
          aria-expanded={showReferences}
          onClick={toggleReferences}
          style={{ color: "var(--eusomnia-primary)" }}
        >
          Ver ejemplos estándar de referencia
        </button>
      </div>

      {showReferences && (
        <section
          className="eusomnia-card p-3 p-sm-4 mb-4"
          aria-label="Ejemplos estándar de nutrición"
        >
          <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
            <div>
              <h3 className="font-headline h6 text-light mb-1">
                Referencias genéricas por tamaño
              </h3>
              <p className="font-body small text-secondary mb-0">
                {references?.metadata?.note ||
                  "Valores orientativos internos; no representan una receta ni una medición."}
              </p>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Cerrar referencias"
              onClick={() => setShowReferences(false)}
            />
          </div>
          {isLoadingReferences ? (
            <p className="text-secondary mb-0" role="status">
              <span className="spinner-border spinner-border-sm me-2" />
              Cargando referencias...
            </p>
          ) : referencesError ? (
            <p className="text-warning mb-0" role="alert">
              {referencesError}
            </p>
          ) : references ? (
            <div className="table-responsive">
              <table className="table table-dark table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Tamaño</th>
                    <th scope="col">Porción</th>
                    <th scope="col">Energía</th>
                    <th scope="col">Proteínas</th>
                    <th scope="col">Carbohidratos</th>
                    <th scope="col">Grasas</th>
                  </tr>
                </thead>
                <tbody>
                  {MEAL_SIZES.map((size) => {
                    const estimate = references.sizes[size.id];
                    return (
                      <tr key={size.id}>
                        <th scope="row">{size.label}</th>
                        <td>{estimate.portion_weight_g} g</td>
                        <td>{estimate.calories} kcal</td>
                        <td>{estimate.protein_g} g</td>
                        <td>{estimate.carbohydrates_g} g</td>
                        <td>{estimate.fat_g} g</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}

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
