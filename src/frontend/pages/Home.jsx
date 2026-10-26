// src/frontend/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

/**
 * Home – página principal que muestra un hero, estadísticas resumidas y una lista
 * de los últimos registros obtenidos del backend.
 *
 * Se utilizan las variables de tema definidas en `Index.css` y clases de Bootstrap
 * para garantizar consistencia visual y comportamiento responsivo.
 */
const SLEEP_QUALITY_LABELS = {
  muy_baja: "Muy baja (tronco)",
  baja: "Baja",
  intermedia: "Intermedia",
  alta: "Alta",
  tronco: "Tronco duro",
};

const FALLBACK_LOGS = [
  {
    id: "fallback-1",
    title: "Daily entry",
    date: null,
    sleep_hours: null,
    sleep_quality: null,
  },
  {
    id: "fallback-2",
    title: "Daily entry",
    date: null,
    sleep_hours: null,
    sleep_quality: null,
  },
];

export const Home = () => {
  const { store } = useGlobalReducer();
  // Estado local para los logs recientes (placeholder mientras la API real está
  // en desarrollo).
  const [recentLogs, setRecentLogs] = useState([]);

  // Simular carga de datos; en producción reemplazar la URL por el endpoint
  // correcto y manejar errores apropiadamente.
  useEffect(() => {
    const fetchLogs = async () => {
      // Si el usuario no ha iniciado sesión (sin token), no llamamos al endpoint protegido
      if (!store.token) {
        setRecentLogs(FALLBACK_LOGS);
        return;
      }

      try {
        const response = await fetch("/api/recent-logs", {
          headers: {
            Authorization: `Bearer ${store.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error en el servidor: ${response.status}`);
        }

        const data = await response.json();
        setRecentLogs(data.logs ?? []);
      } catch (error) {
        console.error("Failed to fetch recent logs:", error);
        setRecentLogs(FALLBACK_LOGS);
      }
    };

    fetchLogs();
  }, [store.token]);

  return (
    <main className="home-page text-white container-fluid p-0">
      <section className="hero d-flex flex-column justify-content-center align-items-center text-center py-5">
        <h1 className="display-4 fw-bold mb-3">Eusomnia</h1>
        <p className="lead mb-4">
          Monitorea y mejora tu sueño con inteligencia artificial.
        </p>
        <Link to="/daily-log" className="btn btn-primary btn-lg">
          Comenzar Registro Diario
        </Link>
      </section>
      {/*
    

      {/* Recent Logs List */}
      <section className="recent-logs py-5 text-white">
        <div className="container">
          <h2 className="h3 mb-4 text-center">Últimos Registros</h2>
          {recentLogs.length === 0 ? (
            <p className="text-center text-white-50">
              {store.token
                ? "No hay registros recientes."
                : "Inicia sesión para ver tus registros diarios."}
            </p>
          ) : (
            <ul className="list-group text-white">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="list-group-item d-flex justify-content-between align-items-center text-white-50"
                >
                  <div className="d-flex flex-column">
                    <span>{log.title}</span>
                    <small className="text-white-50">
                      Sueño:{" "}
                      {log.sleep_hours != null ? `${log.sleep_hours} h` : "—"} ·
                      Calidad:{" "}
                      {SLEEP_QUALITY_LABELS[log.sleep_quality] ||
                        (log.sleep_quality != null ? log.sleep_quality : "—")}
                    </small>
                  </div>
                  <small className="text-white-50">
                    {log.date != null ? log.date : "—"}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};
