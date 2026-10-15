import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlyerAutofill } from "./FlyerAutofill";
import type { SubmissionFormData } from "./schema";
const mocks = vi.hoisted(() => ({ extract: vi.fn(), image: vi.fn(), loading: vi.fn() }));
vi.mock("@/lib/flyerExtraction", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/flyerExtraction")>(), extractFlyer: mocks.extract }));
vi.mock("@/lib/uploadImage", () => ({ prepareUploadImage: async (file: File) => file }));
function Harness() {
  const form = useForm<SubmissionFormData>({ defaultValues: { eventTitle: "", date: "", startTime: "", locationName: "" } });
  return <><FlyerAutofill form={form} onImage={mocks.image} onLoading={mocks.loading} /><input aria-label="Título" {...form.register("eventTitle")} /><input aria-label="Data" {...form.register("date")} /><input aria-label="Horário" {...form.register("startTime")} /><input aria-label="Local" {...form.register("locationName")} /><output aria-label="Título inválido">{form.formState.errors.eventTitle ? "sim" : "não"}</output></>;
}
beforeEach(() => { vi.clearAllMocks(); URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn(); });
describe("flyer first flow", () => {
  it("reads immediately, fills empty fields and preserves manual access", async () => {
    mocks.extract.mockResolvedValue({ eventTitle: "Samba do domingo", date: "2026-10-25", startTime: "20:30", locationName: "Espaço de Teste" });
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer para preencher evento"), { target: { files: [new File(["photo"], "flyer.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveValue("Samba do domingo"));
    expect(screen.getByLabelText("Data")).toHaveValue("2026-10-25");
    expect(screen.getByLabelText("Horário")).toHaveValue("20:30");
    expect(screen.getByLabelText("Local")).toHaveValue("Espaço de Teste");
    expect(mocks.image).toHaveBeenCalledOnce();
    expect(screen.getByText("Prefiro preencher manualmente")).toBeVisible();
    expect(mocks.loading).toHaveBeenLastCalledWith(false);
  });
  it("does not overwrite edits made while reading", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.extract.mockImplementation(() => new Promise(r => { resolve = r; }));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer para preencher evento"), { target: { files: [new File(["photo"], "flyer.png", { type: "image/png" })] } });
    await waitFor(() => expect(mocks.extract).toHaveBeenCalled());
    expect(screen.getByText(/Coezinho está escaneando/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Meu título" } });
    resolve({ eventTitle: "Outro" });
    await waitFor(() => expect(mocks.loading).toHaveBeenLastCalledWith(false));
    expect(screen.getByLabelText("Título")).toHaveValue("Meu título");
  });
  it("prevents concurrent reads from repeated selections or drops and accepts another flyer after completion", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.extract.mockImplementation(() => new Promise(r => { resolve = r; }));
    render(<Harness />);
    const input = screen.getByLabelText("Enviar flyer para preencher evento");
    const flyer = new File(["photo"], "flyer.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [flyer] } });
    await waitFor(() => expect(mocks.extract).toHaveBeenCalledTimes(1));
    expect(input).toBeDisabled();
    fireEvent.change(input, { target: { files: [flyer] } });
    fireEvent.drop(input.parentElement as HTMLElement, { dataTransfer: { files: [flyer] } });
    expect(mocks.image).toHaveBeenCalledTimes(1);
    expect(mocks.extract).toHaveBeenCalledTimes(1);
    resolve({ eventTitle: "Samba" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { files: [flyer] } });
    await waitFor(() => expect(mocks.extract).toHaveBeenCalledTimes(2));
    resolve({ eventTitle: "Samba" });
    await waitFor(() => expect(input).toBeEnabled());
  });
  it("keeps title optional for draft submission when OCR cannot identify one", async () => {
    mocks.extract.mockResolvedValue({ date: "2026-10-25", startTime: "20:30", locationName: "Espaço de Teste" });
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer para preencher evento"), { target: { files: [new File(["photo"], "flyer.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(mocks.loading).toHaveBeenLastCalledWith(false));
    expect(screen.getByLabelText("Título inválido")).toHaveTextContent("não");
    expect(screen.getByLabelText("Título")).toBeEnabled();
    expect(screen.getByLabelText("Data")).toHaveValue("2026-10-25");
    expect(screen.getByLabelText("Horário")).toHaveValue("20:30");
    expect(screen.getByLabelText("Local")).toHaveValue("Espaço de Teste");
  });
  it("rejects unsupported images without calling the reader", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer para preencher evento"), { target: { files: [new File(["gif"], "flyer.gif", { type: "image/gif" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent("JPG, PNG ou WEBP");
    expect(mocks.extract).not.toHaveBeenCalled();
  });
  it("shows a friendly fallback and keeps manual fields available when reading fails", async () => {
    let reject: (reason: Error) => void = () => {};
    mocks.extract.mockImplementation(() => new Promise((_, rejectPromise) => { reject = rejectPromise; }));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer para preencher evento"), { target: { files: [new File(["photo"], "flyer.webp", { type: "image/webp" })] } });
    expect(await screen.findByText(/Coezinho está escaneando/)).toBeVisible();
    reject(new Error("402 raw gateway response"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Oi, sou o Coezinho! Não consegui ler seu flyer agora, mas deixei os campos abaixo livres pra você preencher rapidinho.");
    expect(screen.queryByText(/402 raw gateway response/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toBeEnabled();
    expect(screen.getByText("Prefiro preencher manualmente")).toBeVisible();
    expect(mocks.loading).toHaveBeenLastCalledWith(false);
  });
});