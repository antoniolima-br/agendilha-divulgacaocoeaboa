import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SubmitReviewDialog } from "./SubmitReviewDialog";

describe("SubmitReviewDialog", () => {
  const base = {
    open: true,
    onOpenChange: vi.fn(),
    image: "https://example.com/flyer.jpg",
    events: [{ title: "Samba na Praça", date: "2026-10-20", startTime: "19:00", endTime: "23:00" }],
    location: "Praça do Jardim",
    neighborhood: "Jardim Guanabara",
    submitting: false,
  };

  it("mostra o resumo e só envia ao confirmar", () => {
    const onConfirm = vi.fn();
    render(<SubmitReviewDialog {...base} onConfirm={onConfirm} />);
    expect(screen.getByText("Samba na Praça")).toBeInTheDocument();
    expect(screen.getByText("20/10/2026")).toBeInTheDocument();
    expect(screen.getByText("19:00 às 23:00")).toBeInTheDocument();
    expect(screen.getByText("Praça do Jardim · Jardim Guanabara")).toBeInTheDocument();
    expect(screen.getByAltText("Flyer do rolê")).toHaveAttribute("src", base.image);
    fireEvent.click(screen.getByRole("button", { name: /Enviar para Curadoria/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("volta para editar sem enviar", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<SubmitReviewDialog {...base} onOpenChange={onOpenChange} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /Voltar \/ Editar/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
