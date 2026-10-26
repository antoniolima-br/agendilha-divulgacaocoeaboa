import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Count = { name: string; total: number };

/** Quando a Home está numa região: rolês por bairro (filtro) e o mapa do lugar escolhido. */
export function RegionNeighborhoodPanel({ region, neighborhood, counts, onPick }: {
  region: string; neighborhood: string; counts: Count[]; onPick: (value: string) => void;
}) {
  const active = neighborhood && neighborhood !== "all" ? neighborhood : null;
  const place = `${active ?? region}, Rio de Janeiro`;
  const total = counts.reduce((sum, c) => sum + c.total, 0);
  const chip = (selected: boolean) => cn(
    "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50",
  );

  return (
    <section aria-label={`Rolês por bairro em ${region}`} className="mb-8 space-y-3">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">
        <MapPin className="h-4 w-4 text-primary" /> Rolês por bairro · {region}
      </h2>
      {counts.length > 0 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por bairro">
          <button type="button" aria-pressed={!active} onClick={() => onPick("all")} className={chip(!active)}>
            Todos <span className="opacity-70">{total}</span>
          </button>
          {counts.map((c) => (
            <button key={c.name} type="button" aria-pressed={active === c.name} onClick={() => onPick(c.name)} className={chip(active === c.name)}>
              {c.name} <span className="opacity-70">{c.total}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ainda não tem rolê com bairro nessa região. Tenta outra ou volta pra Todas as Regiões.</p>
      )}
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          title={`Mapa de ${active ?? region}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-48 w-full border-0 sm:h-64"
        />
      </div>
    </section>
  );
}
