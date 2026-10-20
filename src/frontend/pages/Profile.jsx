import { useState, useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

/**
 * Permite al usuario editar su información básica y preferencias.
 * Este placeholder muestra un formulario con nombre y email.
 */
export const Profile = () => {
  const { store, dispatch } = useGlobalReducer();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (store.user) {
      setName(store.user.name || "");
      setEmail(store.user.email || "");
    }
  }, [store.user]);

  const handleSave = async (e) => {
    e.preventDefault();
    // En una implementación real se enviaría al backend.
    console.log("Saving profile", { name, email });
    // Simular mensaje de éxito.
    dispatch({
      type: "SET_MESSAGE",
      payload: { msg: "Perfil actualizado", status: 200 },
    });
    setTimeout(() => dispatch({ type: "SET_MESSAGE", payload: null }), 3000);
  };

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
