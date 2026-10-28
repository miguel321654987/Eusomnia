export const RestArchitectureSection = () => {
  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      <div
        className="p-4 p-lg-5 rounded-4 position-relative overflow-hidden"
        style={{
          background: "var(--eusomnia-surface-low)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 16px 40px rgba(0, 15, 35, 0.4)",
        }}
      >
        <div className="row align-items-center g-5">
          {/* Left Column: Data & Science */}
          <div className="col-12 col-lg-7 d-flex flex-column gap-3">
            <span
              className="font-label small fw-bold text-uppercase tracking-widest"
              style={{ color: "var(--eusomnia-primary)", letterSpacing: "2px" }}
            >
              Arquitectura del Descanso
            </span>
            <h2 className="font-headline display-6 fw-bold text-light mb-0">
              Tu santuario nocturno respaldado por ciencia clínica
            </h2>
            <p className="font-body text-secondary mb-0" style={{ lineHeight: 1.6 }}>
              Desde la regulación de luxes ambientales hasta la amortiguación del
              cortisol nocturno, Eusomnia modela tu entorno óptimo para una fase
              NREM 3 restauradora y sueños lúcidos no fragmentados.
            </p>

            {/* Environmental Metric Pills */}
            <div className="row g-3 pt-2">
              <div className="col-12 col-sm-6">
                <div
                  className="p-3 rounded-3 d-flex align-items-center gap-3"
                  style={{ background: "var(--eusomnia-surface)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                >
                  <span
                    className="material-symbols-outlined fs-2"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    thermostat
                  </span>
                  <div>
                    <div className="font-headline h5 fw-bold text-light mb-0">18.5° C</div>
                    <div className="font-body small text-secondary">Temp. Óptima Cuarto</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div
                  className="p-3 rounded-3 d-flex align-items-center gap-3"
                  style={{ background: "var(--eusomnia-surface)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                >
                  <span
                    className="material-symbols-outlined fs-2"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    wb_twilight
                  </span>
                  <div>
                    <div className="font-headline h5 fw-bold text-light mb-0">&lt; 10 Lux</div>
                    <div className="font-body small text-secondary">Luz Azul Cero 60m</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Image & HUD Sensor Overlay */}
          <div className="col-12 col-lg-5">
            <div
              className="position-relative rounded-4 overflow-hidden shadow-lg"
              style={{ height: "300px" }}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMx0qdUZmuwbbL9r2AC89ywM1z-6ONHrQVXB9l8UR81E3S_T9kfWaFTptzel4C0dTBTwCzY7NqjqzTH2wSgZ13c1rPgGbgHL2vvufIggzhmSK7PvGIf-A-utsZDcO366u6bxZu7dxC32tHrkNZbqeC8Kq7E4ciJ9fe3K6W0JUkwrP3aQo8GHAbfPOlMprlxda8YF0Ii-i6bzw00Gf_5aNhZNChGjHScJXR2Z6qdh3d"
                alt="Santuario circadiano nocturno con iluminación cian tenue"
                className="w-100 h-100 object-fit-cover"
                style={{ objectFit: "cover" }}
              />
              {/* Sensor Badge Overlay */}
              <div
                className="position-absolute bottom-0 start-0 end-0 p-3"
                style={{
                  background: "linear-gradient(180deg, transparent 0%, rgba(6, 14, 29, 0.9) 100%)",
                }}
              >
                <div
                  className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3"
                  style={{
                    background: "rgba(10, 19, 34, 0.85)",
                    border: "1px solid rgba(0, 229, 255, 0.25)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="pulse-dot-cyan" />
                  <span className="font-label small fw-semibold text-light">
                    Sensor de Entorno • Listo para dormir
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

