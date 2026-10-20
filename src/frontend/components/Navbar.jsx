import { Link, NavLink } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { FiLogOut } from "react-icons/fi"; // icon optional

/**
 * Barra de navegación principal.
 * Se ha actualizado al estilo demo con fondo primario y tipografía clara.
 */
export const Navbar = () => {
  const { store, actions } = useGlobalReducer();
  const isAuthenticated = !!store.token && !!store.user;

  const handleLogout = () => {
    actions.handleLogout();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Eusomnia
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
               <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li className="nav-item">
                   <NavLink className="nav-link" to="/daily-log">
                    Registro Diario
                  </NavLink>
                </li>
                <li className="nav-item">
                   <NavLink className="nav-link" to="/daily-result">
                    Resultado del Día
                  </NavLink>
                </li>
                <li className="nav-item">
                   <NavLink className="nav-link" to="/history">
                    Historial
                  </NavLink>
                </li>
                <li className="nav-item">
                   <NavLink className="nav-link" to="/profile">
                    Perfil
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {isAuthenticated ? (
              <li className="nav-item d-flex align-items-center">
                 <span className="navbar-text me-2">
                  {store.user?.name || "Usuario"}
                </span>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  <FiLogOut /> Cerrar sesión
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#loginModal"
                  >
                    Iniciar sesión
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-light btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#signupModal"
                  >
                    Registrarse
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
