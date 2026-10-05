import { describe, expect, it } from "vitest";
import { escapeCsvCell } from "./csv";

describe("exportRowsToCsv", () => {
  it("neutraliza fórmulas antes de gerar a planilha", () => {
    expect(escapeCsvCell("=HYPERLINK(\"https://example.com\")")).toBe("\"'=HYPERLINK(\"\"https://example.com\"\")\"");
    expect(escapeCsvCell(" +SUM(A1:A2)")).toBe("' +SUM(A1:A2)");
  });
});