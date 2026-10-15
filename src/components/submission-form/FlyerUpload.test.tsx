import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlyerUpload } from "./FlyerUpload";
const extract = vi.fn();
vi.mock("@/lib/flyerExtraction", () => ({ extractFlyer: extract }));
function Harness() {
  const [image, setImage] = useState<File | string | null>(null);
  const form = useForm({ defaultValues: { title: "Meu rolê", date: "2026-10-24", time: "20:00", local: "Bar da Praça" } });
  return <><FlyerUpload image={image} onImage={setImage} /><input aria-label="Título" {...form.register("title")} /><input aria-label="Data" {...form.register("date")} /><input aria-label="Horário" {...form.register("time")} /><input aria-label="Local" {...form.register("local")} /><output aria-label="Arquivo">{image instanceof File ? image.name : ""}</output></>;
}
beforeEach(() => { vi.clearAllMocks(); URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn(); });
describe("visual-only flyer upload", () => {
  it("keeps manual values and accepts replacement artwork without invoking OCR", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Enviar flyer do evento");
    fireEvent.change(input, { target: { files: [new File(["first"], "first.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Título corrigido" } });
    fireEvent.change(input, { target: { files: [new File(["second"], "second.jpg", { type: "image/jpeg" })] } });
    expect(screen.getByLabelText("Arquivo")).toHaveTextContent("second.jpg");
    expect(screen.getByLabelText("Título")).toHaveValue("Título corrigido");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-10-24");
    expect(screen.getByLabelText("Horário")).toHaveValue("20:00");
    expect(screen.getByLabelText("Local")).toHaveValue("Bar da Praça");
    expect(extract).not.toHaveBeenCalled();
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
});
