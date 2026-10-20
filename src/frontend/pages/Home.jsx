// src/frontend/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

/**
 * Home – página principal que muestra un hero, estadísticas resumidas y una lista
 * de los últimos registros obtenidos del backend.
 *
 * Se utilizan las variables de tema definidas en `Index.css` y clases de Bootstrap
 * para garantizar consistencia visual y comportamiento responsivo.
 */
export const Home = () => {
  // Estado local para los logs recientes (placeholder mientras la API real está
  // en desarrollo).
  const [recentLogs, setRecentLogs] = useState([]);

  // Simular carga de datos; en producción reemplazar la URL por el endpoint
  // correcto y manejar errores apropiadamente.
  useEffect(() => {
    const fetchLogs = async () => {
      // Sólo intentamos la petición si `fetch` está disponible (e.g., en el navegador).
      if (typeof fetch !== "function") {
        setRecentLogs([
          { id: 1, title: "Sample Log 1", date: "2026-10-01" },
          { id: 2, title: "Sample Log 2", date: "2026-10-02" },
        ]);
        return;
      }
      try {
        const response = await fetch("/api/recent-logs");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setRecentLogs(data.logs ?? []);
      } catch (error) {
        // Fallback estático para desarrollo local.
        console.error("Failed to fetch recent logs:", error);
        setRecentLogs([
          { id: 1, title: "Sample Log 1", date: "2026-10-01" },
          { id: 2, title: "Sample Log 2", date: "2026-10-02" },
        ]);
      }
    };
    fetchLogs();
  }, []);

  return (
    <main className="home-page text-white container-fluid p-0">
      {/* Hero Section */}
      <section
        className="hero d-flex flex-column justify-content-center align-items-center text-center py-5"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-surface))",
        }}
      >
        <h1 className="display-4 fw-bold mb-3">Eusomnia</h1>
        <p className="lead mb-4">
          Monitorea y mejora tu sueño con inteligencia artificial.
        </p>
        <Link to="/daily-log" className="btn btn-primary btn-lg">
          Comenzar Registro Diario
        </Link>
      </section>

      {/* Stats Cards */}
      <section className="stats py-5 bg-dark">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div
                className="card h-100 text-center"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div className="card-body">
                  <h5 className="card-title">Entradas</h5>
                  <p className="card-text display-6">{recentLogs.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card h-100 text-center"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div className="card-body">
                  <h5 className="card-title">Horas de Sueño</h5>
                  <p className="card-text display-6">7.8 h</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card h-100 text-center"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div className="card-body">
                  <h5 className="card-title">Calidad</h5>
                  <p className="card-text display-6">Alta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Logs List */}
      <section className="recent-logs py-5">
        <div className="container">
          <h2 className="h3 mb-4 text-center">Últimos Registros</h2>
          <ul className="list-group">
            {recentLogs.map((log) => (
              <li
                key={log.id}
                className="list-group-item d-flex justify-content-between align-items-center"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span>{log.title}</span>
                <small className="text-muted">{log.date}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
