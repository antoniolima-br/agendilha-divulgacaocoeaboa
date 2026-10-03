import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { CreditCard, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { qk } from "@/data/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEventDateTimeBR } from "@/lib/eventDate";

type PaymentState = "pending" | "confirmed" | "cancelled";
type HighlightPayment = {
  id: string;
  event_title: string | null;
  atrativo_name: string | null;
  date: string | null;
  start_time: string | null;
  location: string | null;
  is_highlight: boolean;
  highlight_grant_type: string | null;
  payment_status: PaymentState;
  has_payment: boolean;
};

const STATUS_LABEL: Record<PaymentState, string> = { pending: "Pendente", confirmed: "Confirmado", cancelled: "Cancelado" };

export default function AdminHighlightPayments() {
  const { user } = useAuth();
  const { canViewFinance, canSettlePayments, loading: permsLoading } = useAppPermissions();
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useQuery({
    queryKey: qk.highlights.payments(),
    enabled: canViewFinance,
    queryFn: async (): Promise<HighlightPayment[]> => {
      const [{ data: submissions, error }, { data: statuses, error: statusError }, { data: payments, error: paymentError }] = await Promise.all([
        supabase.from("submissions").select("id, event_title, atrativo_name, date, start_time, location, is_highlight, highlight_grant_type").or("promotion_choice.eq.highlight,is_highlight.eq.true").order("date", { ascending: false }).limit(300),
        supabase.from("highlight_payment_status").select("event_id, status"),
        supabase.from("payment_records").select("item_id").eq("item_type", "evento"),
      ]);
      if (error) throw error;
      if (statusError) throw statusError;
      if (paymentError) throw paymentError;
      const statusByEvent = new Map((statuses ?? []).map((item) => [item.event_id, item.status as PaymentState]));
      const paidIds = new Set((payments ?? []).map((item) => item.item_id));
      return (submissions ?? []).map((event) => ({
        ...event,
        payment_status: statusByEvent.get(event.id) ?? (paidIds.has(event.id) ? "confirmed" : "pending"),
        has_payment: paidIds.has(event.id),
      }));
    },
  });

  async function changeStatus(event: HighlightPayment, status: PaymentState) {
    if (!user || !canSettlePayments) return;
    if (status === "confirmed" && !event.has_payment) {
      toast.error("Registre a baixa financeira antes de confirmar o pagamento.");
      return;
    }
    const { error } = await supabase.from("highlight_payment_status").upsert({ event_id: event.id, status, updated_by: user.id }, { onConflict: "event_id" });
    if (error) {
      toast.error("Não deu pra atualizar esse pagamento.");
      return;
    }
    if (status === "cancelled" && event.highlight_grant_type === "paid") {
      await supabase.from("submissions").update({ is_highlight: false, highlight_hidden: true }).eq("id", event.id);
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.highlights.all }),
      queryClient.invalidateQueries({ queryKey: qk.home.all }),
      queryClient.invalidateQueries({ queryKey: qk.agenda.all }),
    ]);
    toast.success(`Pagamento marcado como ${STATUS_LABEL[status].toLowerCase()}.`);
  }

  if (permsLoading) return <LoadingState message="Verificando seu acesso…" fullPage />;
  if (!canViewFinance) return <Navigate to="/" replace />;

  return (
    <PageContainer maxWidth="6xl">
      <header className="space-y-2 border-b border-border pb-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><CreditCard className="h-4 w-4" /> Financeiro</p>
        <h1 className="font-display text-3xl font-black text-foreground">Pagamentos dos destaques</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Acompanhe solicitações pagas sem misturar as cortesias do período de divulgação.</p>
      </header>

      {isLoading ? <LoadingState message="Carregando pagamentos…" /> : events.length === 0 ? (
        <EmptyState icon={Sparkles} title="Nenhuma solicitação de destaque" description="Novas solicitações aparecem aqui." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="p-4">Evento</th><th className="p-4">Quando e onde</th><th className="p-4">Tipo</th><th className="p-4">Baixa</th><th className="p-4">Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="p-4 font-bold text-foreground">{event.event_title || event.atrativo_name || "Rolê"}</td>
                  <td className="p-4 text-muted-foreground"><span className="block">{formatEventDateTimeBR(event.date, event.start_time)}</span><span>{event.location || "Local a confirmar"}</span></td>
                  <td className="p-4"><Badge variant={event.highlight_grant_type === "courtesy" ? "secondary" : "outline"}>{event.highlight_grant_type === "courtesy" ? "Cortesia" : "Pago"}</Badge></td>
                  <td className="p-4"><Badge variant={event.has_payment ? "secondary" : "outline"}>{event.has_payment ? "Registrada" : "Não registrada"}</Badge></td>
                  <td className="p-4">
                    {canSettlePayments ? (
                      <Select value={event.payment_status} onValueChange={(value) => void changeStatus(event, value as PaymentState)}>
                        <SelectTrigger className="w-40" aria-label={`Status de pagamento de ${event.event_title || event.atrativo_name || "rolê"}`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="confirmed" disabled={!event.has_payment}>Confirmado</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent>
                      </Select>
                    ) : <Badge variant="outline">{STATUS_LABEL[event.payment_status]}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!canSettlePayments && <p className="text-xs text-muted-foreground">Apenas Financeiro ou Master pode alterar os status.</p>}
    </PageContainer>
  );
}