import { Link, useLocation } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const Navbar = () => {
  const { store, actions } = useGlobalReducer();
  const location = useLocation();
  const user = store.user;
  const userName = user?.name || user?.username || user?.email || null;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Registro Diario", path: "/registro-diario" },
    { name: "Resultado del Día", path: "/resultado-del-dia" },
    { name: "Historial", path: "/historial" },
    { name: "Perfil", path: "/perfil" },
  ];

  return (
    <header className="sticky-top w-100 eusomnia-navbar">
      <nav className="navbar navbar-expand-lg navbar-dark py-2 px-3 px-lg-4">
        <div className="container-fluid max-w-7xl">
          {/* Brand Logo & Name */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 me-3 me-xl-4 text-decoration-none">
            <div
              className="position-relative d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: "40px",
                height: "40px",
                background: "var(--eusomnia-surface)",
                boxShadow: "0 0 16px rgba(0, 229, 255, 0.25)",
                border: "1px solid rgba(0, 229, 255, 0.2)",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--eusomnia-primary)", fontSize: "22px" }}
              >
                bedtime
              </span>
              <span
                className="material-symbols-outlined position-absolute"
                style={{
                  top: "2px",
                  right: "2px",
                  color: "var(--eusomnia-primary-light)",
                  fontSize: "13px",
                }}
              >
                hub
              </span>
            </div>
            <span
              className="font-headline h4 fw-bold mb-0 tracking-tight"
              style={{ color: "var(--eusomnia-primary)" }}
            >
              Eusomnia
            </span>
          </Link>

          {/* Mobile Toggle Button */}
          <button
            className="navbar-toggler border-0 p-1"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#eusomniaNavbarContent"
            aria-controls="eusomniaNavbarContent"
            aria-expanded="false"
            aria-label="Alternar navegación"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Collapsible Content */}
          <div className="collapse navbar-collapse" id="eusomniaNavbarContent">
            {/* Center Navigation Pills */}
            <div className="mx-auto my-2 my-lg-0">
              <div className="eusomnia-nav-pills-container d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`eusomnia-nav-link text-center px-2 px-xl-3 ${isActive ? "active" : ""}`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right User Area */}
            <div className="d-flex align-items-center gap-2 gap-xl-3 ms-lg-3 pt-2 pt-lg-0">
              {userName ? (
                <>
                  <div
                    className="d-flex align-items-center gap-2 ps-3 pe-2 py-1 rounded-pill"
                    style={{
                      background: "var(--eusomnia-surface-low)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <span className="font-label small text-secondary d-none d-sm-inline" style={{ fontSize: "0.78rem" }}>
                      Usuario activo:
                    </span>
                    <span className="font-label small text-light fw-bold" style={{ fontSize: "0.85rem" }}>
                      {userName}
                    </span>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "30px",
                        height: "30px",
                        background: "var(--eusomnia-primary)",
                        color: "var(--eusomnia-on-primary)",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        person
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => actions.handleLogout()}
                    className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1 p-1 text-secondary hover-cyan"
                    title="Cerrar sesión"
                  >
                    <span className="material-symbols-outlined fs-5">logout</span>
                    <span className="font-label small d-none d-md-inline">Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-eusomnia-secondary px-3 py-1 font-label"
                    data-bs-toggle="modal"
                    data-bs-target="#loginModal"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary px-3 py-1 font-label"
                    data-bs-toggle="modal"
                    data-bs-target="#signupModal"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
