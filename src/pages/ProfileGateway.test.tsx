import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ProfileGateway from "./ProfileGateway";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("./ProfileSettings", () => ({ default: () => <div>Perfil autenticado</div> }));

describe("ProfileGateway", () => {
  it("convida visitantes a criar conta ou entrar", () => {
    render(<MemoryRouter><ProfileGateway /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Visitante" })).toBeInTheDocument();
    expect(screen.getByText(/já pode ver todos os rolês divulgados/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Personalizar minhas preferências/ })).toHaveAttribute("href", "/cadastro/publico");
    expect(screen.getByRole("link", { name: /Continuar como visitante/ })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /Já tenho conta/ })).toHaveAttribute("href", "/auth?redirect=%2Fperfil");
  });
});