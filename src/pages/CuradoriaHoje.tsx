import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, ShoppingBasket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { ShareDialog } from "@/components/ShareDialog";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { InlineError } from "@/components/errors/InlineError";
import { HomeAdsCarousel } from "@/components/anuncios/HomeAdsCarousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeoHead } from "@/components/seo/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { addDaysToISO, eventDateISO, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { getEventFallbackImage } from "@/lib/event-utils";
import { getShareData } from "@/lib/sharing";
import { cn } from "@/lib/utils";

type DateFilter = "today" | "tomorrow" | "weekend" | "next7";

interface CuratedEvent {
  id: string;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  address_street: string | null;
  category: string | null;
  description: string | null;
  end_time: string | null;
  image_url: string | null;
  age_rating: string | null;
  is_suitable_for_minors: boolean | null;
  slug: string | null;
  is_highlight: boolean | null;
  highlight_active: boolean | null;
}

const filters: Array<{ id: DateFilter; label: string }> = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "weekend", label: "Fim de semana" },
  { id: "next7", label: "Próximos 7 dias" },
];

function matchesDate(date: string | null, filter: DateFilter): boolean {
  if (!date) return false;
  const eventDay = eventDateISO(date);
  const today = saoPauloTodayISO();
  if (filter === "today") return eventDay === today;
  if (filter === "tomorrow") return eventDay === addDaysToISO(today, 1);
  if (filter === "next7") return eventDay >= today && eventDay <= addDaysToISO(today, 7);

  const todayDate = parseISO(today);
  const daysUntilSaturday = (6 - todayDate.getDay() + 7) % 7;
  const saturday = addDaysToISO(today, daysUntilSaturday);
  const sunday = addDaysToISO(saturday, 1);
  return eventDay >= saturday && eventDay <= sunday;
}

function CuradoriaHojeInner() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [region, setRegion] = useState("all");
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [shareData, setShareData] = useState<{
    title: string;
    text: string;
    url: string;
    eventId?: string;
  } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("agendilha_favorites");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ["curadoria-hoje-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, description, image_url, age_rating, is_suitable_for_minors, slug, is_highlight, highlight_active")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .gte("date", addDaysToISO(saoPauloTodayISO(), -1))
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data ?? []).filter((event) => eventDateISO(event.date) >= saoPauloTodayISO()) as CuratedEvent[];
    },
  });

  const regions = useMemo(() => Array.from(new Set(events
    .map((event) => event.address_neighborhood?.trim())
    .filter((value): value is string => Boolean(value))))
    .sort((a, b) => a.localeCompare(b, "pt-BR")), [events]);

  const visibleEvents = useMemo(() => events.filter((event) => {
    const matchesRegion = region === "all" || event.address_neighborhood === region;
    return matchesRegion && matchesDate(event.date, dateFilter);
  }), [dateFilter, events, region]);

  const todayEvents = useMemo(() => events.filter((event) => {
    const matchesRegion = region === "all" || event.address_neighborhood === region;
    return matchesRegion && eventDateISO(event.date) === saoPauloTodayISO();
  }), [events, region]);

  const upcomingEvents = useMemo(() => {
    const today = saoPauloTodayISO();
    const lastDay = addDaysToISO(today, 7);
    return events.filter((event) => {
      const eventDay = eventDateISO(event.date);
      const matchesRegion = region === "all" || event.address_neighborhood === region;
      return matchesRegion && eventDay > today && eventDay <= lastDay;
    }).slice(0, 8);
  }, [events, region]);

  const featuredEvents = useMemo(() => {
    return [...todayEvents]
      .sort((a, b) => Number(Boolean(b.highlight_active || b.is_highlight)) - Number(Boolean(a.highlight_active || a.is_highlight)))
      .slice(0, 6);
  }, [todayEvents]);

  useEffect(() => setActiveSlide(0), [region]);

  useEffect(() => {
    if (heroPaused || featuredEvents.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % featuredEvents.length);
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [featuredEvents.length, heroPaused]);

  const currentFeature = featuredEvents[activeSlide];
  const selectedLabel = filters.find((item) => item.id === dateFilter)?.label ?? "Hoje";

  const openEvent = (event: CuratedEvent) => navigate(`/evento/${event.slug || event.id}`);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try {
        localStorage.setItem("agendilha_favorites", JSON.stringify(next));
        window.dispatchEvent(new Event("agendilha:favorites"));
      } catch {
        // Mantém a seleção em memória quando o armazenamento não está disponível.
      }
      return next;
    });
  };

  const changeSlide = (direction: -1 | 1) => {
    if (featuredEvents.length < 2) return;
    setActiveSlide((current) => (current + direction + featuredEvents.length) % featuredEvents.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SeoHead
        title="Hoje na Ilha — Coé a Boa?"
        description="Veja a curadoria de eventos de hoje na Ilha do Governador, com destaques e programação completa."
        path="/hoje"
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-32">
        <header className="mb-7 border-b border-border pb-6 sm:mb-10 sm:pb-8">
          <p className="mb-3 text-xs font-bold uppercase text-secondary">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Acontece hoje na Ilha</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                A curadoria do que tá rolando, do primeiro programa ao último show.
              </p>
            </div>
            <span className="text-sm font-semibold text-secondary">
              {todayEvents.length} {todayEvents.length === 1 ? "rolê hoje" : "rolês hoje"}
            </span>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filtrar eventos por data" className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
           <div className="flex w-max gap-2">
            {filters.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={dateFilter === item.id ? "default" : "outline"}
                onClick={() => setDateFilter(item.id)}
                className="h-10 shrink-0 rounded-full px-5 text-sm font-semibold"
                aria-pressed={dateFilter === item.id}
              >
                {item.label}
              </Button>
            ))}
           </div>
          </nav>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="h-11 w-full rounded-full border-foreground/15 bg-card px-4 shadow-sm sm:w-[240px]" aria-label="Selecionar região">
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-secondary" />
              <SelectValue placeholder="Toda a Ilha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda a Ilha</SelectItem>
              {regions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="mb-8 aspect-[16/9] w-full animate-pulse rounded-2xl bg-muted sm:aspect-[21/9]" />
        ) : error ? (
          <InlineError
            error={error}
            title="Não deu pra carregar a curadoria agora."
            description="Confere tua conexão e tenta de novo."
            onRetry={() => refetch()}
          />
        ) : currentFeature ? (
          <section aria-labelledby="destaques-heading" className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="destaques-heading" className="text-lg font-bold sm:text-2xl">Acontece hoje na Ilha</h2>
              {featuredEvents.length > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => changeSlide(-1)} aria-label="Destaque anterior">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => changeSlide(1)} aria-label="Próximo destaque">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => openEvent(currentFeature)}
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
              onFocus={() => setHeroPaused(true)}
              onBlur={() => setHeroPaused(false)}
              className="group relative block h-auto aspect-[16/11] w-full overflow-hidden rounded-lg bg-muted p-0 text-left shadow-elevated outline-none ring-offset-background transition-transform duration-300 hover:-translate-y-0.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:aspect-[21/9]"
            >
              <img
                src={currentFeature.image_url || getEventFallbackImage(currentFeature.category)}
                alt={currentFeature.event_title || "Evento em destaque"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-9">
                <span className="mb-2 inline-flex rounded bg-accent px-2 py-1 text-[10px] font-bold uppercase text-accent-foreground">
                   Patrocinado
                </span>
                <h3 className="max-w-3xl text-xl font-bold leading-tight sm:text-4xl">
                  {currentFeature.event_title || "Rolê na Ilha"}
                </h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-background/80 sm:text-sm">
                  {currentFeature.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{currentFeature.location}</span>}
                  {currentFeature.start_time && <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{currentFeature.start_time.slice(0, 5)}</span>}
                  {currentFeature.date && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{format(parseISO(eventDateISO(currentFeature.date)), "dd MMM", { locale: ptBR })}</span>}
                </div>
              </div>
            </Button>

            {featuredEvents.length > 1 && (
              <div className="mt-3 flex justify-center gap-2" aria-label="Escolher destaque">
                {featuredEvents.map((event, index) => (
                  <Button
                    key={event.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveSlide(index)}
                    className="h-7 w-7 rounded-full p-0"
                    aria-label={`Ir para destaque ${index + 1}`}
                    aria-current={activeSlide === index ? "true" : undefined}
                  >
                    <span className={cn("h-1.5 rounded-full transition-all", activeSlide === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
                  </Button>
                ))}
              </div>
            )}
          </section>
        ) : !isLoading && !error ? (
          <div className="mb-10 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-secondary" />
            <h2 className="font-bold">Nada marcado para hoje ainda.</h2>
            <p className="mt-1 text-sm text-muted-foreground">Veja os próximos rolês logo abaixo.</p>
          </div>
        ) : null}

        {!isLoading && !error && (
          <section aria-labelledby="proximos-patrocinados-heading" className="mb-10">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase text-secondary">Agenda patrocinada</p>
              <h2 id="proximos-patrocinados-heading" className="mt-1 text-xl font-bold sm:text-2xl">Próximos dias</h2>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {upcomingEvents.map((event) => (
                <Button
                  key={event.id}
                  type="button"
                  variant="ghost"
                  onClick={() => openEvent(event)}
                  className="group relative h-auto aspect-[4/5] overflow-hidden rounded-lg border bg-muted p-0 text-left shadow-card hover:bg-muted"
                  aria-label={`Abrir evento patrocinado ${event.event_title || "Evento"}`}
                >
                  <img
                    src={event.image_url || getEventFallbackImage(event.category)}
                    alt={event.event_title || "Evento patrocinado"}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-background sm:p-4">
                    <Badge variant="secondary" className="mb-2 text-[9px] uppercase">Patrocinado</Badge>
                    <p className="mb-1 text-[10px] font-bold uppercase text-background/75">
                      {format(parseISO(eventDateISO(event.date)), "EEE, dd MMM", { locale: ptBR })}
                      {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-bold leading-tight sm:text-base">{event.event_title || "Rolê na Ilha"}</h3>
                    {event.location && <p className="mt-1 truncate text-[11px] text-background/75">{event.location}</p>}
                  </div>
                </Button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {["Amanhã", "Próximos dias", "Fim de semana", "Em breve"].map((label) => (
                  <div key={label} className="flex aspect-[4/5] flex-col justify-end rounded-lg border border-dashed border-border bg-muted/30 p-4">
                    <Badge variant="outline" className="mb-auto w-fit text-[9px] uppercase">Espaço patrocinado</Badge>
                    <CalendarDays className="mb-3 h-7 w-7 text-secondary" aria-hidden="true" />
                    <h3 className="text-sm font-bold sm:text-base">{label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Novos rolês entram aqui assim que forem publicados.</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!error && !isLoading && (
          <>
            <HomeAdsCarousel />

            <aside className="relative mb-9 overflow-hidden rounded-lg border border-accent/40 bg-muted p-4 shadow-card sm:p-5" aria-label="Publicidade da Mercearia do Tio João">
              <span className="absolute right-3 top-2 text-[9px] font-bold uppercase text-muted-foreground">Publicidade</span>
              <div className="flex items-center gap-4 pr-14">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold sm:text-base">Mercearia do Tio João</h2>
                  <p className="mt-0.5 text-xs italic text-muted-foreground sm:text-sm">
                    Qualidade de família para a sua mesa
                  </p>
                </div>
              </div>
            </aside>

            <section aria-labelledby="programacao-heading">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-secondary">Programação</p>
                  <h2 id="programacao-heading" className="mt-1 text-xl font-bold sm:text-3xl">{selectedLabel} na Ilha</h2>
                </div>
              </div>

              {visibleEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-secondary" />
                  <h3 className="font-bold">Nada marcado por aqui ainda.</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Escolha outra data pra descobrir mais rolês.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {visibleEvents.map((event) => (
                    <DiscoveryEventCard
                      key={event.id}
                      event={event}
                      variant="compact"
                      className="h-auto w-full"
                      onClick={() => openEvent(event)}
                      isFavorite={favorites.includes(event.id)}
                      onFavoriteToggle={() => toggleFavorite(event.id)}
                      onShare={() => {
                        const data = getShareData(event);
                        setShareData({ ...data, eventId: event.id });
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="acoes-heading" className="mt-12 border-y border-border py-8 sm:py-10">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-secondary">Faça parte</p>
                  <h2 id="acoes-heading" className="mt-1 text-2xl font-bold sm:text-3xl">Movimente a Ilha</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Button onClick={() => navigate("/divulgador/status")} className="h-16 justify-start rounded-lg px-5 text-base shadow-card">
                  <CalendarDays className="mr-3 h-5 w-5" /> Divulgar evento
                </Button>
                <Button onClick={() => navigate("/anuncios")} variant="outline" className="h-16 justify-start rounded-lg px-5 text-base shadow-card">
                  <BriefcaseBusiness className="mr-3 h-5 w-5 text-secondary" /> Contratar destaque
                </Button>
                <Button onClick={() => navigate("/cadastro")} variant="outline" className="h-16 justify-start rounded-lg px-5 text-base shadow-card">
                  <Plus className="mr-3 h-5 w-5 text-secondary" /> Fazer cadastro
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      {shareData && (
        <ShareDialog
          open={Boolean(shareData)}
          onOpenChange={(open) => !open && setShareData(null)}
          title={shareData.title}
          text={shareData.text}
          url={shareData.url}
        />
      )}
    </div>
  );
}

export default function CuradoriaHoje() {
  return (
    <SectionErrorBoundary context="CuradoriaHoje">
      <CuradoriaHojeInner />
    </SectionErrorBoundary>
  );
}