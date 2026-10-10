import { describe, expect, it } from "vitest";
import { qk } from "./queryKeys";
describe("query response boundaries", () => {
  it("does not mix profile records with administrative detail payloads", () => {
    expect(qk.profileRecord.byId("same-id")).not.toEqual(qk.userDetails.byId("same-id"));
    expect(qk.profileRecord.byId(null)).toEqual(["profiles", "byId", "none"]);
  });
});