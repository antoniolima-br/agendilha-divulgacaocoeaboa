import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Radar, Save, CalendarDays, MapPin } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useEvents } from "@/data/events";
import { radarEvents } from "@/lib/radar";
import { REGIONS, REGION_NEIGHBORHOODS } from "@/lib/regions";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingState } from "@/components/ui/LoadingState";
import { ROUTES } from "@/routes/config";

const STYLES = ["Samba", "Pagode", "Rock", "MPB", "Funk", "Jazz", "Pop", "Sertanejo", "Eletrônica"];
const CATEGORIES = ["Música", "Gastronomia", "Cultura", "Esporte", "Promoções"];
export default function SeuRadar() {
  const { profile, loaded, saveProfile } = useProfile();
  const { events, isLoading, isError, refetch } = useEvents();
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
  const toggle = (values: string[], value: string, setter: (values: string[]) => void) => setter(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
  const choices = (title: string, options: readonly string[], values: string[], setter: (values: string[]) => void) => <fieldset className="space-y-3"><legend className="font-semibold">{title}</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{options.map((value) => <label key={value} className="flex items-center gap-2 text-sm"><Checkbox checked={values.includes(value)} onCheckedChange={() => toggle(values, value, setter)} />{value}</label>)}</div></fieldset>;
  if (!loaded) return <LoadingState />;
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-2xl font-bold"><Radar className="text-primary" />Seu Radar</h1><Button variant="outline" onClick={() => setEditing(!editing)}>Meus gostos</Button></header>
    {editing && <section className="space-y-6 border-y border-border py-6">
      {choices("Categorias", CATEGORIES, categories, setCategories)}
      {choices("Estilos musicais", STYLES, styles, setStyles)}
      {choices("Regiões", REGIONS, regions, setRegions)}
      <details className="space-y-4"><summary className="cursor-pointer font-semibold">Bairros específicos{neighborhoods.length ? ` · ${neighborhoods.length}` : ""}</summary><div className="max-h-80 space-y-5 overflow-y-auto py-3">{REGIONS.map((region) => choices(region, REGION_NEIGHBORHOODS[region], neighborhoods, setNeighborhoods))}</div></details>
      <Button disabled={saving} onClick={async () => { setSaving(true); try { const saved = await saveProfile({ event_type_preferences: categories, musical_preferences: styles, followed_neighborhoods: neighborhoods, followed_regions: regions }); if (saved) setEditing(false); } finally { setSaving(false); } }}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando…" : "Salvar meus gostos"}</Button>
    </section>}
    {isError ? <div role="alert" className="space-y-3"><p>Não deu pra carregar seu radar agora.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div> : isLoading ? <LoadingState message="Buscando seus rolês…" /> : feed.length ? <ul className="space-y-3">{feed.map((event) => <li key={event.id} className="flex gap-4 rounded-lg border border-border p-4">
      {event.image_url && <img src={event.image_url} alt="" loading="lazy" className="hidden h-24 w-20 shrink-0 rounded-md object-cover sm:block" />}
      <div className="min-w-0 space-y-2"><h2 className="break-words font-semibold">{event.event_title || "Rolê sem título"}</h2><p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" />{formatEventDateTimeBR(event.date, event.start_time)}</p><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{event.location || "Local a confirmar"}{event.address_neighborhood ? ` · ${event.address_neighborhood}` : ""}</p><Button asChild variant="outline" size="sm"><Link to={ROUTES.EVENTO_DETAIL.replace(":slug", event.id)}>Ver rolê</Link></Button></div>
    </li>)}</ul> : <div className="space-y-3 py-8"><p>Nenhum rolê no seu radar agora. Ajuste seus gostos ou confira a agenda.</p><Button asChild variant="outline"><Link to={ROUTES.AGENDA}>Ver agenda</Link></Button></div>}
  </main>;
}