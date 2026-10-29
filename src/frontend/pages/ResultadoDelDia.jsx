import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { TelemetryHeader } from "../components/daily_result/TelemetryHeader.jsx";
import { SomnolenceGauges } from "../components/daily_result/SomnolenceGauges.jsx";
import { HygienicAlertBanner } from "../components/daily_result/HygienicAlertBanner.jsx";
import { DreamAnalysisSection } from "../components/daily_result/DreamAnalysisSection.jsx";
import { HabitCorrelationsSection } from "../components/daily_result/HabitCorrelationsSection.jsx";
import { apiUrl } from "../api.js";

async function requestApi(path, token, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud.");
  }

  return data.results;
}

function getText(value, keys = ["message", "text", "title", "name"]) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return keys.map((key) => value[key]).find(Boolean) || "";
}

function getList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export const ResultadoDelDia = () => {
  const { store } = useGlobalReducer();
  const [searchParams] = useSearchParams();
  const token = store.token || localStorage.getItem("jwt-token");
  const requestedEntryId = searchParams.get("entryId");
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadEntry = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    setActionError("");

    try {
      let currentEntry;
      if (requestedEntryId) {
        const entryId = Number(requestedEntryId);
        if (!Number.isInteger(entryId) || entryId < 1) {
          throw new Error("El identificador del registro no es válido.");
        }
        currentEntry = await requestApi(`/api/entries/${entryId}`, token);
      } else {
        const entries = await requestApi("/api/entries", token);
        currentEntry = entries?.[0];
      }

      if (!currentEntry) {
        setEntry(null);
        return;
      }

      let operationError = "";
      let nutritionUpdated = false;
      if (
        currentEntry.habit_log?.nutrition_query &&
        !currentEntry.nutrition_log?.analyzed
      ) {
        try {
          await requestApi("/api/nutrition/analyze", token, {
            method: "POST",
            body: JSON.stringify({
              entry_id: currentEntry.id,
              query: currentEntry.habit_log.nutrition_query,
            }),
          });
          nutritionUpdated = true;
        } catch (error) {
          operationError = `No se pudo obtener el análisis nutricional: ${error.message}`;
        }
      }

      if (!currentEntry.analysis || nutritionUpdated) {
        try {
          await requestApi(`/api/analysis/${currentEntry.id}`, token, {
            method: "POST",
          });
        } catch (error) {
          operationError = [
            operationError,
            `No se pudo generar el análisis onírico: ${error.message}`,
          ]
            .filter(Boolean)
            .join(" ");
        }
      }

      currentEntry = await requestApi(
        `/api/entries/${currentEntry.id}`,
        token,
      );
      setEntry(currentEntry);
      setActionError(operationError);
    } catch (error) {
      setLoadError(error.message || "No se pudo cargar el registro.");
    } finally {
      setIsLoading(false);
    }
  }, [requestedEntryId, token]);

  useEffect(() => {
    let isActive = true;
    if (token) {
      void Promise.resolve().then(() => {
        if (isActive) {
          void loadEntry();
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [loadEntry, token]);

  const handleReanalyze = async () => {
    if (!entry) return;

    setIsReanalyzing(true);
    setActionError("");
    try {
      await requestApi(`/api/analysis/${entry.id}`, token, {
        method: "POST",
      });
      const updatedEntry = await requestApi(
        `/api/entries/${entry.id}`,
        token,
      );
      setEntry(updatedEntry);
    } catch (error) {
      setActionError(`No se pudo reanalizar el registro: ${error.message}`);
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (!token) {
    return (
      <div className="eusomnia-canvas py-5">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div className="eusomnia-card p-4 text-center">
            <h1 className="font-headline h4 text-light">Inicia sesión</h1>
            <p className="text-secondary">
              El resultado muestra análisis vinculados a tus registros guardados.
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
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="eusomnia-canvas py-5">
        <div className="container text-center text-secondary">
          <span className="spinner-border spinner-border-sm me-2" role="status" />
          Cargando registro y análisis guardados...
        </div>
      </div>
    );
  }

  if (loadError || !entry) {
    return (
      <div className="eusomnia-canvas py-5">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div className="eusomnia-card p-4 text-center">
            <h1 className="font-headline h4 text-light">
              {loadError ? "No se pudo cargar el resultado" : "Aún no hay registros"}
            </h1>
            <p className="text-secondary">
              {loadError || "Guarda un registro diario para generar tu análisis."}
            </p>
            <Link to="/registro-diario" className="btn btn-primary">
              Ir al registro diario
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const analysis = entry.analysis;
  const habitLog = entry.habit_log || {};
  const sleepReport = entry.sleep_report || {};
  const emotions = getList(analysis?.predominant_emotions)
    .filter(Boolean)
    .map((emotion, index) => {
      if (typeof emotion === "string") {
        return { label: emotion, theme: index === 0 ? "primary" : "secondary" };
      }
      return {
        label: getText(emotion, ["label", "emotion", "name"]),
        pct: emotion.percentage ?? emotion.pct,
        emoji: emotion.emoji || "",
        theme: index === 0 ? "primary" : "secondary",
      };
    })
    .filter((emotion) => emotion.label);
  const symbols = getList(analysis?.detected_symbols)
    .filter(Boolean)
    .map((symbol, index) => ({
      id: symbol.id || `${entry.id}-symbol-${index}`,
      emoji: symbol.emoji || "",
      title:
        typeof symbol === "string"
          ? symbol
          : getText(symbol, ["title", "name", "symbol"]),
      archetype:
        typeof symbol === "string" ? "" : getText(symbol, ["archetype", "category"]),
      content:
        typeof symbol === "string"
          ? ""
          : getText(symbol, [
              "interpretation",
              "meaning",
              "description",
              "summary",
            ]),
    }))
    .filter((symbol) => symbol.title);
  const prescriptions = getList(analysis?.recommendations)
    .filter(Boolean)
    .map((item, index) => ({
      num: index + 1,
      title:
        getText(item, ["title", "recommendation", "text"]) ||
        `Recomendación ${index + 1}`,
      desc: getText(item, ["description", "reason", "details"]),
    }));
  const alerts = getList(analysis?.alerts)
    .map((item) =>
      getText(item, [
        "message",
        "alert",
        "text",
        "title",
        "description",
        "detail",
      ]),
    )
    .filter(Boolean);
  const nutrition = entry.nutrition_log
    ? {
        calories: entry.nutrition_log.calories,
        fats: entry.nutrition_log.fats_g,
        protein: entry.nutrition_log.protein_g,
        carbs: entry.nutrition_log.carbs_g,
        sugars: entry.nutrition_log.sugar_g,
        sodium: entry.nutrition_log.sodium_mg,
        caffeine: entry.nutrition_log.caffeine_mg,
        vitB12: entry.nutrition_log.vitamin_b12_mcg,
        vitE: entry.nutrition_log.vitamin_e_mg,
      }
    : null;
  const date = entry.entry_date
    ? new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(
        new Date(`${entry.entry_date}T00:00:00`),
      )
    : "Fecha no disponible";

  return (
    <div className="eusomnia-canvas py-5 position-relative">
      <div className="glow-orb-primary" />
      <div className="glow-orb-secondary" />

      <div
        className="container position-relative d-flex flex-column gap-4"
        style={{ maxWidth: "1200px", zIndex: 1 }}
      >
        <TelemetryHeader
          date={date}
          sessionId={`#${entry.id}`}
          isReanalyzing={isReanalyzing}
          onReanalyze={handleReanalyze}
        />

        {actionError && (
          <div className="alert alert-warning mb-0" role="alert">
            {actionError}
          </div>
        )}

        <SomnolenceGauges
          sleepHours={habitLog.sleep_hours}
          sleepQuality={habitLog.bedtime_mood}
          caffeineMg={nutrition?.caffeine}
        />

        <HygienicAlertBanner alerts={alerts} />

        <div className="row g-4 pt-2">
          <div className="col-12 col-lg-7">
            <DreamAnalysisSection
              emotions={emotions}
              symbols={symbols}
              synthesis={analysis?.interpretation}
              habitsReading={analysis?.habits_reading}
              originalDream={sleepReport.raw_text}
              recordedTime={sleepReport.created_at}
            />
          </div>

          <div className="col-12 col-lg-5">
            <HabitCorrelationsSection
              context={{
                activity: habitLog.physical_activity,
                screens: habitLog.screen_time,
                mood: habitLog.bedtime_mood,
                dinner: habitLog.dinner_type,
              }}
              nutrition={nutrition}
              nutritionQuery={habitLog.nutrition_query}
              prescriptions={prescriptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
