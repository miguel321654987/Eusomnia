import { useEffect } from "react";
import { toast } from "react-toastify";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { apiUrl } from "../api.js";
import { PROFILE_REMINDERS } from "../profileReminders.js";

function getLocalDateParts(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function getTimeInTimezone(timezone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

export const RoutineReminderScheduler = () => {
  const { store } = useGlobalReducer();
  const token = store.token || localStorage.getItem("jwt-token");

  useEffect(() => {
    if (!token) return undefined;
    let isActive = true;
    let intervalId;
    let userId;
    let preferences;
    const shownReminders = new Set();

    const showDueReminders = () => {
      if (!preferences || !userId) return;
      let localDate;
      let localTime;
      try {
        const parts = getLocalDateParts(preferences.timezone);
        localDate = `${parts.year}-${parts.month}-${parts.day}`;
        localTime = getTimeInTimezone(preferences.timezone);
      } catch (error) {
        console.error("Invalid reminder timezone:", error);
        return;
      }

      PROFILE_REMINDERS.forEach((reminder) => {
        if (
          !preferences[reminder.enabled] ||
          preferences[reminder.time] !== localTime
        ) {
          return;
        }
        const key = `eusomnia-reminder:${userId}:${localDate}:${reminder.enabled}`;
        if (shownReminders.has(key)) return;
        const storageKey = `eusomnia-reminders:${userId}`;
        try {
          const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
          const storedReminders =
            stored.date === localDate && Array.isArray(stored.reminders)
              ? stored.reminders
              : [];
          if (storedReminders.includes(reminder.enabled)) {
            shownReminders.add(key);
            return;
          }
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              date: localDate,
              reminders: [...storedReminders, reminder.enabled],
            }),
          );
        } catch (error) {
          console.error("Could not persist reminder state:", error);
        }
        shownReminders.add(key);
        toast.info(reminder.message, { toastId: key });
      });
    };

    const loadReminders = async () => {
      try {
        const response = await fetch(apiUrl("/api/users/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "No se pudieron cargar las rutinas.");
        }
        if (!isActive) return;
        userId = data.user?.id;
        preferences = data.preferences;
        showDueReminders();
      } catch (error) {
        if (isActive) {
          console.error("Could not load reminder preferences:", error);
          toast.error(
            error.message || "No se pudieron cargar las rutinas.",
          );
        }
      }
    };

    intervalId = window.setInterval(showDueReminders, 30_000);
    window.addEventListener("eusomnia:profile-updated", loadReminders);
    void loadReminders();
    return () => {
      isActive = false;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("eusomnia:profile-updated", loadReminders);
    };
  }, [token]);

  return null;
};
