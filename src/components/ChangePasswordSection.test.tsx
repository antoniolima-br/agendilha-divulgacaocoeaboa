import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChangePasswordSection } from "./ChangePasswordSection";

const mocks = vi.hoisted(() => ({ call: vi.fn(), refresh: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock("@/lib/edge", () => ({ callEdge: mocks.call }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "test", email: "test@example.test" }, refreshMustChangePassword: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));

describe("Required personal password", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  function fill() {
    fireEvent.change(screen.getByLabelText("Senha temporária"), { target: { value: "Temporary!3489" } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "Personal!4839" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "Personal!4839" } });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
  }
  it("does not unlock or navigate after a failed server verification", async () => {
    mocks.call.mockRejectedValueOnce(new Error("Senha temporária incorreta"));
    const onSuccess = vi.fn();
    render(<ChangePasswordSection isTemporary onSuccess={onSuccess} />);
    fill();
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
  it("refreshes account state only after the server confirms the password change", async () => {
    mocks.call.mockResolvedValueOnce({ success: true });
    const onSuccess = vi.fn();
    render(<ChangePasswordSection isTemporary onSuccess={onSuccess} />);
    fill();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(mocks.call).toHaveBeenCalledWith("complete-password-change", { currentPassword: "Temporary!3489", newPassword: "Personal!4839" });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});