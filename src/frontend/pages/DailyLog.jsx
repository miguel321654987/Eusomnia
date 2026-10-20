import { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

/**
 * Página de registro diario donde el usuario ingresa sus hábitos del día y datos de sueño.
 * Actualmente es un placeholder funcional con un simple formulario.
 */
export const DailyLog = () => {
  // eslint-disable-next-line no-unused-vars
  const { store, dispatch } = useGlobalReducer();
  const [habits, setHabits] = useState("");
  const [sleepHours, setSleepHours] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Aquí se enviaría la información al backend; por ahora solo muestra toast.
    console.log({ habits, sleepHours });
    // Resetear formulario
    setHabits("");
    setSleepHours("");
  };

  return (
    <div className="container mt-4">
      <h2>Registro Diario</h2>
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="mb-3">
          <label className="form-label">Hábitos del día</label>
          <textarea
            className="form-control"
            rows={4}
            value={habits}
            onChange={(e) => setHabits(e.target.value)}
            placeholder="Describe tus hábitos..."
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Horas de sueño</label>
          <input
            type="number"
            className="form-control"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="Ej. 7"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
      </form>
    </div>
  );
};
