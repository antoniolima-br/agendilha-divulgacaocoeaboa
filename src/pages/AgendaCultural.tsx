import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { eventDateISO, formatEventDateTimeBR } from "@/lib/eventDate";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";
import { useFavorites } from "@/hooks/useFavorites";
import { useAgendaData } from "@/hooks/useAgendaData";
import { useAgendaFilters } from "@/hooks/useAgendaFilters";
import { useAgendaArtists } from "@/data/useAgendaArtists";

import { PersonalizationDialog } from "@/components/PersonalizationDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { AgendaHero } from "@/components/agenda/AgendaHero";
import { AgendaLoginBanner } from "@/components/agenda/AgendaLoginBanner";
import { AgendaFilters } from "@/components/agenda/AgendaFilters";
import { AgendaArtistsTab } from "@/components/agenda/AgendaArtistsTab";
import { AgendaListSkeleton } from "@/components/agenda/AgendaListSkeleton";
import { AgendaEmptyState } from "@/components/agenda/AgendaEmptyState";
import { DayEventCard } from "@/components/agenda/DayEventCard";
import { EventDetailDialog } from "@/components/agenda/EventDetailDialog";
import { buildWhatsAppShare } from "@/components/agenda/agenda-utils";
import type { AgendaEvent } from "@/components/agenda/types";

import { exportEditorialAgendaPdf } from "@/lib/pdfExport";
import { getShareUrl } from "@/lib/sharing";
import { cn } from "@/lib/utils";

export default function AgendaCultural() {
  return (
    <SectionErrorBoundary context="AgendaCultural">
      <AgendaCulturalInner />
    </SectionErrorBoundary>
  );
}

function AgendaCulturalInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isDivulgador } = useDivulgadorStatus();
  const { favorites, isFavorite } = useFavorites();

  const {
    events,
    loading,
    trackView,
    trackShare,
    initialEventId,
    clearInitialEventId,
  } = useAgendaData();

  const { artists, shortVideos } = useAgendaArtists();

  const filters = useAgendaFilters({ events, profile, isFavorite, favorites });

  const [shareData, setShareData] = useState<{
    title: string;
    text: string;
    url: string;
    eventId?: string;
  } | null>(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "artists">("events");

  const handleShare = (title: string, text: string, url: string, eventId?: string) =>
    setShareData({ title, text, url, eventId });

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  // Abre o evento vindo da URL quando os dados chegam
  useEffect(() => {
    if (!initialEventId) return;
    const ev = events.find((e) => e.id === initialEventId);
    if (ev) {
      setSelectedEvent(ev);
      trackView(ev.id);
      clearInitialEventId();
    }
  }, [initialEventId, events, trackView, clearInitialEventId]);

  const goToDivulgar = () => {
    if (!user) {
      toast.info("Entra na sua conta primeiro", {
        description: "Precisa estar logado pra divulgar um rolê.",
      });
      navigate("/auth?redirect=/enviar-evento");
      return;
    }
    if (!isDivulgador) {
      toast.info("Acesso só pra Divulgador", {
        description: "Peça acesso em Meus eventos que a equipe libera rapidinho.",
      });
      navigate("/meus-eventos");
      return;
    }
    navigate("/enviar-evento");
  };

  const profileNeighborhood = profile?.home_location || profile?.work_neighborhood || null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:py-16">
        <AgendaHero
          isLoggedIn={!!user}
          nearYouEvents={filters.nearYouEvents}
          trendingEvents={filters.trendingEvents}
          recommendedEvents={filters.recommendedEvents}
          onSelectEvent={setSelectedEvent}
          onShare={handleShare}
          onDivulgar={goToDivulgar}
          onWhatsApp={() => window.open(buildWhatsAppShare(), "_blank")}
          onPersonalize={() => setPersonalizationOpen(true)}
          onCopyLink={() => handleCopyLink(getShareUrl())}
          onExportPdf={() => {
            exportEditorialAgendaPdf(filters.upcomingEvents, "Agenda Cultural da Ilha");
            toast.success("PDF da agenda gerado!");
          }}
        />

        <AgendaLoginBanner
          isLoggedIn={!!user}
          hasProfile={!!profile}
          onSignUp={() => navigate("/auth")}
        />

        {/* Abas */}
        <div className="flex p-1 bg-muted/50 rounded-2xl mb-12 max-w-sm mx-auto border border-border/50">
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
              activeTab === "events"
                ? "bg-background shadow-md text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" /> EVENTOS
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
              activeTab === "artists"
                ? "bg-background shadow-md text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="h-4 w-4" /> ARTISTAS
          </button>
        </div>

        {activeTab === "artists" && (
          <AgendaArtistsTab
            artists={artists}
            shortVideos={shortVideos}
          />
        )}

        {activeTab === "events" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AgendaFilters
              search={filters.search}
              onSearchChange={filters.setSearch}
              sortOrder={filters.sortOrder}
              onToggleSort={() =>
                filters.setSortOrder(filters.sortOrder === "asc" ? "desc" : "asc")
              }
              showFavoritesOnly={filters.showFavoritesOnly}
              onToggleFavorites={() => filters.setShowFavoritesOnly(!filters.showFavoritesOnly)}
              categoryFilter={filters.categoryFilter}
              onCategoryChange={filters.setCategoryFilter}
            />

            {loading ? (
              <AgendaListSkeleton />
            ) : filters.sortedDays.length === 0 ? (
              <AgendaEmptyState
                hasFilters={filters.hasActiveFilters}
                onClearFilters={filters.clearFilters}
                onDivulgar={goToDivulgar}
              />
            ) : (
              <div className="space-y-12">
                {filters.filteredEvents.some((e) => e.is_highlight) && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                      <h2 className="text-2xl font-bold font-display">Destaques AgendIlha</h2>
                    </div>
                    <div className="space-y-6">
                      {Object.entries(
                        filters.filteredEvents
                          .filter((e) => e.is_highlight)
                          .slice()
                          .sort((a, b) => `${eventDateISO(a.date)} ${a.start_time ?? ""}`.localeCompare(`${eventDateISO(b.date)} ${b.start_time ?? ""}`))
                          .reduce<Record<string, AgendaEvent[]>>((acc, ev) => {
                            const key = eventDateISO(ev.date) || "sem-data";
                            (acc[key] ||= []).push(ev);
                            return acc;
                          }, {}),
                      ).map(([dayIso, dayEvents]) => (
                        <div key={dayIso} className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {dayIso === "sem-data" ? "Data a confirmar" : formatEventDateTimeBR(dayIso)}
                          </h3>
                          <ul className="flex flex-col gap-3">
                            {dayEvents.map((ev) => {
                              const title = ev.event_title || ev.category || "Evento";
                              const place = [ev.location, ev.address_neighborhood].filter(Boolean).join(" · ");
                              return (
                                <li key={ev.id}>
                                  <button
                                    type="button"
                                    onClick={() => { trackView?.(ev.id); setSelectedEvent(ev); }}
                                    className="flex w-full items-stretch gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/40 sm:gap-4 sm:p-3"
                                  >
                                    <img src={ev.image_url || "/placeholder.svg"} alt={title} loading="lazy" decoding="async" className="h-24 w-20 shrink-0 rounded-xl object-cover sm:h-28 sm:w-24" />
                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                      {ev.category && <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{ev.category}</span>}
                                      <span className="line-clamp-2 font-display text-base font-bold leading-tight text-foreground">{title}</span>
                                      {ev.start_time && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5 shrink-0" />{String(ev.start_time).slice(0, 5)}</span>
                                      )}
                                      {place && (
                                        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{place}</span></span>
                                      )}
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {filters.sortedDays.map((dayKey) => (
                  <section key={dayKey} className="space-y-8">
                    <div className="flex items-center gap-4 sticky top-16 bg-background/80 backdrop-blur-md py-4 z-10 border-b border-border/50">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                        <CalendarDays className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">
                        {filters.grouped[dayKey].label}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                      {filters.grouped[dayKey].items.map((ev) => (
                        <DayEventCard
                          key={ev.id}
                          event={ev}
                          onSelect={setSelectedEvent}
                          onShare={handleShare}
                          trackView={trackView}
                          trackShare={trackShare}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      
      <PersonalizationDialog open={personalizationOpen} onOpenChange={setPersonalizationOpen} />
      {shareData && (
        <ShareDialog
          open={!!shareData}
          onOpenChange={(open) => !open && setShareData(null)}
          title={shareData.title}
          text={shareData.text}
          url={shareData.url}
          onShare={() => shareData.eventId && trackShare(shareData.eventId)}
        />
      )}

      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onShare={handleShare}
        onCopyLink={handleCopyLink}
        trackShare={trackShare}
      />
    </div>
  );
}
