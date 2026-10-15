import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PitchShare({ audience }: { audience: "investor" | "advertiser" }) {
  const [status, setStatus] = useState("");
  const text = audience === "investor"
    ? "Coé a Boa? — curadoria de eventos e publicidade hiperlocal no Rio de Janeiro. Uma proposta de negócio com governança por setor, Coezinho e expansão condicionada à validação de cada praça. Vamos conversar sobre uma parceria societária?"
    : "Sua marca no próximo rolê: Coé a Boa? conecta eventos e negócios ao público da região. Publicidade regional, flyers em destaque e acompanhamento do engajamento registrado. Vamos definir região, período e pacote para sua campanha?";
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "Coé a Boa?", text });
      else { await navigator.clipboard.writeText(text); setStatus("Resumo copiado."); }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus("Não deu para compartilhar. Use o WhatsApp.");
    }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("Resumo copiado."); }
    catch { setStatus("Não deu para copiar. Use o WhatsApp."); }
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={share}><Share2 aria-hidden="true" />Compartilhar resumo</Button>
      <Button asChild variant="outline"><a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" />WhatsApp</a></Button>
      <Button variant="outline" size="icon" onClick={copy} aria-label="Copiar resumo" title="Copiar resumo">{status === "Resumo copiado." ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</Button>
    </div>
    <p role="status" className="text-sm text-muted-foreground">{status}</p>
  </div>;
}