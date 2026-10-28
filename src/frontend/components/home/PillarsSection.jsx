export const PillarsSection = () => {
  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      {/* Section Header */}
      <div className="text-center mb-5 d-flex flex-column align-items-center gap-2">
        <span
          className="font-label small fw-bold text-uppercase tracking-widest"
          style={{ color: "var(--eusomnia-primary)", letterSpacing: "2px" }}
        >
          Metodología Científica
        </span>
        <h2 className="font-headline display-6 fw-bold text-light mb-0">
          Los Tres Pilares de Eusomnia
        </h2>
        <p className="font-body text-secondary lead mb-0" style={{ maxWidth: "620px" }}>
          Superamos los diarios manuales tediosos y las apps de música genérica
          vinculando fisiología real con la psicología profunda de tus sueños.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="row g-4">
        {/* Pillar 1 */}
        <div className="col-12 col-md-4">
          <div className="eusomnia-card h-100 p-4 d-flex flex-column justify-content-between">
            <div className="d-flex flex-column gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{
                  width: "52px",
                  height: "52px",
                  background: "var(--eusomnia-surface)",
                  color: "var(--eusomnia-primary)",
                }}
              >
                <span className="material-symbols-outlined fs-3">timer</span>
              </div>
              <span className="badge badge-eusomnia-cyan rounded-pill px-3 py-1 small align-self-start">
                01 • AGILIDAD
              </span>
              <h3 className="font-headline h5 fw-bold text-light mb-0">
                Registro Rápido Sin Fricción
              </h3>
              <p className="font-body text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                Diseñado para completarse en menos de 2 minutos matutinos.
                Wizard guiado paso a paso con selectores intuitivos para capturar
                sueños antes de que la memoria remota se disipe.
              </p>
            </div>
            <div
              className="pt-4 d-flex align-items-center gap-2 font-label small fw-semibold"
              style={{ color: "var(--eusomnia-primary)" }}
            >
              <span>Flujo de 4 fases adaptativas</span>
              <span className="material-symbols-outlined fs-6">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="col-12 col-md-4">
          <div
            className="eusomnia-card h-100 p-4 d-flex flex-column justify-content-between position-relative overflow-hidden"
            style={{
              borderColor: "rgba(0, 229, 255, 0.25)",
              background: "linear-gradient(180deg, var(--eusomnia-surface) 0%, var(--eusomnia-surface-low) 100%)",
            }}
          >
            <div className="d-flex flex-column gap-3 position-relative" style={{ zIndex: 1 }}>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{
                  width: "52px",
                  height: "52px",
                  background: "rgba(0, 229, 255, 0.15)",
                  color: "var(--eusomnia-primary)",
                }}
              >
                <span className="material-symbols-outlined fs-3">hub</span>
              </div>
              <span
                className="badge rounded-pill px-3 py-1 small align-self-start fw-bold"
                style={{
                  background: "rgba(0, 229, 255, 0.2)",
                  color: "var(--eusomnia-primary-light)",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                }}
              >
                02 • MOTOR UNIFICADO
              </span>
              <h3 className="font-headline h5 fw-bold text-light mb-0">
                Causa Somática + Símbolo Onírico
              </h3>
              <p className="font-body text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                El sueño aporta la metáfora; tus hábitos (pantallas, cafeína, cena)
                la causa biológica. Nuestra IA entrelaza ambos mundos para explicar
                por qué soñaste lo que soñaste.
              </p>
            </div>
            <div
              className="pt-4 d-flex align-items-center gap-2 font-label small fw-semibold position-relative"
              style={{ color: "var(--eusomnia-primary)", zIndex: 1 }}
            >
              <span>Análisis semántico multimodal</span>
              <span className="material-symbols-outlined fs-6">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="col-12 col-md-4">
          <div className="eusomnia-card h-100 p-4 d-flex flex-column justify-content-between">
            <div className="d-flex flex-column gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{
                  width: "52px",
                  height: "52px",
                  background: "var(--eusomnia-surface)",
                  color: "var(--eusomnia-tertiary-container)",
                }}
              >
                <span className="material-symbols-outlined fs-3">vital_signs</span>
              </div>
              <span className="badge badge-eusomnia-amber rounded-pill px-3 py-1 small align-self-start">
                03 • NUTRICIÓN & EDAMAM
              </span>
              <h3 className="font-headline h5 fw-bold text-light mb-0">
                Prescripciones Personalizadas
              </h3>
              <p className="font-body text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                Integración con bases de datos metabólicas para balancear
                triptófano, magnesio y carbohidratos complejos en tus últimas
                comidas antes de la fase de reposo profundo.
              </p>
            </div>
            <div
              className="pt-4 d-flex align-items-center gap-2 font-label small fw-semibold"
              style={{ color: "var(--eusomnia-tertiary-container)" }}
            >
              <span>Micro-hábitos circadianos</span>
              <span className="material-symbols-outlined fs-6">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

