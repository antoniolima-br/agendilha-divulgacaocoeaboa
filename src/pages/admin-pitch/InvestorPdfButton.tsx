import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInvestorPitchPdf, downloadBlob, INVESTOR_PDF_FILENAME } from "./investorPitchPdf";

export function InvestorPdfButton() {
  const [file, setFile] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    buildInvestorPitchPdf().then((blob) => { if (active) setFile(blob); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return <div className="space-y-2">
    <Button size="lg" className="min-h-12" disabled={!file} onClick={() => file && downloadBlob(file, INVESTOR_PDF_FILENAME)}>
      {file ? <Download aria-hidden="true" /> : <Loader2 aria-hidden="true" className="animate-spin" />}Baixar a Apresentação em PDF
    </Button>
    {failed && <p role="alert" className="text-sm text-destructive">Não deu para preparar o PDF. Recarregue a apresentação e tente de novo.</p>}
  </div>;
}