import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGuideFormVisibility } from "./useGuideFormVisibility";
function Harness() {
  return <output aria-label="Avatar">{useGuideFormVisibility() ? "oculto" : "visível"}</output>;
}
afterEach(() => vi.restoreAllMocks());
describe("editing versus search visibility", () => {
  it.each(['<form><select><option>Categoria</option></select></form>', '<form><div contenteditable="true"></div></form>', '<div role="dialog"><button role="combobox">Categoria</button></div>', '<aside><input type="file" hidden /></aside>'])("hides for editing or upload: %s", async markup => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    render(<MemoryRouter initialEntries={["/explorar"]}><Harness /></MemoryRouter>);
    const container = document.createElement("div");
    container.innerHTML = markup;
    act(() => document.body.append(container));
    await waitFor(() => expect(screen.getByLabelText("Avatar")).toHaveTextContent("oculto"));
    act(() => container.remove());
    await waitFor(() => expect(screen.getByLabelText("Avatar")).toHaveTextContent("visível"));
  });
  it("keeps event search available", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    render(<MemoryRouter initialEntries={["/explorar"]}><Harness /></MemoryRouter>);
    const container = document.createElement("div");
    container.innerHTML = '<form role="search"><input type="search" /><select><option>Local</option></select></form>';
    await act(async () => { document.body.append(container); });
    expect(screen.getByLabelText("Avatar")).toHaveTextContent("visível");
    act(() => container.remove());
  });
});