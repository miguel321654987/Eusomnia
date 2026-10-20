/* eslint-disable no-unused-vars */
/* global describe, test, expect */
import React from "react"; // React needed for JSX transpilation (may be unused depending on setup)
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Home } from "../Home";

/**
 * Tests básicos para la página Home.
 * Verificamos que el hero, las tarjetas de estadísticas y la lista de logs
 * estén presentes y que las clases de Bootstrap definidas se apliquen.
 */
describe("Home component", () => {
  test("renders hero section with title and CTA", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const heroTitle = screen.getByRole("heading", { name: /Eusomnia/i });
    expect(heroTitle).toBeInTheDocument();
    const ctaButton = screen.getByRole("link", { name: /Comenzar Registro Diario/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveClass("btn-primary");
  });

  test("renders three stats cards", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const cards = screen.getAllByRole("heading", { level: 5 });
    // Should contain Entradas, Horas de Sueño, Calidad
    const titles = cards.map((c) => c.textContent);
    expect(titles).toEqual(expect.arrayContaining(["Entradas", "Horas de Sueño", "Calidad"]));
  });

  test("renders recent logs list (fallback data)", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // La llamada fetch falla en test, por lo que se usa el fallback estático.
    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });
});
