import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { apiUrl } from "../api.js";
import { PROFILE_REMINDERS } from "../profileReminders.js";
import "./Perfil.css";

const TABS = [
  { id: "personal", label: "Datos personales", icon: "person" },
  { id: "ai", label: "Motor de IA", icon: "auto_awesome" },
  { id: "routines", label: "Rutinas", icon: "bedtime" },
  { id: "data", label: "Datos y privacidad", icon: "shield_person" },
];

const CHRONOTYPES = [
  { value: "", label: "Sin especificar" },
  { value: "wolf", label: "Lobo · nocturno" },
  { value: "lion", label: "León · matutino" },
  { value: "bear", label: "Oso · intermedio" },
  { value: "dolphin", label: "Delfín · sueño ligero" },
];

const TIMEZONES = [
  "UTC",
  "Europe/Madrid",
  "America/Mexico_City",
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
];

const DEFAULT_PREFERENCES = {
  timezone: "UTC",
  ai_provider: "openrouter",
  selected_model: "nvidia/nemotron-3.5-super-vl:free",
  has_custom_key: false,
  interpretation_framework: "jungian",
  report_depth: "standard",
  include_nutrition_in_analysis: true,
  morning_reminder_enabled: true,
  morning_reminder_time: "07:30",
  caffeine_reminder_enabled: true,
  caffeine_reminder_time: "18:00",
  winddown_reminder_enabled: true,
  winddown_reminder_time: "22:30",
};

async function requestApi(path, token, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    if (response.ok) {
      throw new Error("El servidor devolvió una respuesta no válida.");
    }
  }
  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud.");
  }
  return data;
}

export const Perfil = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const token = store.token || localStorage.getItem("jwt-token");
  const [activeTab, setActiveTab] = useState("personal");
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let isActive = true;
    const loadProfile = async () => {
      await Promise.resolve();
      if (!isActive) return;
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await requestApi("/api/users/profile", token);
        if (!isActive) return;
        setProfile(data.user);
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      } catch (error) {
        if (isActive) setLoadError(error.message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => {
      isActive = false;
    };
  }, [token]);

  const displayName = useMemo(
    () => [profile?.name, profile?.last_name].filter(Boolean).join(" "),
    [profile],
  );

  const updatePreference = (field, value) => {
    setPreferences((current) => ({ ...current, [field]: value }));
    setSaveMessage("");
  };

  const saveChanges = async (values) => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const data = await requestApi("/api/users/profile", token, {
        method: "PUT",
        body: values,
      });
      setProfile(data.user);
      setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      dispatch({ type: "LOGIN_SUCCESS", payload: { token, user: data.user } });
      window.dispatchEvent(new Event("eusomnia:profile-updated"));
      setApiKeyInput("");
      setClearApiKey(false);
      setSaveMessage("Cambios guardados correctamente.");
      toast.success("Cambios guardados correctamente.");
    } catch (error) {
      setSaveMessage(error.message);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePersonalSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const birthYear = formData.get("birth_year");
    void saveChanges({
      name: formData.get("name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      birth_year: birthYear ? Number(birthYear) : null,
      chronotype: formData.get("chronotype") || null,
      timezone: preferences.timezone,
    });
  };

  const handleAiSubmit = (event) => {
    event.preventDefault();
    const values = {
      interpretation_framework: preferences.interpretation_framework,
      report_depth: preferences.report_depth,
      include_nutrition_in_analysis:
        preferences.include_nutrition_in_analysis,
      selected_model: preferences.selected_model,
    };
    if (clearApiKey) values.custom_api_key = null;
    else if (apiKeyInput.trim()) values.custom_api_key = apiKeyInput.trim();
    void saveChanges(values);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setSaveMessage("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setIsChangingPassword(true);
    setSaveMessage("");
    try {
      await requestApi("/api/users/profile/password", token, {
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaveMessage("Contraseña actualizada correctamente.");
      toast.success("Contraseña actualizada correctamente.");
    } catch (error) {
      setSaveMessage(error.message);
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const downloadExport = async (format) => {
    if (Boolean(startDate) !== Boolean(endDate)) {
      setSaveMessage("Selecciona las dos fechas o deja ambas vacías.");
      return;
    }
    const query = new URLSearchParams();
    if (startDate && endDate) {
      query.set("start_date", startDate);
      query.set("end_date", endDate);
    }
    setIsExporting(true);
    setSaveMessage("");
    try {
      const response = await fetch(
        apiUrl(`/api/exports/${format}?${query.toString()}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        let error = {};
        try {
          error = await response.json();
        } catch {
          error = {};
        }
        throw new Error(error.message || "No se pudo generar la exportación.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eusomnia-${format}${startDate ? `-${startDate}-${endDate}` : ""}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportación descargada.");
    } catch (error) {
      setSaveMessage(error.message);
      toast.error(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (deleteConfirmation !== "ELIMINAR") {
      setSaveMessage("Escribe ELIMINAR para confirmar la acción.");
      return;
    }
    setIsDeleting(true);
    setSaveMessage("");
    try {
      await requestApi(`/api/users/${profile.id}`, token, {
        method: "DELETE",
        body: { current_password: deletePassword },
      });
      localStorage.removeItem("jwt-token");
      dispatch({ type: "LOGOUT" });
      navigate("/");
      toast.success("La cuenta y sus registros se han eliminado.");
    } catch (error) {
      setSaveMessage(error.message);
      toast.error(error.message);
      setIsDeleting(false);
    }
  };

  if (!token) {
    return (
      <main className="eusomnia-canvas profile-page py-5">
        <div className="container profile-container">
          <div className="eusomnia-card p-4 text-center">
            <h1 className="font-headline h4 text-light">Tu perfil</h1>
            <p className="text-secondary">
              Inicia sesión para consultar y actualizar tu perfil.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#loginModal"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="eusomnia-canvas profile-page py-4 py-lg-5">
      <div className="glow-orb-primary" />
      <div className="container profile-container position-relative">
        <header className="profile-header mb-4">
          <span className="profile-eyebrow">
            <span className="pulse-dot-cyan" />
            Centro de configuración
          </span>
          <h1 className="profile-title">Tu perfil</h1>
          <p className="profile-subtitle">
            {displayName
              ? `Hola, ${displayName}. Ajusta tus datos y preferencias de descanso.`
              : "Gestiona tus datos personales y preferencias de descanso."}
          </p>
        </header>

        {loadError && (
          <div className="alert alert-danger" role="alert">
            {loadError}
          </div>
        )}
        {saveMessage && (
          <div className="alert alert-info profile-notice" role="status">
            {saveMessage}
          </div>
        )}

        {isLoading ? (
          <div className="eusomnia-card p-4 text-center" role="status">
            Cargando tu perfil…
          </div>
        ) : profile ? (
          <>
            <nav className="profile-tabs" aria-label="Secciones del perfil">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`profile-tab${activeTab === tab.id ? " active" : ""}`}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeTab === "personal" && (
              <section className="profile-panel" aria-labelledby="personal-title">
                <div className="profile-section-heading">
                  <span className="profile-icon">01</span>
                  <div>
                    <h2 id="personal-title">Identidad y datos personales</h2>
                    <p>
                      Mantén actualizada la información asociada a tu cuenta.
                    </p>
                  </div>
                </div>
                <form onSubmit={handlePersonalSubmit}>
                  <div className="profile-form-grid">
                    <label className="profile-field">
                      <span>Nombre</span>
                      <input
                        className="form-control"
                        name="name"
                        type="text"
                        maxLength="80"
                        defaultValue={profile.name || ""}
                        required
                      />
                    </label>
                    <label className="profile-field">
                      <span>Apellidos</span>
                      <input
                        className="form-control"
                        name="last_name"
                        type="text"
                        maxLength="80"
                        defaultValue={profile.last_name || ""}
                        required
                      />
                    </label>
                    <label className="profile-field">
                      <span>Correo electrónico</span>
                      <input
                        className="form-control"
                        name="email"
                        type="email"
                        maxLength="120"
                        defaultValue={profile.email || ""}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label className="profile-field">
                      <span>Año de nacimiento</span>
                      <input
                        className="form-control"
                        name="birth_year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        defaultValue={profile.birth_year || ""}
                      />
                    </label>
                    <label className="profile-field">
                      <span>Cronotipo</span>
                      <select
                        className="form-select"
                        name="chronotype"
                        defaultValue={profile.chronotype || ""}
                      >
                        {CHRONOTYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="profile-field">
                      <span>Zona horaria (IANA)</span>
                      <input
                        className="form-control"
                        type="text"
                        list="profile-timezones"
                        value={preferences.timezone}
                        onChange={(event) =>
                          updatePreference("timezone", event.target.value)
                        }
                        required
                      />
                      <datalist id="profile-timezones">
                        {TIMEZONES.map((timezone) => (
                          <option key={timezone} value={timezone}>
                            {timezone}
                          </option>
                        ))}
                      </datalist>
                    </label>
                  </div>
                  <div className="profile-form-actions">
                    <button className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? "Guardando…" : "Guardar datos"}
                    </button>
                  </div>
                </form>

                <div className="profile-divider" />
                <div className="profile-section-heading">
                  <span className="profile-icon">02</span>
                  <div>
                    <h2>Cambiar contraseña</h2>
                    <p>
                      Confirma tu contraseña actual para establecer una nueva.
                    </p>
                  </div>
                </div>
                <form
                  className="profile-form-grid"
                  onSubmit={handlePasswordSubmit}
                >
                  <label className="profile-field">
                    <span>Contraseña actual</span>
                    <input
                      className="form-control"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      required
                    />
                  </label>
                  <label className="profile-field">
                    <span>Nueva contraseña</span>
                    <input
                      className="form-control"
                      type="password"
                      autoComplete="new-password"
                      minLength="8"
                      maxLength="128"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                  </label>
                  <label className="profile-field">
                    <span>Confirmar nueva contraseña</span>
                    <input
                      className="form-control"
                      type="password"
                      autoComplete="new-password"
                      minLength="8"
                      maxLength="128"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                    />
                  </label>
                  <div className="profile-form-actions">
                    <button
                      className="btn btn-outline-primary"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword
                        ? "Actualizando…"
                        : "Actualizar contraseña"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "ai" && (
              <section className="profile-panel" aria-labelledby="ai-title">
                <div className="profile-section-heading">
                  <span className="profile-icon">02</span>
                  <div>
                    <h2 id="ai-title">Preferencias del análisis</h2>
                    <p>
                      Elige cómo se presenta la reflexión sobre tus registros.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleAiSubmit}>
                  <fieldset className="profile-choice-group">
                    <legend>Marco interpretativo</legend>
                    <div className="profile-choice-grid">
                      {[
                        {
                          value: "jungian",
                          title: "Junguiano",
                          description:
                            "Explora símbolos y arquetipos como posibilidades reflexivas.",
                        },
                        {
                          value: "neuroscientific",
                          title: "Neurocientífico",
                          description:
                            "Prioriza sueño, memoria, emociones y hábitos registrados.",
                        },
                        {
                          value: "holistic",
                          title: "Holístico",
                          description:
                            "Relaciona hábitos y emociones sin presentar especulación como hecho.",
                        },
                      ].map((choice) => (
                        <label
                          className={`profile-choice-card${preferences.interpretation_framework === choice.value ? " selected" : ""}`}
                          key={choice.value}
                        >
                          <input
                            type="radio"
                            name="interpretation_framework"
                            value={choice.value}
                            checked={
                              preferences.interpretation_framework ===
                              choice.value
                            }
                            onChange={(event) =>
                              updatePreference(
                                "interpretation_framework",
                                event.target.value,
                              )
                            }
                          />
                          <span className="profile-choice-title">
                            {choice.title}
                          </span>
                          <span className="profile-choice-description">
                            {choice.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="profile-field profile-depth-field">
                    <span>Profundidad del informe</span>
                    <select
                      className="form-select"
                      value={preferences.report_depth}
                      onChange={(event) =>
                        updatePreference("report_depth", event.target.value)
                      }
                    >
                      <option value="concise">Conciso</option>
                      <option value="standard">Estándar</option>
                      <option value="clinical">Detallado</option>
                    </select>
                  </label>

                  <label className="profile-toggle">
                    <span className="profile-toggle-copy">
                      <strong>Incluir alimentación registrada</strong>
                      <small>
                        Permite al análisis considerar los datos de nutrición
                        que ya has guardado.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.include_nutrition_in_analysis}
                      onChange={(event) =>
                        updatePreference(
                          "include_nutrition_in_analysis",
                          event.target.checked,
                        )
                      }
                    />
                  </label>

                  <div className="profile-provider-card">
                    <div>
                      <span className="profile-provider-label">
                        Proveedor conectado
                      </span>
                      <strong>OpenRouter</strong>
                      <small>
                        {preferences.has_custom_key
                          ? "Hay una clave personalizada guardada."
                          : "Se utiliza la configuración del servidor."}
                      </small>
                    </div>
                    <label className="profile-field profile-model-field">
                      <span>Modelo de análisis</span>
                      <select
                        className="form-select"
                        value={preferences.selected_model}
                        onChange={(event) =>
                          updatePreference(
                            "selected_model",
                            event.target.value,
                          )
                        }
                      >
                        {![
                          "nvidia/nemotron-3.5-super-vl:free",
                          "openrouter/free",
                        ].includes(preferences.selected_model) && (
                          <option value={preferences.selected_model}>
                            {preferences.selected_model}
                          </option>
                        )}
                        <option value="nvidia/nemotron-3.5-super-vl:free">
                          Nemotron 3.5 Super VL (free)
                        </option>
                        <option value="openrouter/free">
                          OpenRouter Free
                        </option>
                      </select>
                    </label>
                    <label className="profile-field">
                      <span>
                        {preferences.has_custom_key
                          ? "Sustituir clave API (opcional)"
                          : "Clave API personalizada (opcional)"}
                      </span>
                      <input
                        className="form-control"
                        type="password"
                        autoComplete="new-password"
                        maxLength="255"
                        value={apiKeyInput}
                        onChange={(event) =>
                          setApiKeyInput(event.target.value)
                        }
                        placeholder="No se mostrará después de guardarla"
                      />
                    </label>
                    {preferences.has_custom_key && (
                      <label className="profile-clear-key">
                        <input
                          type="checkbox"
                          checked={clearApiKey}
                          onChange={(event) =>
                            setClearApiKey(event.target.checked)
                          }
                        />
                        Eliminar la clave guardada
                      </label>
                    )}
                  </div>

                  <p className="profile-disclaimer">
                    El análisis es una herramienta de reflexión y no ofrece
                    diagnósticos ni sustituye la valoración de un profesional.
                  </p>
                  <div className="profile-form-actions">
                    <button className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? "Guardando…" : "Guardar preferencias"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "routines" && (
              <section
                className="profile-panel"
                aria-labelledby="routines-title"
              >
                <div className="profile-section-heading">
                  <span className="profile-icon">03</span>
                  <div>
                    <h2 id="routines-title">Rutinas de descanso</h2>
                    <p>
                      Configura avisos locales según tu zona horaria (
                      {preferences.timezone}).
                    </p>
                  </div>
                </div>

                <div className="profile-routine-list">
                  {PROFILE_REMINDERS.map((reminder) => (
                    <div
                      className="profile-routine-row"
                      key={reminder.enabled}
                    >
                      <label className="profile-toggle">
                        <span className="profile-toggle-copy">
                          <strong>{reminder.title}</strong>
                          <small>{reminder.message}</small>
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences[reminder.enabled]}
                          onChange={(event) =>
                            updatePreference(
                              reminder.enabled,
                              event.target.checked,
                            )
                          }
                        />
                      </label>
                      <label className="profile-time-field">
                        <span>Hora local</span>
                        <input
                          className="form-control"
                          type="time"
                          value={preferences[reminder.time]}
                          disabled={!preferences[reminder.enabled]}
                          onChange={(event) =>
                            updatePreference(
                              reminder.time,
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="profile-inline-notice" role="note">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    info
                  </span>
                  <p>
                    Los avisos aparecen dentro de Eusomnia mientras esta página
                    esté abierta. No se envían notificaciones push ni correos y
                    no se entregan con la aplicación cerrada.
                  </p>
                </div>
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isSaving}
                    onClick={() =>
                      void saveChanges({
                        timezone: preferences.timezone,
                        morning_reminder_enabled:
                          preferences.morning_reminder_enabled,
                        morning_reminder_time:
                          preferences.morning_reminder_time,
                        caffeine_reminder_enabled:
                          preferences.caffeine_reminder_enabled,
                        caffeine_reminder_time:
                          preferences.caffeine_reminder_time,
                        winddown_reminder_enabled:
                          preferences.winddown_reminder_enabled,
                        winddown_reminder_time:
                          preferences.winddown_reminder_time,
                      })
                    }
                  >
                    {isSaving ? "Guardando…" : "Guardar rutinas"}
                  </button>
                </div>
              </section>
            )}

            {activeTab === "data" && (
              <section className="profile-panel" aria-labelledby="data-title">
                <div className="profile-section-heading">
                  <span className="profile-icon">04</span>
                  <div>
                    <h2 id="data-title">Exportación y privacidad</h2>
                    <p>
                      Descarga una copia de los registros asociados a tu cuenta.
                    </p>
                  </div>
                </div>

                <div className="profile-export-card">
                  <h3>Elegir periodo</h3>
                  <p>
                    Deja las fechas vacías para incluir todos tus registros.
                    Ambas fechas son necesarias para filtrar un periodo.
                  </p>
                  <div className="profile-export-range">
                    <label className="profile-field">
                      <span>Desde</span>
                      <input
                        className="form-control"
                        type="date"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(event) => setStartDate(event.target.value)}
                      />
                    </label>
                    <label className="profile-field">
                      <span>Hasta</span>
                      <input
                        className="form-control"
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="profile-export-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isExporting}
                      onClick={() => void downloadExport("pdf")}
                    >
                      Descargar PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={isExporting}
                      onClick={() => void downloadExport("json")}
                    >
                      Exportar JSON
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={isExporting}
                      onClick={() => void downloadExport("csv")}
                    >
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="profile-inline-notice" role="note">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    verified_user
                  </span>
                  <p>
                    Las exportaciones incluyen solo la información realmente
                    registrada en Eusomnia. Los datos se asocian a tu cuenta y
                    puedes solicitar su eliminación en esta página.
                  </p>
                </div>

                <div className="profile-danger-zone">
                  <span className="profile-danger-label">Zona de cuenta</span>
                  <h3>Eliminar cuenta y registros</h3>
                  <p>
                    Esta acción permanente elimina tu cuenta, preferencias y
                    registros asociados. No se puede deshacer.
                  </p>
                  <form
                    className="profile-delete-form"
                    onSubmit={handleDeleteAccount}
                  >
                    <label className="profile-field">
                      <span>Contraseña actual</span>
                      <input
                        className="form-control"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(event) =>
                          setDeletePassword(event.target.value)
                        }
                        required
                      />
                    </label>
                    <label className="profile-field">
                      <span>Escribe ELIMINAR para confirmar</span>
                      <input
                        className="form-control"
                        type="text"
                        value={deleteConfirmation}
                        onChange={(event) =>
                          setDeleteConfirmation(event.target.value)
                        }
                        required
                      />
                    </label>
                    <button
                      className="btn btn-danger"
                      disabled={
                        isDeleting ||
                        deleteConfirmation !== "ELIMINAR" ||
                        !deletePassword
                      }
                    >
                      {isDeleting ? "Eliminando…" : "Eliminar cuenta"}
                    </button>
                  </form>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="eusomnia-card p-4 text-center" role="alert">
            No se pudo cargar tu perfil.
          </div>
        )}
      </div>
    </main>
  );
};
