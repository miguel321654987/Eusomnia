const formatMetric = (value, unit = "") => {
  if (value === null || value === undefined || value === "") {
    return "No informado";
  }
  const formattedValue =
    typeof value === "number" ? Number(value.toFixed(1)).toString() : value;
  return `${formattedValue}${unit ? ` ${unit}` : ""}`;
};

const buildContextMetrics = (context = {}) => [
  {
    label: "Actividad física",
    value: context.activity,
    icon: "fitness_center",
  },
  { label: "Pantallas", value: context.screens, icon: "devices" },
  {
    label: "Calidad percibida",
    value: context.mood,
    icon: "self_improvement",
  },
  { label: "Cena registrada", value: context.dinner, icon: "restaurant" },
  {
    label: "Hora de acostarse declarada",
    value: context.bedtime,
    icon: "bedtime",
  },
  {
    label: "Hora de despertar declarada",
    value: context.wakeTime,
    icon: "alarm",
  },
  {
    label: "Última cafeína declarada",
    value: context.lastCaffeineTime,
    icon: "coffee",
  },
  {
    label: "Temperatura declarada",
    value: context.roomTemperature,
    icon: "thermostat",
  },
  { label: "Luz declarada", value: context.roomLight, icon: "light_mode" },
];

export const ContextRegisteredSection = ({ context = {} }) => {
  const contextMetrics = buildContextMetrics(context);

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
          <span className="material-symbols-outlined fs-5">checklist</span>
        </div>
        <div>
          <h2 className="font-headline h5 fw-bold text-light mb-0">
            Contexto registrado. Hábitos y entorno declarados por ti; no son estimaciones genéricas.
          </h2>
          <span className="visually-hidden">Contexto registrado</span>
          <span className="visually-hidden">
            Hábitos y entorno declarados por ti; no son estimaciones genéricas.
          </span>
        </div>
      </div>

      <div className="row g-2 font-body small">
        {contextMetrics.map((metric) => (
          <div
            className="col-6 col-md-4 d-flex align-items-center gap-2 text-secondary"
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
    </section>
  );
};

export default ContextRegisteredSection;
