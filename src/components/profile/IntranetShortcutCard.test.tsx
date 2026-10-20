import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
let roles: string[] = [];
vi.mock("@/hooks/useAppPermissions", () => ({ useAppPermissions: () => ({ roles, loading: false }) }));
import { IntranetShortcutCard } from "./IntranetShortcutCard";
const view = () => render(<MemoryRouter><IntranetShortcutCard /></MemoryRouter>);
describe("atalho da Gestão Setorial no perfil", () => {
  it.each([[], ["user"], ["promoter"], ["admin"]])("oculto para %j", (...r) => { roles = r; view(); expect(screen.queryByText("Acessar Gestão Setorial")).toBeNull(); });
  it.each(["master", "senior", "comercial", "financeiro"])("leva %s pra /intranet", (r) => { roles = [r]; view(); expect(screen.getByRole("link", { name: /Acessar Gestão Setorial/ }).getAttribute("href")).toBe("/intranet"); });
});
