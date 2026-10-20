/* global jest, describe, test, beforeEach, afterEach, expect, global, require */
// React no es necesario en este archivo de pruebas con JSX transpile automático.
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Profile } from "../Profile";

// Mock the global useGlobalReducer hook to capture dispatch calls
jest.mock("../hooks/useGlobalReducer.jsx", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    store: { user: null },
    dispatch: jest.fn(),
  })),
}));

// Mock react-toastify to avoid actual DOM toasts during tests
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Profile component", () => {
  const mockUser = { name: "Juan Pérez", email: "juan@example.com" };

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
    // Ensure token exists for auth headers
    localStorage.setItem("jwt-token", "dummy-token");
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("shows loading spinner initially", async () => {
    // fetch will resolve after a timeout to keep loading state visible
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

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
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockUser }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: "updated" }) });

    const { dispatch } = require("../hooks/useGlobalReducer.jsx").default();

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
      const { toast } = require("react-toastify");
      expect(toast.success).toHaveBeenCalledWith("Perfil actualizado");
      // Verify dispatch received success message
      expect(dispatch).toHaveBeenCalledWith({ type: "SET_MESSAGE", payload: { msg: "Perfil actualizado", status: 200 } });
    });
  });
});
