import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVERTISER_PDF_FILENAME, buildAdvertiserPitchPdf } from "./advertiserPitchPdf";
import { downloadBlob } from "./investorPitchPdf";

export function AdvertiserPdfButton() {
  const root = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setFile(null);
    const pitch = root.current?.closest("[data-advertiser-pitch]");
    if (!pitch) return;
    const blocks = Array.from(pitch.querySelectorAll("h2, h3, p, dt, dd, [data-pdf-note]"))
      .filter((el) => !el.closest("[data-pdf-exclude]"))
      .map((el) => ({ text: el.textContent?.trim() || "", heading: /^H[23]$/.test(el.tagName) }))
      .filter((block) => block.text);
    buildAdvertiserPitchPdf(blocks).then((blob) => { if (active) setFile(blob); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [retry]);
  return <div ref={root} data-pdf-exclude className="space-y-2">
    <Button variant="ghost" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-muted-foreground" disabled={!file && !failed} onClick={() => {
      if (failed) { setRetry((value) => value + 1); return; }
      if (file) downloadBlob(file, ADVERTISER_PDF_FILENAME);
    }}>
      {file || failed ? <Download aria-hidden="true" /> : <Loader2 aria-hidden="true" className="animate-spin" />}Baixar a Apresentação em PDF
    </Button>
    {failed && <p role="alert" className="text-sm text-destructive">Não deu para preparar o PDF. Toque no botão para tentar de novo.</p>}
  </div>;
}