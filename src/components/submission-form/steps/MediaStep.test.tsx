import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaStep } from "./MediaStep";
import type { SubmissionFormData } from "../schema";

function Harness({ image = null, saved = "" }: { image?: File | string | null; saved?: string }) {
  const form = useForm<SubmissionFormData>({ defaultValues: { eventImageUrl: saved } });
  return <MediaStep form={form} eventImage={image} />;
}
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:official");
  URL.revokeObjectURL = vi.fn();
});
describe("official event artwork", () => {
  it("preserves uploaded flyer without offering standard artwork", () => {
    const { unmount } = render(<Harness image={new File(["image"], "flyer.jpg", { type: "image/jpeg" })} />);
    expect(screen.getByText(/Seu flyer será a imagem oficial/)).toBeVisible();
    expect(screen.getByAltText("Flyer oficial do evento")).toHaveAttribute("src", "blob:official");
    expect(screen.queryByText(/flyer padrão/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:official");
  });
  it("preserves previously saved official artwork", () => {
    render(<Harness saved="https://example.test/official.jpg" />);
    expect(screen.getByAltText("Flyer oficial do evento")).toHaveAttribute("src", "https://example.test/official.jpg");
    expect(screen.queryByText(/flyer padrão/)).not.toBeInTheDocument();
  });
  it("explains generation only at sponsored completion without image", () => {
    render(<Harness />);
    expect(screen.getByText(/patrocinado na revisão/)).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
