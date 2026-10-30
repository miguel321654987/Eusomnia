import { TimeStepper } from "./TimeStepper.jsx";
import {
  formatSleepDuration,
  getSleepDurationHours,
} from "../../utils/sleepTime.js";

const ROOM_TEMPERATURE_SUGGESTION = 20;

const RoomTemperatureStepper = ({ value, onChange }) => {
  const temperature = value === "" ? null : Number(value);
  const displayedTemperature = temperature ?? ROOM_TEMPERATURE_SUGGESTION;
  const isSuggested = temperature === null;

  const updateTemperature = (direction) => {
    const nextTemperature = Math.min(
      40,
      Math.max(5, displayedTemperature + direction * 0.5),
    );
    onChange(String(Number(nextTemperature.toFixed(1))));
  };

  return (
    <div className="d-flex flex-column gap-1" role="group" aria-label="Temperatura aproximada de la habitación">
      <span className="font-label small text-light">Temperatura aprox. (°C)</span>
      <div
        className="d-inline-flex align-items-center justify-content-between gap-2 p-1 rounded-3"
        style={{ background: "var(--eusomnia-surface-high)", maxWidth: "220px" }}
      >
        <button
          type="button"
          className="btn btn-sm btn-eusomnia-secondary"
          style={{ width: "40px", height: "40px" }}
          onClick={() => updateTemperature(-1)}
          disabled={displayedTemperature <= 5}
          aria-label="Bajar temperatura medio grado"
        >
          <span className="material-symbols-outlined fs-6" aria-hidden="true">
            remove
          </span>
        </button>
        <div className="text-center px-2">
          {isSuggested ? (
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none font-headline fw-bold"
              style={{ color: "var(--eusomnia-primary)", fontSize: "1.15rem" }}
              onClick={() => onChange(String(ROOM_TEMPERATURE_SUGGESTION))}
              aria-label="Confirmar temperatura sugerida de 20 grados"
            >
              {displayedTemperature.toFixed(1)} °C
            </button>
          ) : (
            <span className="font-headline fw-bold text-light">
              {displayedTemperature.toFixed(1)} °C
            </span>
          )}
          {isSuggested && (
            <span className="font-body small text-secondary d-block">
              sugerida · sin guardar
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-eusomnia-secondary"
          style={{ width: "40px", height: "40px" }}
          onClick={() => updateTemperature(1)}
          disabled={displayedTemperature >= 40}
          aria-label="Subir temperatura medio grado"
        >
          <span className="material-symbols-outlined fs-6" aria-hidden="true">
            add
          </span>
        </button>
      </div>
    </div>
  );
};

export const StepSleepHygiene = ({
  sleepHours,
  sleepQuality,
  screenTime,
  sleepContext,
  onChangeSleepContext,
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

  const derivedSleepHours = getSleepDurationHours(
    sleepContext?.bedtime,
    sleepContext?.wake_time,
  );
  const hasBothSleepTimes = Boolean(
    sleepContext?.bedtime && sleepContext?.wake_time,
  );

  const handleHours = (delta) => {
    const nextVal = Math.max(
      3,
      Math.min(14, Math.round((sleepHours + delta) * 100) / 100),
    );
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
            Registra las horas de sueño y cómo percibiste tu descanso.
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

          {derivedSleepHours === null && !hasBothSleepTimes ? (
          <div
            className="d-flex align-items-center gap-3 p-1 rounded-3"
            style={{ background: "var(--eusomnia-surface-high)" }}
          >
            <button
              type="button"
              className="btn btn-sm btn-eusomnia-secondary d-flex align-items-center justify-content-center"
              style={{ width: "36px", height: "36px" }}
              onClick={() => handleHours(-0.25)}
              aria-label="Restar quince minutos"
            >
              <span className="material-symbols-outlined fs-6">remove</span>
            </button>

            <div className="text-center px-3">
              <span className="font-headline h3 fw-bold mb-0 text-light d-block" style={{ color: "var(--eusomnia-primary)" }}>
                {formatSleepDuration(sleepHours)}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-eusomnia-secondary d-flex align-items-center justify-content-center"
              style={{ width: "36px", height: "36px" }}
              onClick={() => handleHours(0.25)}
              aria-label="Sumar quince minutos"
            >
              <span className="material-symbols-outlined fs-6">add</span>
            </button>
          </div>
          ) : derivedSleepHours !== null ? (
            <div
              className="text-center p-2 rounded-3"
              style={{ background: "var(--eusomnia-surface-high)" }}
              role="status"
              aria-live="polite"
            >
              <span className="font-headline h4 fw-bold text-light d-block mb-0">
                {formatSleepDuration(derivedSleepHours)}
              </span>
              <span className="font-body small text-secondary">
                Calculado según los horarios indicados
              </span>
            </div>
          ) : (
            <p className="small text-danger mb-0" role="alert">
              Los horarios no pueden ser iguales. Ajusta la hora de despertar o
              borra uno para indicar la duración manualmente.
            </p>
          )}
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

      <section
        className="p-3 p-sm-4 rounded-3 mb-4"
        style={{ background: "var(--eusomnia-surface)" }}
        aria-labelledby="sleep-context-heading"
      >
        <h3
          id="sleep-context-heading"
          className="font-headline h6 fw-bold text-light mb-1"
        >
          Horarios y entorno (opcional)
        </h3>
        <p className="font-body small text-secondary mb-3">
          Datos aproximados declarados por ti; no se miden con sensores.
        </p>
        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <TimeStepper
              label="Me acosté"
              value={sleepContext?.bedtime || ""}
              suggestedValue="23:00"
              onChange={(bedtime) => onChangeSleepContext({ bedtime })}
            />
          </div>
          <div className="col-12 col-sm-6">
            <TimeStepper
              label="Me desperté"
              value={sleepContext?.wake_time || ""}
              suggestedValue="06:30"
              onChange={(wake_time) => onChangeSleepContext({ wake_time })}
            />
          </div>
          <div className="col-12 col-sm-6">
            <RoomTemperatureStepper
              value={sleepContext?.room_temperature_c ?? ""}
              onChange={(room_temperature_c) =>
                onChangeSleepContext({ room_temperature_c })
              }
            />
          </div>
          <div className="col-12 col-sm-6">
            <fieldset className="border-0 p-0 m-0">
              <legend className="font-label small text-light mb-2">
                Luz de la habitación
              </legend>
              <div className="d-flex flex-wrap gap-2" role="group" aria-label="Luz de la habitación">
                {[
                  { id: "dark", label: "Oscura" },
                  { id: "dim", label: "Tenue" },
                  { id: "bright", label: "Luminosa" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`btn btn-sm rounded-pill ${
                      sleepContext?.room_light === option.id
                        ? "btn-primary"
                        : "btn-eusomnia-secondary"
                    }`}
                    aria-pressed={sleepContext?.room_light === option.id}
                    onClick={() =>
                      onChangeSleepContext({
                        room_light:
                          sleepContext?.room_light === option.id
                            ? ""
                            : option.id,
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </section>

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
          onClick={() => {
            if (!hasBothSleepTimes || derivedSleepHours !== null) onNext();
          }}
          disabled={hasBothSleepTimes && derivedSleepHours === null}
        >
          <span>Aceptar y Siguiente</span>
          <span className="material-symbols-outlined fs-6">arrow_forward</span>
        </button>
      </div>
    </section>
  );
};
