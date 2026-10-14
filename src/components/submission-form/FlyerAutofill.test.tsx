import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlyerAutofill } from "./FlyerAutofill";
import type { SubmissionFormData } from "./schema";
const mocks = vi.hoisted(() => ({ extract: vi.fn(), image: vi.fn(), loading: vi.fn() }));
vi.mock("@/lib/flyerExtraction", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/flyerExtraction")>(), extractFlyer: mocks.extract }));
vi.mock("@/lib/uploadImage", () => ({ prepareUploadImage: async (file: File) => file }));
function Harness() {
  const form = useForm<SubmissionFormData>({ defaultValues: { eventTitle: "", date: "", startTime: "" } });
  return <><FlyerAutofill form={form} onImage={mocks.image} onLoading={mocks.loading} /><input aria-label="Título" {...form.register("eventTitle")} /></>;
}
beforeEach(() => { vi.clearAllMocks(); URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn(); });
describe("flyer first flow", () => {
  it("reads immediately, fills empty fields and preserves manual access", async () => {
    mocks.extract.mockResolvedValue({ eventTitle: "Samba do domingo" });
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer para preencher evento"), { target: { files: [new File(["photo"], "flyer.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveValue("Samba do domingo"));
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
    expect(screen.getByText("Aguarde um instante que o Coezinho está lendo o seu flyer e preenchendo os dados!")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Meu título" } });
    resolve({ eventTitle: "Outro" });
    await waitFor(() => expect(mocks.loading).toHaveBeenLastCalledWith(false));
    expect(screen.getByLabelText("Título")).toHaveValue("Meu título");
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
    expect(await screen.findByText("Aguarde um instante que o Coezinho está lendo o seu flyer e preenchendo os dados!")).toBeVisible();
    reject(new Error("402 raw gateway response"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Oi, sou o Coezinho! Não consegui ler seu flyer agora, mas deixei os campos abaixo livres pra você preencher rapidinho.");
    expect(screen.queryByText(/402 raw gateway response/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toBeEnabled();
    expect(screen.getByText("Prefiro preencher manualmente")).toBeVisible();
    expect(mocks.loading).toHaveBeenLastCalledWith(false);
  });
});