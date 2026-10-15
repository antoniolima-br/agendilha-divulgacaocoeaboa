import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function PwaUpdateNotice({ apply }: { apply: () => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div role="status" className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-elevated">
      <p className="min-w-0 flex-1 text-sm">{failed ? "Não deu pra atualizar. Tente novamente." : "Nova versão disponível!"}</p>
      <Button size="sm" disabled={busy} onClick={async () => {
        setBusy(true);
        const applied = await apply().catch(() => false);
        if (!applied) { setFailed(true); setBusy(false); }
      }}>
        <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin motion-reduce:animate-none" : ""}`} />
        {busy ? "Atualizando…" : "Atualizar"}
      </Button>
    </div>
  );
}
