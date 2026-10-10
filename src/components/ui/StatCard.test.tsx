import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StatCard } from "./StatCard";
import { Users } from "lucide-react";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Users" value={100} icon={Users} />);
    expect(screen.getByText("Total Users")).toBeDefined();
    expect(screen.getByText("100")).toBeDefined();
    cleanup();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<StatCard label="Clickable" value={10} icon={Users} onClick={onClick} />);
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalled();
    cleanup();
  });

  it("shows description when expanded", () => {
    render(<StatCard label="Info" value={5} icon={Users} description="Helpful text" />);
    expect(screen.queryByText("Helpful text")).toBeNull();
    fireEvent.click(screen.getByText("Info"));
    expect(screen.getByText("Helpful text")).toBeDefined();
    cleanup();
  });

  it("renders minimal variant", () => {
    render(<StatCard label="Minimal" value={1} icon={Users} variant="minimal" />);
    expect(screen.getByText("Minimal")).toBeDefined();
    cleanup();
  });

  it("renders compact variant", () => {
    render(<StatCard label="Compact" value={1} icon={Users} variant="compact" description="Desc" />);
    expect(screen.getByText("Compact")).toBeDefined();
    expect(screen.getByText("Desc")).toBeDefined();
    cleanup();
  });
});
