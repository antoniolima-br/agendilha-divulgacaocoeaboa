import { lazy, Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { activeRegions, regionOf } from "@/lib/regions";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { addDaysToISO, eventDateISO, formatEventDateTimeBR, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { isHighlightActive, prioritizeHomeHeroEvents } from "@/lib/highlights";

const HOME_CATEGORIES = [
  { key: "turismo", label: "Turismo", hint: "Passeios, excursões e viagens", match: ["turismo"] },
  { key: "gastronomia", label: "Gastronomia", hint: "Buteco, restaurante e lanches", match: ["gastronomia"] },
  { key: "musica", label: "Shows", hint: "Rock, samba, pagode e mais", match: ["musica", "música", "shows", "show"] },
  { key: "cultura", label: "Cultura", hint: "Teatro, dança, circo e afins", match: ["cultura", "teatro"] },
  { key: "esporte", label: "Esporte", hint: "Jogos, corridas e aulas", match: ["esporte"] },
  { key: "promocoes", label: "Promoções", hint: "Ofertas da região", match: ["promocoes", "promoções"] },
  { key: "outros", label: "Outros", hint: "Tudo o que não cabe acima", match: ["outros"] },
];

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
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { profile, loaded: profileLoaded } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    queryKey: qk.home.events(),
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
       const rows = Array.isArray(data) ? data : [];
       return {
         items: rows.filter((event) => eventDateISO(event.date) >= today),
         nextPage: rows.length === 10 ? pageParam + 10 : undefined
       };
     },
     initialPageParam: 0,
     getNextPageParam: (lastPage) => lastPage.nextPage,
   });

    const { data: freeEventsData, isLoading: freeEventsLoading } = useQuery({
      queryKey: qk.home.freeEvents(),
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
        const rows = Array.isArray(data) ? data : [];
        return rows
          .filter((event) => eventDateISO(event.date) >= today && !event.is_highlight && !event.highlight_active && isFreeEventPrice(event.sale_price))
          .slice(0, 8);
      },
    });

    const { data: promotionalFlyerEventsData } = useQuery({
      queryKey: qk.home.promotionalFlyers(),
      queryFn: async () => {
        const today = saoPauloTodayISO();
        const { data, error } = await supabase
          .from("public_submissions")
          .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, category, image_url, is_highlight, highlight_active, highlight_hidden, highlight_until, atrativo_style, description, age_rating, is_suitable_for_minors, views_count, sale_price")
          .in("status", [...PUBLIC_EVENT_STATUSES])
          .not("image_url", "is", null)
          .gte("date", addDaysToISO(today, -1))
          .order("date", { ascending: true })
          .order("start_time", { ascending: true, nullsFirst: false })
          .limit(100);

        if (error) throw error;
        return (Array.isArray(data) ? data : []).filter(
          (event) => eventDateISO(event.date) >= today && typeof event.image_url === "string" && event.image_url.trim().length > 0,
        );
      },
    });
 
    const freeEvents = useMemo(
      () => Array.isArray(freeEventsData) ? freeEventsData : [],
      [freeEventsData],
    );
    const eventPages = useMemo(
      () => eventsData && Array.isArray(eventsData.pages) ? eventsData.pages : [],
      [eventsData],
    );
    const allEvents = useMemo(
      () => eventPages.flatMap((page) => Array.isArray(page?.items) ? page.items : []),
      [eventPages],
    );
    const promotionalFlyerEvents = useMemo(
      () => Array.isArray(promotionalFlyerEventsData) ? promotionalFlyerEventsData : [],
      [promotionalFlyerEventsData],
    );
    const visualEvents = useMemo(
      () => allEvents.filter((event) => isHighlightActive(event) || !isFreeEventPrice(event.sale_price)),
      [allEvents],
    );
    const [heroSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
    const { data: flyerAdsData } = usePublishedFlyerAds();
    const flyerAds = Array.isArray(flyerAdsData) ? flyerAdsData : [];
    const flyerPhotoPaths = flyerAds.flatMap((ad) => {
      const firstPhoto = Array.isArray(ad?.photos) ? ad.photos[0] : undefined;
      return typeof firstPhoto === "string" && firstPhoto.trim() ? [firstPhoto] : [];
    });
    const { data: flyerUrlsData } = useAdPhotoUrls(flyerPhotoPaths);
    const flyerUrls = flyerUrlsData && typeof flyerUrlsData === "object" ? flyerUrlsData : {};
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
       const pool = Array.from(new Map(
         [...promotionalFlyerEvents, ...flyers, ...allEvents].map((event) => [event.id, event]),
       ).values());
      const todays = pool.filter((ev) => eventDateISO(ev.date) === today);
       const activeHighlights = pool.filter((event) =>
         eventDateISO(event.date) >= today && isHighlightActive(event),
       );
       // Destaques ativos sempre entram no banner; as vagas restantes priorizam o que acontece hoje.
       const base = Array.from(new Map([
         ...activeHighlights,
         ...(todays.length > 0 ? todays : pool.filter((ev) => eventDateISO(ev.date) >= today)),
       ].map((event) => [event.id, event])).values());
      // Ordem aleatória a cada abertura da página (semente fixa durante a visita).
      const rand = (id: string) => {
        let h = heroSeed;
        for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761);
        return h >>> 0;
      };
       return prioritizeHomeHeroEvents(base, rand).slice(0, 8);
    }, [allEvents, flyerAds, flyerUrls, heroSeed, promotionalFlyerEvents]);

    useEffect(() => {
      const channel = supabase
        .channel("home-highlight-updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "submissions" },
          () => void queryClient.invalidateQueries({ queryKey: qk.home.all }),
        )
        .subscribe();

      return () => { void supabase.removeChannel(channel); };
    }, [queryClient]);
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

     const matchingUpcoming = allEvents.filter(matchesPreferences);
     return (matchingUpcoming.length > 0 ? matchingUpcoming : allEvents).slice(0, 5);
   }, [allEvents, profile?.event_type_preferences, profile?.followed_styles, profile?.musical_preferences, profileLoaded, todayEvents, user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const [homeBairro, setHomeBairro] = useState("all");
  const [homeCat, setHomeCat] = useState("all");
  const [homeNbh, setHomeNbh] = useState("all");
  const homeBairros = useMemo(() => activeRegions(allEvents), [allEvents]);
  useEffect(() => { if (homeBairro !== "all" && !homeBairros.includes(homeBairro as any)) setHomeBairro("all"); }, [homeBairros, homeBairro]);
  const nbhName = (e: any) => String(e.address_neighborhood || "").trim();
  const regionNbhs = useMemo(() => homeBairro === "all" ? [] :
    [...new Set(allEvents.filter((e: any) => regionOf(e) === homeBairro).map(nbhName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [allEvents, homeBairro]);
  useEffect(() => { if (homeNbh !== "all" && !regionNbhs.includes(homeNbh)) setHomeNbh("all"); }, [regionNbhs, homeNbh]);
  const homeFiltered = useMemo(() => allEvents.filter((e: any) =>
    (homeBairro === "all" || regionOf(e) === homeBairro) && (homeNbh === "all" || nbhName(e) === homeNbh)),
    [allEvents, homeBairro, homeNbh]);
  return (
    <div className="theme-coeaboa min-h-screen bg-background text-foreground antialiased font-body selection:bg-primary/15 selection:text-primary">
      <Header />

       {/* ── Faixa de dias ── */}
       <div style={{ paddingTop: headerH }}>
         <div className="mx-auto flex w-full max-w-screen-lg items-center gap-1 px-2 py-2 sm:px-6">
           <Button variant="ghost" size="icon" aria-label="Semana anterior" className="h-9 w-9 shrink-0 rounded-full border border-primary/40 text-primary" onClick={() => setWeekStart((w) => { const prev = subWeeks(w, 1); return prev < todayStart ? todayStart : prev; })} disabled={weekStart <= todayStart}>
             <ChevronLeft className="h-4 w-4" />
           </Button>
           <div className="grid flex-1 grid-cols-7 gap-0.5">
             {weekDays.map((day) => {
               const dayStr = format(day, "yyyy-MM-dd");
               const isSel = format(customDate || new Date(), "yyyy-MM-dd") === dayStr;
               return (
                 <button key={dayStr} onClick={() => { setCustomDate(day); navigate(`/explorar?view=custom&date=${dayStr}`); }}
                   className={cn("flex min-h-11 flex-col items-center justify-center rounded-lg px-0.5 py-1 transition-colors", isSel ? "btn-gold shadow-md" : "text-muted-foreground hover:text-foreground")}>
                   <span className="text-[8px] font-bold uppercase leading-none tracking-wide sm:text-[10px]">{format(day, "EEEE", { locale: ptBR }).split("-")[0]}</span>
                   <span className="mt-0.5 text-[11px] font-black leading-none sm:text-sm">{format(day, "dd/MM")}</span>
                 </button>
               );
             })}
           </div>
           <Button variant="ghost" size="icon" aria-label="Próxima semana" className="h-9 w-9 shrink-0 rounded-full border border-primary/40 text-primary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
             <ChevronRight className="h-4 w-4" />
           </Button>
         </div>
         <HomeMixedHeroCarousel
           events={homeFlyerEvents}
           onOpenEvent={(id) => navigate(id.startsWith("ad:") ? `/anuncios/${id.slice(3)}` : `/agenda?event=${id}`)}
         />
       </div>

       <section className="mx-auto w-full max-w-screen-lg px-4 pb-16 pt-5 sm:px-6 sm:pb-24 sm:pt-8">
         {/* Filtros Local / Categoria */}
         <div className="mb-8 space-y-2">
           <Select value={homeBairro} onValueChange={setHomeBairro}>
             <SelectTrigger aria-label="Filtrar por local" className="h-11 rounded-xl border-primary/70 bg-card/60 font-display text-sm font-bold uppercase tracking-wide text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]">
               <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="text-foreground/70">Local:</span><SelectValue /></span>
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="all">Todas as regiões</SelectItem>
                {homeBairros.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {regionNbhs.length > 0 && (
              <Select value={homeNbh} onValueChange={setHomeNbh}>
                <SelectTrigger aria-label="Filtrar por bairro" className="h-11 rounded-xl border-primary/70 bg-card/60 font-display text-sm font-bold uppercase tracking-wide text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]">
                  <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="text-foreground/70">Bairro:</span><SelectValue /></span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {regionNbhs.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
           <Select value={homeCat} onValueChange={setHomeCat}>
             <SelectTrigger aria-label="Filtrar por categoria" className="h-11 rounded-xl border-primary/70 bg-card/60 font-display text-sm font-bold uppercase tracking-wide text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]">
               <span className="flex min-w-0 items-center gap-2"><Sparkles className="h-4 w-4 shrink-0" /><span className="text-foreground/70">Categoria:</span><SelectValue /></span>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Geral</SelectItem>
               {HOME_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
             </SelectContent>
           </Select>
         </div>

         {/* Seções por categoria */}
         <div className="mb-10 space-y-8" aria-label="Categorias">
           {HOME_CATEGORIES.filter((c) => homeCat === "all" || c.key === homeCat).map((c) => {
             const evs = homeFiltered.filter((ev: any) => c.match.includes(String(ev?.category || "").toLowerCase().trim()));
             return (
               <section key={c.key}>
                 <div className="mb-3 flex items-end justify-between gap-3 border-b border-primary/25 pb-1.5">
                   <h2 className="min-w-0 font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground">
                     {c.label} <span className="font-medium normal-case tracking-normal text-muted-foreground">/ {c.hint}</span>
                   </h2>
                   {evs.length > 2 && (
                     <Link to={`/agenda?categoria=${encodeURIComponent(c.match[0])}`} className="flex min-h-9 shrink-0 items-center text-xs font-bold text-primary">Ver tudo <ChevronRight className="h-3.5 w-3.5" /></Link>
                   )}
                 </div>
                 {evs.length > 0 ? (
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
                 ) : (
                   <p className="rounded-xl border border-dashed border-border px-4 py-4 text-center text-xs text-muted-foreground">
                     Nada por aqui ainda{homeBairro !== "all" ? " nesse local" : ""}. Tem um rolê assim? <Link to="/anuncios/novo" className="font-bold text-primary">Divulgue</Link>.
                   </p>
                 )}
               </section>
             );
           })}
         </div>

         {/* Publicidade geral */}
         <div className="mb-10">
           <HomeAdsCarousel variant="banner" />
         </div>

          <section className="mb-16 border-t border-border/60 pt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide sm:text-xl">Veja mais eventos pra hoje</h2>
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

         <section id="radar" className="mb-12 scroll-mt-40">
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

         {/* "Recomendado para você" removido: já coberto por "No seu radar" para evitar duplicação */}

        {/* Newsletter / Public Registration */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/25 bg-card p-8 sm:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
               <h2 className="mb-4 font-display text-2xl font-black sm:text-3xl">Receba o melhor do rolê no WhatsApp 🎸</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Toda semana, uma curadoria imperdível com o que está rolando de norte a sul — direto no seu Zap.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input 
                      aria-label="Seu nome"
                      placeholder="Seu nome" 
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                      className="h-14 rounded-2xl border-border bg-background px-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
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
                      className="h-14 rounded-2xl border-border bg-background px-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col justify-end px-1 sm:px-4">
                    <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
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

        {false && (
                <section className="mb-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-secondary/10 bg-secondary/5 p-5 sm:mb-16 sm:flex-row sm:p-8">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-2">Explore a Ilha no mapa</h3>
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
              © {new Date().getFullYear()} — Todos os direitos reservados
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
              Criado por{" "}
              <a
                href="https://limaxsistemas.online/"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-foreground transition-colors hover:text-primary hover:underline"
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
