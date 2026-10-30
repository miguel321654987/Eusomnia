import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Home } from "./Home.jsx";

vi.mock("../hooks/useGlobalReducer.jsx", () => ({
  default: () => ({
    store: {
      token: "home-token",
      user: { name: "Ada" },
    },
  }),
}));

describe("Home", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows personal records and pending analysis from the API, not sample metrics", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        results: {
          recent_entries: [
            {
              id: 41,
              date: "2026-10-29",
              title: "Un bosque iluminado",
              excerpt: "Recuerdo de un bosque al amanecer.",
              sleep_hours: 7.5,
              sleep_quality: "Profundo",
              has_analysis: false,
              analysis: null,
            },
          ],
          pending_analysis_count: 2,
          sleep_summary: {
            current_period_days: 7,
            current_sample_size: 1,
            current_average_hours: 7.5,
            previous_period_days: 7,
            previous_sample_size: 0,
            previous_average_hours: null,
            comparison_hours: null,
            comparison_available: false,
            source: "Autodeclarado por el usuario",
          },
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Un bosque iluminado")).toBeInTheDocument();
    expect(screen.getByText(/Calidad declarada: Profundo/)).toBeInTheDocument();
    expect(
      screen.getByText(/Tienes 2 registros pendientes de análisis/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/7.5 h en 1 registro/),
    ).toBeInTheDocument();
    expect(screen.queryByText("84%")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ciclo REM óptimo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Avión sobre gran ciudad/)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/home-summary",
        expect.objectContaining({
          headers: { Authorization: "Bearer home-token" },
        }),
      );
    });
  });
});
