import { describe, expect, it, vi } from "vitest";
import { exportRowsToCsv } from "./csv";

describe("exportRowsToCsv", () => {
  it("neutraliza fórmulas antes de gerar a planilha", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    exportRowsToCsv("auditoria", ["Nome"], [["=HYPERLINK(\"https://example.com\")"]]);

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toContain("'=HYPERLINK");
  });
});