import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Auth from "./Auth";
const mocks = vi.hoisted(() => ({ signIn: vi.fn(), error: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, loading: false, signIn: mocks.signIn }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
describe("WhatsApp-only login", () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks(); });
  it("formats WhatsApp and signs in without an email", async () => {
    mocks.signIn.mockResolvedValue({ error: null });
    render(<MemoryRouter><Auth /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: "21987654321" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "roleno" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith("(21) 98765-4321", "roleno"));
  });
  it("rejects an email identifier without sending a login request", () => {
    render(<MemoryRouter><Auth /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: "pessoa@example.com" } });
    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form") as HTMLFormElement);
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalled();
  });
});