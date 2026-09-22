import { describe, expect, it } from "vitest";
import { matchesUserSearch } from "./userSearch";
import type { UserWithRole } from "./types";

const user: UserWithRole = {
  id: "user-1",
  email: "marcia@example.com",
  created_at: "2026-09-22T12:00:00Z",
  is_admin: false,
  status: "collaborator",
  user_type: "divulgador",
  company_type: "Produtora Cultural",
  responsible_name: "Márcia da Conceição",
  phone: "(22) 99999-1234",
  address_neighborhood: "Vila do Abraão",
};

describe("matchesUserSearch", () => {
  it("busca globalmente por dados da conta", () => {
    for (const search of [
      "marcia conceicao",
      "example.com",
      "99999-1234",
      "vila abraao",
      "divulgador",
      "collaborator",
      "produtora cultural",
    ]) {
      expect(matchesUserSearch(user, search)).toBe(true);
    }
  });

  it("ignora acentos, maiúsculas e espaços vazios", () => {
    expect(matchesUserSearch(user, "  MÁRCIA   ABRAÃO ")).toBe(true);
    expect(matchesUserSearch(user, "   ")).toBe(true);
  });

  it("não encontra termos ausentes", () => {
    expect(matchesUserSearch(user, "outro bairro")).toBe(false);
  });
});