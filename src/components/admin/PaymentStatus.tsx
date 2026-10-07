import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, FileText } from "lucide-react";

type Record_ = { id: string; amount_cents: number; receipt_path: string | null; settled_at: string };

/**
 * Status financeiro de um anúncio/evento em destaque.
 * Todo admin vê; Financeiro, Sênior ou Master dão baixa.
 */
export function PaymentStatus({ itemType, itemId }: { itemType: "anuncio" | "evento"; itemId: string }) {
  const { user } = useAuth();
  const { canSettlePayments, canViewFinance } = useAppPermissions();
  const [rec, setRec] = useState<Record_ | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canViewFinance) return;
    (supabase as any)
      .from("payment_records")
      .select("id, amount_cents, receipt_path, settled_at")
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .order("settled_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: Record_ | null }) => setRec(data));
  }, [canViewFinance, itemType, itemId]);

  if (!canViewFinance || rec === undefined) return null;

  async function openReceipt() {
    if (!rec?.receipt_path) return;
    const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(rec.receipt_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  async function darBaixa() {
    const cents = Math.round(parseFloat(valor.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Coloca o valor recebido, tipo 49,90.");
      return;
    }
    if (!file) {
      toast.error("Anexa o comprovante pra dar baixa.");
      return;
    }
    setSaving(true);
    try {
      const path = `${itemType}/${itemId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("payment-receipts").upload(path, file);
      if (up.error) throw up.error;
      const { data, error } = await (supabase as any)
        .from("payment_records")
        .insert({ item_type: itemType, item_id: itemId, amount_cents: cents, receipt_path: path, settled_by: user?.id })
        .select("id, amount_cents, receipt_path, settled_at")
        .single();
      if (error) throw error;
      setRec(data);
      setOpen(false);
      toast.success("Baixa registrada!");
    } catch {
      toast.error("Não deu pra registrar a baixa. Tenta de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {rec ? (
        <>
          <Badge variant="secondary" className="gap-1">
            <Wallet className="h-3 w-3" /> Pago · R$ {(rec.amount_cents / 100).toFixed(2).replace(".", ",")} ·{" "}
            {new Date(rec.settled_at).toLocaleDateString("pt-BR")}
          </Badge>
          {rec.receipt_path && (
            <Button size="sm" variant="ghost" onClick={openReceipt}>
              <FileText className="h-3.5 w-3.5 mr-1" /> Comprovante
            </Button>
          )}
        </>
      ) : (
        <Badge variant="outline" className="gap-1">
          <Wallet className="h-3 w-3" /> Pagamento pendente
        </Badge>
      )}
      {!rec && canSettlePayments && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Dar baixa
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar baixa no pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`valor-${itemId}`}>Valor recebido (R$)</Label>
              <Input id={`valor-${itemId}`} inputMode="decimal" placeholder="49,90" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`comp-${itemId}`}>Comprovante</Label>
              <Input id={`comp-${itemId}`} type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={darBaixa} disabled={saving}>{saving ? "Salvando..." : "Confirmar baixa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
