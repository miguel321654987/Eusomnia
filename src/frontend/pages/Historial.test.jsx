import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  filterHistoryEntries,
  getHistoryMetrics,
} from "./historyUtils.js";
import { Historial } from "./Historial.jsx";

vi.mock("../hooks/useGlobalReducer.jsx", () => ({
  default: () => ({ store: { token: "history-token" } }),
}));

const historyEntries = [
  {
    id: 1,
    entry_date: getDateOffset(0),
    original_entry_date: getDateOffset(1),
    created_at: "2026-10-28T07:00:00",
    updated_at: "2026-10-28T07:00:00",
    sleep_report: {
      final_text: "Soñé que volaba sobre una ciudad.",
      raw_text: "Soñé que volaba sobre una ciudad.",
    },
    habit_log: {
      total_sleep_hours: 7,
      sleep_quality: "Profundo",
      physical_activity: "Paseo suave",
      screen_time: "Poco",
    },
    nutrition_log: { analyzed: true, caffeine_mg: 20 },
    analysis: {
      interpretation: "Una noche tranquila.",
      predominant_emotions: ["Serenidad"],
      detected_symbols: ["Vuelo"],
      alerts: [],
      created_at: "2026-10-28T07:10:00",
    },
  },
  {
    id: 2,
    entry_date: getDateOffset(15),
    original_entry_date: getDateOffset(15),
    created_at: "2026-10-15T07:00:00",
    updated_at: "2026-10-15T07:00:00",
    sleep_report: {
      final_text: "Soñé con una araña.",
      raw_text: "Soñé con una araña.",
    },
    habit_log: {
      total_sleep_hours: 6,
      sleep_quality: "Fragmentado",
    },
    nutrition_log: { analyzed: true, caffeine_mg: 0 },
    analysis: {
      interpretation: "Sueño interrumpido.",
      predominant_emotions: [],
      detected_symbols: ["Araña"],
      alerts: [{ message: "Cafeína tardía." }],
      created_at: "2026-10-15T07:10:00",
    },
  },
];

function getDateOffset(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

describe("Historial helpers", () => {
  it("filters by effective date, quality, and search text", () => {
    const now = new Date();

    expect(
      filterHistoryEntries(
        historyEntries,
        { range: "7", quality: "deep", search: "volaba" },
        now,
      ).map((entry) => entry.id),
    ).toEqual([1]);
    expect(
      filterHistoryEntries(
        historyEntries,
        { range: "all", quality: "alerts" },
        now,
      ).map((entry) => entry.id),
    ).toEqual([2]);
  });

  it("calculates summaries only from available fields", () => {
    expect(getHistoryMetrics(historyEntries)).toEqual({
      averageSleepHours: 6.5,
      entryCount: 2,
      alertCount: 1,
      mostCommonQuality: "Fragmentado",
    });
  });
});

describe("Historial page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: historyEntries }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the timeline and can reveal older records", async () => {
    render(
      <MemoryRouter>
        <Historial />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Historial de Registros & Cronobiología",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Soñé que volaba sobre una ciudad.")).toBeInTheDocument();
    expect(screen.getByText("Fecha original")).toBeInTheDocument();
    expect(screen.getByText("Fecha efectiva")).toBeInTheDocument();
    expect(screen.queryByText("Soñé con una araña.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todo" }));

    await waitFor(() => {
      expect(screen.getByText("2 registros")).toBeInTheDocument();
    });
  });
});
