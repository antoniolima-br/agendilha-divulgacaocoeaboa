import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CepField, FileUpload } from "./FormFields";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/data/cep", () => ({ fetchCepAddress: mocks.fetch }));
function Address({ onFound }: { onFound: (data: unknown) => void }) {
  const form = useForm({ defaultValues: { addressZip: "" } });
  return <FormProvider {...form}><CepField control={form.control} onCepFound={onFound} /></FormProvider>;
}
beforeEach(() => vi.clearAllMocks());
describe("address lookup request ownership", () => {
  it("does not apply an old CEP response after a newer lookup", async () => {
    let first: (value: unknown) => void = () => {};
    let second: (value: unknown) => void = () => {};
    mocks.fetch.mockImplementationOnce(() => new Promise(resolve => { first = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { second = resolve; }));
    const onFound = vi.fn();
    render(<Address onFound={onFound} />);
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "21021100" } });
    const firstSignal = mocks.fetch.mock.calls[0][1].signal;
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "21931570" } });
    expect(firstSignal.aborted).toBe(true);
    await act(async () => { second({ logradouro: "Novo" }); });
    await act(async () => { first({ logradouro: "Antigo" }); });
    expect(onFound.mock.calls).toEqual([[{ logradouro: "Novo" }]]);
  });
  it("ignores a pending response after the CEP is erased", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.fetch.mockImplementation(() => new Promise(done => { resolve = done; }));
    const onFound = vi.fn();
    render(<Address onFound={onFound} />);
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "21021100" } });
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "" } });
    await act(async () => { resolve({ logradouro: "Antigo" }); });
    expect(onFound).not.toHaveBeenCalled();
  });
  it("allows manual completion when the service fails and cancels on unmount", async () => {
    mocks.fetch.mockRejectedValue(new Error("offline"));
    const onFound = vi.fn();
    const { unmount } = render(<Address onFound={onFound} />);
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "21021100" } });
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(onFound).not.toHaveBeenCalled();
    const signal = mocks.fetch.mock.calls[0][1].signal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
describe("file chooser interaction", () => {
  it("opens the file picker with Enter and Space", () => {
    const { container } = render(<FileUpload label="Flyer" accept="image/*" file={null} onFileChange={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing file input");
    const click = vi.spyOn(input, "click");
    fireEvent.keyDown(screen.getByRole("button", { name: "Flyer" }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Flyer" }), { key: " " });
    expect(click).toHaveBeenCalledTimes(2);
  });
  it("removes the selection without reopening the picker", () => {
    const onFileChange = vi.fn();
    const { container } = render(<FileUpload label="Flyer" accept="image/*" file={new File(["art"], "art.png")} onFileChange={onFileChange} />);
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing file input");
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Remover arquivo" }));
    expect(onFileChange).toHaveBeenCalledWith(null);
    expect(input.value).toBe("");
    expect(click).not.toHaveBeenCalled();
  });
});