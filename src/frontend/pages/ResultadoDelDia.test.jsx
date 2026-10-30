import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultadoDelDia } from "./ResultadoDelDia.jsx";

vi.mock("../hooks/useGlobalReducer.jsx", () => ({
  default: () => ({ store: { token: "result-token" } }),
}));

describe("ResultadoDelDia nutrition progress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the nutrition table before the AI interpretation finishes", async () => {
    let resolveAnalysis;
    const analysisResponse = new Promise((resolve) => {
      resolveAnalysis = resolve;
    });
    const entry = {
      id: 35,
      entry_date: "2026-10-29",
      sleep_report: { raw_text: "Un sueño junto al mar." },
      habit_log: {
        total_sleep_hours: 7,
        sleep_quality: "Intermedio",
        sleep_context: {
          bedtime: "23:00",
          wake_time: "06:30",
          last_caffeine_time: "15:00",
          room_temperature_c: 18.5,
          room_light: "dark",
        },
        meal_entries: {
          breakfast: {
            size: "light",
            time: "08:00",
            foods: "",
          },
        },
      },
      nutrition_log: null,
      analysis: null,
    };
    const nutritionLog = {
      calories: 350,
      protein_g: 15,
      carbohydrates_g: 45,
      sugar_g: 8,
      fat_g: 12,
      sodium_mg: 500,
      caffeine_mg: null,
      vitamin_b12_ug: null,
      vitamin_e_mg: null,
      analyzed: true,
      meal_breakdown: {
        source: "generic",
        source_label: "Modelo orientativo interno de Eusomnia",
        generic_reference: {
          source: "Modelo orientativo interno de Eusomnia",
        },
        items: [
          {
            meal_type: "breakfast",
            label: "Desayuno",
            time: "08:00",
            source: "generic",
            source_label: "Modelo orientativo interno de Eusomnia",
            values: {
              calories: 350,
              protein_g: 15,
              carbohydrates_g: 45,
              sugars_g: 8,
              fat_g: 12,
              sodium_mg: 500,
              caffeine_mg: null,
            },
          },
        ],
        totals: {
          calories: 350,
          protein_g: 15,
          carbohydrates_g: 45,
          sugars_g: 8,
          fat_g: 12,
          sodium_mg: 500,
          caffeine_mg: null,
        },
      },
    };
    const fetchMock = vi.fn((url, options = {}) => {
      if (url === "/api/entries/35") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: entry }),
        });
      }
      if (url === "/api/nutrition/log") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: nutritionLog }),
        });
      }
      if (url === "/api/analysis/35" && options.method === "POST") {
        return analysisResponse;
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/resultado-del-dia?entryId=35"]}>
        <ResultadoDelDia />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Valores por ingesta y procedencia"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nutrición disponible. Generando la interpretación onírica..."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("350 kcal").length).toBeGreaterThan(0);
    expect(screen.getByText("Hora de acostarse declarada:")).toBeInTheDocument();
    expect(screen.getByText("18.5 °C")).toBeInTheDocument();
    expect(screen.getByText("Oscura")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) =>
          url === "/api/analysis/35" && options.method === "POST",
      ),
    ).toBe(true);

    await act(async () => {
      resolveAnalysis({
        ok: true,
        json: async () => ({
          results: {
            id: 1,
            interpretation: "Interpretación generada después.",
            predominant_emotions: [],
            detected_symbols: [],
            recommendations: [],
            alerts: [],
          },
        }),
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Interpretación generada después."),
      ).toBeInTheDocument();
    });
  });

  it("shows the HTTP status when the server error body is not JSON", async () => {
    const fetchMock = vi.fn(async (url, options = {}) => {
      if (url === "/api/entries/35") {
        return {
          ok: true,
          json: async () => ({
            results: {
              id: 35,
              entry_date: "2026-10-29",
              sleep_report: { raw_text: "Un sueño junto al mar." },
              habit_log: {},
              nutrition_log: null,
              analysis: null,
            },
          }),
        };
      }
      if (url === "/api/analysis/35" && options.method === "POST") {
        return {
          ok: false,
          status: 500,
          json: async () => {
            throw new SyntaxError("Unexpected token '<'");
          },
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/resultado-del-dia?entryId=35"]}>
        <ResultadoDelDia />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("No se pudo generar el análisis onírico: El servidor devolvió un error HTTP 500."),
    ).toBeInTheDocument();
  });
});
