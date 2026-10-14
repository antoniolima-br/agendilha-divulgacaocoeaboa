import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Radar, Save, Settings2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useEvents } from "@/data/events";
import { radarEvents } from "@/lib/radar";
import { REGIONS, REGION_NEIGHBORHOODS } from "@/lib/regions";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ROUTES } from "@/routes/config";

const STYLES = ["Samba", "Pagode", "Rock", "MPB", "Funk", "Jazz", "Pop", "Sertanejo", "Eletrônica"];
const CATEGORIES = ["Música", "Gastronomia", "Cultura", "Esporte", "Promoções"];

interface ChoiceGroupProps {
  title: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
}

function ChoiceGroup({ title, options, values, onToggle }: ChoiceGroupProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-foreground">{title}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((value) => {
          const checked = values.includes(value);
          return (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border/70 bg-card/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/35 hover:bg-card"
            >
              <Checkbox checked={checked} onCheckedChange={() => onToggle(value)} />
              <span className="min-w-0 break-words">{value}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function SeuRadar() {
  const { profile, loaded, saveProfile } = useProfile();
  const { events, isLoading, isError, refetch } = useEvents({ includeRatings: false });
  const [categories, setCategories] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    setCategories(Array.isArray(profile.event_type_preferences) ? profile.event_type_preferences : []);
    setStyles(Array.isArray(profile.musical_preferences) ? profile.musical_preferences : []);
    setNeighborhoods(Array.isArray(profile.followed_neighborhoods) ? profile.followed_neighborhoods : []);
    setRegions(Array.isArray(profile.followed_regions) ? profile.followed_regions : []);
  }, [loaded, profile]);

  const feed = useMemo(() => radarEvents(events, profile), [events, profile]);
  const toggle = (values: string[], value: string, setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
  };

  async function savePreferences() {
    setSaving(true);
    try {
      const saved = await saveProfile({
        event_type_preferences: categories,
        musical_preferences: styles,
        followed_neighborhoods: neighborhoods,
        followed_regions: regions,
      });
      if (saved) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <LoadingState fullPage />;

  return (
    <PageContainer maxWidth="3xl">
      <SectionHeader
        title="Seu Radar"
        subtitle="Rolês combinando com seus gostos e lugares preferidos."
        rightElement={
          <Button variant={editing ? "secondary" : "outline"} onClick={() => setEditing((current) => !current)}>
            <Settings2 className="h-4 w-4" />
            {editing ? "Fechar ajustes" : "Meus gostos"}
          </Button>
        }
      />

      {editing && (
        <section className="space-y-7 rounded-lg border border-border/70 bg-card/35 p-4 shadow-card sm:p-6" aria-label="Preferências do Radar">
          <ChoiceGroup title="Categorias" options={CATEGORIES} values={categories} onToggle={(value) => toggle(categories, value, setCategories)} />
          <ChoiceGroup title="Estilos musicais" options={STYLES} values={styles} onToggle={(value) => toggle(styles, value, setStyles)} />
          <ChoiceGroup title="Regiões" options={REGIONS} values={regions} onToggle={(value) => toggle(regions, value, setRegions)} />
          <details className="rounded-md border border-border/70 bg-background/35 p-4">
            <summary className="cursor-pointer font-semibold text-foreground">
              Bairros específicos{neighborhoods.length ? ` · ${neighborhoods.length}` : ""}
            </summary>
            <div className="mt-5 max-h-80 space-y-6 overflow-y-auto pr-1">
              {REGIONS.map((region) => (
                <ChoiceGroup key={region} title={region} options={REGION_NEIGHBORHOODS[region]} values={neighborhoods} onToggle={(value) => toggle(neighborhoods, value, setNeighborhoods)} />
              ))}
            </div>
          </details>
          <Button disabled={saving} onClick={() => void savePreferences()} className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            {saving ? "Salvando…" : "Salvar meus gostos"}
          </Button>
        </section>
      )}

      {isError ? (
        <ErrorState title="Não deu pra carregar seu Radar" message="Tente novamente em instantes." onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState message="Buscando seus rolês…" />
      ) : feed.length ? (
        <ul className="space-y-3" aria-label="Rolês do seu Radar">
          {feed.map((event) => (
            <li key={event.id} className="flex gap-4 rounded-lg border border-border/70 bg-card/45 p-3 shadow-card transition-colors hover:border-primary/30 sm:p-4">
              {event.image_url && <img src={event.image_url} alt="" loading="lazy" className="h-24 w-20 shrink-0 rounded-md object-cover" />}
              <div className="min-w-0 flex-1 space-y-2.5">
                <h2 className="break-words text-base font-semibold leading-tight text-foreground sm:text-lg">{event.event_title || "Rolê sem título"}</h2>
                <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{formatEventDateTimeBR(event.date, event.start_time)}</p>
                <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{event.location || "Local a confirmar"}{event.address_neighborhood ? ` · ${event.address_neighborhood}` : ""}</p>
                <Button asChild variant="outline" size="sm"><Link to={ROUTES.EVENTO_DETAIL.replace(":slug", event.id)}>Ver rolê</Link></Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Radar} title="Seu Radar está quietinho agora" description="Ajuste seus gostos ou confira a agenda completa pra encontrar um rolê." actionLabel="Ver agenda" onAction={() => { window.location.href = ROUTES.AGENDA; }} />
      )}
    </PageContainer>
  );
}