import { useEffect } from "react";
import { Link } from "react-router-dom";

export const DemoModal = ({ isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="eusomnia-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="eusomnia-modal-container p-4 p-md-5 d-flex flex-column gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-secondary border-opacity-10">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center p-2"
              style={{
                background: "rgba(0, 229, 255, 0.15)",
                color: "var(--eusomnia-primary)",
              }}
            >
              <span className="material-symbols-outlined fs-3">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-headline h5 fw-bold text-light mb-0">
                Motor Neuronal Eusomnia (Simulación)
              </h3>
              <span className="font-label small text-secondary">
                Ejemplo de interpretación simultánea
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm rounded-3 p-1 d-flex align-items-center justify-content-center"
            style={{
              background: "var(--eusomnia-surface)",
              color: "var(--eusomnia-text-muted)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined fs-5">close</span>
          </button>
        </div>

        {/* Demo Case Comparison */}
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div
              className="p-3 rounded-3 h-100 d-flex flex-column gap-2"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <span
                className="font-label small fw-bold text-uppercase"
                style={{ color: "var(--eusomnia-primary)" }}
              >
                1. Datos Somáticos Ingresados
              </span>
              <ul className="font-body small text-secondary mb-0 ps-3" style={{ lineHeight: 1.6 }}>
                <li>Cena: 22:30 (Pizza + Té negro)</li>
                <li>Frecuencia cardíaca: 78 bpm en reposo</li>
                <li>Pantalla móvil activa hasta las 00:15</li>
              </ul>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div
              className="p-3 rounded-3 h-100 d-flex flex-column gap-2"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <span
                className="font-label small fw-bold text-uppercase"
                style={{ color: "var(--eusomnia-secondary)" }}
              >
                2. Narrativa Onírica
              </span>
              <p className="font-body small text-secondary mb-0 fst-italic" style={{ lineHeight: 1.6 }}>
                &quot;Buscaba mi equipaje en una terminal de trenes infinita y los
                andenes cambiaban de hora constantemente.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* AI Unified Verdict */}
        <div
          className="p-3 rounded-3 d-flex align-items-start gap-3"
          style={{
            background: "var(--eusomnia-surface-high)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
          }}
        >
          <span
            className="material-symbols-outlined fs-2 flex-shrink-0"
            style={{ color: "var(--eusomnia-primary)" }}
          >
            neurology
          </span>
          <div className="d-flex flex-column gap-1">
            <div className="font-label small fw-bold" style={{ color: "var(--eusomnia-primary)" }}>
              Veredicto Neuro-Onírico Unificado:
            </div>
            <p className="font-body small text-light mb-0" style={{ lineHeight: 1.6 }}>
              La pérdida de control en la terminal refleja la sobreactivación del
              locus coeruleus provocada por digestión tardía y teína. El cerebro
              traduce la incapacidad física de relajar la temperatura central en
              una búsqueda infructuosa en el sueño.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="d-flex justify-content-end align-items-center gap-3 pt-2">
          <button
            type="button"
            className="btn btn-eusomnia-secondary px-4 py-2 small"
            onClick={onClose}
          >
            Cerrar
          </button>
          <Link
            to="/registro-diario"
            className="btn btn-primary px-4 py-2 small"
            onClick={onClose}
          >
            Probar con mis propios datos
          </Link>
        </div>
      </div>
    </div>
  );
};
