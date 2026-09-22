import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  Dumbbell,
  Landmark,
  MapPin,
  MessageCircle,
  Music2,
  PartyPopper,
  Sparkles,
  Utensils,
} from "lucide-react";
import Header from "@/components/Header";
import { HomeAdsCarousel } from "@/components/anuncios/HomeAdsCarousel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/data/events";
import { eventDateISO, saoPauloTodayISO } from "@/lib/eventDate";
import { getEventFallbackImage, getEventFallbackPalette } from "@/lib/event-utils";
import { newsletterSubscribeSchema } from "@/schemas/newsletter";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/routes/config";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AgendaEvent } from "@/components/agenda/types";

const categories = [
  { id: "musica", label: "Música", icon: Music2 },
  { id: "cultura", label: "Cultura", icon: Landmark },
  { id: "gastronomia", label: "Gastronomia", icon: Utensils },
  { id: "esporte", label: "Esporte", icon: Dumbbell },
  { id: "turismo", label: "Turismo", icon: Compass },
  { id: "outros", label: "Outros", icon: PartyPopper },
] as const;

function formatEventDate(value: string | null) {
  const iso = eventDateISO(value);
  if (!iso) return "Data a confirmar";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

function EventArtwork({ event, eager = false }: { event: AgendaEvent; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const fallback = getEventFallbackImage(event.category);
  const palette = getEventFallbackPalette(`${event.id}:${event.category || "outros"}`);
  const image = failed ? fallback : event.image_url;

  if (!image) {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center", palette)} aria-hidden="true">
        <span className="font-display text-8xl font-bold text-foreground/15">
          {(event.event_title || "C").charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={event.event_title || "Programação cultural"}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function EventCard({ event, featured = false }: { event: AgendaEvent; featured?: boolean }) {
  const navigate = useNavigate();
  const place = event.address_neighborhood || event.location || "Ilha do Governador";

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => navigate(`/evento/${event.id}`)}
      className={cn(
        "group relative block h-auto w-full overflow-hidden whitespace-normal rounded-2xl bg-card p-0 text-left shadow-card ring-1 ring-border/70 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        featured ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[4/5]",
      )}
      aria-label={`Ver ${event.event_title || "programação"}`}
    >
      <EventArtwork event={event} eager={featured} />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-background/90 px-3 py-1 text-foreground backdrop-blur-sm">
            {formatEventDate(event.date)}{event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
          </span>
          <span className="flex min-w-0 items-center gap-1 rounded-full bg-background/15 px-3 py-1 text-background backdrop-blur-sm">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{place}</span>
          </span>
        </div>
        <h3 className={cn("line-clamp-2 font-display font-bold leading-tight", featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl")}>
          {event.event_title || "Programação na Ilha"}
        </h3>
      </div>
    </Button>
  );
}

function SectionHeading({ eyebrow, title, to }: { eyebrow: string; title: string; to?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
        <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>
      </div>
      {to && (
        <Button asChild variant="ghost" className="shrink-0 px-2 text-muted-foreground hover:text-foreground">
          <Link to={to}>Ver tudo <ChevronRight className="h-4 w-4" /></Link>
        </Button>
      )}
    </div>
  );
}

export default function HomePremium() {
  const { events, isLoading } = useEvents({ staleTime: 60_000 });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const upcoming = useMemo(() => {
    const today = saoPauloTodayISO();
    return events
      .filter((event) => {
        const date = eventDateISO(event.date);
        return date && date >= today;
      })
      .sort((a, b) => eventDateISO(a.date).localeCompare(eventDateISO(b.date)) || (a.start_time || "").localeCompare(b.start_time || ""));
  }, [events]);

  const highlights = useMemo(() => {
    const selected = upcoming.filter((event) => event.is_highlight);
    return [...selected, ...upcoming.filter((event) => !event.is_highlight)].slice(0, 6);
  }, [upcoming]);
  const heroEvent = highlights.find((event) => event.image_url) || highlights[0];
  const otherEvents = upcoming.filter((event) => event.id !== heroEvent?.id).slice(0, 8);

  const subscribe = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = newsletterSubscribeSchema.safeParse({ name, phone, neighborhood: "", whatsappConsent: consent });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira seus dados.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: `${parsed.data.phone}@whatsapp.agendilha.app`,
      name: parsed.data.name || null,
      neighborhood: null,
    });
    setSubmitting(false);
    if (error?.code === "23505") {
      toast.success("Você já está na nossa lista. Tá tudo certo!");
      return;
    }
    if (error) {
      toast.error("Não rolou cadastrar agora. Tenta de novo.");
      return;
    }
    setName("");
    setPhone("");
    setConsent(false);
    toast.success("Pronto! As melhores da Ilha chegam no seu WhatsApp.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="mb-10 max-w-4xl sm:mb-14">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-4 w-4 text-secondary" /> A Ilha acontece aqui
            </p>
            <h1 className="text-balance font-display text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              Coé a Boa?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
              Descubra shows, cultura, sabores e programas que movimentam a Ilha do Governador.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 shadow-elevated">
                <Link to={ROUTES.CURADORIA_HOJE}>Ver o que tem hoje <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-foreground/15 bg-transparent px-6 shadow-none hover:bg-muted">
                <Link to={ROUTES.DIVULGADOR_STATUS}>Área do Divulgador</Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="aspect-[4/5] w-full rounded-2xl sm:aspect-[16/7]" />
          ) : heroEvent ? (
            <div className={cn("grid gap-4", highlights.length > 1 && "lg:grid-cols-[1.5fr_0.75fr]")}>
              <div className="min-h-0 [&>button]:aspect-[5/4] sm:[&>button]:aspect-[16/8]">
                <EventCard event={heroEvent} featured />
              </div>
              {highlights.length > 1 && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                  {highlights.slice(1, 3).map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              A agenda está sendo atualizada. Volte daqui a pouco para ver o que tá rolando.
            </div>
          )}
        </section>

        <nav aria-label="Explorar por categoria" className="border-y border-border/70 bg-card/60">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-5 scrollbar-none sm:px-6 lg:px-8">
            {categories.map(({ id, label, icon: Icon }) => (
              <Button key={id} asChild variant="outline" className="h-10 shrink-0 rounded-full border-border bg-background px-4 shadow-sm hover:border-foreground/20 hover:bg-muted">
                <Link to={`${ROUTES.AGENDA}?category=${id}`}><Icon className="h-4 w-4 text-secondary" />{label}</Link>
              </Button>
            ))}
          </div>
        </nav>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading eyebrow="Seleção da semana" title="Eventos em alta" to={ROUTES.AGENDA} />
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="aspect-[4/5] rounded-2xl" />)}</div>
          ) : highlights.length ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {highlights.slice(0, 4).map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Novos rolês chegam em breve.</p>
          )}
        </section>

        <section className="bg-muted/40 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeAdsCarousel />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading eyebrow="Pra montar seu roteiro" title="Outras programações" to={ROUTES.EXPLORAR} />
          <div className="divide-y divide-border border-y border-border">
            {otherEvents.length ? otherEvents.map((event) => (
              <Link
                key={event.id}
                to={`/evento/${event.id}`}
                className="group grid gap-3 py-5 transition-colors hover:bg-muted/50 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:px-3"
              >
                <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                  {formatEventDate(event.date)}{event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate font-display text-lg font-semibold">{event.event_title || "Programação na Ilha"}</strong>
                  <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{event.address_neighborhood || event.location || "Ilha do Governador"}</span>
                  </span>
                </span>
                <ChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" />
              </Link>
            )) : <p className="py-10 text-center text-muted-foreground">A agenda está sendo atualizada.</p>}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground shadow-elevated sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16 lg:px-14">
            <div className="max-w-xl">
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/10">
                <MessageCircle className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/65">Agenda no seu celular</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">A boa chega primeiro no WhatsApp.</h2>
              <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
                Receba uma seleção caprichada do que tá rolando na Ilha, sem excesso de mensagens.
              </p>
            </div>
            <form onSubmit={subscribe} className="mt-8 grid gap-4 lg:mt-0" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="home-name" className="text-primary-foreground/80">Seu nome</Label>
                  <Input id="home-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Como a gente te chama?" className="h-12 border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/45" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-phone" className="text-primary-foreground/80">WhatsApp</Label>
                  <Input id="home-phone" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(21) 99999-9999" className="h-12 border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/45" />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-primary-foreground/65">
                <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5 border-primary-foreground/50 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary" />
                Aceito receber a agenda e novidades pelo WhatsApp.
              </label>
              <Button type="submit" variant="secondary" size="lg" disabled={submitting} className="h-12 justify-between px-5 shadow-none">
                {submitting ? "Entrando na lista..." : "Quero receber a agenda"}
                {submitting ? null : <Check className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        <p>Coé a Boa? · A agenda cultural da Ilha do Governador</p>
      </footer>
    </div>
  );
}