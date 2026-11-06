import { closeModalSafely } from "../utils.js";
import { apiUrl } from "../api.js";

export const getActions = (store, dispatch) => {
  // 🔥 Helper interno para incluir el Token JWT de forma automática y segura
  const getAuthHeaders = () => {
    const token = localStorage.getItem("jwt-token");
    // Si no hay token, devolvemos solo el Content-Type básico
    if (!token) {
      return {
        "Content-Type": "application/json",
      };
    }
    // Si el token existe, devolvemos el objeto completo con la autorización
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  return {
    handleLogout: (modalId = null, reason = "manual") => {
      // 1. Si hay un ID, cerramos ese modal específico de forma segura.
      if (modalId) {
        closeModalSafely(modalId);
      } else {
        // Si no hay un modal concreto, limpiamos los residuos del body de forma segura
        const backdrops = document.querySelectorAll(".modal-backdrop");
        backdrops.forEach((backdrop) => backdrop.remove());
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
      }

      // 2. Limpieza segura de los datos de sesión
      localStorage.removeItem("jwt-token");
      dispatch({ type: "LOGOUT" });

      // Duración estándar para cualquier aviso controlado en la UI (3000 ms).
      const TOAST_DURATION = 3000;

      if (reason === "expired") {
        // Sesión inválida/expirada en el servidor: aviso de advertencia controlado.
        dispatch({
          type: "SET_MESSAGE",
          payload: {
            msg: "La sesión ha caducado. Vuelve a iniciar sesión para continuar.",
            status: 401,
            variant: "warning",
          },
        });

        setTimeout(() => {
          dispatch({ type: "SET_MESSAGE", payload: null });
        }, TOAST_DURATION);
      } else {
        // Cierre manual: el reducer ya deja el aviso verde de éxito.
        // Se limpia con el mismo timeout estándar.
        setTimeout(() => {
          dispatch({ type: "SET_MESSAGE", payload: null });
        }, TOAST_DURATION);
      }
    },

    //  ❤️ GESTIÓN DE FAVORITOS
    cargarFavoritosBackend: async (userId) => {
      // antes de pedir la lista del nuevo usuario, limpiamos el estado local
      dispatch({ type: "CLEAR_FAVORITES" });

      // 1. Activa el loading exclusivo de favoritos
      dispatch({ type: "FAVORITES_LOADING" });

      try {
        const response = await fetch(
          apiUrl(`/api/favorites/user/${userId}/favorites`),
          { headers: getAuthHeaders() },
        );
        if (!response.ok)
          throw new Error("Error al obtener los favoritos del servidor");

        const data = await response.json();

        // 2. Guarda la lista y apaga el loading de favoritos
        dispatch({
          type: "SET_FAVORITES",
          payload: data.results || data,
        });
      } catch (error) {
        console.error("Error cargando favoritos del backend:", error);
        // 3. Registra el error exclusivo de favoritos
        dispatch({
          type: "FAVORITES_ERROR",
          payload: error.message,
        });
      }
    },

    añadirFavoritoBackend: async (userId, pokemon) => {
      try {
        const idSeguro = encodeURIComponent(String(pokemon.id).trim());

        const response = await fetch(
          apiUrl(`/api/favorites/user/${userId}/favorites/${idSeguro}`),
          {
            method: "POST",
            headers: { ...getAuthHeaders() }, // ✨ Escalabilidad: podrían agregarse otros headers
            body: JSON.stringify(pokemon), // 🌟 ¡Aquí pasamos la info del store al back!
          },
        );

        if (response.status === 409) {
          dispatch({
            type: "SET_MESSAGE",
            payload: { msg: "Esta carta ya está en tus favoritos.", status: 409, variant: "info" },
          });
          return;
        }

        if (!response.ok) throw new Error("No se pudo añadir el favorito");

        // Todo bien: Actualizamos el Navbar e interfaz en tiempo real
        dispatch({ type: "ADD_FAVORITE_STORE", payload: pokemon });
      } catch (error) {
        console.error(error);
      }
    },

    eliminarFavoritoBackend: async (userId, pokemonId) => {
      try {
        // Codificamos el ID para que coincida perfectamente con el POST
        const idSeguro = encodeURIComponent(String(pokemonId).trim());

        const response = await fetch(
          apiUrl(`/api/favorites/user/${userId}/favorites/${idSeguro}`),
          {
            method: "DELETE",
            headers: { ...getAuthHeaders() },
          },
        );
        if (!response.ok)
          throw new Error("No se pudo eliminar el favorito del servidor");

        // Todo bien: removemos del estado local filtrando por ID
        dispatch({ type: "REMOVE_FAVORITE_STORE", payload: pokemonId });

        dispatch({
          type: "SET_MESSAGE",
          payload: { msg: "La carta se ha eliminado de tus favoritos.", status: 200, variant: "success" },
        });
      } catch (error) {
        console.error("Error al eliminar favorito:", error);
        dispatch({ type: "FAVORITES_ERROR", payload: error.message });
      }
    },
  };
};
