import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventImage } from "./EventImage";
describe("official flyer recovery", () => {
  it("tries the official artwork once before showing a fallback", () => {
    render(<EventImage src="/art.flyer.png" alt="Show" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/art.thumb.webp");
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/art.flyer.png");
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("loads official art directly in the detail view", () => {
    render(<EventImage src="/art.flyer.png" alt="Show" fit="contain" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/art.flyer.png");
  });
});