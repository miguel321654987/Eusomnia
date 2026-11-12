function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function getItems(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [parsedValue];
  } catch {
    return [value];
  }
}

export function getItemText(
  value,
  keys = ["label", "title", "name", "text", "message"],
) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (!value || typeof value !== "object") return "";
  return keys.map((key) => value[key]).find(Boolean) || "";
}

export function getSleepQuality(entry) {
  const habits = entry.habit_log || {};
  return habits.sleep_quality || habits.bedtime_mood || "Sin indicar";
}

export function getQualityKey(value) {
  const quality = normalizeText(value);
  if (quality.includes("profund")) return "deep";
  if (quality.includes("intermedi")) return "intermediate";
  if (quality.includes("fragment")) return "fragmented";
  return "other";
}

export function getAlerts(entry) {
  return getItems(entry.analysis?.alerts)
    .map((item) =>
      getItemText(item, [
        "message",
        "alert",
        "text",
        "title",
        "description",
        "detail",
      ]),
    )
    .filter(Boolean);
}

export function hasEntryAlerts(entry) {
  return (
    getAlerts(entry).length > 0 ||
    Boolean(entry.nutrition_log?.other_excitants_present)
  );
}

function getEntrySearchText(entry) {
  const analysis = entry.analysis || {};
  const habits = entry.habit_log || {};
  const sleep = entry.sleep_report || {};
  return [
    sleep.raw_text,
    sleep.final_text,
    analysis.interpretation,
    analysis.habits_reading,
    getItems(analysis.detected_symbols)
      .map((item) => getItemText(item, ["title", "name", "symbol", "label"]))
      .join(" "),
    getItems(analysis.predominant_emotions)
      .map((item) => getItemText(item, ["label", "emotion", "name"]))
      .join(" "),
    habits.physical_activity,
    habits.dinner_type,
    habits.incidents,
    habits.food_notes,
  ]
    .filter(Boolean)
    .join(" ");
}

function isWithinRange(entry, range, now) {
  if (range === "all") return true;
  if (!entry.entry_date) return false;

  const entryDate = new Date(`${entry.entry_date}T00:00:00`);
  if (Number.isNaN(entryDate.getTime())) return false;

  const firstDate = new Date(now);
  firstDate.setHours(0, 0, 0, 0);
  firstDate.setDate(firstDate.getDate() - Number(range) + 1);
  return entryDate >= firstDate && entryDate <= now;
}

export function filterHistoryEntries(
  entries,
  { range = "all", quality = "all", search = "" } = {},
  now = new Date(),
) {
  const normalizedSearch = normalizeText(search.trim());

  return entries
    .filter((entry) => isWithinRange(entry, range, now))
    .filter((entry) => {
      if (quality === "all") return true;
      if (quality === "alerts") return hasEntryAlerts(entry);
      return getQualityKey(getSleepQuality(entry)) === quality;
    })
    .filter(
      (entry) =>
        !normalizedSearch ||
        normalizeText(getEntrySearchText(entry)).includes(normalizedSearch),
    )
    .sort((left, right) => {
      const dateOrder = String(right.entry_date || "").localeCompare(
        String(left.entry_date || ""),
      );
      if (dateOrder !== 0) return dateOrder;
      return String(right.created_at || "").localeCompare(
        String(left.created_at || ""),
      );
    });
}

export function getHistoryMetrics(entries) {
  const sleepDurations = entries
    .map((entry) => Number(entry.habit_log?.total_sleep_hours))
    .filter((hours) => Number.isFinite(hours) && hours > 0);
  const qualityCounts = entries.reduce((counts, entry) => {
    const quality = getSleepQuality(entry);
    if (quality !== "Sin indicar") {
      counts[quality] = (counts[quality] || 0) + 1;
    }
    return counts;
  }, {});
  const mostCommonQuality = Object.entries(qualityCounts).sort(
    ([leftName, leftCount], [rightName, rightCount]) =>
      rightCount - leftCount || leftName.localeCompare(rightName),
  )[0]?.[0];

  return {
    averageSleepHours: sleepDurations.length
      ? sleepDurations.reduce((total, hours) => total + hours, 0) /
        sleepDurations.length
      : null,
    entryCount: entries.length,
    alertCount: entries.filter(hasEntryAlerts).length,
    mostCommonQuality: mostCommonQuality || "Sin datos",
  };
}

export function formatHistoryDate(
  value,
  options = { dateStyle: "long" },
) {
  if (!value) return "Fecha no disponible";
  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-ES", options).format(parsedDate);
}

export function getAnalysisText(value) {
  return getItems(value)
    .map((item) =>
      getItemText(item, [
        "label",
        "title",
        "name",
        "symbol",
        "emotion",
        "text",
        "message",
      ]),
    )
    .filter(Boolean);
}

export function isAnalysisStale(entry) {
  const updatedAt = Date.parse(entry.updated_at || "");
  const analyzedAt = Date.parse(entry.analysis?.created_at || "");
  return (
    Number.isFinite(updatedAt) &&
    Number.isFinite(analyzedAt) &&
    updatedAt > analyzedAt
  );
}
