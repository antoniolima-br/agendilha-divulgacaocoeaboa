import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AtrativoAutocomplete } from "./AtrativoAutocomplete";
import { EstabelecimentoAutocomplete } from "@/components/estabelecimentos/EstabelecimentoAutocomplete";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("@/lib/entityEvents", () => ({ useEntityRevision: () => 0 }));
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
  it("preserves attraction selection and duplicate warning", async () => {
    const item = { id: "one", name: "Conceição", type: "Show", estabelecimento_id: null };
    mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [item], error: null }) });
    const select = vi.fn();
    render(<AtrativoAutocomplete value="conceicao" onChange={vi.fn()} onSelect={select} />);
    fireEvent.focus(screen.getByRole("textbox"));
    fireEvent.click(await screen.findByRole("button", { name: "Conceição Show" }));
    expect(select).toHaveBeenCalledWith(item);
    expect(screen.getByTestId("atrativo-duplicate-alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Conceição Show" })).not.toBeInTheDocument();
  });
  it("preserves venue selection on mouse down", async () => {
    const item = { id: "one", nome: "Local", bairro: "Bairro", endereco: "Rua" };
    mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve({ data: [item], error: null }) });
    const select = vi.fn();
    const change = vi.fn();
    render(<EstabelecimentoAutocomplete value="Local" onChange={change} onSelect={select} />);
    fireEvent.focus(screen.getByRole("textbox"));
    fireEvent.mouseDown(await screen.findByRole("button", { name: "Local — Bairro Rua" }));
    expect(change).toHaveBeenCalledWith("Local");
    expect(select).toHaveBeenCalledWith(item);
    expect(screen.queryByRole("button", { name: "Local — Bairro Rua" })).not.toBeInTheDocument();
  });
});