import { describe, expect, it } from "vitest";
import { userGroup, GROUP_ORDER } from "./userGrouping";

describe("user presentation grouping", () => {
  it("preserves category precedence for hybrid accounts", () => {
    expect(userGroup({ status: "master", user_type: "artist" })).toBe("admin");
    expect(userGroup({ status: "admin", user_type: "divulgador" })).toBe("admin");
    expect(userGroup({ status: "artist", user_type: "estabelecimento" })).toBe("artist");
    expect(userGroup({ status: "collaborator", user_type: "estabelecimento" })).toBe("estabelecimento");
  });
  it.each(["divulgador", "promotor", "promoter"])("retains promoter alias %s", (user_type) => {
    expect(userGroup({ status: "user", user_type })).toBe("divulgador");
  });
  it("keeps unclassified accounts public and group order unchanged", () => {
    expect(userGroup({})).toBe("usuario");
    expect(userGroup({ status: "collaborator" })).toBe("divulgador");
    expect(GROUP_ORDER).toEqual(["admin", "divulgador", "artist", "estabelecimento", "usuario"]);
  });
});