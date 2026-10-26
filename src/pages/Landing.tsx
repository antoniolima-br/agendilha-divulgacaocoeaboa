import { TIME_PREFERENCES, cleanTimePreferences } from "@/lib/timePreferences";
import { usePublicEvents } from "@/data/usePublicEvents";
import { InstitutionalCredits } from "@/components/layout/InstitutionalCredits";
import { useGlobalEventFilters } from "@/hooks/useGlobalEventFilters";
import { EventDateFilter } from "@/components/agenda/EventDateFilter";
import { availableEventDays, eventDayStripWindow, eventWeekStart } from "@/lib/eventCalendar";
import { orderHomeFlyersChronologically, splitHomeEventPresentation } from "@/lib/homeEventPresentation";
import { matchesPublicEventFilters } from "@/lib/publicEventFilters";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { REGIONS, regionOf, normalizeGeography, matchesEventGeography } from "@/lib/regions";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
const PersonalizationDialog = lazy(() =>
  import("@/components/PersonalizationDialog").then((m) => ({ default: m.PersonalizationDialog }))
);
const ShareDialog = lazy(() =>
  import("@/components/ShareDialog").then((m) => ({ default: m.ShareDialog }))
);
import {
  Calendar,
  Sparkles,
  Globe2,
  TrendingUp,
  Music,
  MapPin,
  ChevronRight,
  Loader2,
  Compass,
  Megaphone,
  MessageCircle,
  Map as MapIcon,
  ChevronLeft
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
 import { handleError } from "@/lib/error-handler";
 import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import logo from "@/assets/coeaboa-logo.webp";
import { NotificationPreferences } from "@/components/registration/NotificationPreferences";
import { processGeographies } from "@/lib/notificationPreferences";
import { newsletterSubscribeSchema } from "@/schemas/newsletter";
import { activePlacePhrase } from "@/lib/activePlace";
import { HomeVideoHighlight } from "@/components/home/HomeVideoHighlight";
import { RegionNeighborhoodPanel } from "@/components/home/RegionNeighborhoodPanel";
import { HomeAdsCarousel } from "@/components/anuncios/HomeAdsCarousel";
import { HomeMixedHeroCarousel } from "@/components/anuncios/HomeMixedHeroCarousel";
import { EventDetailDialog } from "@/components/agenda/EventDetailDialog";
import type { AgendaEvent } from "@/components/agenda/types";
import { usePublishedFlyerAds } from "@/data/useAds";
import { useAdPhotoUrls } from "@/data/useAdPhotoUrls";
import { addDaysToISO, eventDateISO, formatEventDateTimeBR, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { isHighlightActive, limitHomeCarouselEvents, selectHomeLaunchFlyerEvents } from "@/lib/highlights";

const HOME_CATEGORIES = [
  { key: "turismo", label: "Turismo", hint: "Passeios, excursões e viagens", match: ["turismo"] },
  { key: "gastronomia", label: "Gastronomia", hint: "Buteco, restaurante e lanches", match: ["gastronomia"] },
  { key: "musica", label: "Shows", hint: "Rock, samba, pagode e mais", match: ["musica", "música", "shows", "show"] },
  { key: "cultura", label: "Cultura", hint: "Teatro, dança, circo e afins", match: ["cultura", "teatro"] },
  { key: "esporte", label: "Esporte", hint: "Jogos, corridas e aulas", match: ["esporte"] },
  { key: "promocoes", label: "Promoções", hint: "Ofertas da região", match: ["promocoes", "promoções"] },
  { key: "outros", label: "Outros", hint: "Tudo o que não cabe acima", match: ["outros"] },
];

function normalizePreferenceText(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function useScrollReveal() {
  const observed = useRef<Set<Element>>(new Set());
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      if (!observed.current.has(el)) {
        obs.observe(el);
        observed.current.add(el);
      }
    });
    return () => obs.disconnect();
  }, []);
}

export default function Landing() {
  const [headerH, setHeaderH] = useState(129);
  useEffect(() => {
    const h = document.querySelector("header");
    if (!h) return;
    const upd = () => setHeaderH(Math.round(h.getBoundingClientRect().height));
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);
  useScrollReveal();
  const { user } = useAuth();
  const { profile, loaded: profileLoaded, saveProfile } = useProfile();
  const navigate = useNavigate();
  const todayRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const row = todayRowRef.current;
      if (!row || row.scrollWidth <= row.clientWidth) return;
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      row.scrollTo({ left: atEnd ? 0 : row.scrollLeft + row.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);
  const { data: eventsData } = usePublicEvents();
  const { filters: globalFilters, setFilters: setGlobalFilters } = useGlobalEventFilters();
   const allEvents = useMemo(() => {
     const today = saoPauloTodayISO();
     return (eventsData ?? []).filter((event) => matchesPublicEventFilters(event, globalFilters, "", today));
   }, [eventsData, globalFilters]);
    const { visual: visualEvents } = useMemo(
      () => splitHomeEventPresentation(allEvents), [allEvents],
    );
    const freeEvents = useMemo(() => {
      const listFilters = { ...globalFilters, period: "all" as const, date: "" };
      return (eventsData ?? []).filter((event) =>
        PUBLIC_EVENT_STATUSES.some((status) => status === event.status)
        && matchesPublicEventFilters(event, listFilters),
      ).sort((a, b) => {
        const dateComparison = eventDateISO(a.date).localeCompare(eventDateISO(b.date));
        if (dateComparison !== 0) return dateComparison;
        return (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99");
      });
    }, [eventsData, globalFilters]);
    const promotionalFlyerEvents = visualEvents;
    const todayEventsCount = useMemo(() => {
      const today = saoPauloTodayISO();
      return allEvents.filter((event) => eventDateISO(event.date) === today).length;
    }, [allEvents]);
    const { data: flyerAdsData } = usePublishedFlyerAds();
    const flyerAds = Array.isArray(flyerAdsData) ? flyerAdsData : [];
    const flyerPhotoPaths = flyerAds.flatMap((ad) => {
      const firstPhoto = Array.isArray(ad?.photos) ? ad.photos[0] : undefined;
      return typeof firstPhoto === "string" && firstPhoto.trim() ? [firstPhoto] : [];
    });
    const { data: flyerUrlsData } = useAdPhotoUrls(flyerPhotoPaths);
    const flyerUrls = flyerUrlsData && typeof flyerUrlsData === "object" ? flyerUrlsData : {};
    const unfilteredHomeFlyerEvents = useMemo(() => {
      const spParts = (iso: string) => {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(new Date(iso));
        const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
        return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
      };
      const flyers = flyerAds
        .filter((ad) => {
          const firstPhoto = Array.isArray(ad.photos) ? ad.photos[0] : undefined;
          return Boolean(ad.event_date && firstPhoto && flyerUrls[firstPhoto]);
        })
        .map((ad) => {
          const { date, time } = spParts(ad.event_date as string);
          const firstPhoto = Array.isArray(ad.photos) ? ad.photos[0] : undefined;
          return {
            id: `ad:${ad.id}`,
            event_title: ad.title,
            date,
            start_time: time,
            location: ad.event_location,
            address_neighborhood: ad.neighborhood,
            category: ad.category,
            description: ad.description,
            image_url: firstPhoto ? flyerUrls[firstPhoto] : undefined,
             is_highlight: false,
             highlight_active: false,
          };
        });
      const today = saoPauloTodayISO();
       const eligiblePromotionalFlyers = selectHomeLaunchFlyerEvents(
         promotionalFlyerEvents,
         today,
       );
       const pool = Array.from(new Map(
          [...eligiblePromotionalFlyers, ...flyers].map((event) => [event.id, event]),
       ).values());
      const todays = pool.filter((ev) => eventDateISO(ev.date) === today);
        const activeHighlights = pool.filter((event) =>
          eventDateISO(event.date) >= today && (event.id.startsWith("ad:") || isHighlightActive(event)),
       );
       // Destaques ativos sempre entram no banner; as vagas restantes mantêm a programação atual e futura.
       const base = Array.from(new Map([
         ...activeHighlights,
         ...(todays.length > 0 ? todays : pool.filter((ev) => eventDateISO(ev.date) >= today)),
       ].map((event) => [event.id, event])).values());
       const ordered = orderHomeFlyersChronologically(base);
         return limitHomeCarouselEvents(ordered, today);
    }, [flyerAds, flyerUrls, promotionalFlyerEvents]);

    const [weekStart, setWeekStart] = useState(() => saoPauloTodayISO());
    const [carouselDate, setCarouselDate] = useState("");
    const syncCarouselDate = useCallback((date: string) => {
      setCarouselDate(date);
      setWeekStart(eventWeekStart(date));
    }, []);

    const todayStr = useMemo(() => saoPauloTodayISO(), []);
    const todayEvents = useMemo(
       () => visualEvents.filter((event) => eventDateISO(event.date) === todayStr),
      [visualEvents, todayStr],
    );

    const daysWithEvents = useMemo(() => {
      const days = availableEventDays(eventsData ?? [], globalFilters);
      unfilteredHomeFlyerEvents.forEach((event) => {
        const day = eventDateISO(event.date);
        if (day) days.add(day);
      });
      return days;
    }, [eventsData, globalFilters, unfilteredHomeFlyerEvents]);
    const dayStrip = useMemo(() => eventDayStripWindow(daysWithEvents, weekStart), [daysWithEvents, weekStart]);
    
    // Deduplicate: events in alta should not be in today if possible, or limited
    const trendingEvents = useMemo(() => visualEvents
      .filter(e => !todayEvents.find(t => t.id === e.id))
      .slice(0, 8), [visualEvents, todayEvents]);
 
  const [subscriberPhone, setSubscriberPhone] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberGeographies, setSubscriberGeographies] = useState<string[]>(["all"]);
  const [subscriberInterests, setSubscriberInterests] = useState<string[]>([]);
  const [subscriberTimes, setSubscriberTimes] = useState<string[]>([]);
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [isSubscribing, setIsSubmitting] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [selectedCarouselEvent, setSelectedCarouselEvent] = useState<AgendaEvent | null>(null);

  const openCarouselEvent = useCallback((id: string) => {
    if (id.startsWith("ad:")) {
      navigate(`/anuncios/${id.slice(3)}`);
      return;
    }
    const selected = unfilteredHomeFlyerEvents.find((event) => event.id === id);
    if (!selected) return;
    setSelectedCarouselEvent(selected as AgendaEvent);
    void supabase.rpc("record_event_open", { p_event_id: selected.id, p_origin: "direct", p_channel: "direct" });
  }, [navigate, unfilteredHomeFlyerEvents]);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = newsletterSubscribeSchema.safeParse({
      phone: subscriberPhone,
      name: subscriberName,
      geographies: subscriberGeographies,
      interests: subscriberInterests,
      whatsappConsent,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    const { phone, name, geographies, interests } = parsed.data;
    const audience = processGeographies(geographies);
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: `${phone}@whatsapp.agendilha.app`,
          name: name || null,
          neighborhood: audience.preferred_neighborhood,
          ...audience,
          interests,
          whatsapp_consent: parsed.data.whatsappConsent,
        });

      // Quem está logado leva bairros, regiões e interesses pro Meu Radar.
      if (user && (!error || error.code === "23505")) {
        const merge = (a: unknown, b: string[]) => [...new Set([...(Array.isArray(a) ? a as string[] : []), ...b])];
        await saveProfile({
          followed_regions: merge(profile?.followed_regions, audience.preferred_regions),
          followed_neighborhoods: merge(profile?.followed_neighborhoods, audience.preferred_neighborhoods),
          event_type_preferences: merge(profile?.event_type_preferences, interests),
          preferred_times: cleanTimePreferences(merge(profile?.preferred_times, subscriberTimes)),
        });
      }
      if (error) {
        if (error.code === "23505") {
          toast.info("Este número já está cadastrado!");
        } else {
          throw error;
        }
      } else {
        toast.success("Cadastro realizado!", {
          description: "Suas preferências foram salvas para as novidades no WhatsApp."
        });
        setSubscriberPhone("");
        setSubscriberName("");
        setSubscriberGeographies(["all"]);
        setSubscriberInterests([]);
        setSubscriberTimes([]);
      }
     } catch (err) {
       handleError(err, "Erro ao realizar cadastro.");
     } finally {
      setIsSubmitting(false);
    }
  };

   const recommendedEvents = useMemo(() => {
      const preferences = profileLoaded && user
        ? [
            ...stringList(profile?.musical_preferences),
            ...stringList(profile?.event_type_preferences),
            ...stringList(profile?.followed_styles),
          ]
           .map(normalizePreferenceText)
           .filter(Boolean)
       : [];

     if (preferences.length === 0) return todayEvents.slice(0, 5);

     const matchesPreferences = (event: (typeof allEvents)[number]) => {
       const searchable = normalizePreferenceText([
         event.atrativo_style,
         event.category,
         event.event_title,
         event.description,
       ].filter(Boolean).join(" "));
       return preferences.some((preference) => searchable.includes(preference));
     };

     const matchingToday = todayEvents.filter(matchesPreferences);
     if (matchingToday.length > 0) return matchingToday.slice(0, 5);

     if (todayEvents.length > 0) return todayEvents.slice(0, 5);

     const matchingUpcoming = visualEvents.filter(matchesPreferences);
     return (matchingUpcoming.length > 0 ? matchingUpcoming : visualEvents).slice(0, 5);
   }, [visualEvents, profile?.event_type_preferences, profile?.followed_styles, profile?.musical_preferences, profileLoaded, todayEvents, user]);

  const homeBairro = globalFilters.region;
  const homeCat = globalFilters.category;
  const homeNbh = globalFilters.neighborhood;
  const setHomeBairro = (region: string) => setGlobalFilters({ region });
  const setHomeCat = (category: string) => setGlobalFilters({ category });
  const setHomeNbh = (neighborhood: string) => setGlobalFilters({ neighborhood });
  const homeBairros = REGIONS;
  // A Home sempre abre em "Todas as Regiões"; a pessoa refina pelo "Trocar local".
  const placePhrase = activePlacePhrase(homeBairro, homeNbh);
  useEffect(() => { if (homeBairro !== "all" && !homeBairros.includes(homeBairro as any)) setHomeBairro("all"); }, [homeBairros, homeBairro]);
  const nbhName = (e: any) => String(e.address_neighborhood || "").trim();
  const regionNbhs = useMemo(() => homeBairro === "all" ? [] :
    [...new Set((eventsData ?? []).filter((e: any) => regionOf(e) === homeBairro).map(nbhName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [eventsData, homeBairro]);

  const homeFiltered = useMemo(() => visualEvents.filter((e: any) =>
     matchesEventGeography(e, homeBairro, homeNbh)),
    [visualEvents, homeBairro, homeNbh]);
  return (
    <div className="theme-coeaboa home-action-clarity min-h-screen bg-background text-foreground antialiased font-body selection:bg-primary/15 selection:text-primary">
      <Header />

       <div style={{ paddingTop: headerH }}>
         <HomeVideoHighlight placePhrase={placePhrase} />
         {/* ── Faixa de dias (logo abaixo dos vídeos) ── */}
         {dayStrip.days.length > 0 && <nav aria-label="Dias com rolês" className="mx-auto flex w-full max-w-screen-lg items-center gap-0.5 px-1.5 py-0.5 sm:px-6">
           <Button variant="ghost" size="icon" aria-label="Semana anterior" className="h-7 w-5 shrink-0 rounded-md p-0 text-primary" onClick={() => { if (dayStrip.previous) setWeekStart(dayStrip.previous); }} disabled={!dayStrip.previous}>
             <ChevronLeft className="h-3 w-3" />
           </Button>
           <div className="flex min-w-0 flex-1 snap-x snap-mandatory gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x [-webkit-overflow-scrolling:touch]">
             {dayStrip.days.map((dayStr) => {
               const day = parseISO(dayStr);
               const isSel = (carouselDate || globalFilters.date || todayStr) === dayStr;
               return (
                 <Button variant="ghost" key={dayStr} aria-label={format(day, "EEEE, dd/MM/yyyy", { locale: ptBR })} aria-pressed={isSel} onClick={() => { setGlobalFilters({ period: "custom", date: dayStr }); navigate(`/explorar?view=custom&date=${dayStr}`); }}
                   className={cn("h-7 min-w-10 flex-1 snap-start flex-col justify-center gap-0 rounded px-0 py-0 transition-colors", isSel ? "btn-gold shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                   <span className="text-[9px] font-bold uppercase leading-none sm:text-[10px]">{format(day, "EEEE", { locale: ptBR }).split("-")[0]}</span>
                   <span className="mt-px text-[11px] font-black leading-none sm:text-xs">{format(day, "dd/MM")}</span>
                 </Button>
               );
             })}
           </div>
           <Button variant="ghost" size="icon" aria-label="Próxima semana" className="h-7 w-5 shrink-0 rounded-md p-0 text-primary" onClick={() => { if (dayStrip.next) setWeekStart(dayStrip.next); }} disabled={!dayStrip.next}>
             <ChevronRight className="h-3 w-3" />
           </Button>
         </nav>}
         <div className="mx-auto flex w-full max-w-screen-lg items-center justify-between gap-2 px-4 pt-3 sm:px-6">
           <p className="flex min-w-0 items-center gap-1.5 font-display text-sm font-bold text-foreground">
             <MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{homeBairro === "all" && (!homeNbh || homeNbh === "all") ? "Rolês em Todas as Regiões" : `Rolês ${placePhrase}`}</span>
           </p>
           <Button variant="ghost" size="sm" className="h-11 shrink-0 font-bold text-primary"
             onClick={() => document.getElementById("filtros-local")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
             Trocar local
           </Button>
         </div>
         <section aria-label="Destaque para você" className="mx-auto w-full max-w-screen-lg space-y-6 px-4 pt-4 sm:space-y-8 sm:px-6">
           <HomeAdsCarousel variant="compact" region={globalFilters.region} />
           <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">Destaque para você</h2>
         </section>
         <HomeMixedHeroCarousel
           events={unfilteredHomeFlyerEvents.filter((event) => matchesPublicEventFilters(event, globalFilters))}
           onOpenEvent={openCarouselEvent}
           onActiveDateChange={syncCarouselDate}
         />
       </div>

       <section className="mx-auto w-full max-w-screen-lg px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
         {/* Filtros Local / Categoria */}
         <div id="filtros-local" className="mb-8 grid scroll-mt-32 grid-cols-2 gap-3" aria-label="Filtros de local e categoria">
           <Select value={homeBairro} onValueChange={setHomeBairro}>
             <SelectTrigger aria-label="Filtrar por local" className="h-16 min-w-0 gap-1 rounded-lg border-primary/70 bg-card/60 px-3 font-display text-xs font-bold uppercase text-primary sm:h-11 sm:text-sm">
               <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2"><span className="flex shrink-0 items-center gap-1 text-foreground/70"><MapPin className="h-4 w-4 shrink-0" />Local:</span><span className="block min-w-0 w-full truncate sm:w-auto"><SelectValue /></span></span>
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="all">Todas as regiões</SelectItem>
                {homeBairros.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {regionNbhs.length > 0 && (
              <Select key="nbh-select" value={homeNbh} onValueChange={setHomeNbh}>
                <SelectTrigger aria-label="Filtrar por bairro" className="order-3 col-span-2 h-11 min-w-0 rounded-lg border-primary/70 bg-card/60 font-display text-sm font-bold uppercase text-primary">
                  <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="text-foreground/70">Bairro:</span><SelectValue /></span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {regionNbhs.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
           <Select value={homeCat} onValueChange={setHomeCat}>
             <SelectTrigger aria-label="Filtrar por categoria" className="h-16 min-w-0 gap-1 rounded-lg border-primary/70 bg-card/60 px-3 font-display text-xs font-bold uppercase text-primary sm:h-11 sm:text-sm">
               <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2"><span className="flex shrink-0 items-center gap-1 text-foreground/70"><Sparkles className="h-4 w-4 shrink-0" />Categoria:</span><span className="block min-w-0 w-full truncate sm:w-auto"><SelectValue /></span></span>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Geral</SelectItem>
               {HOME_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
             </SelectContent>
           </Select>
         </div>

         {homeBairro !== "all" && (
           <RegionNeighborhoodPanel region={homeBairro} neighborhood={homeNbh} onPick={setHomeNbh}
             counts={regionNbhs.map((n) => ({ name: n, total: visualEvents.filter((e: any) => regionOf(e) === homeBairro && nbhName(e) === n).length }))} />
         )}

         <div className="mb-10 flex flex-wrap items-center gap-3">
            <EventDateFilter value={globalFilters.date} onChange={(date) => setGlobalFilters({ date, period: date ? "custom" : "all" })} />
         </div>
         {/* Seções por categoria */}
         <div className="mb-12 space-y-12" aria-label="Categorias">
           {HOME_CATEGORIES.filter((c) => homeCat === "all" || c.key === homeCat).map((c) => {
             const evs = homeFiltered.filter((ev: any) => c.match.includes(String(ev?.category || "").toLowerCase().trim()));
              if (evs.length === 0) return null;
             return (
               <section key={c.key}>
                 <div className="mb-3 flex items-end justify-between gap-3 border-b border-primary/25 pb-1.5">
                   <h2 className="min-w-0 font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">
                     {c.label} <span className="font-medium normal-case tracking-normal text-muted-foreground">/ {c.hint}</span>
                   </h2>
                   {evs.length > 2 && (
                     <Link to={`/agenda?category=${encodeURIComponent(c.key)}`} className="flex min-h-9 shrink-0 items-center text-xs font-bold text-primary">Ver tudo <ChevronRight className="h-3 w-3" /></Link>
                   )}
                 </div>
                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                     {evs.slice(0, 4).map((ev: any) => (
                       <button key={ev.id} type="button" onClick={() => navigate(`/agenda?event=${ev.id}`)} className="group min-w-0 text-left">
                         <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted ring-1 ring-border transition group-hover:ring-primary/60">
                           {ev.image_url ? (
                             <img src={ev.image_url} alt={ev.event_title || "Evento"} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                           ) : (
                             <div className="flex h-full items-center justify-center p-3 text-center font-display text-sm font-bold text-primary">{ev.event_title || "Evento"}</div>
                           )}
                         </div>
                         <p className="mt-2 line-clamp-2 font-display text-sm font-extrabold uppercase leading-tight text-foreground">{ev.event_title || ev.location || "Evento"}</p>
                         {ev.location && <p className="mt-0.5 truncate text-xs text-muted-foreground">{ev.location}{ev.address_neighborhood ? ` · ${ev.address_neighborhood}` : ""}</p>}
                         <p className="mt-0.5 text-xs text-primary">{formatEventDateTimeBR(ev.date, ev.start_time)}</p>
                       </button>
                     ))}
                   </div>
               </section>
             );
           })}
         </div>

         {/* Publicidade geral */}
         <div className="mb-10">
           <HomeAdsCarousel variant="banner" region={homeBairro} />
         </div>

        <section id="radar" className="mb-8 scroll-mt-40">
           <div className="mb-3 flex flex-row items-center justify-between gap-3">
             <h2 className="flex min-w-0 items-center gap-2 font-display text-xl font-bold sm:text-2xl">
               <MapPin className="h-5 w-5 text-primary" />
               {user ? "No seu radar" : "Sugestões para você"}
             </h2>
             <Link to="/agenda" className="flex min-h-11 shrink-0 items-center self-start font-bold text-primary xs:self-auto">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
           </div>
           
           {recommendedEvents.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {recommendedEvents.map((ev: any) => {
                const title = ev.event_title || ev.atrativo_style || ev.category || "Evento";
                const iso = ev.date ? eventDateISO(ev.date) : null;
                const dateLabel = iso
                  ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))
                  : null;
                const place = [ev.location, ev.address_neighborhood].filter(Boolean).join(" · ");
                return (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/agenda?event=${ev.id}`)}
                      className="flex w-full items-stretch gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/40 sm:gap-4 sm:p-3"
                    >
                      <img
                        src={ev.image_url || "/placeholder.svg"}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        className="h-24 w-20 shrink-0 rounded-xl object-cover sm:h-28 sm:w-24"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                        {ev.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{ev.category}</span>
                        )}
                        <h3 className="line-clamp-2 font-display text-base font-bold leading-tight text-foreground">{title}</h3>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {dateLabel && <span className="flex items-center gap-1 capitalize"><Calendar className="h-3.5 w-3.5 shrink-0" />{dateLabel}</span>}
                          {ev.start_time && <span>{String(ev.start_time).slice(0, 5)}</span>}
                        </p>
                        {place && (
                          <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{place}</span>
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
           ) : (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-primary/20 bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Sparkles className="h-5 w-5 shrink-0 text-primary/60" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight text-foreground/90">Ainda sem sugestões pra você</h3>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {!user
                      ? "Crie uma conta e escolha seus estilos favoritos."
                      : "Escolha seus estilos favoritos pra receber indicações."}
                  </p>
                </div>
              </div>
              {!user ? (
                <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="h-9 shrink-0 rounded-full font-bold">
                  Criar minha conta
                </Button>
              ) : (
                <Button onClick={() => setPersonalizationOpen(true)} variant="outline" size="sm" className="h-9 shrink-0 rounded-full font-bold">
                  Definir Preferências
                </Button>
              )}
            </div>
           )}
         </section>

         {/* "Recomendado para você" removido: já coberto por "No seu radar" para evitar duplicação */}

          <section className="mb-16 border-t border-border/60 pt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide sm:text-xl">Outras programações</h2>
              </div>
              <Link to="/agenda" className="text-primary text-sm font-bold flex items-center shrink-0">
                Ver tudo <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {freeEvents.length > 0 ? (
              <ul
                className="max-h-[22.5rem] overflow-y-auto divide-y divide-border border-y border-border"
                aria-label="Outras programações"
              >
                {freeEvents.map((event) => {
                  const title = event.event_title || event.atrativo_style || event.category || "Evento";
                  const scheduleLabel = formatEventDateTimeBR(event.date, event.start_time) || "Data e horário a confirmar";
                  const locationLabel = [event.location, event.address_neighborhood].filter(Boolean).join(" · ") || "Local a confirmar";

                  return (
                    <li key={event.id}>
                      <Link
                        to={`/agenda?event=${event.id}`}
                        className="group flex min-h-[5.25rem] flex-col justify-center gap-1.5 px-1 py-3.5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-2"
                      >
                        <h3 className="break-words font-display text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base">
                          {title}
                        </h3>
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                          <span className="flex items-center gap-1.5 font-medium text-primary">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />{scheduleLabel}
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="break-words">{locationLabel}</span>
                          </span>
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="border-y border-border py-8 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma outra programação disponível agora. Confira novamente em breve.</p>
              </div>
            )}
          </section>


        {/* Newsletter / Public Registration */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-4 sm:p-6">
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
               <h2 className="mb-1 font-display text-lg font-black sm:text-2xl">Receba o melhor do rolê no WhatsApp 🎸</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Toda semana, uma curadoria imperdível com o que está rolando de norte a sul — direto no seu Zap.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="space-y-2.5">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Input 
                      aria-label="Seu nome"
                      placeholder="Seu nome" 
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      className="h-11 rounded-xl border-border bg-background px-3.5 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input 
                      aria-label="WhatsApp com DDD"
                      type="tel" 
                      placeholder="WhatsApp (DDD + Número)" 
                      value={subscriberPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 11) setSubscriberPhone(val);
                      }}
                      required
                      className="h-11 rounded-xl border-border bg-background px-3.5 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <NotificationPreferences geographies={subscriberGeographies} onGeographiesChange={setSubscriberGeographies} interests={subscriberInterests} onInterestsChange={setSubscriberInterests} id="newsletter-geography" />
                <fieldset className="space-y-1">
                  <legend className="text-xs font-semibold text-foreground">Horário preferido <span className="font-normal text-muted-foreground">(opcional)</span></legend>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_PREFERENCES.map((t) => {
                      const on = subscriberTimes.includes(t.id);
                      return <button key={t.id} type="button" aria-pressed={on} title={t.hint}
                        onClick={() => setSubscriberTimes((cur) => cur.includes(t.id) ? cur.filter((x) => x !== t.id) : [...cur, t.id])}
                        className={cn("h-8 rounded-md border px-3 text-xs font-semibold transition-colors", on ? "btn-gold border-transparent" : "border-border bg-background text-muted-foreground hover:text-foreground")}>{t.label}</button>;
                    })}
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col justify-end">
                    <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-2 sm:border-0 sm:bg-transparent sm:p-0">
                      <input 
                        type="checkbox" 
                        id="whatsapp-consent-landing" 
                        checked={whatsappConsent}
                        onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="relative mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary after:absolute after:-inset-3 after:content-[''] focus:ring-primary accent-primary"
                      />
                      <label htmlFor="whatsapp-consent-landing" className="cursor-pointer break-words text-xs font-medium leading-snug text-foreground">
                        Autorizo receber notificações, sugestões e promoções pelo WhatsApp.
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <Button 
                    type="submit" 
                    disabled={isSubscribing}
                    className="w-full h-11 rounded-xl font-semibold text-base tracking-tight bg-foreground hover:bg-secondary text-background shadow-card flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <MessageCircle className="h-6 w-6 fill-white" />
                    )}
                    {isSubscribing ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {false && (
                <section className="mb-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-secondary/10 bg-secondary/5 p-5 sm:mb-16 sm:flex-row sm:p-8">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-2">Explore o Rio no mapa</h3>
            <p className="text-muted-foreground text-sm">Estabelecimentos, shows e pontos culturais no Rio de Janeiro.</p>
          </div>
          <Button 
            variant="secondary" 
             className="h-12 w-full rounded-full border border-secondary/20 px-8 font-bold shadow-md transition-all hover:scale-105 sm:w-auto"
            onClick={() => window.open("https://www.google.com/maps/search/eventos+e+bares+na+ilha+do+governador+rio+de+janeiro", "_blank")}
          >
            <MapIcon className="mr-2 h-4 w-4"/> Abrir Mapa
          </Button>
        </section>
        )}

      </section>

      <footer className="border-t border-border/40 bg-card/30 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-6xl flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-center sm:text-left">
            {/* Copyright */}
            <div className="order-2 text-xs font-medium text-muted-foreground sm:order-1">
              © {new Date().getFullYear()} Coé a Boa? — Todos os direitos reservados
            </div>

            {/* Marca / Slogan */}
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              <img src={logo} alt="Coé a Boa?" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 rounded-full ring-1 ring-primary/15" />
              <div className="leading-tight">
                <div className="font-display text-sm font-black text-foreground tracking-tight">
                  Coé a Boa?
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground">
                  Transparência e Cultura
                </div>
              </div>
            </div>

            {/* Créditos */}
            <div className="order-3 text-xs font-medium text-muted-foreground sm:text-right">
              <InstitutionalCredits />
            </div>
          </div>
        </div>
      </footer>

      {personalizationOpen && <Suspense fallback={null}><PersonalizationDialog open onOpenChange={setPersonalizationOpen} /></Suspense>}
      {selectedCarouselEvent && (
        <EventDetailDialog
          event={selectedCarouselEvent}
          onClose={() => setSelectedCarouselEvent(null)}
          trackShare={(id) => { void supabase.rpc("increment_shares", { event_id: id }); }}
        />
      )}
    </div>
  );
}
