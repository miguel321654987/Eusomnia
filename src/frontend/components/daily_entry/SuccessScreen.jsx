import { Link } from "react-router-dom";

export const SuccessScreen = ({ entryId }) => {
  return (
    <section className="eusomnia-card p-4 p-sm-5 text-center shadow-2xl position-relative">
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
        Registro guardado
      </h2>
      <p className="font-body text-secondary small mx-auto mb-4">
        Tus datos se guardaron en tu cuenta. Abre el resultado para consultar el
        análisis generado con los servicios configurados.
      </p>

      <Link
        to={`/resultado-del-dia?entryId=${entryId}`}
        className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2"
      >
        <span>Ver Resultado del Día</span>
        <span className="material-symbols-outlined fs-6">arrow_forward</span>
      </Link>
    </section>
  );
};
