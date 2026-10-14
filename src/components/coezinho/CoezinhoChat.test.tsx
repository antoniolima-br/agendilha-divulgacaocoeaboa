import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CoezinhoChat } from "./CoezinhoChat";

const { stop } = vi.hoisted(() => ({ stop: vi.fn() }));
vi.mock("@ai-sdk/react", async () => {
  const { useState } = await import("react");
  return { useChat: () => {
    const [messages, setMessages] = useState<Array<{ id: string; role: "user"; parts: Array<{ type: "text"; text: string }> }>>([]);
    return { messages, status: "ready", stop, sendMessage: ({ text }: { text: string }) => setMessages([{ id: "test", role: "user", parts: [{ type: "text", text }] }]) };
  } };
});

describe("Coezinho fresh conversations", () => {
  it("welcomes free questions with only two suggestions and clears messages and drafts on close", () => {
    render(<MemoryRouter><CoezinhoChat initiallyOpen /></MemoryRouter>);
    expect(screen.getByText(/Pode perguntar à vontade/)).toBeInTheDocument();
    expect(screen.getByLabelText("Sugestões rápidas").querySelectorAll("button")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "O que tá rolando hoje?" }));
    expect(screen.getByText("Quais eventos estão rolando hoje?")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Sua mensagem" }), { target: { value: "Rascunho anterior" } });
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(stop).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Falar com o Guia do Coé" }));
    expect(screen.queryByText("Quais eventos estão rolando hoje?")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Sua mensagem" })).toHaveValue("");
    expect(screen.getByText(/Pode perguntar à vontade/)).toBeInTheDocument();
  });

  it("also starts fresh after Escape", () => {
    render(<MemoryRouter><CoezinhoChat initiallyOpen /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Como divulgar meu evento?" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Falar com o Guia do Coé" }));
    expect(screen.queryByText("Como cadastrar e divulgar meu evento?")).not.toBeInTheDocument();
  });
});