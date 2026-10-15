import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlyerUpload } from "./FlyerUpload";
import type { SubmissionFormData } from "./schema";
const { extract } = vi.hoisted(() => ({ extract: vi.fn() }));
vi.mock("@/lib/visionFlyer", async (original) => ({ ...await original<typeof import("@/lib/visionFlyer")>(), extractVisionFlyer: extract }));
function Harness({ saved = "" }: { saved?: string }) {
  const [image, setImage] = useState<File | string | null>(null);
  const form = useForm<SubmissionFormData>({ defaultValues: { eventTitle: "", atrativoName: "", date: "2026-10-15", startTime: "", locationName: "", eventImageUrl: saved } });
  return <><FlyerUpload image={image} onImage={setImage} form={form} /><input aria-label="Título" {...form.register("eventTitle")} /><input aria-label="Atração" {...form.register("atrativoName")} /><input aria-label="Data" {...form.register("date")} /><input aria-label="Horário" {...form.register("startTime")} /><input aria-label="Local" {...form.register("locationName")} /><output aria-label="Arquivo">{image instanceof File ? image.name : ""}</output></>;
}
beforeEach(() => { vi.clearAllMocks(); extract.mockResolvedValue({ eventTitle: "Samba", atrativoName: "Grupo", date: "2026-10-24", startTime: "20:00", locationName: "Bar da Praça" }); URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn(); });
describe("vision flyer upload", () => {
  it("restores saved official artwork without starting another paid reading", async () => {
    render(<Harness saved="https://example.test/saved.flyer.jpg" />);
    await waitFor(() => expect(screen.getByAltText("Flyer oficial do rolê")).toHaveAttribute("src", "https://example.test/saved.flyer.jpg"));
    expect(extract).not.toHaveBeenCalled();
  });
  it("keeps the selected official file when credits prevent reading", async () => {
    extract.mockRejectedValueOnce(Object.assign(new Error("Créditos insuficientes"), { status: 402 }));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer do evento"), { target: { files: [new File(["official"], "official.jpg", { type: "image/jpeg" })] } });
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Arquivo")).toHaveTextContent("official.jpg");
    expect(extract).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-10-15");
  });
  it("autofills five fields and preserves corrections on replacement", async () => {
    render(<Harness />);
    const input = screen.getByLabelText("Enviar flyer do evento");
    fireEvent.change(input, { target: { files: [new File(["first"], "first.png", { type: "image/png" })] } });
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveValue("Samba"));
    expect(screen.getByLabelText("Atração")).toHaveValue("Grupo");
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Título corrigido" } });
    fireEvent.change(input, { target: { files: [new File(["second"], "second.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(extract).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText("Arquivo")).toHaveTextContent("second.jpg");
    expect(screen.getByLabelText("Título")).toHaveValue("Título corrigido");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-10-24");
    expect(screen.getByLabelText("Horário")).toHaveValue("20:00");
    expect(screen.getByLabelText("Local")).toHaveValue("Bar da Praça");
    await waitFor(() => expect(screen.queryByLabelText("Parar leitura")).not.toBeInTheDocument());
  });
  it("ignores an obsolete response and preserves edits made while reading", async () => {
    let first: (value: object) => void = () => {};
    let second: (value: object) => void = () => {};
    extract.mockImplementationOnce(() => new Promise(resolve => { first = resolve; })).mockImplementationOnce(() => new Promise(resolve => { second = resolve; }));
    render(<Harness />);
    const input = screen.getByLabelText("Enviar flyer do evento");
    fireEvent.change(input, { target: { files: [new File(["first"], "first.png", { type: "image/png" })] } });
    fireEvent.change(input, { target: { files: [new File(["second"], "second.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Manual" } });
    first({ eventTitle: "Obsoleto", startTime: "10:00" });
    second({ eventTitle: "Lido", startTime: "20:00" });
    await waitFor(() => expect(screen.getByLabelText("Horário")).toHaveValue("20:00"));
    expect(screen.getByLabelText("Título")).toHaveValue("Manual");
  });
  it.each([
    new File(["gif"], "bad.gif", { type: "image/gif" }),
    new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
  ])("rejects invalid artwork without changing the selected file", (file) => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer do evento"), { target: { files: [file] } });
    expect(screen.getByLabelText("Arquivo")).toHaveTextContent("");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("keeps all manual fields editable after a failed reading", async () => {
    extract.mockRejectedValueOnce(new Error("Não consegui ler o flyer."));
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Enviar flyer do evento"), { target: { files: [new File(["image"], "flyer.png", { type: "image/png" })] } });
    await screen.findByRole("alert");
    for (const [label, value] of [["Título", "Samba manual"], ["Data", "2026-10-25"], ["Horário", "21:00"], ["Local", "Praça"]]) {
      const field = screen.getByLabelText(label);
      expect(field).not.toBeDisabled();
      fireEvent.change(field, { target: { value } });
      expect(field).toHaveValue(value);
    }
    expect(screen.getByLabelText("Arquivo")).toHaveTextContent("flyer.png");
  });
});
