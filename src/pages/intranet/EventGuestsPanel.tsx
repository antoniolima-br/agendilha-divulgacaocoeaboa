import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, MessageCircle, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { maskBrPhone, toE164Digits, validateWhatsappForAccount } from "@/lib/phone";
import { guestInviteLink, GUEST_ORIGIN_LABELS, GUEST_STATUS_LABELS, type GuestOrigin } from "@/lib/eventGuests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Guest = Tables<"intranet_event_guests">;
type EventOption = { id: string; event_title: string | null; slug: string | null; date: string | null };

export default function EventGuestsPanel({ canEdit, events }: { canEdit: boolean; events: EventOption[] }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [eventId, setEventId] = useState("");
  const [origin, setOrigin] = useState<GuestOrigin>("curation");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: qk.intranet.records(user?.id ?? null, "event-guests"), enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.from("intranet_event_guests").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  const guests = query.data ?? [];
  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const visible = guests.filter((guest) => `${guest.name} ${eventMap.get(guest.event_id)?.event_title ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: qk.intranet.all })]); };
  const create = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Escolha o rolê do convite.");
      if (name.trim().length < 2) throw new Error("Informe o nome do convidado.");
      const phoneIssue = whatsapp ? validateWhatsappForAccount(whatsapp) : null;
      if (phoneIssue) throw new Error(phoneIssue);
      const { data, error } = await supabase.from("intranet_event_guests").insert({ event_id: eventId, name: name.trim(), whatsapp: whatsapp ? toE164Digits(whatsapp) : null, origin }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => { await refresh(); setName(""); setWhatsapp(""); toast.success("Convidado cadastrado. O convite personalizado está pronto."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não deu pra cadastrar agora."),
  });
  const updateStatus = useMutation({ mutationFn: async ({ id, status }: { id: string; status: Guest["status"] }) => { const converted_at = status === "converted" ? new Date().toISOString() : null; const { error } = await supabase.from("intranet_event_guests").update({ status, converted_at }).eq("id", id); if (error) throw error; }, onSuccess: refresh, onError: () => toast.error("Não deu pra atualizar agora.") });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("intranet_event_guests").delete().eq("id", id); if (error) throw error; }, onSuccess: refresh, onError: () => toast.error("Não deu pra excluir agora.") });

  const linkFor = (guest: Guest) => { const event = eventMap.get(guest.event_id); return guestInviteLink(event?.slug ?? null, guest.event_id, guest.invite_token, guest.origin); };
  const share = (guest: Guest) => { const event = eventMap.get(guest.event_id); const link = linkFor(guest); const text = `Oi, ${guest.name}! Você recebeu um convite para ${event?.event_title || "este rolê"}: ${link}`; window.open(`https://wa.me/${guest.whatsapp || ""}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer"); };

  return <section className="min-w-0 space-y-5 py-5" aria-labelledby="event-guests-title"><div><h3 id="event-guests-title" className="text-lg font-semibold">Convidados e convites personalizados</h3><p className="mt-1 text-sm text-muted-foreground">Cada link identifica a abertura daquele convidado sem expor o convite de outra pessoa.</p></div>
    {canEdit && <form className="grid gap-3 rounded-md border border-border bg-card/40 p-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><div className="space-y-2"><Label htmlFor="guest-event">Rolê</Label><select id="guest-event" className="min-h-11 w-full rounded-md border border-border bg-field px-3 text-foreground" value={eventId} onChange={(event) => setEventId(event.target.value)} required><option value="">Escolha o rolê</option>{events.map((event) => <option key={event.id} value={event.id}>{event.event_title || "Rolê sem título"}</option>)}</select></div><div className="space-y-2"><Label htmlFor="guest-name">Nome</Label><Input id="guest-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="guest-whatsapp">WhatsApp opcional</Label><Input id="guest-whatsapp" type="tel" inputMode="tel" placeholder="(21) 99999-9999" value={whatsapp} onChange={(event) => setWhatsapp(maskBrPhone(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="guest-origin">Origem</Label><select id="guest-origin" className="min-h-11 w-full rounded-md border border-border bg-field px-3 text-foreground" value={origin} onChange={(event) => setOrigin(event.target.value as GuestOrigin)}>{Object.entries(GUEST_ORIGIN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><Button type="submit" disabled={create.isPending} className="md:col-span-2 xl:col-span-4 xl:justify-self-end"><Plus />Cadastrar convidado</Button></form>}
    <div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><Input aria-label="Buscar convidado" className="pl-9" placeholder="Buscar convidado ou rolê" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    {query.isLoading ? <p className="py-8">Carregando convidados…</p> : visible.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Nenhum convidado cadastrado.</p> : <ul className="divide-y border-y">{visible.map((guest) => { const event = eventMap.get(guest.event_id); return <li key={guest.id} className="flex min-w-0 flex-col gap-3 py-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{guest.name}</h4><Badge variant="outline">{GUEST_STATUS_LABELS[guest.status as keyof typeof GUEST_STATUS_LABELS]}</Badge></div><p className="mt-1 break-words text-sm text-muted-foreground">{event?.event_title || "Rolê"} · {GUEST_ORIGIN_LABELS[guest.origin as GuestOrigin]}</p><p className="mt-1 break-all text-xs text-muted-foreground">{linkFor(guest)}</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><Button variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(linkFor(guest)).then(() => toast.success("Link copiado."))}><Copy />Copiar</Button>{guest.whatsapp && <Button size="sm" onClick={() => share(guest)}><MessageCircle />WhatsApp</Button>}{canEdit && guest.status !== "converted" && <Button variant="secondary" size="sm" onClick={() => updateStatus.mutate({ id: guest.id, status: "converted" })}><CheckCircle2 />Converter</Button>}{canEdit && <Button variant="ghost" size="icon" aria-label={`Excluir ${guest.name}`} onClick={() => { if (window.confirm(`Excluir o convite de ${guest.name}?`)) remove.mutate(guest.id); }}><Trash2 /></Button>}</div></li>; })}</ul>}
  </section>;
}