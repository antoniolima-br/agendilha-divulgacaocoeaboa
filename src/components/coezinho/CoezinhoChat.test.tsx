import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoezinhoChat } from "./CoezinhoChat";

const { stop, chatState } = vi.hoisted(() => ({ stop: vi.fn(), chatState: { failNext: false } }));
vi.mock("@ai-sdk/react", async () => {
  const { useState } = await import("react");
  return { useChat: ({ onError }: { onError: () => void }) => {
    const [messages, setMessages] = useState<Array<{ id: string; role: "user"; parts: Array<{ type: "text"; text: string }> }>>([]);
    return { messages, status: "ready", stop, sendMessage: ({ text }: { text: string }) => {
      setMessages([{ id: "test", role: "user", parts: [{ type: "text", text }] }]);
      if (chatState.failNext) onError();
    } };
  } };
});
vi.mock("./GuidePromotions", () => ({ GuidePromotions: () => null }));

describe("Coezinho fresh conversations", () => {
  afterEach(() => {
    cleanup();
    chatState.failNext = false;
  });
  it("welcomes free questions with only two suggestions and clears messages and drafts on close", () => {
    render(<MemoryRouter><CoezinhoChat initiallyOpen /></MemoryRouter>);
    expect(screen.getByText(/Posso acompanhar você na busca/)).toBeInTheDocument();
    expect(screen.getByLabelText("Sugestões rápidas").querySelectorAll("button")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "O que tá rolando hoje?" }));
    expect(screen.getByText("Quais eventos estão rolando hoje?")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Sua mensagem" }), { target: { value: "Rascunho anterior" } });
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(stop).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Falar com o Guia do Coé" }));
    expect(screen.queryByText("Quais eventos estão rolando hoje?")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Sua mensagem" })).toHaveValue("");
    expect(screen.getByText(/Posso acompanhar você na busca/)).toBeInTheDocument();
  });

  it("also starts fresh after Escape", () => {
    render(<MemoryRouter><CoezinhoChat initiallyOpen /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Como divulgar meu evento?" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Falar com o Guia do Coé" }));
    expect(screen.queryByText("Como cadastrar e divulgar meu evento?")).not.toBeInTheDocument();
  });

  it("starts compact, grows with the message and scrolls only after five lines", () => {
    render(<MemoryRouter><CoezinhoChat initiallyOpen /></MemoryRouter>);
    const textarea = screen.getByRole("textbox", { name: "Sua mensagem" });
    Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 96 });
    fireEvent.change(textarea, { target: { value: "Uma mensagem um pouco maior" } });
    expect(textarea).toHaveAttribute("rows", "1");
    expect(textarea).toHaveStyle({ height: "96px", overflowY: "hidden" });

    Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 220 });
    fireEvent.change(textarea, { target: { value: "Linha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5\nLinha 6" } });
    expect(textarea).toHaveStyle({ height: "124px", overflowY: "auto" });

    Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 40 });
    fireEvent.change(textarea, { target: { value: "" } });
    expect(textarea).toHaveStyle({ height: "40px", overflowY: "hidden" });
  });

  it.each([
    ["Quais eventos estão rolando hoje?", /programação atual fica na Agenda/],
    ["Como divulgar meu evento?", /abra Publicar Evento/],
    ["Como funciona o app?", /Eu te ajudo a encontrar a programação na Agenda/],
  ])("answers %s with a useful fallback when the connection fails", async (question, answer) => {
    chatState.failNext = true;
    render(<MemoryRouter><CoezinhoChat initiallyOpen /></MemoryRouter>);
    fireEvent.change(screen.getByRole("textbox", { name: "Sua mensagem" }), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(screen.getByRole("log").textContent).toMatch(answer));
    expect(screen.queryByText(/Não rolou falar/)).not.toBeInTheDocument();
    chatState.failNext = false;
  });
});