export const HygienicAlertBanner = ({ alerts = [] }) => {
  if (!alerts.length) return null;

  return (
    <section
      className="p-3 p-sm-4 rounded-4 d-flex align-items-start gap-3 shadow-sm position-relative"
      style={{
        background: "rgba(255, 198, 126, 0.1)",
        border: "1px solid rgba(255, 198, 126, 0.28)",
        backdropFilter: "blur(8px)",
        zIndex: 1,
      }}
      aria-label="Alertas del análisis"
    >
      <div
        className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
        style={{
          width: "40px",
          height: "40px",
          background: "rgba(255, 198, 126, 0.25)",
          color: "var(--eusomnia-tertiary-container)",
        }}
      >
        <span className="material-symbols-outlined fs-5">warning</span>
      </div>

      <div className="flex-grow-1">
        <h2
          className="font-headline h6 fw-bold mb-2"
          style={{ color: "var(--eusomnia-tertiary)" }}
        >
          Alertas del análisis
        </h2>
        <ul className="font-body small text-secondary mb-0 ps-3">
          {alerts.map((alert, index) => (
            <li key={`${index}-${alert}`}>{alert}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};
