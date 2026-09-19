import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, ImageIcon, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { buildCoeaboaDailyReport, openWhatsAppWithText } from "@/lib/todayWhatsappSummary";
import { addDaysToISO, eventDateISO, saoPauloTodayISO } from "@/lib/eventDate";

interface Ev {
  id: string;
  status: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  category: string | null;
  atrativo_name: string | null;
  atrativo_style: string | null;
  short_copy: string | null;
  address_street: string | null;
  address_number: string | null;
  sale_price: string | null;
  is_highlight: boolean | null;
  highlight_active?: boolean | null;
  image_url: string | null;
  submission_atrativos: Array<{ name: string | null; display_order: number | null }> | null;
}

function todayISO() {
  return saoPauloTodayISO();
}

function formatTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  if (m && m !== "00") return `${h}:${m}h`;
  return `${h}h`;
}

export default function AdminAgendaInforma() {
  const [date, setDate] = useState<string>(todayISO());
  const [events, setEvents] = useState<Ev[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("submissions")
      .select(
        "id, status, event_title, date, start_time, location, address_street, address_number, address_neighborhood, category, atrativo_name, atrativo_style, short_copy, sale_price, is_highlight, highlight_active, image_url, submission_atrativos(name, display_order)"
      )
      .in("status", ["aprovado", "publicado", "divulgado"])
      .gte("date", addDaysToISO(date, -1))
      .lt("date", addDaysToISO(date, 1))
      .order("start_time", { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error("Falha ao carregar eventos", { description: error.message });
        } else {
          const list = ((data as Ev[]) || []).filter((event) => eventDateISO(event.date) === date);
          setEvents(list);
          const sel: Record<string, boolean> = {};
          list.forEach((e) => (sel[e.id] = true));
          setSelected(sel);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const lines = useMemo(() => {
    const chosen = events.filter((e) => selected[e.id]);
    return buildCoeaboaDailyReport(chosen, date).text;
  }, [events, selected, date]);

  const chosenCount = useMemo(() => {
    const chosen = events.filter((event) => selected[event.id]);
    return buildCoeaboaDailyReport(chosen, date).count;
  }, [events, selected, date]);

  const chosenEvents = useMemo(() => events.filter((event) => selected[event.id]), [events, selected]);
  const highlightedEvents = useMemo(
    () => chosenEvents.filter((event) => Boolean(event.highlight_active || event.is_highlight)),
    [chosenEvents],
  );
  const remainingEvents = useMemo(
    () => chosenEvents.filter((event) => !highlightedEvents.includes(event)),
    [chosenEvents, highlightedEvents],
  );

  const eventName = (event: Ev) =>
    (event.submission_atrativos || []).map((item) => item.name).filter(Boolean).join(" - ") ||
    event.atrativo_name ||
    event.event_title ||
    "Evento";

  async function copy() {
    await navigator.clipboard.writeText(lines);
    toast.success("Texto copiado!");
  }

  function shareWhats() {
    openWhatsAppWithText(lines);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Relatório diário COEABOA"
        subtitle="Programação válida do dia, separada entre destaques visuais e demais eventos divulgados."
        rightElement={
          <div>
            <Label htmlFor="date" className="text-xs">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[170px]"
            />
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Programação do dia ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Carregando eventos..." className="py-6" />
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum evento aprovado para esta data.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={!!selected[e.id]}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [e.id]: Boolean(v) }))
                        }
                        className="mt-1"
                      />
                      <div className="text-sm flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {formatTime(e.start_time)} —{" "}
                           {(e.submission_atrativos || []).map((item) => item.name).filter(Boolean).join(" - ") || e.atrativo_name || e.event_title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {e.location} {e.address_neighborhood && `· ${e.address_neighborhood}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Coé a Boa? — pré-visualização</CardTitle>
              <span className="text-xs text-muted-foreground">
                {chosenCount} evento(s)
              </span>
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] space-y-6 overflow-y-auto rounded-md border bg-muted/20 p-4">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Star className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">Anúncios Pagos / Destaques</h3>
                  </div>
                  {highlightedEvents.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {highlightedEvents.map((event) => (
                        <article key={event.id} className="overflow-hidden rounded-md border bg-card">
                          {event.image_url ? (
                            <img
                              src={event.image_url}
                              alt={`Flyer de ${eventName(event)}`}
                              className="aspect-[4/3] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                              <ImageIcon className="h-7 w-7" aria-hidden="true" />
                              <span className="sr-only">Espaço reservado para flyer ou banner</span>
                            </div>
                          )}
                          <div className="space-y-1 p-3">
                            <p className="text-sm font-semibold">{eventName(event)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(event.start_time)} · {event.location || "Local a confirmar"}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="py-3 text-center text-sm text-muted-foreground">Nenhum destaque selecionado.</p>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Demais Eventos Divulgados</h3>
                  </div>
                  {remainingEvents.length ? (
                    <ul className="divide-y">
                      {remainingEvents.map((event) => (
                        <li key={event.id} className="py-2 text-sm">
                          <span className="font-medium">{formatTime(event.start_time)} · {eventName(event)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {event.location || "Local a confirmar"}
                            {event.address_neighborhood ? ` · ${event.address_neighborhood}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-3 text-center text-sm text-muted-foreground">Nenhum outro evento selecionado.</p>
                  )}
                </section>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={copy} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar texto
                </Button>
                <Button onClick={shareWhats} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Compartilhar no WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}