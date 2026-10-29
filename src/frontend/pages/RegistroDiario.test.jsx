import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistroDiario } from "./RegistroDiario.jsx";

vi.mock("../hooks/useGlobalReducer.jsx", () => ({
  default: () => ({ store: { token: "edit-token" } }),
}));

vi.mock("../components/daily_entry/StepDreamJournal.jsx", () => ({
  StepDreamJournal: ({ onSubmit, isSubmitting, submitLabel }) => (
    <button type="button" onClick={onSubmit} disabled={isSubmitting}>
      {submitLabel}
    </button>
  ),
}));

const existingEntry = {
  id: 23,
  entry_date: "2026-10-28",
  original_entry_date: "2026-10-27",
  sleep_report: {
    raw_text: "Un relato inicial.",
    final_text: "Un relato inicial.",
  },
  habit_log: {
    physical_activity: "Media (Ejercicio regular)",
    dinner_type: "",
    bedtime_mood: "Profundo",
    sleep_quality: "Profundo",
    screen_time: "< 1 hora (Filtro cálido)",
    incidents: "",
    food_notes: "Una taza de café",
    total_sleep_hours: 7,
  },
  nutrition_log: { analyzed: true, caffeine_mg: 80 },
  analysis: {
    interpretation: "Análisis existente.",
    created_at: "2026-10-28T07:10:00",
  },
};

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

describe("RegistroDiario edit mode", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn(async (url, options = {}) => {
      if (options.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({ results: { ...existingEntry } }),
        };
      }
      if (url === "/api/nutrition/log") {
        return {
          ok: true,
          json: async () => ({ results: { analyzed: true } }),
        };
      }
      if (url === "/api/analysis/23") {
        return {
          ok: true,
          json: async () => ({ results: { id: 1 } }),
        };
      }
      return {
        ok: true,
        json: async () => ({ results: existingEntry }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the effective date and refreshes changed nutrition and analysis", async () => {
    render(
      <MemoryRouter initialEntries={["/registro-diario?entryId=23"]}>
        <RegistroDiario />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Fecha original")).toBeInTheDocument();
    expect(screen.getByText("27 de octubre de 2026")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Fecha efectiva"), {
      target: { value: "2026-10-29" },
    });
    fireEvent.click(screen.getByRole("button", { name: /4\. Nutrición/ }));
    fireEvent.change(screen.getByLabelText(/Alimentos y cantidades/), {
      target: { value: "Dos tazas de café" },
    });
    fireEvent.click(screen.getByRole("button", { name: /5\. Sueño/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/historial?entryId=23",
      );
    });

    const patchRequest = fetchMock.mock.calls.find(
      ([, options]) => options.method === "PATCH",
    );
    expect(JSON.parse(patchRequest[1].body)).toMatchObject({
      date: "2026-10-29",
      habits: {
        total_sleep_hours: 7,
        sleep_quality: "Profundo",
      },
    });

    const nutritionRequest = fetchMock.mock.calls.find(
      ([url]) => url === "/api/nutrition/log",
    );
    expect(JSON.parse(nutritionRequest[1].body)).toMatchObject({
      entry_id: 23,
      ingredients: ["Dos tazas de café"],
    });
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          url === "/api/analysis/23" && options.method === "POST",
      ),
    ).toBe(true);
  });
});
