import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { callPublicEdge } from "@/lib/edge";
import { Button } from "@/components/ui/button";
import { PitchContentView } from "./admin-pitch/PitchContentView";
import type { AdvertiserPitchContent, PitchContent } from "./admin-pitch/types";

export default function AdminPitchComercial({ audience = "investor" }: { audience?: "investor" | "advertiser" }) {
  const title = audience === "advertiser" ? "Pitch para Anunciantes" : "Coé a Boa? | Visão Societária & Expansão";
  const subtitle = audience === "advertiser" ? "Marcas, patrocinadores e divulgadores · Publicidade regional" : "Conectando Pessoas, Negócios e Diversão em Grande Escala.";
  const [content, setContent] = useState<PitchContent | AdvertiserPitchContent | null>(null);
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPending(true);
    setError("");
    setContent(null);
    callPublicEdge<{ content: PitchContent | AdvertiserPitchContent }>("commercial-pitch", { audience }, { signal: controller.signal })
      .then((result) => {
        if (active) setContent(result.content);
      })
      .catch((e) => { if (active && !(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : "Não deu para abrir. Tente novamente."); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; controller.abort(); };
  }, [audience, retry]);

  return <div className="theme-coeaboa mx-auto w-full min-w-0 max-w-6xl space-y-6 bg-background p-4 text-foreground sm:p-8">
    <Helmet><title>{title} | Coé a Boa?</title><meta name="description" content={subtitle} /></Helmet>
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0 space-y-2"><h1 className="break-words text-2xl font-semibold sm:text-3xl">{audience === "advertiser" ? `${title} · Coé a Boa?` : title}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></div>
    </header>
    {content ? <PitchContentView key={audience} content={content} audience={audience} /> : <section className="mx-auto max-w-sm space-y-5 py-10">
      {pending && <Loader2 aria-label="Carregando pitch" className="h-8 w-8 animate-spin text-primary" />}
      {error && <><p role="alert" className="text-sm text-destructive">{error}</p><Button onClick={() => setRetry((value) => value + 1)} disabled={pending}>Tentar novamente</Button></>}
    </section>}
  </div>;
}
