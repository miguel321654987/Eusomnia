import { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { closeModalSafely, switchModals } from "../utils.js";

import { apiUrl } from "../api.js";

const REMEMBERED_CREDENTIALS_KEY = "eusomnia_remembered_credentials";

function readRememberedCredentials() {
  try {
    const rememberedCredentials = localStorage.getItem(
      REMEMBERED_CREDENTIALS_KEY,
    );
    if (!rememberedCredentials) {
      return null;
    }

    const parsedCredentials = JSON.parse(rememberedCredentials);
    if (
      typeof parsedCredentials?.email === "string" &&
      typeof parsedCredentials?.password === "string"
    ) {
      return parsedCredentials;
    }

    return null;
  } catch {
    localStorage.removeItem(REMEMBERED_CREDENTIALS_KEY);
    return null;
  }
}

export const Login = ({ loginModal, signupModal }) => {
  const { dispatch } = useGlobalReducer();
  const rememberedCredentials = readRememberedCredentials();
  const [email, setEmail] = useState(rememberedCredentials?.email ?? "");
  const [password, setPassword] = useState(
    rememberedCredentials?.password ?? "",
  );
  const [rememberMe, setRememberMe] = useState(
    Boolean(rememberedCredentials),
  );

  const abrirSignupModal = () => {
    // 🌟 CAMBIO DEFENSIVO DE MODAL (Necesario para local VS Code)
    switchModals(loginModal, signupModal);
    // En lugar de abrir/cerrar con Bootstrap directamente,usamos switchModals
    // En local, Bootstrap a veces no está completamente inicializado en el click
    // El helper intenta primero con Bootstrap y hace fallback a CSS si es necesario.
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch({ type: "SET_MESSAGE", payload: null }); // Limpiamos mensajes previos

    if (!email.trim() || !password.trim()) {
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: "⚠️ Los campos están vacíos", status: 400, variant: "danger" },
      });
      return;
    }
    if (password.length < 6) {
      dispatch({
        type: "SET_MESSAGE",
        payload: {
          msg: "⚠️ La contraseña debe tener al menos 6 caracteres",
          status: 400,
          variant: "danger",
        },
      });
      return;
    }

    try {
      const resp = await fetch(apiUrl("/api/users/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!resp.ok) {
        const datosError = await resp.json();
        const mensajeDelBack = datosError.message || "Error al iniciar sesión";
        dispatch({
          type: "SET_MESSAGE",
          payload: { msg: `⚠️ ${mensajeDelBack}`, status: resp.status, variant: "danger" },
        });
        // El aviso se muestra una sola vez con MessageToast.
        return;
      }

      const data = await resp.json();
      const accessToken = data.access_token;
      if (typeof accessToken !== "string" || !accessToken.trim()) {
        throw new Error("El servidor no devolvió un token válido.");
      }

      localStorage.setItem("jwt-token", accessToken);
      if (rememberMe) {
        localStorage.setItem(
          REMEMBERED_CREDENTIALS_KEY,
          JSON.stringify({ email, password }),
        );
      } else {
        localStorage.removeItem(REMEMBERED_CREDENTIALS_KEY);
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { token: accessToken, user: data.user || null },
      });
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: "¡Sesión iniciada!", status: 200, variant: "success" },
      });
      // 🌟 CIERRE DEFENSIVO DEL MODAL
      // En entorno local, Bootstrap a veces tarda en inicializarse completamente.
      // El helper closeModalSafely intenta cerrar con Bootstrap primero, y si falla,
      // lo hace con CSS para que el modal se cierre sin dejar backdrop abierto.
      setTimeout(() => {
        closeModalSafely(loginModal);
        if (!rememberMe) {
          setEmail("");
          setPassword("");
        }
      }, 300);
    } catch (error) {
      const message = error.message || "Error de conexión";
      dispatch({
        type: "SET_MESSAGE",
        payload: { msg: message, status: 500, variant: "danger" },
      });
      // El aviso se muestra una sola vez con MessageToast.
    }
  };

  return (
    <div
      className="modal fade"
      id={loginModal}
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <form
          className="modal-content"
          onSubmit={handleLogin}
          autoComplete="on"
        >
          <div className="modal-header">
            <h2 className="modal-title fs-5">Login</h2>
            {/* 🔥 Eliminamos data-bs-dismiss="modal" y dejamos que nuestro helper */}
            {/* gestione el cierre de forma segura cuando el usuario pulsa la "X" */}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => {
                closeModalSafely(loginModal);
                dispatch({ type: "SET_MESSAGE", payload: null });
                if (!rememberMe) {
                  setEmail("");
                  setPassword("");
                }
              }}
            ></button>
          </div>
          <div className="modal-body">
            <input
              className="form-control mb-2"
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="form-control mb-2"
              type="password"
              name="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="form-check mt-2 text-start">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                data-testid="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="rememberMe">
                Recordar usuario y contraseña
              </label>
            </div>
          </div>
          <div className="modal-footer d-flex flex-column gap-2">
            <button type="submit" className="btn btn-success w-100">
              Entrar
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={abrirSignupModal}
            >
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
