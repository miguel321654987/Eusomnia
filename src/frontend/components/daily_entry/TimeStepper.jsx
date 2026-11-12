function parseTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(totalMinutes) {
  const wrappedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(wrappedMinutes / 60)).padStart(2, "0");
  const minutes = String(wrappedMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export const TimeStepper = ({
  label,
  value,
  suggestedValue,
  onChange,
  stepMinutes = 15,
}) => {
  const selectedMinutes = parseTime(value);
  const suggestedMinutes = parseTime(suggestedValue);
  const displayedValue =
    selectedMinutes === null
      ? suggestedValue || "--:--"
      : formatTime(selectedMinutes);
  const isSuggested = selectedMinutes === null && suggestedMinutes !== null;

  const adjustTime = (direction) => {
    const baseMinutes = selectedMinutes ?? suggestedMinutes ?? 12 * 60;
    onChange(formatTime(baseMinutes + direction * stepMinutes));
  };

  return (
    <div
      className="d-flex flex-column gap-1"
      role="group"
      aria-label={label}
    >
      <span className="font-label small text-light">{label}</span>
      <div
        className="d-inline-flex align-items-center justify-content-between gap-2 p-1 rounded-3"
        style={{
          background: "var(--eusomnia-surface-high)",
          maxWidth: "220px",
        }}
      >
        <button
          type="button"
          className="btn btn-sm btn-eusomnia-secondary d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px" }}
          onClick={() => adjustTime(-1)}
          aria-label={`Restar ${stepMinutes} minutos a ${label.toLocaleLowerCase("es")}`}
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
              onClick={() => onChange(formatTime(suggestedMinutes))}
              aria-label={`Confirmar hora sugerida ${displayedValue} para ${label.toLocaleLowerCase("es")}`}
            >
              {displayedValue}
            </button>
          ) : (
            <span className="font-headline fw-bold text-light">
              {displayedValue}
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
          className="btn btn-sm btn-eusomnia-secondary d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px" }}
          onClick={() => adjustTime(1)}
          aria-label={`Sumar ${stepMinutes} minutos a ${label.toLocaleLowerCase("es")}`}
        >
          <span className="material-symbols-outlined fs-6" aria-hidden="true">
            add
          </span>
        </button>
      </div>
    </div>
  );
};
