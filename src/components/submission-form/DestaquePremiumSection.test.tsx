import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DestaquePremiumSection } from "./DestaquePremiumSection";

describe("DestaquePremiumSection", () => {
  it("permite escolher anúncio gratuito ou com destaque", () => {
    const onChange = vi.fn();
    render(<DestaquePremiumSection value="free" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /anúncio gratuito/i })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: /anúncio com destaque/i }));
    expect(onChange).toHaveBeenCalledWith("highlight");
  });
});