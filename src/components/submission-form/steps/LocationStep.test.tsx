import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationStep } from "./LocationStep";

const LOCAL = {
  id: "local-1",
  nome: "Quiosque da Praia",
  endereco: "Praia da Bica",
  numero: "10",
  bairro: "Jardim Guanabara",
  cep: "21931-570",
  complemento: null,
  tipo: "quiosque",
  contato: "21999998888",
};

vi.mock("@/components/estabelecimentos/EstabelecimentoAutocomplete", () => ({
  EstabelecimentoAutocomplete: ({ value, onChange, onSelect }: any) => (
    <div>
      <input
        aria-label="Local autocomplete"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={() => { onChange(LOCAL.nome); onSelect(LOCAL); }}>
        Selecionar local
      </button>
    </div>
  ),
}));

vi.mock("@/components/estabelecimentos/NovoEstabelecimentoDialog", () => ({
  NovoEstabelecimentoDialog: () => null,
}));

function Harness() {
  const [visible, setVisible] = useState(true);
  const form = useForm({
    defaultValues: {
      locationName: "",
      localTipo: "",
      addressNeighborhood: "",
      addressCity: "",
      addressState: "",
      eventAddress: "",
      locationCep: "",
      locationContact: "",
      locationType: "commercial",
      estabelecimentoId: "",
    },
  });
  return (
    <FormProvider {...form}>
      {visible && <LocationStep form={form as any} />}
      <button type="button" onClick={() => setVisible((current) => !current)}>
        Alternar etapa
      </button>
      <output data-testid="location-values">{JSON.stringify(form.watch())}</output>
    </FormProvider>
  );
}

describe("LocationStep autocomplete", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["Centro", "Centro"], ["Botafogo", "Zona Sul"], ["Tijuca", "Grande Tijuca"],
    ["OLARIA", "Zona Norte"], ["Jardim Guanabara", "Ilha do Governador"],
    ["Taquara", "Jacarepaguá"], ["Recreio", "Barra e Recreio"], ["Bangu", "Zona Oeste"],
  ])("consulta CEP e sugere a região de %s", async (bairro, region) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ logradouro: "Rua do Rolê", bairro, localidade: "Rio de Janeiro", uf: "RJ" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("CEP do local"), { target: { value: "21021100" } });
    await waitFor(() => expect(within(screen.getByRole("status", { name: "Região do evento" })).getByText(region)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/21021100/json/", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(JSON.parse(screen.getByTestId("location-values").textContent || "{}")).toMatchObject({ locationCep: "21021-100", eventAddress: "Rua do Rolê", addressNeighborhood: bairro, addressCity: "Rio de Janeiro", addressState: "RJ" });
    fireEvent.change(screen.getByLabelText("Bairro do local"), { target: { value: "Penha" } });
    expect(within(screen.getByRole("status", { name: "Região do evento" })).getByText("Zona Norte")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Cidade do local"), { target: { value: "Niterói" } });
    expect(screen.getByText(/Não identificamos uma região/)).toBeInTheDocument();
  });

  it.each(["not-found", "network", "http"])("permite preenchimento manual quando a consulta falha: %s", async (failure) => {
    vi.stubGlobal("fetch", failure === "network" ? vi.fn().mockRejectedValue(new Error("offline")) : vi.fn().mockResolvedValue({ ok: failure !== "http", json: async () => ({ erro: true }) }));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("CEP do local"), { target: { value: "21021100" } });
    await waitFor(() => expect(screen.getByText(failure === "not-found" ? /CEP não encontrado/ : /Não deu pra consultar/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Endereço resumido"), { target: { value: "Rua manual, 123" } });
    expect(screen.getByLabelText("Endereço resumido")).toHaveValue("Rua manual, 123");
  });

  it("não inventa região para bairro desconhecido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bairro: "Bairro desconhecido", localidade: "Rio de Janeiro" }) }));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("CEP do local"), { target: { value: "21021100" } });
    await waitFor(() => expect(screen.getByText(/Não identificamos uma região/)).toBeInTheDocument());
  });

  it("ignora resposta atrasada depois de apagar o CEP", async () => {
    let resolve: ((value: unknown) => void) | undefined;
    const pending = new Promise((done) => { resolve = done; });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("CEP do local"), { target: { value: "21021100" } });
    fireEvent.change(screen.getByLabelText("CEP do local"), { target: { value: "210" } });
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { resolve?.({ ok: true, json: async () => ({ bairro: "Olaria", localidade: "Rio de Janeiro" }) }); });
    expect(screen.getByLabelText("Bairro do local")).toHaveValue("");
    expect(screen.queryByText("Buscando endereço...")).not.toBeInTheDocument();
  });

  it("preenche o local e preserva os valores ao avançar e voltar", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar local" }));
    expect(screen.getByText("Região do evento")).toBeInTheDocument();
    expect(screen.getByText("Ilha do Governador")).toBeInTheDocument();

    let values = JSON.parse(screen.getByTestId("location-values").textContent || "{}");
    expect(values).toMatchObject({
      locationName: "Quiosque da Praia",
      estabelecimentoId: "local-1",
      eventAddress: "Praia da Bica, 10",
      addressNeighborhood: "Jardim Guanabara",
      localTipo: "quiosque",
      locationContact: "(21) 99999-8888",
      locationCep: "21931-570",
    });

    fireEvent.click(screen.getByRole("button", { name: "Alternar etapa" }));
    fireEvent.click(screen.getByRole("button", { name: "Alternar etapa" }));

    expect(screen.getByLabelText("Local autocomplete")).toHaveValue("Quiosque da Praia");
    values = JSON.parse(screen.getByTestId("location-values").textContent || "{}");
    expect(values.estabelecimentoId).toBe("local-1");
  });
});