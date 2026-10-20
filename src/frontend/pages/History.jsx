import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

/**
 * History – muestra el historial de entradas diarias del usuario.
 * Se recuperan todas las entradas mediante una petición GET a `/api/entries`.
 * Cada registro muestra la fecha y un resumen breve.
 */
export const History = () => {
  const { dispatch } = useGlobalReducer();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utilidades para la comunicación con el backend (coherentes con DailyLog/DailyResult)
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const getAuthHeaders = () => {
    const token = localStorage.getItem("jwt-token");
    if (!token) {
      return { "Content-Type": "application/json" };
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/entries`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const err = await response.json();
          const msg = err.message || "Error al obtener el historial";
          setError(msg);
          toast.error(msg);
          dispatch({ type: "SET_MESSAGE", payload: { msg: `⚠️ ${msg}`, status: response.status } });
          return;
        }
        const data = await response.json();
        setEntries(data.results || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
        toast.error("Error de conexión");
        dispatch({ type: "SET_MESSAGE", payload: { msg: `⚠️ ${err.message}`, status: 500 } });
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single run
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <h2 className="text-danger">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Historial</h2>
      {entries.length === 0 ? (
        <p>No hay entradas registradas.</p>
      ) : (
        <ul className="list-group">
          {entries.map((e) => (
            <li
              key={e.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{e.entry_date?.split('T')[0] || e.date}</span>
              <span className="badge bg-primary rounded-pill">
                {e.summary || e.sleep_report?.raw_text?.slice(0, 30) || "-"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
