import { describe, expect, it } from "vitest";
import { canEditOwnEvent, organizerStatus } from "./organizerEventAccess";
describe("edição pessoal antes da aprovação", () => {
  it.each(["rascunho", "draft", "pendente", "pending", "em_revisao", "rejeitado"])("permite %s sem aprovação", (status) => expect(canEditOwnEvent({ status })).toBe(true));
  it.each(["aprovado", "publicado", "divulgado", "suspenso", "cancelado", "unknown"])("bloqueia %s", (status) => expect(canEditOwnEvent({ status })).toBe(false));
  it("não reabre edição depois de suspensão", () => {
    expect(canEditOwnEvent({ status: "pendente", approved_at: "2026-10-01" })).toBe(false);
    expect(canEditOwnEvent({ status: "pendente", published_at: "2026-10-01" })).toBe(false);
    expect(organizerStatus("pendente", "2026-10-01")).toBe("Suspenso");
  });
});
