export const RecommendationsPanel = ({ prescriptions = [] }) => {
  if (!prescriptions.length) return null;

  return (
    <section className="eusomnia-card p-4 p-sm-5 shadow-lg d-flex flex-column gap-3">
      <div className="d-flex align-items-center gap-2">
        <span
          className="material-symbols-outlined fs-5"
          style={{ color: "var(--eusomnia-primary)" }}
          aria-hidden="true"
        >
          recommend
        </span>
        <div>
          <h2 className="font-headline h5 fw-bold text-light mb-0">
            Recomendaciones del análisis
          </h2>
          <p className="font-body small text-secondary mb-0">
            Sugerencias generadas por IA — no constituyen diagnóstico clínico
          </p>
        </div>
      </div>

      <div className="row g-3">
        {prescriptions.map((item) => (
          <div className="col-12 col-md-6 col-lg-4" key={item.num}>
            <div
              className="prescription-card h-100"
              style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
            >
              <div className="prescription-number flex-shrink-0">{item.num}</div>
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
          </div>
        ))}
      </div>
    </section>
  );
};

