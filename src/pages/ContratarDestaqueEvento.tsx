import { Navigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Crown, Loader2, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmission } from "@/data";
import { formatDuration, formatPriceBRL, useHighlightPackages } from "@/data/useHighlightPackages";
import { SETTING_KEYS, settingOr, useAppSettings } from "@/data/useAppSettings";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";

type HighlightSubmission = {
  id: string;
  slug: string | null;
  event_title: string | null;
  atrativo_name: string | null;
  promotion_choice: string;
  image_url: string | null;
};

export default function ContratarDestaqueEvento() {
  const { id } = useParams<{ id: string }>();
  const validId = !!id && /^[0-9a-f-]{10,}$/i.test(id);
  const { data: event, isLoading } = useSubmission<HighlightSubmission>(validId ? id : "", "id, slug, event_title, atrativo_name, promotion_choice, image_url");
  const { data: packages = [], isLoading: loadingPackages } = useHighlightPackages();
  const { data: settings } = useAppSettings();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  if (!validId) return <Navigate to="/meus-eventos" replace />;
  if (isLoading || loadingPackages) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!event || event.promotion_choice !== "highlight") return <Navigate to={`/evento-enviado/${id}`} replace />;

  const title = event.event_title || event.atrativo_name || "meu rolê";
  const teamWhatsapp = settingOr(settings, SETTING_KEYS.teamWhatsapp);
  const eventUrl = event.slug ? `${window.location.origin}/evento/${event.slug}` : `${window.location.origin}/evento-enviado/${event.id}`;

  async function requestPackage(packageId: string, whatsappUrl: string) {
    setSelectedPackage(packageId);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ highlight_package_id: packageId })
        .eq("id", event.id);
      if (error) throw error;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      handleError(error, { context: "ContratarDestaqueEvento", fallback: "Não deu pra registrar o plano. Tenta de novo." });
    } finally {
      setSelectedPackage(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:py-12">
      <header className="space-y-3 text-center">
        <Crown className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <h1 className="text-3xl font-black">Contrate o destaque do seu rolê</h1>
        <p className="text-muted-foreground">Escolha um plano para <strong>{title}</strong>. O flyer oficial já está preparado.</p>
      </header>

      {event.image_url && <img src={event.image_url} alt={`Flyer de ${title}`} className="mx-auto aspect-[4/5] w-full max-w-xs rounded-lg border object-cover" />}

      <div className="grid gap-4 sm:grid-cols-2">
        {packages.map((pkg) => {
          const message = `Oi! Quero contratar o ${pkg.name} para o rolê "${title}".\nPlano: ${pkg.name} — ${formatPriceBRL(pkg.price_cents)} · ${formatDuration(pkg.duration_days)}\nEvento: ${eventUrl}`;
          const whatsappUrl = teamWhatsapp ? buildWhatsappUrl(teamWhatsapp, message) : `https://wa.me/?text=${encodeURIComponent(message)}`;
          return (
            <article key={pkg.id} className="flex flex-col rounded-lg border bg-card p-5 shadow-sm">
              <Star className="h-6 w-6 text-primary" aria-hidden />
              <h2 className="mt-3 text-xl font-bold">{pkg.name}</h2>
              {pkg.description && <p className="mt-2 flex-1 text-sm text-muted-foreground">{pkg.description}</p>}
              <p className="mt-4 text-lg font-black">{formatPriceBRL(pkg.price_cents)} <span className="text-sm font-medium text-muted-foreground">· {formatDuration(pkg.duration_days)}</span></p>
              <Button className="mt-4 w-full" disabled={selectedPackage !== null} onClick={() => void requestPackage(pkg.id, whatsappUrl)}>
                {selectedPackage === pkg.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Contratar este plano
              </Button>
            </article>
          );
        })}
      </div>

      <div className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p>Seu evento ganha prioridade na Home depois que a equipe confirmar o pagamento.</p>
      </div>
    </main>
  );
}