export function getSleepDurationHours(bedtime, wakeTime) {
  const bedtimeMinutes = parseTimeToMinutes(bedtime);
  const wakeTimeMinutes = parseTimeToMinutes(wakeTime);
  if (bedtimeMinutes === null || wakeTimeMinutes === null) return null;

  const durationMinutes =
    (wakeTimeMinutes - bedtimeMinutes + 1440) % 1440;
  if (durationMinutes === 0) return null;
  return durationMinutes / 60;
}

export function parseTimeToMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatSleepDuration(hours) {
  if (!Number.isFinite(hours)) return "No disponible";
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes
    ? `${wholeHours} h ${String(remainingMinutes).padStart(2, "0")} min`
    : `${wholeHours} h`;
}
