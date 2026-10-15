import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isGuideFormRoute, useGuideFormVisibility } from "./useGuideFormVisibility";

afterEach(() => vi.restoreAllMocks());
function Harness() {
  const hidden = useGuideFormVisibility();
  const navigate = useNavigate();
  return <><output aria-label="Avatar">{hidden ? "oculto" : "visível"}</output><button onClick={() => navigate("/agenda")}>Listagem</button></>;
}
describe("Guide form visibility", () => {
  it.each(["/enviar-evento", "/anuncios/novo", "/anuncios/abc/editar", "/cadastro/publico", "/cadastro/artista", "/perfil", "/promotor/perfil"])("hides on the form route %s", path => {
    expect(isGuideFormRoute(path)).toBe(true);
  });
  it.each(["/agenda", "/meus-eventos", "/explorar", "/anuncios/abc", "/cadastro/sucesso"])("keeps discovery available on %s", path => {
    expect(isGuideFormRoute(path)).toBe(false);
  });
  it("returns when leaving the event form for a listing", () => {
    render(<MemoryRouter initialEntries={["/enviar-evento"]}><Harness /></MemoryRouter>);
    expect(screen.getByLabelText("Avatar")).toHaveTextContent("oculto");
    act(() => screen.getByRole("button").click());
    expect(screen.getByLabelText("Avatar")).toHaveTextContent("visível");
  });
  it("hides during a visible edit dialog and returns when it closes", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    render(<MemoryRouter initialEntries={["/meus-eventos"]}><Harness /></MemoryRouter>);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.innerHTML = '<input aria-label="Editar título" />';
    act(() => document.body.append(dialog));
    await waitFor(() => expect(screen.getByLabelText("Avatar")).toHaveTextContent("oculto"));
    act(() => dialog.remove());
    await waitFor(() => expect(screen.getByLabelText("Avatar")).toHaveTextContent("visível"));
  });
  it("does not treat the Guide composer as an editing form", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    render(<MemoryRouter><Harness /></MemoryRouter>);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-labelledby", "coezinho-title");
    dialog.innerHTML = '<textarea />';
    await act(async () => { document.body.append(dialog); });
    expect(screen.getByLabelText("Avatar")).toHaveTextContent("visível");
    act(() => dialog.remove());
  });
});