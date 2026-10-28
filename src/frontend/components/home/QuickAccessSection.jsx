import { Link } from "react-router-dom";

export const QuickAccessSection = ({ user }) => {
  const userName = user?.name || user?.username || user?.email || null;

  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      <div
        className="p-4 p-lg-5 rounded-4 shadow-lg d-flex flex-column flex-lg-row align-items-center justify-content-between gap-4"
        style={{
          background:
            "linear-gradient(135deg, var(--eusomnia-surface-low) 0%, var(--eusomnia-surface) 50%, var(--eusomnia-surface-low) 100%)",
          border: "1px solid rgba(0, 229, 255, 0.15)",
        }}
      >
        {/* Left Side: Avatar and Greeting */}
        <div className="d-flex align-items-center gap-4">
          <div
            className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: "72px",
              height: "72px",
              background: "var(--eusomnia-primary)",
              color: "var(--eusomnia-on-primary)",
              boxShadow: "0 0 24px rgba(0, 229, 255, 0.45)",
            }}
          >
            <span className="material-symbols-outlined fs-1">
              {userName ? "person_check" : "bedtime"}
            </span>
          </div>

          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-2">
              <h3 className="font-headline h4 fw-bold text-light mb-0">
                {userName ? `Bienvenida/o de nuevo, ${userName}` : "Únete al neuro-descanso con Eusomnia"}
              </h3>
              <span className="pulse-dot-cyan" />
            </div>
            <p className="font-body text-secondary small mb-0" style={{ maxWidth: "560px" }}>
              {userName
                ? "Tienes 1 reporte matutino pendiente de revisión con IA. ¿Quieres registrar el descanso de anoche o revisar las recomendaciones de tu cena?"
                : "Crea tu cuenta o inicia sesión para sincronizar tus biométricas circadianas, correlacionar tus cenas con la fase REM y desvelar los símbolos de tu subconsciente."}
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">
          {userName ? (
            <>
              <Link
                to="/registro-diario"
                className="btn btn-primary px-4 py-3 d-inline-flex align-items-center gap-2"
              >
                <span className="material-symbols-outlined fs-5">add_circle</span>
                <span>Registrar Noche</span>
              </Link>
              <Link
                to="/perfil"
                className="btn btn-eusomnia-secondary px-4 py-3 d-inline-flex align-items-center gap-2"
              >
                <span className="material-symbols-outlined fs-5">settings</span>
                <span>Ajustes de Perfil</span>
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary px-4 py-3 d-inline-flex align-items-center gap-2"
                data-bs-toggle="modal"
                data-bs-target="#signupModal"
              >
                <span className="material-symbols-outlined fs-5">how_to_reg</span>
                <span>Crear Cuenta</span>
              </button>
              <button
                type="button"
                className="btn btn-eusomnia-secondary px-4 py-3 d-inline-flex align-items-center gap-2"
                data-bs-toggle="modal"
                data-bs-target="#loginModal"
              >
                <span className="material-symbols-outlined fs-5">login</span>
                <span>Iniciar Sesión</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
