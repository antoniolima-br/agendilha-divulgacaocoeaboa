import { lazy, Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
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
import { format, startOfWeek, addDays, eachDayOfInterval, isSameDay, parseISO, subWeeks, startOfDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";
import { Button } from "@/components/ui/button";
 import { handleError } from "@/lib/error-handler";
 import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import logo from "@/assets/coeaboa-logo.webp";
import { getShareData } from "@/lib/sharing";
import { newsletterSubscribeSchema } from "@/schemas/newsletter";
import { HomeAdsCarousel } from "@/components/anuncios/HomeAdsCarousel";
import { HomeMixedHeroCarousel } from "@/components/anuncios/HomeMixedHeroCarousel";
import { usePublishedFlyerAds } from "@/data/useAds";
import { useAdPhotoUrls } from "@/data/useAdPhotoUrls";
import { addDaysToISO, eventDateISO, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";

const sitelinks = [
  { href: "#oferecemos", label: "O que oferecemos" },
  { href: "#ecossistema", label: "Ecossistema" },
  { href: "#diferenciais", label: "Diferenciais" },
  { href: "#contato", label: "Contato" },
];

const genres = [
  { id: "musica", label: "Música", icon: Music },
  { id: "cultura", label: "Cultura", icon: Sparkles },
  { id: "gastronomia", label: "Gastronomia", icon: Globe2 },
  { id: "esporte", label: "Esporte", icon: Calendar },
  { id: "turismo", label: "Turismo", icon: Compass },
  { id: "outros", label: "Outros", icon: Megaphone },
];

const marqueeWords = ["Música", "Teatro", "Gastronomia", "Arte", "Workshops", "Feiras", "Cinema", "Literatura", "Dança", "Cultura local"];

function isFreeEventPrice(price?: string | null): boolean {
  const value = (price ?? "").trim().toLowerCase();
  if (!value) return true;
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["0", "0,00", "0.00", "r$ 0", "r$ 0,00", "gratuito", "gratis", "free"].includes(normalized)) return true;
  const amount = Number(normalized.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(amount) && amount === 0;
}

function normalizePreferenceText(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
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
  useScrollReveal();
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { profile, loaded: profileLoaded } = useProfile();
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
   const { ref: loadMoreRef, inView: loadMoreInView } = useInView();
 
   const { 
     data: eventsData, 
     fetchNextPage, 
     hasNextPage, 
     isFetchingNextPage,
     isLoading: eventsLoading 
   } = useInfiniteQuery({
    queryKey: ["landing-events"],
    queryFn: async ({ pageParam = 0 }) => {
      const today = saoPauloTodayISO();
      const { data, error } = await supabase
         .from("public_submissions")
        .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, image_url, is_highlight, highlight_active, highlight_hidden, highlight_until, atrativo_style, description, age_rating, is_suitable_for_minors, views_count, sale_price")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .gte("date", addDaysToISO(today, -1))
        .order('highlight_active', { ascending: false, nullsFirst: false })
        .order('date', { ascending: true })
        .range(pageParam, pageParam + 9);
       
       if (error) throw error;
       return {
         items: (data ?? []).filter((event) => eventDateISO(event.date) >= today),
         nextPage: data.length === 10 ? pageParam + 10 : undefined
       };
     },
     initialPageParam: 0,
     getNextPageParam: (lastPage) => lastPage.nextPage,
   });

    const { data: freeEvents = [], isLoading: freeEventsLoading } = useQuery({
      queryKey: ["landing-free-events"],
      queryFn: async () => {
        const today = saoPauloTodayISO();
        const { data, error } = await supabase
          .from("public_submissions")
          .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, image_url, is_highlight, highlight_active, highlight_hidden, highlight_until, atrativo_style, description, age_rating, is_suitable_for_minors, views_count, sale_price")
          .in("status", [...PUBLIC_EVENT_STATUSES])
          .gte("date", addDaysToISO(today, -1))
          .order("date", { ascending: true })
          .order("start_time", { ascending: true, nullsFirst: false })
          .limit(100);

        if (error) throw error;
        return (data ?? [])
          .filter((event) => eventDateISO(event.date) >= today && !event.is_highlight && !event.highlight_active && isFreeEventPrice(event.sale_price))
          .slice(0, 8);
      },
    });
 
    const allEvents = useMemo(() => eventsData?.pages.flatMap(page => page.items) || [], [eventsData]);
    const visualEvents = useMemo(
      () => allEvents.filter((event) => event.is_highlight || event.highlight_active || !isFreeEventPrice(event.sale_price)),
      [allEvents],
    );
    const [heroSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
    const { data: flyerAds = [] } = usePublishedFlyerAds();
    const { data: flyerUrls = {} } = useAdPhotoUrls(flyerAds.map((ad) => ad.photos[0]));
    const homeFlyerEvents = useMemo(() => {
      const spParts = (iso: string) => {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(new Date(iso));
        const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
        return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
      };
      const flyers = flyerAds
        .filter((ad) => ad.event_date && flyerUrls[ad.photos[0]])
        .map((ad) => {
          const { date, time } = spParts(ad.event_date as string);
          return {
            id: `ad:${ad.id}`,
            event_title: ad.title,
            date,
            start_time: time,
            location: ad.event_location,
            address_neighborhood: ad.neighborhood,
            category: ad.category,
            description: ad.description,
            image_url: flyerUrls[ad.photos[0]],
          };
        });
      const today = saoPauloTodayISO();
      const pool = [...flyers, ...allEvents];
      const todays = pool.filter((ev) => eventDateISO(ev.date) === today);
      // Só eventos de hoje; se não houver nenhum, mostra os próximos dias.
      const base = todays.length > 0 ? todays : pool.filter((ev) => eventDateISO(ev.date) >= today);
      // Ordem aleatória a cada abertura da página (semente fixa durante a visita).
      const rand = (id: string) => {
        let h = heroSeed;
        for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761);
        return h >>> 0;
      };
      return [...base].sort((a, b) => rand(a.id) - rand(b.id)).slice(0, 8);
    }, [allEvents, flyerAds, flyerUrls, heroSeed]);
    const todayStart = useMemo(() => { const [y, m, d] = saoPauloTodayISO().split("-").map(Number); return new Date(y, m - 1, d); }, []);
    const [weekStart, setWeekStart] = useState(() => { const [y, m, d] = saoPauloTodayISO().split("-").map(Number); return new Date(y, m - 1, d); });
    const [customDate, setCustomDate] = useState<Date | undefined>(new Date());

    const todayStr = useMemo(() => saoPauloTodayISO(), []);
    const todayEvents = useMemo(
      () => allEvents.filter((event) => eventDateISO(event.date) === todayStr).slice(0, 6),
      [allEvents, todayStr],
    );

    const weekDays = useMemo(() => {
      return eachDayOfInterval({
        start: weekStart,
        end: addDays(weekStart, 6)
      });
    }, [weekStart]);

    const daysWithEvents = useMemo(() => {
      const set = new Set<string>();
      visualEvents.forEach(ev => {
        if (ev.date) set.add(ev.date);
      });
      return set;
    }, [visualEvents]);
    
    // Deduplicate: events in alta should not be in today if possible, or limited
    const trendingEvents = useMemo(() => visualEvents
      .filter(e => !todayEvents.find(t => t.id === e.id))
      .slice(0, 8), [visualEvents, todayEvents]);
 
   useEffect(() => {
     if (loadMoreInView && hasNextPage && !isFetchingNextPage) {
       fetchNextPage();
     }
   }, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("agendilha_favorites");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [subscriberPhone, setSubscriberPhone] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberNeighborhood, setSubscriberNeighborhood] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [isSubscribing, setIsSubmitting] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; text: string; url: string; eventId?: string } | null>(null);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter(f => f !== id) : [...prev, id];
      try {
        localStorage.setItem("agendilha_favorites", JSON.stringify(next));
        window.dispatchEvent(new Event("agendilha:favorites"));
      } catch {
        // storage cheio ou bloqueado: segue só com o estado em memória
      }
      return next;
    });
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = newsletterSubscribeSchema.safeParse({
      phone: subscriberPhone,
      name: subscriberName,
      neighborhood: subscriberNeighborhood,
      whatsappConsent,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    const { phone, name, neighborhood } = parsed.data;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: `${phone}@whatsapp.agendilha.app`,
          name: name || null,
          neighborhood: neighborhood || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("Este número já está cadastrado!");
        } else {
          throw error;
        }
      } else {
        toast.success("Cadastro realizado!", {
          description: "Você receberá as novidades da Ilha no seu WhatsApp."
        });
        setSubscriberPhone("");
        setSubscriberName("");
        setSubscriberNeighborhood("");
      }
     } catch (err) {
       handleError(err, "Erro ao realizar cadastro.");
     } finally {
      setIsSubmitting(false);
    }
  };

   const recommendedEvents = useMemo(() => {
     const preferences = profileLoaded && user
       ? [...(profile.musical_preferences ?? []), ...(profile.event_type_preferences ?? []), ...(profile.followed_styles ?? [])]
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

     const matchingUpcoming = allEvents.filter(matchesPreferences);
     return (matchingUpcoming.length > 0 ? matchingUpcoming : allEvents).slice(0, 5);
   }, [allEvents, profile.event_type_preferences, profile.followed_styles, profile.musical_preferences, profileLoaded, todayEvents, user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="theme-coeaboa min-h-screen bg-background text-foreground antialiased font-body selection:bg-primary/15 selection:text-primary">
      <Header />

       {/* ── Destaques full-width ── */}
       <div className="pt-[6.5rem] sm:pt-[7rem]">
         <HomeMixedHeroCarousel
           events={homeFlyerEvents}
           onOpenEvent={(id) => navigate(id.startsWith("ad:") ? `/anuncios/${id.slice(3)}` : `/agenda?event=${id}`)}
         />
       </div>

       <section className="mx-auto w-full max-w-screen-lg px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8">
        {/* Featured Events */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
              <h2 className="text-2xl font-bold font-display">Agenda</h2>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 rounded-full md:h-8 md:w-8" 
                onClick={() => setWeekStart((w) => { const prev = subWeeks(w, 1); return prev < todayStart ? todayStart : prev; })}
                disabled={weekStart <= todayStart}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-1">
                {weekDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const hasEvents = daysWithEvents.has(dayStr);
                  const isSelected = format(customDate || new Date(), "yyyy-MM-dd") === dayStr;
                  
                  return (
                    <button
                      key={day.toString()}
                      onClick={() => {
                        setCustomDate(day);
                        navigate(`/explorar?view=custom&date=${dayStr}`);
                      }}
                      className={cn(
                        "relative flex h-14 min-w-11 flex-col items-center justify-center rounded-xl transition-all",
                        isSelected 
                          ? "bg-primary text-primary-foreground shadow-md scale-105 z-10" 
                          : "bg-card/40 hover:bg-card/60 text-muted-foreground"
                      )}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
                        {format(day, "EEE", { locale: ptBR })}
                      </span>
                      <span className="text-sm font-black">{format(day, "dd")}</span>
                      {hasEvents && !isSelected && (
                        <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary/40" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 rounded-full md:h-8 md:w-8" 
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {trendingEvents.map(ev => (
                <DiscoveryEventCard 
                  key={ev.id} 
                  event={ev} 
                  variant="compact"
                  className="w-full h-auto"
                  onClick={() => navigate(`/agenda?event=${ev.id}`)}
                  isFavorite={favorites.includes(ev.id)}
                  onFavoriteToggle={() => toggleFavorite(ev.id)}
                  onShare={() => {
                    const data = getShareData(ev);
                    setShareData({ ...data, eventId: ev.id });
                  }}
                />
              ))}
            </div>
           {hasNextPage && (
             <div ref={loadMoreRef} className="w-full py-10 flex justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
           )}
        </section>
        {/* Today's Events */}
        <section className="-mt-8 mb-12">
           <div className="mb-4 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
              <h2 className="flex min-w-0 items-center gap-2 font-display text-xl font-bold sm:text-2xl">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acontece hoje
            </h2>
              <Link to="/agenda" className="flex min-h-11 shrink-0 items-center self-start font-bold text-primary xs:self-auto">Ver tudo <ChevronRight className="h-4 w-4"/></Link>
          </div>
          {todayEvents.length > 0 ? (
            <div className="relative">
            {todayEvents.length > 1 && (
              <div className="absolute -top-14 right-24 hidden gap-1 sm:flex">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Anterior" onClick={() => todayRowRef.current?.scrollBy({ left: -(todayRowRef.current.clientWidth * 0.8), behavior: "smooth" })}><ChevronLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Próximo" onClick={() => todayRowRef.current?.scrollBy({ left: todayRowRef.current.clientWidth * 0.8, behavior: "smooth" })}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
            <div ref={todayRowRef} className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-4 overscroll-x-contain [-webkit-overflow-scrolling:touch] sm:gap-4" aria-label="Acontece hoje na Ilha">
              {todayEvents.map(ev => (
                <div key={ev.id} className="w-[calc((100%-1rem)/3)] min-w-0 shrink-0 snap-start sm:w-[calc((100%-2rem)/3)]">
                <DiscoveryEventCard 
                  key={ev.id} 
                  event={ev} 
                  variant="compact"
                  className="w-full h-auto"
                  onClick={() => navigate(`/agenda?event=${ev.id}`)}
                  isFavorite={favorites.includes(ev.id)}
                  onFavoriteToggle={() => toggleFavorite(ev.id)}
                  onShare={() => {
                    const data = getShareData(ev);
                    setShareData({ ...data, eventId: ev.id });
                  }}
                />
                </div>
              ))}
            </div>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-3xl p-8 text-center border border-dashed border-primary/15">
              <Calendar className="h-8 w-8 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">Hoje a Ilha está em recesso. Veja o que rola nos próximos dias.</p>
              <Button onClick={() => navigate("/explorar")} variant="outline" className="rounded-full font-bold">
                Ver próximos dias
              </Button>
            </div>
          )}
        </section>

         {/* Recommendations AI Sections */}

         <section className="mb-12">
           <div className="mb-6 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between">
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
            <div className="bg-muted/30 rounded-3xl p-10 text-center border-2 border-dashed border-primary/10">
              <Sparkles className="h-10 w-10 text-primary/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground/80 mb-2">Ainda não temos sugestões personalizadas</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                {!user 
                  ? "Crie uma conta e selecione seus estilos favoritos para que nossa IA recomende os melhores eventos para você."
                  : "Complete seu perfil com seus estilos musicais favoritos para receber recomendações exclusivas."}
              </p>
              {!user ? (
                <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-full font-bold">
                  Criar minha conta
                </Button>
              ) : (
                <Button onClick={() => setPersonalizationOpen(true)} variant="outline" className="rounded-full font-bold">
                  Definir Preferências
                </Button>
              )}
            </div>
           )}
         </section>

          <section className="mb-16 border-t border-border/60 pt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold font-display">Outras programações</h2>
              </div>
              <Link to="/explorar?view=free" className="text-primary text-sm font-bold flex items-center shrink-0">
                Ver tudo <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {freeEventsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : freeEvents.length > 0 ? (
              <ul
                className={cn(
                  "divide-y divide-border border-y border-border",
                  freeEvents.length >= 4 && "max-h-[13.5rem] overflow-y-auto overscroll-contain pr-1",
                )}
                aria-label="Outras programações"
              >
                {freeEvents.map((event) => {
                  const dateIso = eventDateISO(event.date);
                  const [year, month, day] = dateIso.split("-").map(Number);
                  const dateLabel = year && month && day
                    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(year, month - 1, day))
                    : "Data a confirmar";
                  const timeLabel = event.start_time?.slice(0, 5) || "Horário a confirmar";
                  const locationLabel = [event.location, event.address_neighborhood].filter(Boolean).join(" · ") || "Local a confirmar";

                  return (
                    <li key={event.id}>
                      <Link
                        to={`/agenda?event=${event.id}`}
                        className="group grid min-h-[4.5rem] grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none transition-colors"
                      >
                        <div className="text-xs sm:text-sm text-muted-foreground pl-1 sm:pl-3">
                          <span className="block font-semibold text-foreground capitalize">{dateLabel}</span>
                          <span>{timeLabel}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                            {event.event_title || "Evento"}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{locationLabel}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mr-1 sm:mr-3" aria-hidden="true" />
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

         {/* "Recomendado para você" removido: já coberto por "No seu radar" para evitar duplicação */}

        {/* Newsletter / Public Registration */}
        <section className="mb-12">
          <div className="bg-secondary/10 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
               <h2 className="mb-4 font-display text-2xl font-black sm:text-3xl">Receba o rolê da Ilha no WhatsApp 🎸</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Toda semana, uma curadoria com o que está rolando do Galeão à Ribeira — direto no seu Zap.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input 
                      placeholder="Seu nome" 
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm focus:ring-secondary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input 
                      type="tel" 
                      placeholder="WhatsApp (DDD + Número)" 
                      value={subscriberPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 11) setSubscriberPhone(val);
                      }}
                      required
                      className="h-14 px-6 rounded-2xl border-none bg-white/50 backdrop-blur-sm focus:ring-secondary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col justify-end px-1 sm:px-4">
                    <div className="flex items-start gap-2 bg-white/40 sm:bg-transparent rounded-xl p-3 sm:p-0">
                      <input 
                        type="checkbox" 
                        id="whatsapp-consent-landing" 
                        checked={whatsappConsent}
                        onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="relative mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-secondary after:absolute after:-inset-3 after:content-[''] focus:ring-secondary/20 accent-secondary"
                      />
                      <label htmlFor="whatsapp-consent-landing" className="text-xs sm:text-xs font-medium text-foreground/75 leading-snug cursor-pointer break-words">
                        Autorizo receber notificações, sugestões e promoções pelo WhatsApp.
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isSubscribing}
                    className="w-full h-14 rounded-2xl font-semibold text-base tracking-tight bg-foreground hover:bg-secondary text-background shadow-card flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
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

        {/* Map Explorer CTA */}
        <section className="mb-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-secondary/10 bg-secondary/5 p-5 sm:mb-16 sm:flex-row sm:p-8">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-2">Explore a Ilha no mapa</h3>
            <p className="text-muted-foreground text-sm">Estabelecimentos, shows e pontos culturais em toda a Ilha do Governador.</p>
          </div>
          <Button 
            variant="secondary" 
             className="h-12 w-full rounded-full border border-secondary/20 px-8 font-bold shadow-md transition-all hover:scale-105 sm:w-auto"
            onClick={() => window.open("https://www.google.com/maps/search/eventos+e+bares+na+ilha+do+governador+rio+de+janeiro", "_blank")}
          >
            <MapIcon className="mr-2 h-4 w-4"/> Abrir Mapa
          </Button>
        </section>

        <HomeAdsCarousel variant="banner" />

      </section>

      <footer className="border-t border-border/40 bg-card/30 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-foreground/70">
            <Link to="/agenda" className="hover:text-primary transition-colors">Agenda</Link>
            <Link to="/hoje" className="hover:text-primary transition-colors">Coé a Boa?</Link>
            <Link to="/agenda" className="hover:text-primary transition-colors">Agenda Cultural</Link>
            <Link to="/auth" className="hover:text-primary transition-colors">Divulgue seu evento</Link>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 pt-6 border-t border-border/40 text-center sm:text-left">
            {/* Copyright */}
            <div className="text-xs text-foreground/60 font-medium order-2 sm:order-1">
              © {new Date().getFullYear()} — Todos os direitos reservados
            </div>

            {/* Marca / Slogan */}
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              <img src={logo} alt="Coé a Boa? — Agendilha" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 rounded-full ring-1 ring-primary/15" />
              <div className="leading-tight">
                <div className="font-display text-sm font-black text-foreground tracking-tight">
                  Coé a Boa? <span className="text-foreground/30">•</span> Agendilha
                </div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-semibold">
                  Transparência e Cultura
                </div>
              </div>
            </div>

            {/* Créditos */}
            <div className="text-xs text-foreground/60 font-medium order-3 sm:text-right">
              Criado por{" "}
              <a
                href="https://limaxsistemas.online/"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-foreground/80 hover:text-primary transition-colors hover:underline"
              >
                Lima<span className="text-orange-500">X</span> Soluções
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        
        <PersonalizationDialog open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
        {shareData && (
          <ShareDialog
            open={!!shareData}
            onOpenChange={(open) => !open && setShareData(null)}
            title={shareData.title}
            text={shareData.text}
            url={shareData.url}
          />
        )}
      </Suspense>
    </div>
  );
}
