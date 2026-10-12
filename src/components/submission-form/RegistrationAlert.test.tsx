import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistrationAlert } from "./RegistrationAlert";

describe("registration notices", () => {
  it("offers sponsored registration only after an explicit click", () => {
    const onSponsored = vi.fn();
    render(<RegistrationAlert code="FREE_DAILY_QUOTA" onSponsored={onSponsored} />);
    expect(screen.getByRole("alert")).toHaveTextContent("cota gratuita");
    expect(onSponsored).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Escolher Divulgação Patrocinada" }));
    expect(onSponsored).toHaveBeenCalledTimes(1);
  });
  it("does not imply that paying allows a duplicate", () => {
    render(<RegistrationAlert code="DUPLICATE_EVENT" onSponsored={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("verifique os horários");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});