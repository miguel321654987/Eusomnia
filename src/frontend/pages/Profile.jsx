import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

/**
 * Perfil del usuario – permite visualizar y editar la información básica.
 * Se carga mediante una petición GET a `/profile` y se actualiza con PUT a
 * la misma ruta. Maneja estados de carga, errores y muestra feedback al
 * usuario usando react‑toastify y el store global.
 */
export const Profile = () => {
  const { dispatch } = useGlobalReducer();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
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

  // Carga inicial del perfil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/profile`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const err = await response.json();
          const msg = err.message || "Error al cargar el perfil";
          setError(msg);
          toast.error(msg);
          dispatch({
            type: "SET_MESSAGE",
            payload: { msg: `⚠️ ${msg}`, status: response.status },
          });
          return;
        }
        const data = await response.json();
        const user = data.user || data;
        setName(user.name || "");
        setEmail(user.email || "");
      } catch (err) {
        console.error(err);
        setError(err.message);
        toast.error("Error de conexión");
        dispatch({
          type: "SET_MESSAGE",
          payload: { msg: `⚠️ ${err.message}`, status: 500 },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/profile`, {
        method: "PUT",
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ name, email }),
      });
      if (!response.ok) {
        const err = await response.json();
        const msg = err.message || "Error al actualizar el perfil";
        toast.error(msg);
        dispatch({
          type: "SET_MESSAGE",
          payload: { msg: `⚠️ ${msg}`, status: response.status },
        });
        return;
      }
      toast.success("Perfil actualizado");
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: "Perfil actualizado", status: 200 },
      });
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: `⚠️ ${err.message}`, status: 500 },
      });
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
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
      <h2>Perfil</h2>
      <form onSubmit={handleSave} className="mt-3">
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};
