/** Escapa um valor para CSV RFC 4180 (vírgula, aspas, quebras). */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  // Planilhas interpretam estes prefixos como fórmula, inclusive após espaços.
  const s = /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Gera e baixa um CSV com BOM (compatível Excel) a partir de headers + linhas. */
export function exportRowsToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>
): void {
  const csv = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}