import { describe, expect, it } from "vitest";
import { findDuplicateEventStart } from "./eventBatchValidation";

describe("findDuplicateEventStart", () => {
  it("permite vários eventos na mesma data com horários diferentes", () => {
    expect(findDuplicateEventStart([
      { date: "2026-10-10", startTime: "18:00" },
      { date: "2026-10-10", startTime: "20:00" },
      { date: "2026-10-10", startTime: "22:00" },
    ])).toEqual([]);
  });

  it("marca os eventos que repetem data e horário de início", () => {
    expect(findDuplicateEventStart([
      { date: "2026-10-10", startTime: "18:00" },
      { date: "2026-10-10T03:00:00.000Z", startTime: "18:00:00" },
      { date: "2026-10-10", startTime: "20:00" },
    ])).toEqual([0, 1]);
  });

  it("permite o mesmo horário em datas diferentes", () => {
    expect(findDuplicateEventStart([
      { date: "2026-10-10", startTime: "18:00" },
      { date: "2026-10-11", startTime: "18:00" },
    ])).toEqual([]);
  });
});