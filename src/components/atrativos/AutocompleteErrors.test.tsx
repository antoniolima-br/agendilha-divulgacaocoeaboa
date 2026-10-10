import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AtrativoAutocomplete } from "./AtrativoAutocomplete";
import { EstabelecimentoAutocomplete } from "@/components/estabelecimentos/EstabelecimentoAutocomplete";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("@/lib/entityEvents", () => ({ onEntityCreated: () => () => {} }));
beforeEach(() => { mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: null, error: new Error("failed") }) }); });
describe("autocomplete failures", () => {
  it("shows an actionable attraction search failure, not an empty result", async () => {
    render(<AtrativoAutocomplete value="Teste" onChange={vi.fn()} onSelect={vi.fn()} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não deu pra buscar atrativos. Tente de novo em instantes.");
    expect(screen.queryByText("Nenhum atrativo com esse nome ainda.")).not.toBeInTheDocument();
  });
  it("shows an actionable venue search failure", async () => {
    render(<EstabelecimentoAutocomplete value="Teste" onChange={vi.fn()} onSelect={vi.fn()} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não deu pra buscar locais. Tente de novo em instantes.");
  });
});