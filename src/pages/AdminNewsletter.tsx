import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bell, Download, Mail, Pencil, Search, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDeleteNewsletterSubscriber, useNewsletterSubscribers } from "@/data";
import type { NewsletterSubscriber } from "@/data/useNewsletterSubscribers";
import { INTEREST_LABEL, INTEREST_STATUSES, type InterestStatus, useCreateCrmNotification, useCrmDeliveries, useCrmEvents, useCrmNotifications, useSetDelivered, useUpdateSubscriber } from "@/data/useCrm";
import { exportRowsToCsv } from "@/lib/csv";

const placesOf = (s: NewsletterSubscriber) => [...new Set([s.neighborhood, ...(s.preferred_regions ?? []), ...(s.preferred_neighborhoods ?? []), ...(s.preferred_localities ?? [])].filter((p): p is string => !!p?.trim()))];
const NONE = "__none";

export default function AdminNewsletter() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingState fullPage message="Carregando..." />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHeader title="CRM de Inscritos" subtitle="Quem se inscreveu, qual rolê escolheu e quais avisos já recebeu." />
      <Tabs defaultValue="subscribers">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="subscribers" className="gap-2"><Users className="h-4 w-4" />Inscritos</TabsTrigger>
          <TabsTrigger value="tracking" className="gap-2"><Bell className="h-4 w-4" />Rastreio de avisos</TabsTrigger>
        </TabsList>
        <TabsContent value="subscribers" className="mt-6"><SubscribersTab /></TabsContent>
        <TabsContent value="tracking" className="mt-6"><TrackingTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function useEventTitles() {
  const { data: events = [] } = useCrmEvents();
  const titles = useMemo(() => new Map(events.map(e => [e.id, `${e.event_title?.trim() || "Rolê sem título"}${e.date ? ` · ${e.date.split("-").reverse().join("/")}` : ""}`])), [events]);
  return { events, titles };
}

function SubscribersTab() {
  const { data: subscribers = [], isLoading } = useNewsletterSubscribers();
  const { events, titles } = useEventTitles();
  const update = useUpdateSubscriber();
  const remove = useDeleteNewsletterSubscriber();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<NewsletterSubscriber | null>(null);
  const [deleting, setDeleting] = useState<NewsletterSubscriber | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter(s =>
      (!q || [s.name, s.email, s.phone].some(v => (v ?? "").toLowerCase().includes(q))) &&
      (eventFilter === "all" || (eventFilter === NONE ? !s.interest_event_id : s.interest_event_id === eventFilter)) &&
      (statusFilter === "all" || s.interest_status === statusFilter));
  }, [subscribers, search, eventFilter, statusFilter]);

  const exportCsv = () => {
    exportRowsToCsv(`inscritos-${new Date().toISOString().slice(0, 10)}.csv`, ["Nome", "E-mail", "Telefone", "Bairro/Região", "Rolê", "Status", "Cadastro"],
      filtered.map(s => [s.name || "—", s.email, s.phone || "—", placesOf(s).join(", ") || "—", s.interest_event_id ? titles.get(s.interest_event_id) ?? "—" : "—", INTEREST_LABEL[s.interest_status ?? "interessado"], new Date(s.created_at).toLocaleDateString("pt-BR")]));
    toast.success("Planilha baixada!");
  };

  const quickStatus = (s: NewsletterSubscriber, status: InterestStatus) =>
    update.mutate({ id: s.id, patch: { interest_status: status } }, { onError: () => toast.error("Não deu pra mudar o status. Tenta de novo.") });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border/50 bg-muted/30 p-4 md:grid-cols-[1fr_220px_180px_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-10" placeholder="Buscar nome, e-mail ou telefone" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={eventFilter} onValueChange={setEventFilter}><SelectTrigger className="h-11"><SelectValue placeholder="Rolê" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os rolês</SelectItem><SelectItem value={NONE}>Sem rolê escolhido</SelectItem>{events.map(e => <SelectItem key={e.id} value={e.id}>{titles.get(e.id)}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-11"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os status</SelectItem>{INTEREST_STATUSES.map(s => <SelectItem key={s} value={s}>{INTEREST_LABEL[s]}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" className="h-11 gap-2" onClick={exportCsv}><Download className="h-4 w-4" />CSV</Button>
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} de {subscribers.length} inscritos</p>

      {isLoading ? <LoadingState message="Buscando inscritos..." /> : filtered.length === 0 ? (
        <EmptyState icon={Mail} title="Nenhum inscrito por aqui" description="Mude a busca ou os filtros pra ver mais gente." />
      ) : (
        <Card className="overflow-hidden rounded-2xl">
          <Table>
            <TableHeader className="hidden bg-muted/50 md:table-header-group"><TableRow>
              <TableHead>Inscrito</TableHead><TableHead>Bairro/Região</TableHead><TableHead>Rolê escolhido</TableHead><TableHead>Status</TableHead><TableHead>Cadastro</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody className="block divide-y divide-border md:table-row-group md:divide-y-0">
              {filtered.map(s => (
                <TableRow key={s.id} className="grid grid-cols-1 gap-2 p-4 md:table-row md:p-0">
                  <TableCell className="min-w-0 p-0 md:p-4">
                    <p className="font-medium">{s.name || <span className="italic text-muted-foreground">Sem nome</span>}</p>
                    <p className="break-all text-xs text-muted-foreground">{s.email}</p>
                    {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                  </TableCell>
                  <TableCell className="p-0 md:p-4"><span className="flex flex-wrap gap-1">{placesOf(s).length ? placesOf(s).map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>) : <span className="text-xs italic text-muted-foreground">Não informado</span>}</span></TableCell>
                  <TableCell className="p-0 text-sm md:p-4">{s.interest_event_id ? titles.get(s.interest_event_id) ?? "Rolê indisponível" : <span className="text-xs italic text-muted-foreground">Nenhum</span>}</TableCell>
                  <TableCell className="p-0 md:p-4">
                    <Select value={s.interest_status ?? "interessado"} onValueChange={v => quickStatus(s, v as InterestStatus)}>
                      <SelectTrigger className="h-9 w-full md:w-36" aria-label="Status do inscrito"><SelectValue /></SelectTrigger>
                      <SelectContent>{INTEREST_STATUSES.map(st => <SelectItem key={st} value={st}>{INTEREST_LABEL[st]}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-0 text-xs text-muted-foreground md:p-4">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="p-0 md:p-4 md:text-right">
                    <div className="flex gap-2 md:justify-end">
                      <Button size="icon" variant="outline" aria-label="Editar inscrito" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="outline" aria-label="Excluir inscrito" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {editing && <EditDialog subscriber={editing} events={events} titles={titles} onClose={() => setEditing(null)} />}
      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir inscrito?</AlertDialogTitle><AlertDialogDescription>{deleting?.email} sai da base e do histórico de avisos. Não dá pra desfazer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id, { onSuccess: () => toast.success("Inscrito excluído."), onError: () => toast.error("Não deu pra excluir. Tenta de novo.") })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditDialog({ subscriber, events, titles, onClose }: { subscriber: NewsletterSubscriber; events: { id: string }[]; titles: Map<string, string>; onClose: () => void }) {
  const update = useUpdateSubscriber();
  const [form, setForm] = useState({ name: subscriber.name ?? "", email: subscriber.email, phone: subscriber.phone ?? "", neighborhood: subscriber.neighborhood ?? "", event: subscriber.interest_event_id ?? NONE, status: subscriber.interest_status ?? "interessado" });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return toast.error("Confere o e-mail: parece incompleto.");
    update.mutate({ id: subscriber.id, patch: { name: form.name.trim() || null, email: form.email.trim(), phone: form.phone.trim() || null, neighborhood: form.neighborhood.trim() || null, interest_event_id: form.event === NONE ? null : form.event, interest_status: form.status as InterestStatus } },
      { onSuccess: () => toast.success("Inscrito atualizado."), onError: () => toast.error("Não deu pra salvar. Tenta de novo.") });
    onClose();
  };
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar inscrito</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Nome</Label><Input value={form.name} maxLength={120} onChange={e => set("name")(e.target.value)} /></div>
          <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} maxLength={254} onChange={e => set("email")(e.target.value)} /></div>
          <div className="space-y-1"><Label>Telefone</Label><Input inputMode="tel" value={form.phone} maxLength={20} onChange={e => set("phone")(e.target.value)} /></div>
          <div className="space-y-1"><Label>Bairro</Label><Input value={form.neighborhood} maxLength={80} onChange={e => set("neighborhood")(e.target.value)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Rolê escolhido</Label>
            <Select value={form.event} onValueChange={set("event")}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>Nenhum</SelectItem>{events.map(e => <SelectItem key={e.id} value={e.id}>{titles.get(e.id)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1 sm:col-span-2"><Label>Status</Label>
            <Select value={form.status} onValueChange={set("status")}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INTEREST_STATUSES.map(s => <SelectItem key={s} value={s}>{INTEREST_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TrackingTab() {
  const { data: subscribers = [] } = useNewsletterSubscribers();
  const { data: notifications = [], isLoading } = useCrmNotifications();
  const { data: deliveries = [] } = useCrmDeliveries();
  const { events, titles } = useEventTitles();
  const create = useCreateCrmNotification();
  const setDelivered = useSetDelivered();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"pending" | "delivered">("pending");
  const [draft, setDraft] = useState({ title: "", message: "", event: NONE });

  const byId = useMemo(() => new Map(subscribers.map(s => [s.id, s])), [subscribers]);
  const current = notifications.find(n => n.id === selected) ?? notifications[0];
  const currentDeliveries = deliveries.filter(d => d.notification_id === current?.id);
  const shown = currentDeliveries.filter(d => (view === "delivered") === !!d.delivered_at);
  const audience = draft.event === NONE ? subscribers : subscribers.filter(s => s.interest_event_id === draft.event && s.interest_status !== "cancelado");

  const submit = () => {
    if (!draft.title.trim()) return toast.error("Dá um título pro aviso.");
    create.mutate({ title: draft.title.trim(), message: draft.message.trim(), event_id: draft.event === NONE ? null : draft.event, subscriberIds: audience.map(s => s.id) }, {
      onSuccess: () => { toast.success(`Aviso registrado pra ${audience.length} inscritos.`); setOpen(false); setDraft({ title: "", message: "", event: NONE }); },
      onError: () => toast.error("Não deu pra registrar o aviso. Tenta de novo."),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Registre um aviso e marque quem já recebeu.</p>
        <Button className="gap-2" onClick={() => setOpen(true)}><Send className="h-4 w-4" />Novo aviso</Button>
      </div>
      {isLoading ? <LoadingState message="Buscando avisos..." /> : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhum aviso ainda" description="Toque em “Novo aviso” pra começar o histórico." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {notifications.map(n => {
              const ds = deliveries.filter(d => d.notification_id === n.id);
              const done = ds.filter(d => d.delivered_at).length;
              return (
                <button key={n.id} type="button" onClick={() => setSelected(n.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${current?.id === n.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40"}`}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}{n.event_id ? ` · ${titles.get(n.event_id) ?? "Rolê"}` : ""}</p>
                  <p className="mt-1 text-xs">{done} de {ds.length} receberam</p>
                </button>
              );
            })}
          </div>
          {current && (
            <Card className="rounded-2xl"><CardContent className="space-y-4 p-4">
              <div><h3 className="font-semibold">{current.title}</h3>{current.message && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{current.message}</p>}</div>
              <Tabs value={view} onValueChange={v => setView(v as typeof view)}>
                <TabsList><TabsTrigger value="pending">Pendentes ({currentDeliveries.filter(d => !d.delivered_at).length})</TabsTrigger><TabsTrigger value="delivered">Já Receberam ({currentDeliveries.filter(d => d.delivered_at).length})</TabsTrigger></TabsList>
              </Tabs>
              {shown.length === 0 ? <p className="text-sm text-muted-foreground">{view === "pending" ? "Ninguém pendente. Todo mundo recebeu!" : "Ninguém marcado como recebido ainda."}</p> : (
                <ul className="divide-y divide-border">
                  {shown.map(d => { const s = byId.get(d.subscriber_id); return (
                    <li key={d.id} className="flex items-center gap-3 py-2">
                      <Checkbox checked={!!d.delivered_at} aria-label="Marcar como recebido" onCheckedChange={c => setDelivered.mutate({ id: d.id, delivered: c === true }, { onError: () => toast.error("Não deu pra atualizar. Tenta de novo.") })} />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s?.name || s?.email || "Inscrito removido"}</p><p className="truncate text-xs text-muted-foreground">{[s?.email, s?.phone].filter(Boolean).join(" · ")}</p></div>
                      {d.delivered_at && <span className="text-xs text-muted-foreground">{new Date(d.delivered_at).toLocaleDateString("pt-BR")}</span>}
                    </li>); })}
                </ul>
              )}
            </CardContent></Card>
          )}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo aviso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Título</Label><Input value={draft.title} maxLength={160} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Mensagem</Label><Textarea value={draft.message} maxLength={2000} onChange={e => setDraft(d => ({ ...d, message: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Pra quem</Label>
              <Select value={draft.event} onValueChange={v => setDraft(d => ({ ...d, event: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>Todos os inscritos</SelectItem>{events.map(e => <SelectItem key={e.id} value={e.id}>Interessados em: {titles.get(e.id)}</SelectItem>)}</SelectContent></Select>
              <p className="text-xs text-muted-foreground">{audience.length} inscritos vão entrar como pendentes.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit} disabled={create.isPending}>Registrar aviso</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
