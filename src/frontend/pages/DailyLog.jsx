import { useState } from "react";
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
 * DailyLog – página de registro diario.
 * Utiliza el tema global definido en `Index.css` mediante variables CSS y emplea
 * la cuadrícula de Bootstrap para que el formulario sea responsivo y visualmente
 * coherente con el resto de la aplicación.
 */
export const DailyLog = () => {
  // eslint-disable-next-line no-unused-vars
  const { store, dispatch } = useGlobalReducer();
  const [habits, setHabits] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  // Estado de errores para validación en tiempo real
  const [errors, setErrors] = useState({ habits: "", sleepHours: "" });

  const validate = (field, value) => {
    let message = "";
    if (field === "habits") {
      if (!value.trim()) message = "Los hábitos son obligatorios.";
    }
    if (field === "sleepHours") {
      if (!value) {
        message = "Introduce las horas de sueño.";
      } else {
        const num = Number(value);
        if (Number.isNaN(num) || num < 0 || num > 24) {
          message = "Horas de sueño deben estar entre 0 y 24.";
        }
      }
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Re‑validar antes de enviar por si el botón se activó de alguna forma.
    validate("habits", habits);
    validate("sleepHours", sleepHours);
    if (errors.habits || errors.sleepHours) return;

    // Construir payload conforme al endpoint /api/entries
    const payload = {
      // Se envía la fecha de hoy en formato ISO (YYYY‑MM‑DD)
      date: new Date().toISOString().split('T')[0],
      sleep: {
        // El backend requiere raw_text; usamos las horas como descripción simple.
        raw_text: `${sleepHours} horas de sueño`,
      },
      habits: {
        // Solo capturamos el texto libre de hábitos; el backend almacena bajo
        // physical_activity por ejemplo, pero enviamos como texto genérico.
        physical_activity: habits,
      },
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/entries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        const mensaje = errData.message || "Error al guardar la entrada";
        dispatch({ type: "SET_MESSAGE", payload: { msg: `⚠️ ${mensaje}`, status: response.status } });
        toast.error(mensaje);
        return;
      }

      const data = await response.json();
      dispatch({ type: "SET_MESSAGE", payload: { msg: "✅ Entrada guardada", status: 201 } });
      toast.success("Entrada guardada exitosamente");
      // Opcional: podrías actualizar el store con la nueva entrada aquí.
    } catch (err) {
      console.error(err);
      dispatch({ type: "SET_MESSAGE", payload: { msg: `⚠️ ${err.message}`, status: 500 } });
      toast.error("Error de conexión");
    }

    // Resetear campos y errores tras la operación.
    setHabits("");
    setSleepHours("");
    setErrors({ habits: "", sleepHours: "" });
  };

  return (
    // Contenedor principal con fondo de superficie y texto primario.
    <section
      className="dailylog py-5 bg-dark text-white"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div className="container">
        {/* Título central */}
        <h2 className="display-5 fw-bold text-center mb-4" style={{ color: "var(--color-primary)" }}>
          Registro Diario
        </h2>
        {/* Formulario centrado en columna mediana */}
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <form onSubmit={handleSubmit} className="mt-3">
              <div className="mb-3">
                <label className="form-label" style={{ color: "var(--color-text-primary)" }}>
                  Hábitos del día
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={habits}
                  onChange={(e) => {
                    setHabits(e.target.value);
                    validate("habits", e.target.value);
                  }}
                  placeholder="Describe tus hábitos..."
                  style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)" }}
                />
                {errors.habits && (
                  <div className="form-text text-danger" role="alert">
                    {errors.habits}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ color: "var(--color-text-primary)" }}>
                  Horas de sueño
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={sleepHours}
                  onChange={(e) => {
                    setSleepHours(e.target.value);
                    validate("sleepHours", e.target.value);
                  }}
                  placeholder="Ej. 7"
                  style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)" }}
                />
                {errors.sleepHours && (
                  <div className="form-text text-danger" role="alert">
                    {errors.sleepHours}
                  </div>
                )}
              </div>
              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={!!errors.habits || !!errors.sleepHours || !habits || !sleepHours}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
