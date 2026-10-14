import { describe, expect, it } from "vitest";
import { profileAccessTitle } from "./HeaderUserMenu";

describe("profileAccessTitle", () => {
  it.each([
    [["master"], false, "Master"],
    [["senior"], false, "Admin Sênior"],
    [["financeiro"], false, "Admin Financeiro"],
    [["marketing"], false, "Admin Marketing"],
    [["admin"], false, "Admin Curador"],
    [[], true, "Divulgador"],
    [[], false, "Visitante"],
  ])("resolve %j como %s", (roles, isDivulgador, expected) => {
    expect(profileAccessTitle(roles as string[], isDivulgador as boolean)).toBe(expected);
  });

  it("respeita a maior autoridade quando há mais de um acesso", () => {
    expect(profileAccessTitle(["admin", "financeiro", "master"], true)).toBe("Master");
  });
});