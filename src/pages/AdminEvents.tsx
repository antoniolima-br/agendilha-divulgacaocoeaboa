import { PaymentStatus } from "@/components/admin/PaymentStatus";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays, Loader2, MessageCircle, Trash2,
  FileDown, MapPin, Clock,
  CheckCircle, XCircle, ChevronDown, ShieldAlert,
  Phone, Mail, Globe, Star,
  RotateCcw, Edit, ExternalLink, Eye, History, Megaphone,
   AlertCircle, Wallet
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportSingleEventPdf, exportBulkEventsPdf } from "@/lib/pdfExport";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { handleError } from "@/lib/error-handler";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { buildWhatsappUrl, validateBrazilianMobile, renderTemplate } from "@/lib/whatsapp";
import { generateFallbackFlyer } from "@/lib/generateFallbackFlyer";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { missingPublishFields, shouldOfferGenericFlyer } from "@/lib/publishValidation";
import { PublishBlockDialog, type PublishBlockInfo } from "@/components/events-admin/PublishBlockDialog";
import { qk } from "@/data/queryKeys";


import {
  type AdminSubmission as Submission,
  categoryLabels,
  statusConfig,
  formatSubmissionDate,
  formatEventDate,
  buildWhatsAppMessage,
  buildTemplateVars,
  computeKpis,
  filterSubmissions,
  isActiveSubmission,
} from "@/components/events-admin/adminEventsHelpers";
import { AdminEventsToolbar } from "@/components/events-admin/AdminEventsToolbar";
import { QuickEditEventDialog } from "@/components/events-admin/QuickEditEventDialog";
import { AdminEventsKpis } from "@/components/events-admin/AdminEventsKpis";
import { AdminEventsFilters } from "@/components/events-admin/AdminEventsFilters";
import {
  ModerationReviewDialog,
  type ModerationReviewKind,
  type ModerationReviewState,
} from "@/components/events-admin/ModerationReviewDialog";


export default function AdminEvents() {
  return (
    <SectionErrorBoundary context="AdminEvents">
      <AdminEventsInner />
    </SectionErrorBoundary>
  );
}

function AdminEventsInner() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const queryClient = useQueryClient();
  const canRead = hasPermission('events.read');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [quickEdit, setQuickEdit] = useState<Submission | null>(null);
  const [templates, setTemplates] = useState<{ approved: string; rejected: string }>({
    approved: "",
    rejected: "",
  });
  const [review, setReview] = useState<ModerationReviewState | null>(null);

  const [flyerOffer, setFlyerOffer] = useState<Submission | null>(null);
  const [generatingFlyer, setGeneratingFlyer] = useState(false);
  const [publishBlock, setPublishBlock] = useState<PublishBlockInfo | null>(null);
  const [highlightingId, setHighlightingId] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      handleError(error, "Erro ao carregar eventos");
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }


  useEffect(() => {
    if (canRead) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("whatsapp_templates")
        .select("kind, body");
      const next = { approved: "", rejected: "" };
      (data || []).forEach((r: any) => {
        if (r.kind === "approved" || r.kind === "rejected") (next as any)[r.kind] = r.body;
      });
      setTemplates(next);
    })();
  }, []);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      handleError(error, "Erro ao remover evento");
    } else {
      toast.success("Evento removido com sucesso");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleteConfirmId(null);
  }

  function openReview(sub: Submission, kind: ModerationReviewKind) {
    const template = templates[kind === "ajuste" ? "rejected" : kind];
    if (!template && kind !== "ajuste") {
      toast.error("Template do WhatsApp ainda não carregado. Tente novamente em alguns segundos.");
      return;
    }
    const initial = template ? renderTemplate(template, buildTemplateVars(sub, "")) : "";
    setReview({ sub, kind, reason: "", message: initial, submitting: false });
  }

  function updateReviewReason(reason: string) {
    setReview((prev) => {
      if (!prev) return prev;
      const message = renderTemplate(templates[prev.kind], buildTemplateVars(prev.sub, reason));
      return { ...prev, reason, message };
    });
  }

  async function confirmReview() {
    if (!review) return;
    const { sub, kind, reason, message } = review;
    if (kind === "approved") {
      const missing = missingPublishFields(sub);
      if (missing.length) {
        setPublishBlock({ eventTitle: sub.event_title, action: "aprovar", missing });
        toast.error(`Não dá pra aprovar: falta ${missing.join(', ')}.`);
        setReview({ ...review, submitting: false });
        return;
      }
    }
    setReview({ ...review, submitting: true });

    const payload: any =
      kind === "approved"
        ? {
            status: "aprovado",
            approved_at: new Date().toISOString(),
            approved_by: user?.id,
            rejected_at: null,
            rejected_by: null,
            admin_notes: reason || null,
          }
        : {
            status: "rejeitado",
            rejected_at: new Date().toISOString(),
            rejected_by: user?.id,
            admin_notes: reason || null,
          };

    const { error } = await supabase.from("submissions").update(payload).eq("id", sub.id);
    if (error) {
      handleError(error, "Erro ao atualizar status");
      setReview({ ...review, submitting: false });
      return;
    }

    toast.success(kind === "approved" ? "Evento aprovado." : "Evento rejeitado.");

    if (kind === "approved") {
      if (!sub.image_url) {
        // Gera flyer em segundo plano se não houver
        confirmGenerateFlyer(sub);
      }
    }

    const phoneCheck = validateBrazilianMobile(sub.phone || "");
    if (phoneCheck.valid) {
      const url = buildWhatsappUrl(sub.phone || "", message);
      if (url) {
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win) toast.info("Pop-up bloqueado. Libere para enviar pelo WhatsApp.");
        else toast.success(`WhatsApp aberto para ${phoneCheck.display}.`);
      }
    } else {
      toast.warning(`Sem WhatsApp válido: ${(phoneCheck as { reason: string }).reason}`);
    }

    setReview(null);
    fetchAll();
  }

  async function confirmGenerateFlyer(targetSub?: Submission | React.MouseEvent) {
    let sub: Submission | null = null;
    
    if (targetSub && 'id' in targetSub) {
      sub = targetSub;
    } else {
      sub = flyerOffer;
    }

    if (!sub) return;
    
    // Nunca sobrescreve arte enviada pelo promotor.
    if (sub.image_url) {
      setFlyerOffer(null);
      return;
    }
    setGeneratingFlyer(true);
    try {
      const dataUrl = await generateFallbackFlyer({
        title: sub.event_title || "Evento",
        date: formatEventDate(sub.date),
        startTime: sub.start_time,
        location: sub.location,
        category: (sub as any).category ?? null,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const filePath = `${user?.id ?? "admin"}/fallback-${sub.id}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("event-flyers")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("event-flyers")
        .getPublicUrl(filePath);
      const { error: updErr } = await supabase
        .from("submissions")
        .update({ image_url: publicUrl })
        .eq("id", sub.id);
      if (updErr) throw updErr;
      
      setFlyerOffer(null);
      fetchAll();
    } catch (e) {
      handleError(e, "Não foi possível gerar o flyer");
    } finally {
      setGeneratingFlyer(false);
    }
  }

  const [regenerating, setRegenerating] = useState(false);
  async function regenerateAutoFlyers() {
    setRegenerating(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, event_title, atrativo_name, company_name, date, start_time, location, category, image_url")
        .like("image_url", "%/fallback-%");
      if (error) throw error;
      let ok = 0;
      for (const s of (data ?? []) as any[]) {
        try {
          const dataUrl = await generateFallbackFlyer({
            title: s.event_title || s.atrativo_name || s.company_name || "Evento",
            date: s.date,
            startTime: s.start_time,
            location: s.location,
            category: s.category ?? null,
          });
          const blob = await (await fetch(dataUrl)).blob();
          const filePath = `${user?.id ?? "admin"}/fallback-${s.id}-${Date.now()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("event-flyers")
            .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
          if (upErr) throw upErr;
          const { data: { publicUrl } } = supabase.storage.from("event-flyers").getPublicUrl(filePath);
          const { error: updErr } = await supabase.from("submissions").update({ image_url: publicUrl }).eq("id", s.id);
          if (updErr) throw updErr;
          ok++;
        } catch (e) {
          console.warn("[refazer flyer]", s.id, e);
        }
      }
      toast.success(`${ok} flyers refeitos com a data certinha.`);
      fetchAll();
    } catch (e) {
      handleError(e, "Não deu pra refazer os flyers");
    } finally {
      setRegenerating(false);
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const openWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  async function handleModerationChange(id: string, newModerationStatus: string) {
    const { error } = await supabase.from("submissions").update({ 
      moderation_status: newModerationStatus 
    }).eq("id", id);
    if (error) {
      handleError(error, "Erro ao atualizar moderação");
    } else {
      toast.success(`Moderação atualizada: ${newModerationStatus}`);
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, moderation_status: newModerationStatus } : s));
    }

  }

  async function toggleHighlight(id: string, current: boolean, grantType: "courtesy" | "paid" = "courtesy") {
    const target = submissions.find((submission) => submission.id === id);
    if (!target) return;
    setHighlightingId(id);
    try {
      if (!current && grantType === "paid") {
        const { data: payment, error: paymentError } = await supabase
          .from("payment_records")
          .select("id")
          .eq("item_type", "evento")
          .eq("item_id", id)
          .limit(1)
          .maybeSingle();
        if (paymentError) throw paymentError;
        if (!payment) {
          toast.info("Para marcar como Pago, registre a baixa primeiro. A cortesia pode ser liberada agora.");
          return;
        }
      }

      let imageUrl = target.image_url;
      if (!current && !imageUrl) {
        const dataUrl = await generateFallbackFlyer({
          title: target.event_title || "Evento",
          date: formatEventDate(target.date),
          startTime: target.start_time,
          location: target.location,
          category: target.category,
        });
        const blob = await (await fetch(dataUrl)).blob();
        const filePath = `${user?.id ?? "admin"}/fallback-${target.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("event-flyers")
          .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("event-flyers").getPublicUrl(filePath).data.publicUrl;
      }

      const nextHighlight = !current;
      const { error } = await supabase
        .from("submissions")
        .update({ is_highlight: nextHighlight, highlight_hidden: false, image_url: imageUrl, highlight_grant_type: nextHighlight ? grantType : null })
        .eq("id", id);
      if (error) throw error;

      setSubmissions((previous) => previous.map((submission) =>
         submission.id === id ? { ...submission, is_highlight: nextHighlight, image_url: imageUrl, highlight_grant_type: nextHighlight ? grantType : null } : submission,
      ));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.home.all }),
        queryClient.invalidateQueries({ queryKey: qk.agenda.all }),
        queryClient.invalidateQueries({ queryKey: qk.submissions.all }),
      ]);
      toast.success(nextHighlight ? `Evento em Destaque na Home como ${grantType === "courtesy" ? "cortesia" : "pago"}!` : "Destaque removido");
    } catch (error) {
      handleError(error, "Erro ao atualizar destaque");
    } finally {
      setHighlightingId(null);
    }
  }

  const activeSubmissions = useMemo(
    () => submissions.filter((submission) => isActiveSubmission(submission)),
    [submissions],
  );

  const kpis = useMemo(() => computeKpis(activeSubmissions), [activeSubmissions]);

  const filtered = useMemo(
    () => filterSubmissions(activeSubmissions, { statusFilter, categoryFilter, search }),
    [activeSubmissions, statusFilter, categoryFilter, search],
  );


  if (authLoading || permsLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || !hasPermission('events.read')) return <Navigate to="/" replace />;

  return (
    <PageContainer
      maxWidth="7xl"
      className="flex min-h-0 flex-col space-y-0 py-4 sm:py-5 md:h-[calc(100dvh-5rem)] md:overflow-hidden"
    >
         <PublishBlockDialog info={publishBlock} onClose={() => setPublishBlock(null)} />
         <div className="shrink-0">
           <AdminEventsToolbar
             submissions={activeSubmissions}
             filtered={filtered}
             onRefresh={() => fetchAll()}
             onExportPdf={(list) => exportBulkEventsPdf(list)}
           />

           <div className="mb-3 flex justify-end">
             <Button size="sm" variant="outline" disabled={regenerating} onClick={regenerateAutoFlyers}>
               {regenerating ? "Refazendo flyers..." : "Refazer flyers automáticos"}
             </Button>
           </div>

           <AdminEventsKpis kpis={kpis} activeStatus={statusFilter} onSelectStatus={setStatusFilter} />

           <AdminEventsFilters
             search={search}
             statusFilter={statusFilter}
             categoryFilter={categoryFilter}
             onSearchChange={setSearch}
             onStatusChange={setStatusFilter}
             onCategoryChange={setCategoryFilter}
             onClear={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); toast.info("Filtros limpos"); }}
           />
         </div>

        {/* Main List */}
        <div className="h-[65dvh] min-h-0 shrink-0 overflow-y-auto overscroll-contain rounded-lg border border-border bg-card shadow-sm [scrollbar-gutter:stable] md:h-auto md:flex-1">
           <div className="sticky top-0 z-10 hidden grid-cols-12 gap-4 border-b border-border bg-card/95 px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground backdrop-blur md:grid">
              <div className="col-span-3">Informações do Evento</div>
              <div className="col-span-2">Cronograma</div>
              <div className="col-span-2">Responsável & Contato</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right px-2">Ações Operacionais</div>
           </div>
          
          {loading ? (
            <LoadingState message="Carregando eventos..." />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground space-y-2">
              <CalendarDays className="h-12 w-12 mx-auto opacity-20" />
              <p>Nenhum evento encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((sub) => (
             <div key={sub.id} className="p-3 transition-colors hover:bg-muted/20 dark:hover:bg-muted/40 sm:p-5">
                   <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12 md:gap-6">
                    {/* Informações Principais */}
                     <div className="col-span-3 space-y-2">
                        <div className="flex items-start gap-3 relative group/flyer">
                          {sub.image_url ? (
                            <div className="relative">
                              <img
                                src={sub.image_url}
                                alt={sub.event_title}
                                loading="lazy"
                                className="h-14 w-14 rounded-lg object-cover ring-1 ring-border shrink-0"
                              />
                              <a
                                href={sub.image_url}
                                download={`flyer-${sub.event_title}.jpg`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover/flyer:opacity-100 transition-opacity shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileDown className="h-3 w-3" />
                              </a>
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <CalendarDays className="h-5 w-5 text-muted-foreground/70" />
                            </div>
                          )}
                         <div className="min-w-0 flex-1">
                           <div className="flex items-start gap-1.5">
                             {sub.is_highlight && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-1" />}
                             <h3 className="font-black text-base text-foreground leading-tight tracking-tight line-clamp-2">{sub.event_title || "Evento"}</h3>
                           </div>
                           <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 truncate">
                             por {sub.company_name || sub.responsible_name || "—"}
                           </p>
                         </div>
                       </div>
                       <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                         <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-none uppercase tracking-wider">
                           {categoryLabels[sub.category || ''] || 'Outros'}
                         </Badge>
                         <span className="text-[10px] text-muted-foreground/90 font-mono bg-muted dark:bg-muted/50 px-1.5 py-0.5 rounded">ID: {sub.id.slice(0, 8)}</span>
                       </div>
                         <div className="flex flex-col gap-1 mt-3 p-2 bg-muted/20 rounded-lg border border-border/30">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Data de Cadastro</span>
                           <p className="text-[11px] text-foreground font-bold flex items-center gap-1.5">
                            <History className="h-3 w-3 text-primary/70" />
                             {formatSubmissionDate(sub.created_at)}
                           </p>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                           {sub.moderation_status === 'flagged' && (
                             <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-[9px] font-black uppercase">
                               <ShieldAlert className="h-3 w-3" /> Conteúdo Suspeito
                             </Badge>
                           )}
                           {(sub.report_count ?? 0) > 0 && (
                             <Badge variant="outline" className="flex items-center gap-1 border-destructive/50 bg-destructive/15 text-[9px] font-black uppercase text-foreground">
                               🚩 {sub.report_count} Denúncias
                             </Badge>
                           )}
                         </div>
                     </div>
 
                     {/* Cronograma */}
                     <div className="col-span-2 space-y-2">
                       <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50">
                         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Data do Evento</span>
                         <div className="flex items-center gap-2 text-sm font-black text-foreground">
                           <CalendarDays className="h-4 w-4 text-primary" />
                           {formatEventDate(sub.date)}
                         </div>
                         <div className="flex items-center gap-2 text-xs font-bold text-primary mt-2 ml-0.5">
                           <Clock className="h-3.5 w-3.5" />
                           {sub.start_time || '--:--'}{sub.end_time ? ` – ${sub.end_time}` : ''}
                         </div>
                       </div>
                     </div>

                    {/* Responsável */}
                    <div className="col-span-2 space-y-1.5">
                      <p className="font-bold text-sm text-foreground truncate">{sub.company_name || sub.responsible_name || '—'}</p>
                      <div className="space-y-1">
                        <a href={`tel:${sub.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="h-3 w-3" />
                          {sub.phone || 'Sem tel'}
                        </a>
                        {sub.email && (
                          <a href={`mailto:${sub.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
                            <Mail className="h-3 w-3" />
                            {sub.email}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      {(() => {
                         const cfg = statusConfig[sub.status] || statusConfig.pendente;
                        const StatusIcon = cfg.icon;
                        return (
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge className={`${cfg.bg} ${cfg.color} ${cfg.border} border font-black text-[10px] py-1.5 px-3 flex items-center gap-2 shadow-sm rounded-full`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {cfg.label.toUpperCase()}
                            </Badge>
                            {sub.status === 'aprovado' && (
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 ml-1">
                                <Globe className="h-3 w-3" />
                                NA AGENDA
                              </span>
                            )}
                          </div>
                          {sub.is_highlight && (
                            <Badge variant="outline" className="mt-1 text-[9px]">
                              {sub.highlight_grant_type === "paid" ? "Destaque pago" : "Cortesia · Período de Divulgação"}
                            </Badge>
                          )}
                        );
                      })()}
                    </div>

                     <div className="col-span-3 flex flex-wrap justify-start gap-2 md:justify-end md:gap-1.5">
                      <TooltipProvider>
                        {/* Ver Detalhes */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button size="icon" variant="outline" className="bg-transparent border-border hover:bg-muted hover:text-primary hover:border-primary/20 transition-all shadow-sm md:h-9 md:w-9" onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Detalhes</TooltipContent>
                        </Tooltip>

                        {/* Editar (Abre expansão ou poderia ser rota dedicada) */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button size="icon" variant="outline" className="bg-background border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all shadow-sm md:h-9 md:w-9" onClick={() => setQuickEdit(sub)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar evento</TooltipContent>
                        </Tooltip>

                        {/* Aprovar/Rejeitar/Publicar (Dinâmico) */}
                        {sub.status === 'pendente' ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <span className="inline-flex">
                                    <Button size="icon" variant="outline" disabled={missingPublishFields(sub).length > 0} className="border-success/50 bg-success/15 text-foreground hover:bg-success hover:text-success-foreground transition-all shadow-sm disabled:opacity-50 md:h-9 md:w-9" onClick={() => openReview(sub, 'approved')}>
                                     <CheckCircle className="h-4 w-4" />
                                   </Button>
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent>
                                 {missingPublishFields(sub).length > 0
                                   ? `Falta: ${missingPublishFields(sub).join(", ")}`
                                   : "Aprovar"}
                               </TooltipContent>
                             </Tooltip>
                             
                             <Tooltip>
                               <TooltipTrigger asChild>
                                  <Button size="icon" variant="outline" className="bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm md:h-9 md:w-9" onClick={() => openReview(sub, 'ajuste')}>
                                   <AlertCircle className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Solicitar Ajuste</TooltipContent>
                             </Tooltip>

                             <Tooltip>
                               <TooltipTrigger asChild>
                                  <Button size="icon" variant="outline" className="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm md:h-9 md:w-9" onClick={() => openReview(sub, 'rejected')}>
                                   <XCircle className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Rejeitar</TooltipContent>
                             </Tooltip>
                          </>
                        ) : sub.status === 'aprovado' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <Button size="icon" variant="outline" className="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm md:h-9 md:w-9" onClick={() => openReview(sub, 'rejected')}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rejeitar</TooltipContent>
                          </Tooltip>
                        ) : sub.status === 'rejeitado' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button size="icon" variant="outline" disabled={missingPublishFields(sub).length > 0} className="border-success/50 bg-success/15 text-foreground hover:bg-success hover:text-success-foreground transition-all shadow-sm disabled:opacity-50 md:h-9 md:w-9" onClick={() => openReview(sub, 'approved')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {missingPublishFields(sub).length > 0
                                ? `Falta: ${missingPublishFields(sub).join(", ")}`
                                : "Reverter para Aprovado"}
                            </TooltipContent>
                          </Tooltip>
                        ) : null}

                        {sub.slug && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="outline" className="border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm md:h-9 md:w-9" onClick={() => window.open(`/evento/${sub.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Página Pública</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Divulgar no WhatsApp — visível quando aprovado */}
                        {sub.status === 'aprovado' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                className="h-9 bg-success px-3 text-xs font-bold text-success-foreground shadow-sm hover:bg-success/90 gap-1.5"
                                onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden lg:inline">Divulgar</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Divulgar no WhatsApp</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Destacar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={highlightingId === sub.id}
                              className={cn(
                                "transition-all shadow-sm md:h-9 md:w-9",
                                sub.is_highlight
                                  ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                  : "bg-transparent border-border hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600"
                              )}
                              onClick={() => toggleHighlight(sub.id, !!sub.is_highlight, "courtesy")}
                            >
                              <Star className={cn("h-4 w-4", sub.is_highlight && "fill-amber-600")} />
                            </Button>
                          </TooltipTrigger>
                           <TooltipContent>{sub.is_highlight ? 'Remover Destaque' : 'Conceder cortesia'}</TooltipContent>
                        </Tooltip>

                        {/* Menu Adicional (PDF, WhatsApp, Excluir) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                               <Button size="icon" variant="ghost" className="md:h-9 md:w-9"><ChevronDown className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Distribuição</div>
                            <DropdownMenuItem onClick={() => sub.short_copy && copyToClipboard(sub.short_copy, "Texto curto")} disabled={!sub.short_copy} className="cursor-pointer">
                              <MessageCircle className="h-4 w-4 mr-2" /> Copiar Texto Curto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sub.long_copy && copyToClipboard(sub.long_copy, "Texto longo")} disabled={!sub.long_copy} className="cursor-pointer">
                              <MessageCircle className="h-4 w-4 mr-2" /> Copiar Texto Longo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sub.short_copy && openWhatsApp(sub.short_copy)} disabled={!sub.short_copy} className="cursor-pointer text-emerald-600">
                              <Phone className="h-4 w-4 mr-2" /> Abrir no WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => exportSingleEventPdf(sub)} className="cursor-pointer">
                              <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Moderação</div>
                             {sub.moderation_status === 'flagged' && (
                               <DropdownMenuItem onClick={() => handleModerationChange(sub.id, 'approved')} className="cursor-pointer text-emerald-600 font-bold">
                                 <CheckCircle className="h-4 w-4 mr-2" /> Limpar Sinalização
                               </DropdownMenuItem>
                             )}
                             {sub.moderation_status !== 'blocked' ? (
                               <DropdownMenuItem onClick={() => handleModerationChange(sub.id, 'blocked')} className="cursor-pointer text-red-600 font-bold">
                                 <ShieldAlert className="h-4 w-4 mr-2" /> Bloquear Evento
                               </DropdownMenuItem>
                             ) : (
                               <DropdownMenuItem onClick={() => handleModerationChange(sub.id, 'approved')} className="cursor-pointer text-emerald-600 font-bold">
                                 <RotateCcw className="h-4 w-4 mr-2" /> Desbloquear
                               </DropdownMenuItem>
                             )}
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => setDeleteConfirmId(sub.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer font-bold">
                               <Trash2 className="h-4 w-4 mr-2" /> Excluir permanentemente
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipProvider>
                    </div>
                  </div>

                  {expandedId === sub.id && (
                    <div className="mt-4 p-5 bg-muted/30 rounded-xl border border-border/50 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Classificação e Segurança</h4>
                            <div className="space-y-3 text-sm mb-6">
                              <div className="flex items-center gap-2">
                                <Badge className={cn("rounded-full px-3 py-1 font-black", sub.age_rating === '18+' ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground")}>
                                  {sub.age_rating || 'Livre'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Classificação Etária</span>
                              </div>
                              <p className="flex items-center gap-2 font-bold text-xs">
                                {sub.is_suitable_for_minors ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                Adequado para menores: {sub.is_suitable_for_minors ? 'SIM' : 'NÃO'}
                              </p>
                            </div>

                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Localização e Contato</h4>
                            <div className="space-y-3 text-sm">
                              <p className="flex items-start gap-2 font-medium"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {sub.location}</p>
                              {sub.address_street && <p className="text-xs text-muted-foreground ml-6 leading-relaxed">{sub.address_street}, {sub.address_number}<br/>{sub.address_neighborhood}, {sub.address_city}</p>}
                              {sub.email && <p className="flex items-center gap-2 text-xs"><Mail className="h-4 w-4 text-primary shrink-0" /> {sub.email}</p>}
                              {sub.contact_social && <p className="flex items-center gap-2 text-xs"><Globe className="h-4 w-4 text-primary shrink-0" /> {sub.contact_social}</p>}
                            </div>
                          </div>
                          <div className="pt-2 flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => exportSingleEventPdf(sub)}><FileDown className="h-4 w-4 mr-2" /> PDF do Evento</Button>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}><MessageCircle className="h-4 w-4 mr-2" /> Gerar Texto WhatsApp</Button>
                          </div>
                        </div>
                      <div className="md:col-span-2 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Conteúdo do Evento</h4>
                           <div className="rounded-xl border border-border/60 bg-background p-3 shadow-inner sm:p-5">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{sub.description || "Sem descrição disponível."}</p>
                          </div>
                        </div>
                          {sub.additional_details && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Detalhes Complementares</h4>
                              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg text-sm italic">
                                {sub.additional_details}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row sm:flex-wrap">
                            {sub.status !== 'aprovado' && (
                             (() => {
                               const missing = missingPublishFields(sub);
                               const disabled = missing.length > 0;
                               const btn = (
                                 <Button size="sm" variant="default" disabled={disabled} onClick={() => openReview(sub, 'approved')} className="bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50">
                                   <CheckCircle className="h-4 w-4 mr-2" /> Aprovar e Publicar
                                 </Button>
                               );
                               return disabled ? (
                                 <Tooltip><TooltipTrigger asChild><span className="inline-flex">{btn}</span></TooltipTrigger><TooltipContent>Falta: {missing.join(", ")}</TooltipContent></Tooltip>
                               ) : btn;
                             })()
                            )}
                            {sub.status !== 'rejeitado' && (
                             <Button size="sm" variant="outline" onClick={() => openReview(sub, 'rejected')} className="text-rose-600 border-rose-200 hover:bg-rose-50"><XCircle className="h-4 w-4 mr-2" /> Rejeitar</Button>
                            )}
                            {sub.status === 'pendente' && (
                             <Button size="sm" variant="outline" onClick={() => openReview(sub, 'ajuste')} className="text-orange-600 border-orange-200 hover:bg-orange-50"><AlertCircle className="h-4 w-4 mr-2" /> Solicitar Ajuste</Button>
                            )}
                             <Button size="sm" disabled={highlightingId === sub.id} variant={sub.is_highlight ? 'secondary' : 'outline'} className={sub.is_highlight ? 'bg-amber-100 text-amber-700' : ''} onClick={() => toggleHighlight(sub.id, !!sub.is_highlight, "courtesy")}>
                               {highlightingId === sub.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className={`mr-2 h-4 w-4 ${sub.is_highlight ? 'fill-amber-500' : ''}`} />}
                               {sub.is_highlight ? 'Remover Destaque' : 'Conceder cortesia'}
                             </Button>
                             {!sub.is_highlight && (
                               <Button size="sm" disabled={highlightingId === sub.id} variant="outline" onClick={() => toggleHighlight(sub.id, false, "paid")}>
                                 <Wallet className="mr-2 h-4 w-4" /> Ativar como pago
                               </Button>
                             )}
                             {sub.is_highlight && (
                               <Badge variant="outline">
                                 {sub.highlight_grant_type === "paid" ? "Pago" : "Cortesia (Período de Divulgação)"}
                               </Badge>
                             )}
                            {sub.is_highlight && <PaymentStatus itemType="evento" itemId={sub.id} />}
                            <Button size="sm" variant="ghost" className="text-muted-foreground ml-auto"><History className="h-4 w-4 mr-2" /> Histórico</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir Evento"
        description="Esta ação não pode ser desfeita. O evento será removido permanentemente da base de dados e da agenda pública."
        confirmText="Excluir Agora"
        variant="destructive"
      />

      <ModerationReviewDialog
        review={review}
        onClose={() => setReview(null)}
        onReasonChange={updateReviewReason}
        onMessageChange={(message) => setReview((current) => current ? { ...current, message } : current)}
        onConfirm={confirmReview}
      />

      <QuickEditEventDialog
        event={quickEdit}
        onClose={() => setQuickEdit(null)}
        onSaved={(updated) => setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? ({ ...s, ...updated } as Submission) : s)))}
      />
    </PageContainer>
  );
}
