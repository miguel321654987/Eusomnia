import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="w-100 py-4 mt-auto eusomnia-footer position-relative" style={{ zIndex: 10 }}>
      <div className="container max-w-7xl px-3 px-lg-4">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
          <div className="font-body small text-secondary">
            © 2026 Eusomnia - TechLab 4Geeks Academy
          </div>

          <div className="d-flex align-items-center gap-4">
            <Link
              to="/contacto"
              className="font-label small text-secondary text-decoration-none hover-cyan"
            >
              Contacto
            </Link>
            <Link
              to="/privacidad"
              className="font-label small text-secondary text-decoration-none hover-cyan"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
