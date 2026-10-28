const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "No registrado";
  }
  return value;
};

export const SomnolenceGauges = ({
  sleepHours,
  sleepQuality,
  caffeineMg,
}) => {
  const metrics = [
    {
      label: "Duración registrada",
      value:
        sleepHours === null || sleepHours === undefined
          ? null
          : `${sleepHours} h`,
      icon: "bedtime",
      color: "var(--eusomnia-primary)",
    },
    {
      label: "Calidad percibida",
      value: sleepQuality,
      icon: "self_improvement",
      color: "var(--eusomnia-secondary)",
    },
    {
      label: "Cafeína en alimentos",
      value:
        caffeineMg === null || caffeineMg === undefined
          ? null
          : `${caffeineMg} mg`,
      icon: "bolt",
      color: "var(--eusomnia-tertiary-container)",
    },
  ];

  return (
    <section className="row g-4 position-relative" style={{ zIndex: 1 }}>
      {metrics.map((metric) => (
        <div className="col-12 col-md-4" key={metric.label}>
          <div className="eusomnia-card p-4 h-100 d-flex align-items-center gap-3">
            <span
              className="material-symbols-outlined fs-3"
              style={{ color: metric.color }}
              aria-hidden="true"
            >
              {metric.icon}
            </span>
            <div>
              <span className="font-label small text-uppercase text-secondary d-block">
                {metric.label}
              </span>
              <span className="font-headline h5 fw-bold text-light mb-0">
                {formatValue(metric.value)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};
