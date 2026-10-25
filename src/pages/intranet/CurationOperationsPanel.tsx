import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, ArrowLeft, Check, Copy, Download, ImagePlus, Loader2, MessageCircle, PauseCircle, Pencil, Plus, Search, Share2, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { usePublicEventsRealtime } from "@/data/publicEventsRealtime";
import { prepareUploadImage } from "@/lib/uploadImage";
import { uploadFlyerImage } from "@/lib/flyerImages";
import { extractFlyer } from "@/lib/flyerExtraction";
import { curationEventInvite, curationEventLink, emptyCurationEventForm, validateCurationEventForm, type CurationEventForm } from "@/lib/curationEvents";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CurationImpactPanel, { EventImpactCounters, useCurationImpact } from "./CurationImpactPanel";
import EventGuestsPanel from "./EventGuestsPanel";
import { toast } from "sonner";

type CurationEvent = {
  id: string;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  video_link: string | null;
  image_url: string | null;
  artist_history: string | null;
  status: string;
  slug: string | null;
};

const MAX_FLYER_MB = 8;
const EMPTY_CURATION_EVENTS: CurationEvent[] = [];

async function invalidateEventViews(client: ReturnType<typeof useQueryClient>) {
  await Promise.all([qk.intranet.all, qk.curation.all, qk.submissions.all, qk.home.all, qk.agenda.all, qk.highlights.publicList()].map((key) => client.invalidateQueries({ queryKey: key })));
}

function errorMessage(error: unknown, fallback: string): string {
  return error && typeof error === "object" && "message" in error ? String(error.message) : fallback;
}

export function CurationOperationsPanel({ canEdit }: { canEdit: boolean }) {
  const { user } = useAuth();
  const client = useQueryClient();
  usePublicEventsRealtime(true);
  const [form, setForm] = useState<CurationEventForm>(() => emptyCurationEventForm());
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("register");
  const [readingFlyer, setReadingFlyer] = useState(false);
  const [flyerNotice, setFlyerNotice] = useState("");
  const flyerReadRequest = useMemo(() => new AbortController(), []);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => flyerReadRequest.abort(), [flyerReadRequest]);

  const eventsQuery = useQuery({
    queryKey: qk.intranet.records(user?.id ?? null, "curation-events"),
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async (): Promise<CurationEvent[]> => {
      const { data, error } = await supabase.rpc("intranet_curation_event_editor");
      if (error) throw error;
      return (data ?? []) as CurationEvent[];
    },
  });
  const events = eventsQuery.data ?? EMPTY_CURATION_EVENTS;
  const impactQuery = useCurationImpact(30);
  const impactByEvent = useMemo(() => new Map((impactQuery.data?.events ?? []).map((item) => [item.id, item])), [impactQuery.data?.events]);
  const visibleEvents = useMemo(() => events.filter((event) => `${event.event_title ?? ""} ${event.date ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [events, search]);
  const selected = events.find((event) => event.id === selectedId) ?? events[0] ?? null;

  const save = useMutation({
    mutationFn: async () => {
      const issue = validateCurationEventForm(form);
      if (issue) throw new Error(issue);
      if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
      let imageUrl = form.flyerUrl.trim() || null;
      if (file) {
        const extension = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/curadoria-${form.id ?? "novo"}-${Date.now()}.${extension}`;
        imageUrl = await uploadFlyerImage(file, path);
      }
      const { data, error } = await supabase.rpc("intranet_save_curation_event_v2", {
        p_id: form.id,
        p_title: form.title.trim(),
        p_date: form.date,
        p_start_time: form.startTime,
        p_video_link: form.registrationUrl.trim() || undefined,
        p_image_url: imageUrl || undefined,
        p_artist_history: form.artistHistory.trim() || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await invalidateEventViews(client);
      toast.success(form.id ? "Rolê atualizado em todo o app." : "Rolê publicado em todo o app.");
      setForm(emptyCurationEventForm());
      setFile(null);
      setTab("manage");
    },
    onError: (error) => toast.error(errorMessage(error, "Não deu pra salvar agora. Tente novamente.")),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("intranet_archive_curation_event", { p_id: id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidateEventViews(client);
      toast.success("Rolê removido das áreas públicas.");
      setSelectedId(null);
    },
    onError: (error) => toast.error(errorMessage(error, "Não deu pra excluir agora. Tente novamente.")),
  });

  const moderation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" | "suspend" }) => {
      const { error } = await supabase.rpc("intranet_set_curation_status", { p_id: id, p_action: action });
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await invalidateEventViews(client);
      toast.success(variables.action === "approve" ? "Rolê aprovado." : variables.action === "reject" ? "Rolê rejeitado." : "Rolê suspenso e retirado das áreas públicas.");
    },
    onError: (error) => toast.error(errorMessage(error, "Não deu pra concluir essa ação. Tente novamente.")),
  });

  async function chooseFile(next: File | null) {
    if (next && !next.type.startsWith("image/")) return toast.error("Escolha uma imagem JPG, PNG ou WEBP.");
    if (next && next.size > MAX_FLYER_MB * 1024 * 1024) return toast.error(`O flyer pode ter até ${MAX_FLYER_MB} MB.`);
    setFile(next);
    setFlyerNotice("");
    if (!next) return;
    setReadingFlyer(true);
    try {
      const prepared = await prepareUploadImage(next);
      const fields = await extractFlyer(prepared, flyerReadRequest.signal);
      setForm((current) => ({
        ...current,
        title: current.title || fields.eventTitle || "",
        date: current.date || fields.date || "",
        startTime: current.startTime || fields.startTime || "",
      }));
      setFlyerNotice(fields.eventTitle
        ? "O Coezinho leu o flyer. Confira o título, a data e o horário."
        : "O Coezinho não encontrou o título. Se quiser, preencha o nome do rolê.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setFlyerNotice("O Coezinho não conseguiu ler o título. Se quiser, preencha o nome do rolê.");
      }
    } finally {
      setReadingFlyer(false);
    }
  }

  function edit(event: CurationEvent) {
    setForm({ id: event.id, title: event.event_title ?? "", date: event.date?.slice(0, 10) ?? "", startTime: event.start_time?.slice(0, 5) ?? "", registrationUrl: event.video_link ?? "", flyerUrl: event.image_url ?? "", artistHistory: event.artist_history ?? "" });
    setFile(null);
    setTab("register");
  }

  function confirmArchive(event: CurationEvent) {
    if (window.confirm(`Excluir “${event.event_title || "este rolê"}” das áreas públicas?`)) archive.mutate(event.id);
  }

  function decide(event: CurationEvent, action: "approve" | "reject" | "suspend") {
    const label = action === "approve" ? "aprovar" : action === "reject" ? "rejeitar" : "suspender";
    if (window.confirm(`Quer ${label} “${event.event_title || "este rolê"}”?`)) moderation.mutate({ id: event.id, action });
  }

  return (
    <section className="min-w-0 border-b py-6" aria-labelledby="curation-operations-title">
      <header className="mb-5 space-y-2">
        <p className="text-xs font-semibold uppercase text-primary">Operação em tempo real</p>
        <h2 id="curation-operations-title" className="text-xl font-semibold sm:text-2xl">Cadastro, gestão e divulgação</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">As mudanças salvas aqui chegam automaticamente ao carrossel e aos feeds públicos.</p>
      </header>
      <Tabs value={tab} onValueChange={setTab} className="min-w-0">
        <TabsList aria-label="Ações da Curadoria" className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-4">
          <TabsTrigger value="register" className="min-h-14 border border-border text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Plus className="mr-2 h-5 w-5" />Cadastro</TabsTrigger>
          <TabsTrigger value="manage" className="min-h-14 border border-border text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Pencil className="mr-2 h-5 w-5" />Gerenciar</TabsTrigger>
          <TabsTrigger value="share" className="min-h-11 border border-border text-sm data-[state=active]:bg-secondary">Divulgação</TabsTrigger>
          {/* Convidados oculto por pedido; conteúdo da aba preservado abaixo pra reativar depois. */}
          {/* <TabsTrigger value="guests">Convidados</TabsTrigger> */}
          <TabsTrigger value="impact" className="min-h-11 border border-border text-sm data-[state=active]:bg-secondary">Impacto</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="pt-4">
          {!canEdit ? <p className="border-y py-8 text-sm text-muted-foreground">Você pode consultar os rolês. A edição fica com a pessoa responsável pela Curadoria, Sênior ou Master.</p> : <form className="mx-auto grid w-full max-w-3xl min-w-0 gap-5" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
            {form.id && <div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={() => { setForm(emptyCurationEventForm()); setFile(null); setTab("manage"); }}><ArrowLeft />Voltar aos rolês</Button><Badge variant="outline">Editando um rolê</Badge></div>}
            {form.id && <EventImpactCounters impact={impactByEvent.get(form.id)} />}
            <div className="flex min-h-80 items-center justify-center overflow-hidden rounded-md border border-border bg-card/40 p-3 sm:min-h-[28rem]">
              {preview || form.flyerUrl ? <img src={preview || form.flyerUrl} alt="Flyer do evento selecionado" className="max-h-[70vh] w-full rounded-md object-contain" /> : <div className="text-center text-muted-foreground"><ImagePlus className="mx-auto mb-2 h-8 w-8" /><p className="text-sm">A prévia do flyer aparece aqui.</p></div>}
            </div>
            <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 px-4 text-sm font-semibold hover:border-primary/55 hover:bg-accent"><Upload className="h-4 w-4" />{readingFlyer ? "Coezinho lendo o flyer…" : file ? file.name : form.id ? "Substituir flyer" : "Enviar flyer"}<input className="sr-only" type="file" accept="image/*" disabled={readingFlyer} onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)} /></label>
            {flyerNotice && <p role="status" className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{flyerNotice}</p>}
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2 sm:col-span-2"><Label htmlFor="curation-artist-history">Histórico da atração principal</Label><Textarea id="curation-artist-history" value={form.artistHistory} maxLength={4000} rows={6} placeholder="Casas de show, festivais, cidades e palcos onde a atração já se apresentou" onChange={(event) => setForm((current) => ({ ...current, artistHistory: event.target.value }))} /><p className="text-right text-xs text-muted-foreground">{form.artistHistory.length}/4.000</p></div>
              <div className="min-w-0 space-y-2 sm:col-span-2"><Label htmlFor="curation-title">Título do rolê</Label><Input id="curation-title" value={form.title} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /><p className="text-xs text-muted-foreground">Opcional.</p></div>
              <div className="min-w-0 space-y-2"><Label htmlFor="curation-date">Data</Label><Input id="curation-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></div>
              <div className="min-w-0 space-y-2"><Label htmlFor="curation-time">Horário</Label><Input id="curation-time" type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} required /></div>
              <div className="min-w-0 space-y-2 sm:col-span-2"><Label htmlFor="curation-link">Link de inscrição / saiba mais</Label><Input id="curation-link" type="url" inputMode="url" placeholder="https://" value={form.registrationUrl} onChange={(event) => setForm((current) => ({ ...current, registrationUrl: event.target.value }))} /></div>
              <div className="min-w-0 space-y-2 sm:col-span-2"><Label htmlFor="curation-flyer-url">Link do flyer</Label><Input id="curation-flyer-url" type="url" inputMode="url" placeholder="https://" value={form.flyerUrl} onChange={(event) => setForm((current) => ({ ...current, flyerUrl: event.target.value }))} /></div>
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                <Button type="submit" disabled={save.isPending} className="w-full">{save.isPending ? <Loader2 className="animate-spin" /> : form.id ? <Pencil /> : <Plus />}{form.id ? "Salvar alterações" : "Publicar rolê"}</Button>
                {form.id && <Button type="button" variant="destructive" className="w-full" disabled={archive.isPending} onClick={() => { const current = events.find((event) => event.id === form.id); if (current) confirmArchive(current); }}><Trash2 />Excluir evento</Button>}
              </div>
            </div>
          </form>}
        </TabsContent>

        <TabsContent value="manage" className="pt-4">
          <div className="relative mb-4 max-w-md"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar rolê" className="pl-9" placeholder="Buscar por nome ou data" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          {eventsQuery.isLoading ? <p className="py-8" role="status">Carregando rolês…</p> : eventsQuery.isError ? <div className="space-y-3 py-8"><p role="alert">Não deu pra carregar os rolês.</p><Button variant="outline" onClick={() => void eventsQuery.refetch()}>Tentar novamente</Button></div> : visibleEvents.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Nenhum rolê encontrado. Use o cadastro rápido para começar.</p> : <ul className="grid gap-6">{visibleEvents.map((event) => <li key={event.id} className="min-w-0 rounded-lg border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex min-h-[26rem] w-full items-center justify-center overflow-hidden rounded-md border bg-background/40 sm:min-h-[38rem]">{event.image_url ? <img src={event.image_url} alt={`Flyer de ${event.event_title || "rolê"}`} className="max-h-[80vh] w-full object-contain" /> : <div className="flex min-h-[26rem] w-full items-center justify-center"><ImagePlus className="h-10 w-10 text-muted-foreground" /></div>}</div>
            <div className="mt-4 min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words text-xl font-semibold">{event.event_title || "Rolê sem título"}</h3><Badge variant="outline">{event.status === "cancelado" ? "suspenso" : event.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{formatEventDateTimeBR(event.date, event.start_time)}</p><div className="mt-4 border-t pt-3"><p className="text-xs font-semibold uppercase text-muted-foreground">Histórico artístico</p><p className="mt-1 line-clamp-4 text-sm">{event.artist_history || "Ainda não informado."}</p></div><EventImpactCounters impact={impactByEvent.get(event.id)} /></div>
            {canEdit && <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4"><Button className="min-h-12 text-base" disabled={moderation.isPending} onClick={() => decide(event, "approve")}><Check />Aprovar</Button><Button variant="outline" className="min-h-12 text-base" disabled={moderation.isPending} onClick={() => decide(event, "reject")}><X />Rejeitar</Button><Button variant="secondary" className="min-h-12 text-base" disabled={moderation.isPending} onClick={() => decide(event, "suspend")}><PauseCircle />Suspender</Button><Button variant="outline" className="min-h-12 text-base" onClick={() => edit(event)}><Pencil />Editar</Button></div>}
          </li>)}</ul>}
        </TabsContent>

        <TabsContent value="share" className="pt-4">
          {events.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Publique um rolê para liberar os materiais de divulgação.</p> : <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-4"><Label htmlFor="curation-share-event">Escolha o rolê</Label><select id="curation-share-event" className="min-h-11 w-full rounded-md border border-border bg-field px-3 text-foreground" value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>{events.map((event) => <option key={event.id} value={event.id}>{event.event_title || "Rolê sem título"} · {formatEventDateTimeBR(event.date, event.start_time)}</option>)}</select>{selected && <ShareActions event={selected} />}</div>
            {selected && <EventQr event={selected} />}
          </div>}
        </TabsContent>

        <TabsContent value="impact" className="pt-2"><CurationImpactPanel /></TabsContent>
        <TabsContent value="guests" className="pt-2"><EventGuestsPanel canEdit={canEdit} events={events} /></TabsContent>
      </Tabs>
    </section>
  );
}

function ShareActions({ event }: { event: CurationEvent }) {
  const visibleLink = curationEventLink(event, window.location.origin, "curation_link");
  const whatsappLink = curationEventLink(event, window.location.origin, "curation_whatsapp");
  const shareLink = curationEventLink(event, window.location.origin, "curation_share");
  const invitation = curationEventInvite(event, whatsappLink);
  const copy = async () => { try { await navigator.clipboard.writeText(visibleLink); toast.success("Link copiado."); } catch { toast.error("Não deu pra copiar. Selecione o link abaixo."); } };
  return <div className="min-w-0 space-y-3"><div className="break-all rounded-md border bg-card/40 p-3 text-sm text-muted-foreground">{visibleLink}</div><div className="flex flex-col gap-2 sm:flex-row"><Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(invitation)}`, "_blank", "noopener,noreferrer")}><MessageCircle />Compartilhar no WhatsApp</Button><Button variant="outline" onClick={() => void copy()}><Copy />Copiar link</Button>{navigator.share && <Button variant="ghost" onClick={() => void navigator.share({ title: event.event_title || "Rolê", text: curationEventInvite(event, shareLink), url: shareLink }).catch(() => undefined)}><Share2 />Compartilhar</Button>}</div></div>;
}

function EventQr({ event }: { event: CurationEvent }) {
  const link = curationEventLink(event, window.location.origin, "curation_qr");
  const qrId = `curation-qr-${event.id}`;
  function download() {
    const svg = document.getElementById(qrId);
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qr-${event.slug || event.id}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return <div className="flex flex-col items-center rounded-md border bg-card/40 p-5 text-center"><div className="rounded-md bg-foreground p-3"><QRCodeSVG id={qrId} value={link} size={180} marginSize={2} bgColor="transparent" fgColor="hsl(var(--background))" /></div><h3 className="mt-3 break-words font-semibold">{event.event_title || "Rolê"}</h3><Button className="mt-3 w-full" variant="outline" onClick={download}><Download />Baixar QR Code</Button></div>;
}