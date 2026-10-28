import { Link } from "react-router-dom";

export const SuccessScreen = ({ onReset }) => {
  return (
    <section className="eusomnia-card p-4 p-sm-5 text-center shadow-2xl position-relative">
      {/* Success Badge */}
      <div
        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
        style={{
          width: "64px",
          height: "64px",
          background: "rgba(0, 229, 255, 0.2)",
          color: "var(--eusomnia-primary)",
          boxShadow: "0 0 24px rgba(0, 229, 255, 0.4)",
        }}
      >
        <span className="material-symbols-outlined fs-1">verified</span>
      </div>

      <h2 className="font-headline display-6 fw-bold text-light mb-2">
        ¡Registro Diario Completado!
      </h2>
      <p
        className="font-body text-secondary small mx-auto mb-4"
        style={{ maxWidth: "520px", lineHeight: 1.6 }}
      >
        Tus datos somáticos, crononutricionales y oníricos han sido procesados. El
        motor de correlación de Eusomnia ha generado tu diagnóstico matutino.
      </p>

      {/* Biometric Summary Teaser */}
      <div className="row g-3 justify-content-center my-4 mx-auto" style={{ maxWidth: "480px" }}>
        <div className="col-4">
          <div
            className="p-3 rounded-3 text-center h-100"
            style={{ background: "var(--eusomnia-surface)" }}
          >
            <span
              className="font-label small text-secondary d-block text-uppercase"
              style={{ fontSize: "0.7rem" }}
            >
              Índice Sueño
            </span>
            <span className="font-headline h4 fw-bold mb-0 d-block" style={{ color: "var(--eusomnia-primary)" }}>
              88
              <span className="font-label small text-secondary fw-normal">/100</span>
            </span>
          </div>
        </div>

        <div className="col-4">
          <div
            className="p-3 rounded-3 text-center h-100"
            style={{ background: "var(--eusomnia-surface)" }}
          >
            <span
              className="font-label small text-secondary d-block text-uppercase"
              style={{ fontSize: "0.7rem" }}
            >
              Fase REM
            </span>
            <span className="font-headline h4 fw-bold mb-0 text-light d-block">
              1h 48m
            </span>
          </div>
        </div>

        <div className="col-4">
          <div
            className="p-3 rounded-3 text-center h-100"
            style={{ background: "var(--eusomnia-surface)" }}
          >
            <span
              className="font-label small text-secondary d-block text-uppercase"
              style={{ fontSize: "0.7rem" }}
            >
              Tensión
            </span>
            <span
              className="font-headline h4 fw-bold mb-0 d-block"
              style={{ color: "var(--eusomnia-primary-light)" }}
            >
              Baja
            </span>
          </div>
        </div>
      </div>

      {/* Action Cluster */}
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 pt-2">
        <Link
          to="/resultado-del-dia"
          className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2"
        >
          <span>Ver Resultado del Día</span>
          <span className="material-symbols-outlined fs-6">arrow_forward</span>
        </Link>

        <button
          type="button"
          className="btn btn-eusomnia-secondary px-4 py-2"
          onClick={onReset}
        >
          Registrar otro parámetro
        </button>
      </div>
    </section>
  );
};

