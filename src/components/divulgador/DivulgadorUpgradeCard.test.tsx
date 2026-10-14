import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DivulgadorUpgradeCard } from "./DivulgadorUpgradeCard";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { updateUser: vi.fn() } } }));
vi.mock("@/data/useDivulgadorRequest", () => ({ useCreateDivulgadorRequest: () => ({ isPending: false, mutateAsync: vi.fn() }) }));
vi.mock("@/data/useDivulgadorStatus", () => ({
  useDivulgadorStatus: () => ({
    loading: false,
    isDivulgador: false,
    profile: { responsible_name: "Toni", phone: "21999999999", whatsapp_phone: null },
    request: { status: "pendente", verification_status: "aguardando_integracao" },
  }),
}));

describe("DivulgadorUpgradeCard", () => {
  it("bloqueia a liberação enquanto o envio oficial não estiver conectado", () => {
    render(<DivulgadorUpgradeCard />);
    expect(screen.getByRole("heading", { name: "Confirmação pelo WhatsApp" })).toBeInTheDocument();
    expect(screen.getByText(/nenhum código é criado ou mostrado aqui/i)).toBeInTheDocument();
    expect(screen.getByText("Aguardando ativação do envio oficial")).toBeInTheDocument();
  });
});