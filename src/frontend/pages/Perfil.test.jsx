import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Perfil } from "./Perfil.jsx";

const dispatch = vi.fn();

vi.mock("../hooks/useGlobalReducer.jsx", () => ({
  default: () => ({
    store: { token: "profile-token" },
    dispatch,
  }),
}));

const profileResponse = {
  user: {
    id: 7,
    email: "ada@example.test",
    name: "Ada",
    last_name: "Lovelace",
    birth_year: 1984,
    chronotype: "lion",
  },
  preferences: {
    timezone: "Europe/Madrid",
    ai_provider: "openrouter",
    selected_model: "nvidia/nemotron-3.5-super-vl:free",
    has_custom_key: false,
    interpretation_framework: "jungian",
    report_depth: "standard",
    include_nutrition_in_analysis: true,
    morning_reminder_enabled: true,
    morning_reminder_time: "07:30",
    caffeine_reminder_enabled: true,
    caffeine_reminder_time: "18:00",
    winddown_reminder_enabled: true,
    winddown_reminder_time: "22:30",
  },
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <Perfil />
    </MemoryRouter>,
  );
}

describe("Perfil page", () => {
  beforeEach(() => {
    dispatch.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, options = {}) =>
        Promise.resolve({
          ok: true,
          json: async () => {
            if (options.method === "PUT") {
              return {
                ...profileResponse,
                message: "Profile updated successfully",
              };
            }
            return profileResponse;
          },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the account and hides unsupported device and subscription cards", async () => {
    renderProfile();

    expect(await screen.findByText(/Hola, Ada Lovelace/)).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue(
      "ada@example.test",
    );
    expect(
      screen.queryByText("Dispositivos sincronizados"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Suscripción Neuro-Pro")).not.toBeInTheDocument();
  });

  it("shows each profile section and its supported functionality", async () => {
    renderProfile();
    await screen.findByText(/Hola, Ada Lovelace/);

    fireEvent.click(screen.getByRole("button", { name: /motor de ia/i }));
    expect(
      screen.getByRole("heading", { name: "Preferencias del análisis" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Incluir alimentación registrada"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rutinas" }));
    expect(
      screen.getByText(/no se envían notificaciones push ni correos/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /datos y privacidad/i }),
    );
    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Exportar JSON" })).toBeVisible();
  });

  it("saves the selected AI settings using the authenticated profile API", async () => {
    renderProfile();
    await screen.findByText(/Hola, Ada Lovelace/);
    fireEvent.click(screen.getByRole("button", { name: /motor de ia/i }));
    fireEvent.click(
      screen.getByRole("radio", { name: /Neurocientífico/ }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /Incluir alimentación registrada/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar preferencias" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/users/profile",
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            Authorization: "Bearer profile-token",
          }),
        }),
      );
    });
    const request = fetch.mock.calls.find(([, options]) => options?.method === "PUT");
    expect(JSON.parse(request[1].body)).toMatchObject({
      interpretation_framework: "neuroscientific",
      include_nutrition_in_analysis: false,
    });
  });
});
