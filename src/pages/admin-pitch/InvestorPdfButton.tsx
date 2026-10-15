import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInvestorPitchPdf, downloadBlob, INVESTOR_PDF_FILENAME } from "./investorPitchPdf";

export function InvestorPdfButton() {
  const root = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    const pitch = root.current?.closest("[data-investor-pitch]");
    const blocks = pitch ? Array.from(pitch.querySelectorAll("h2, h3, h4, p, dt, dd, tr, figcaption")).map((el) => ({
      text: el.tagName === "TR" ? Array.from(el.children).map((cell) => cell.textContent?.trim() || "").join(" / ") : el.textContent?.trim() || "",
      heading: /^H[234]$/.test(el.tagName),
    })).filter((block) => block.text) : undefined;
    buildInvestorPitchPdf(blocks).then((blob) => { if (active) setFile(blob); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [retry]);
  return <div ref={root} className="space-y-2">
    <Button size="lg" className="min-h-12" disabled={!file && !failed} onClick={() => { if (failed) { setRetry((value) => value + 1); return; } if (file) downloadBlob(file, INVESTOR_PDF_FILENAME); }}>
      {file || failed ? <Download aria-hidden="true" /> : <Loader2 aria-hidden="true" className="animate-spin" />}Baixar a Apresentação em PDF
    </Button>
    {failed && <p role="alert" className="text-sm text-destructive">Não deu para preparar o PDF. Toque no botão para tentar de novo.</p>}
  </div>;
}