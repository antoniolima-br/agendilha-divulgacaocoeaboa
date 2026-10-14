import { describe, expect, it } from "vitest";
import { formatDurationDays, formatPriceBRL } from "./commercialFormatting";

describe("commercial formatting", () => {
  it("formats prices and durations consistently", () => {
    expect(formatPriceBRL(123450)).toMatch(/R\$\s*1\.234,50/);
    expect(formatDurationDays(1)).toBe("1 dia");
    expect(formatDurationDays(7)).toBe("7 dias");
  });
});