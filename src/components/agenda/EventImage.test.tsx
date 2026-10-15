import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventImage } from "./EventImage";

describe("event artwork loading", () => {
  it("loads official artwork lazily and falls back locally without another image request", () => {
    render(<EventImage src="/official.jpg" alt="Rolê" />);
    const image = screen.getByRole("img", { name: "Rolê" });
    expect(image).toHaveAttribute("src", "/official.jpg");
    expect(image).toHaveAttribute("loading", "lazy");
    fireEvent.error(image);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("resets image loading when the official artwork changes", () => {
    const { rerender } = render(<EventImage src="/first.jpg" alt="Rolê" />);
    fireEvent.error(screen.getByRole("img"));
    rerender(<EventImage src="/second.jpg" alt="Rolê" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/second.jpg");
    fireEvent.load(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveClass("opacity-100");
  });
});