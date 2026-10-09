import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import CompartilharMeusEventos from "./CompartilharMeusEventos";
vi.mock("@/data/useMyPublishedEvents", () => ({ useMyPublishedEvents: () => ({ data: [{ id: "1", user_id: "owner", slug: "samba", event_title: "Samba", date: "2099-01-01", start_time: "19:00", location: "Praça", description: "Música ao vivo", status: "aprovado" }], isLoading: false, isError: false }) }));
describe("ações de compartilhamento pessoal", () => {
  it("envia e copia a mesma mensagem individual com link direto", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<MemoryRouter><CompartilharMeusEventos /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Gerar mensagem" }));
    const link = screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
    const message = new URL(link || "").searchParams.get("text");
    expect(message).toContain("/evento/samba");
    fireEvent.click(screen.getByRole("button", { name: "Copiar mensagem" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(message));
  });
});