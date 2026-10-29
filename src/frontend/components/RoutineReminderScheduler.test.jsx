import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoutineReminderScheduler } from "./RoutineReminderScheduler.jsx";
import { toast } from "react-toastify";

vi.mock("../hooks/useGlobalReducer.jsx", () => ({
  default: () => ({ store: { token: "reminder-token" } }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RoutineReminderScheduler", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T07:30:15.000Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: 8 },
          preferences: {
            timezone: "UTC",
            morning_reminder_enabled: true,
            morning_reminder_time: "07:30",
            caffeine_reminder_enabled: true,
            caffeine_reminder_time: "07:30",
            winddown_reminder_enabled: false,
            winddown_reminder_time: "22:30",
          },
        }),
      }),
    );
    toast.info.mockClear();
    toast.error.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("shows enabled reminders at local time and deduplicates within the day", async () => {
    render(<RoutineReminderScheduler />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(toast.info).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(toast.info).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("eusomnia-reminders:8")).toContain(
      "morning_reminder_enabled",
    );
  });
});
