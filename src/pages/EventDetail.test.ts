import { describe, expect, it } from "vitest";
import { eventLookupField } from "./EventDetail";

describe("eventLookupField", () => {
  it("busca links com UUID diretamente pelo ID", () => {
    expect(eventLookupField("b5e195d6-255c-4140-8cac-2af094a522d9")).toBe("id");
  });

  it("mantém links amigáveis buscando pelo slug", () => {
    expect(eventLookupField("musica-ao-vivo-9")).toBe("slug");
  });
});