import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { toast } from "react-toastify";

// Backend URL helper (consistent with other hooks)
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

/**
 * DailyResult – muestra la interpretación del día actual.
 * Se realiza una petición GET a `/api/entries` para obtener todas las entradas del usuario,
 * se filtra la del día de hoy y se renderiza la información relevante.
 */
export const DailyResult = () => {
  const { dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/entries`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const err = await response.json();
          const msg = err.message || "Error al obtener entradas";
          setError(msg);
          toast.error(msg);
          dispatch({ type: "SET_MESSAGE", payload: { msg: `⚠️ ${msg}`, status: response.status } });
          return;
        }
        const data = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const todaysEntry = data.results.find((e) => e.entry_date === today);
        setEntry(todaysEntry || null);
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
  }, [dispatch]);

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

  if (!entry) {
    return (
      <div className="container mt-4">
        <h2>Resultado del Día</h2>
        <p>No hay una entrada registrada para hoy.</p>
      </div>
    );
  }

  const { sleep_report, habit_log } = entry;

  return (
    <section className="container mt-4">
      <h2>Resultado del Día - {entry.entry_date}</h2>
      <div className="mt-3">
        <h4>Sleep Report</h4>
        <p>{sleep_report?.raw_text || "-"}</p>
      </div>
      <div className="mt-3">
        <h4>Hábitos</h4>
        <ul>
          <li><strong>Actividad física:</strong> {habit_log?.physical_activity || "-"}</li>
          <li><strong>Tipo de cena:</strong> {habit_log?.dinner_type || "-"}</li>
          <li><strong>Ánimo antes de dormir:</strong> {habit_log?.bedtime_mood || "-"}</li>
          <li><strong>Tiempo de pantalla:</strong> {habit_log?.screen_time || "-"}</li>
          <li><strong>Incidentes:</strong> {habit_log?.incidents || "-"}</li>
        </ul>
      </div>
    </section>
  );
};
