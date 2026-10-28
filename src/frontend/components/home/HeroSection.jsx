import { Link } from "react-router-dom";

export const HeroSection = ({ user, onOpenDemo }) => {
  const userName = user?.name || user?.username || user?.email || null;

  return (
    <section className="container py-5 position-relative" style={{ zIndex: 1 }}>
      <div className="row align-items-center g-5">
        {/* Left Column: Brand, Pitch & CTAs */}
        <div className="col-12 col-lg-7 d-flex flex-column gap-4">
          {/* Version badge */}
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill w-fit"
            style={{
              background: "rgba(34, 42, 58, 0.85)",
              border: "1px solid rgba(0, 229, 255, 0.2)",
              backdropFilter: "blur(8px)",
              width: "fit-content",
            }}
          >
            <span className="pulse-dot-cyan" />
            <span className="font-label small fw-semibold text-gradient-cyan text-uppercase tracking-wider">
              Neuro-Monitoreo Circadiano • v2.6 Activa
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline display-5 fw-bold text-light mb-0" style={{ lineHeight: 1.15 }}>
            Descifra la conexión entre tus días y{" "}
            <span className="text-gradient-cyan">tus sueños</span>
          </h1>

          {/* Pitch Text */}
          <p className="font-body text-secondary lead mb-0" style={{ maxWidth: "580px", color: "var(--eusomnia-text-muted)" }}>
            Unificamos la higiene neuro-circadiana, biométricas nutricionales y el
            análisis onírico generativo. Tu día explica el estresor somático;
            nuestra IA decodifica el símbolo de tu subconsciente.
          </p>

          {/* Action CTAs */}
          <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
            <Link
              to="/registro-diario"
              className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-3"
            >
              <span className="material-symbols-outlined fs-5">play_arrow</span>
              <span>Comenzar Registro Diario</span>
            </Link>

            <button
              type="button"
              onClick={onOpenDemo}
              className="btn btn-eusomnia-secondary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-3"
            >
              <span className="material-symbols-outlined fs-5" style={{ color: "var(--eusomnia-primary)" }}>
                auto_fix_high
              </span>
              <span>Ver Demo de Análisis</span>
            </button>
          </div>

          {/* Dynamic User Session Indicator */}
          <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
            {userName ? (
              <div
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                style={{ background: "var(--eusomnia-surface-low)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--eusomnia-primary)", fontSize: "18px" }}
                >
                  verified_user
                </span>
                <span className="font-label small text-secondary">
                  Sesión activa de: <strong className="text-light">{userName}</strong>
                </span>
              </div>
            ) : (
              <div
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                style={{ background: "var(--eusomnia-surface-low)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: "18px" }}>
                  account_circle
                </span>
                <span className="font-label small text-secondary">
                  Modo Explorador: <strong className="text-light">Invitado</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none ms-1 font-label"
                  style={{ color: "var(--eusomnia-primary)" }}
                  data-bs-toggle="modal"
                  data-bs-target="#loginModal"
                >
                  Identificarse
                </button>
              </div>
            )}
            <span
              className="font-label small text-uppercase tracking-wider"
              style={{ color: "var(--eusomnia-outline)", fontSize: "0.75rem" }}
            >
              Última calibración: Hoy, 07:42 AM
            </span>
          </div>
        </div>

        {/* Right Column: Bioluminescent HUD Mockup Card */}
        <div className="col-12 col-lg-5 position-relative">
          <div className="eusomnia-hud-card p-4 d-flex flex-column gap-3">
            {/* HUD Header */}
            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-secondary border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-3 d-flex align-items-center justify-center p-2"
                  style={{ background: "var(--eusomnia-surface)" }}
                >
                  <span
                    className="material-symbols-outlined fs-5"
                    style={{ color: "var(--eusomnia-primary)" }}
                  >
                    psychology
                  </span>
                </div>
                <div>
                  <div className="font-label fw-bold text-light lh-1">Sinapsis Nocturna</div>
                  <div className="font-label small text-secondary" style={{ fontSize: "0.75rem" }}>
                    Bio-Telemetry Matrix
                  </div>
                </div>
              </div>
              <span className="badge badge-eusomnia-cyan rounded-pill px-2 py-1 small">
                CALIBRADO
              </span>
            </div>

            {/* Dial & Sleep Score */}
            <div
              className="p-3 rounded-3 d-flex align-items-center justify-content-between"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: "64px", height: "64px" }}>
                  <svg className="w-100 h-100" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="3.2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#00e5ff"
                      strokeDasharray="84, 100"
                      strokeLinecap="round"
                      strokeWidth="3.2"
                    />
                  </svg>
                  <span className="position-absolute font-label fw-bold text-light fs-6">84%</span>
                </div>
                <div>
                  <div className="font-headline fw-semibold text-light">Restauración Alta</div>
                  <div className="font-body small text-secondary" style={{ fontSize: "0.8rem" }}>
                    7h 42m • Ciclo REM óptimo
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined fs-3" style={{ color: "var(--eusomnia-primary)" }}>
                trending_up
              </span>
            </div>

            {/* Sparkline wave */}
            <div
              className="p-3 rounded-3 d-flex flex-column gap-2"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <div className="d-flex justify-content-between align-items-center font-label" style={{ fontSize: "0.75rem" }}>
                <span className="text-secondary">ESTRUCTURA DEL SUEÑO (NREM / REM)</span>
                <span style={{ color: "var(--eusomnia-primary)" }}>02:14 - 04:30 PICO REM</span>
              </div>
              <div className="w-100" style={{ height: "36px" }}>
                <svg className="w-100 h-100" preserveAspectRatio="none" viewBox="0 0 280 40">
                  <path
                    d="M0,30 Q25,32 50,15 T100,28 T150,8 T200,25 T240,12 T280,30"
                    fill="none"
                    stroke="#00e5ff"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,30 Q25,32 50,15 T100,28 T150,8 T200,25 T240,12 T280,30 L280,40 L0,40 Z"
                    fill="rgba(0, 229, 255, 0.12)"
                  />
                </svg>
              </div>
            </div>

            {/* Somatic & Nutrition Alert */}
            <div
              className="p-3 rounded-3 d-flex align-items-start gap-2"
              style={{
                background: "rgba(255, 198, 126, 0.1)",
                border: "1px solid rgba(255, 198, 126, 0.25)",
              }}
            >
              <span
                className="material-symbols-outlined fs-5 flex-shrink-0"
                style={{ color: "var(--eusomnia-tertiary-container)" }}
              >
                local_cafe
              </span>
              <div className="d-flex flex-column">
                <span className="font-label small fw-bold" style={{ color: "var(--eusomnia-tertiary)" }}>
                  Alerta Somática Nutricional
                </span>
                <span className="font-body small text-secondary" style={{ fontSize: "0.78rem" }}>
                  Cena alta en lípidos (21:30) y 85mg cafeína alteraron la latencia NREM en 34 min.
                </span>
              </div>
            </div>

            {/* Dream semantic anchor preview */}
            <div
              className="p-3 rounded-3 d-flex align-items-center justify-content-between"
              style={{ background: "var(--eusomnia-surface)" }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined fs-5" style={{ color: "var(--eusomnia-primary)" }}>
                  cloud
                </span>
                <span className="font-label small text-light">Símbolo: &quot;Vuelo Nocturno&quot;</span>
              </div>
              <span className="font-label small fw-bold" style={{ color: "var(--eusomnia-primary)" }}>
                Resonancia IA 92%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
