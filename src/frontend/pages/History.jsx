import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

/**
 * Lista los registros diarios del usuario y permite ver el detalle de cada día.
 * Esta versión simplificada muestra datos simulados.
 */
export const History = () => {
  useGlobalReducer();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    // En una implementación real se llamaría al backend para obtener el historial.
    // Por ahora usamos datos de ejemplo.
    const mock = [
      { id: 1, date: "2026-10-10", summary: "Buen día, 7h sueño" },
      { id: 2, date: "2026-10-11", summary: "Día con estrés" },
    ];
    setEntries(mock);
  }, []);

  return (
    <div className="container mt-4">
      <h2>Historial</h2>
      <ul className="list-group">
        {entries.map((e) => (
          <li
            key={e.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span>{e.date}</span>
            <span className="badge bg-primary rounded-pill">{e.summary}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
