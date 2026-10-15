export const INVESTOR_PDF_FILENAME = "coe-a-boa-visao-de-negocio-e-futuro.pdf";

export const investorPitchSections = [
  { title: "Visão de Negócio", paragraphs: [
    "O Coé a Boa? nasceu para resolver um problema real: ajudar o público a descobrir os melhores rolês da cidade de forma simples e oferecer aos comerciantes locais um canal direto para divulgar seus produtos, serviços e eventos.",
    "Mais do que um aplicativo, estamos construindo um ponto de encontro digital que aproxima as pessoas do que a cidade tem de melhor e pode fortalecer a economia local.",
  ] },
  { title: "Por que esse negócio tem potencial?", items: [
    ["O Poder da Vizinhança (Hiperlocalidade)", "Em vez de anúncios genéricos para quem está longe, a plataforma busca conectar o comércio local a pessoas da mesma região que procuram onde consumir e se divertir."],
    ["Crescimento Modular", "O formato leve criado para o Rio de Janeiro pode ser replicado em outras cidades e regiões, conforme a validação comercial e o controle dos custos de cada praça."],
    ["Organização e Profissionalismo", "Curadoria cuida da qualidade da agenda, Marketing da imagem e dos espaços de marcas, Comercial das parcerias e do pós-venda, e Financeiro do controle e da transparência."],
  ] },
  { title: "Muito Além do Resultado: O Propósito de Construir Juntos", paragraphs: [
    "Investir tempo, energia e recursos no Coé a Boa? vai além do retorno financeiro. É a oportunidade de criar um produto presente na rotina das pessoas, que apoia o comércio local e gera orgulho.",
    "É uma jornada empresarial que une estratégia, organização e o compromisso de construir algo duradouro e marcante.",
  ] },
  { title: "O Futuro é Agora", paragraphs: [
    "Estamos nos estruturando para crescer com responsabilidade e conquistar espaço no mercado, praça a praça, com resultados medidos e validação local.",
  ] },
] as const;

export async function buildInvestorPitchPdf(blocks?: { text: string; heading: boolean }[]) {
  const { default: JsPDF } = await import("jspdf");
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const margin = 18, width = 174, bottom = 276;
  let y = 24;
  const ensure = (height: number) => { if (y + height > bottom) { doc.addPage(); y = 22; } };
  const write = (text: string, size: number, style: "normal" | "bold" = "normal", gap = 4) => {
    doc.setFont("helvetica", style); doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width) as string[];
    const lineHeight = size * 0.45;
    ensure(lines.length * lineHeight);
    doc.text(lines, margin, y); y += lines.length * lineHeight + gap;
  };
  doc.setTextColor(15, 23, 42);
  write("Coé a Boa? | Visão de Negócio & Futuro", 20, "bold", 5);
  write("Conectando Pessoas, Comércios e a Energia do Rio de Janeiro.", 12, "normal", 9);
  if (blocks) {
    for (const block of blocks) write(block.text, block.heading ? 13 : 10.5, block.heading ? "bold" : "normal", block.heading ? 5 : 4);
  } else for (const section of investorPitchSections) {
    write(section.title, 14, "bold", 4);
    if ("paragraphs" in section) section.paragraphs.forEach((p) => write(p, 10.5));
    if ("items" in section) section.items.forEach(([title, text]) => { write(title, 11, "bold", 2); write(text, 10.5); });
    y += 3;
  }
  doc.setTextColor(90, 90, 90);
  write("Preços sugeridos e projeções da apresentação online são ilustrativos; não representam receita realizada nem retorno garantido. Expansão sujeita à validação da praça-piloto.", 8.5, "normal", 0);
  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}