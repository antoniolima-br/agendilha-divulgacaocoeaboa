export const ADVERTISER_PDF_FILENAME = "coe-a-boa-apresentacao-anunciantes.pdf";

export async function buildAdvertiserPitchPdf(blocks: { text: string; heading: boolean }[]) {
  const { default: JsPDF } = await import("jspdf");
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: "Anuncie no Coé a Boa?", subject: "Apresentação para anunciantes e divulgadores" });
  const margin = 18, width = 174, bottom = 276;
  let y = 24;
  const pageBreak = () => { doc.addPage(); y = 24; };
  for (const block of blocks) {
    const size = block.heading ? 14 : 10.5;
    const lineHeight = size * 0.48;
    doc.setFont("helvetica", block.heading ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(block.text, width) as string[];
    if (block.heading && y + (lines.length + 2) * lineHeight > bottom) pageBreak();
    for (const line of lines) {
      if (y + lineHeight > bottom) pageBreak();
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += block.heading ? 5 : 4;
  }
  return doc.output("blob");
}