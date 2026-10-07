import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MeusEventos from "./MeusEventos";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), history: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => ({ ...await importOriginal<typeof import("react-router-dom")>(), useNavigate: () => mocks.navigate }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner" } }) }));
vi.mock("@/data/useMyEventHistory", () => ({ useMyEventHistory: (id: string) => mocks.history(id) }));
vi.mock("@/data/useDivulgadorStatus", () => ({ useDivulgadorStatus: () => ({ isDivulgador: true }) }));
vi.mock("@/hooks/useAppPermissions", () => ({ useAppPermissions: () => ({ canApprove: true }) }));
vi.mock("@/components/divulgador/EditarMeuEventoDialog", () => ({ EditarMeuEventoDialog: () => null }));
vi.mock("@/components/divulgador/SolicitarDivulgadorCard", () => ({ SolicitarDivulgadorCard: () => null }));

describe("organizer archives", () => {
  it("admin divulgador vê apenas seus eventos, separados da curadoria geral", () => {
    mocks.history.mockReturnValue({ data: [
      { id: "mine", user_id: "owner", event_title: "Meu rolê", date: "2099-01-01", status: "pendente" },
      { id: "other", user_id: "someone-else", event_title: "Rolê de outra pessoa", date: "2099-01-01", status: "pendente" },
    ], isLoading: false, refetch: vi.fn() });
    render(<MemoryRouter><MeusEventos /></MemoryRouter>);
    expect(screen.getByText("Meu rolê")).toBeInTheDocument();
    expect(screen.queryByText("Rolê de outra pessoa")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Curadoria geral" })).toHaveAttribute("href", "/admin/aprovar-eventos");
    expect(screen.getByRole("link", { name: "Divulgar evento" })).toHaveAttribute("href", "/enviar-evento");
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.history.mockReturnValue({ data: [{ id: "past", user_id: "owner", event_title: "Show antigo", date: "2020-01-01", start_time: "20:00", location: "Palco", description: "Apresentação passada", status: "publicado", slug: "show-antigo" }], isLoading: false, refetch: vi.fn() });
  });
  it("requests only the current organizer's history and hides past events from active tabs", () => {
    render(<MemoryRouter><MeusEventos /></MemoryRouter>);
    expect(mocks.history).toHaveBeenCalledWith("owner");
    expect(screen.queryByText("Show antigo")).not.toBeInTheDocument();
  });
  it("allows private consultation and repetition without public or edit links", () => {
    render(<MemoryRouter><MeusEventos /></MemoryRouter>);
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Arquivados/ }), { button: 0, ctrlKey: false });
    expect(screen.getByText("Show antigo")).toBeInTheDocument();
    expect(screen.queryByText(/Ver na agenda/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    expect(screen.getByText("Apresentação passada")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Repetir evento" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/enviar-evento", { state: { repeatEventId: "past" } });
  });
});