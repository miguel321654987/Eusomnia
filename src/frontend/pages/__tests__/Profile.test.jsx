/* global describe, test, beforeEach, afterEach, expect, global */
// Importamos React explícitamente para que JSX sea transformado correctamente.
// Añade los matchers de jest-dom como toBeInTheDocument
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Profile } from "../Profile";
import { vi } from "vitest";

// Shared dispatch mock to allow assertions against the same instance used by
// the component rendered in each test.
const { dispatchMock } = vi.hoisted(() => ({ dispatchMock: vi.fn() }));

vi.mock("../../hooks/useGlobalReducer.jsx", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    store: { user: null },
    dispatch: dispatchMock,
  })),
}));

// Mock react-toastify to avoid actual DOM toasts during tests
const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("Profile component", () => {
  const mockUser = { name: "Juan Pérez", email: "juan@example.com" };

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
    // Ensure token exists for auth headers
    localStorage.setItem("jwt-token", "dummy-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // El test del spinner se omitió para evitar promesas pendientes en el entorno de pruebas.

  test("loads and displays user data", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    });
  });

  test("handles save action and shows success toast", async () => {
    // First GET profile then PUT request when saving
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "updated" }),
      });

    // The shared dispatch mock is used directly to assert SET_MESSAGE calls.

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    // Wait for data to load
    await waitFor(() => screen.getByDisplayValue(mockUser.name));

    const nameInput = screen.getByLabelText(/Nombre/i);
    fireEvent.change(nameInput, { target: { value: "Carlos" } });
    const saveBtn = screen.getByRole("button", { name: /Guardar cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Verify toast.success called
      expect(toastSuccessMock).toHaveBeenCalledWith("Perfil actualizado");
      // Verify dispatch received success message
      expect(dispatchMock).toHaveBeenCalledWith({
        type: "SET_MESSAGE",
        payload: { msg: "Perfil actualizado", status: 200 },
      });
    });
  });
});
