import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseFinanceAmount, type FinanceItem } from "@/lib/finance";
import type { FinanceCommand } from "@/data/useFinance";
export type FinanceAction = "edit" | "settle" | "release" | "cancel";
const titles = { edit: "Editar cobrança", settle: "Dar baixa", release: "Liberar publicação", cancel: "Cancelar cobrança" };
export function FinanceActionDialog({ item, action, onClose, onConfirm }: { item: FinanceItem; action: FinanceAction; onClose: () => void; onConfirm: (command: FinanceCommand) => Promise<void> }) {
  const [value, setValue] = useState(item.expected_amount_cents == null ? "" : (item.expected_amount_cents / 100).toFixed(2).replace(".", ","));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [release, setRelease] = useState(false);
  const [saving, setSaving] = useState(false);
  async function submit() {
    const amount = parseFinanceAmount(value);
    if ((action === "edit" || action === "settle") && amount === null) return void toast.error("Coloca um valor válido, tipo 49,90.");
    if (action === "settle" && !file) return void toast.error("Anexa o comprovante pra dar baixa.");
    if (file && (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024)) return void toast.error("Use JPG, PNG, WebP ou PDF de até 10 MB.");
    setSaving(true);
    let path: string | undefined;
    try {
      if (action === "settle" && file) {
        path = `${item.item_type}/${item.item_id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("payment-receipts").upload(path, file);
        if (error) throw error;
      }
      await onConfirm({ itemType: item.item_type, itemId: item.item_id, action, amount: amount ?? undefined, notes, receiptPath: path, release });
      toast.success(action === "settle" && release ? "Baixa registrada e publicação liberada!" : `${titles[action]}: pronto!`);
      onClose();
    } catch (error) {
      toast.error(error && typeof error === "object" && "message" in error ? String(error.message) : "Não deu pra salvar. Tenta de novo.");
    } finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{titles[action]}</DialogTitle><DialogDescription>{item.title}</DialogDescription></DialogHeader>
    <div className="space-y-4">
      {(action === "edit" || action === "settle") && <div className="space-y-2"><Label htmlFor="finance-amount">{action === "edit" ? "Valor da cobrança (R$)" : "Valor recebido (R$)"}</Label><Input id="finance-amount" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="49,90" /></div>}
      {action === "settle" && <><div className="space-y-2"><Label htmlFor="finance-receipt">Comprovante</Label><Input id="finance-receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={release} onCheckedChange={(checked) => setRelease(checked === true)} />Liberar publicação após a baixa</label></>}
      {action === "release" && <p className="text-sm text-muted-foreground">O pagamento já tem baixa. Ao confirmar, o item patrocinado será publicado.</p>}
      {action === "cancel" && <p className="text-sm text-muted-foreground">O destaque será retirado. Baixas registradas permanecem no histórico; cancelar não faz estorno.</p>}
      <div className="space-y-2"><Label htmlFor="finance-notes">Observações</Label><Textarea id="finance-notes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} /></div>
    </div><DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>Voltar</Button><Button variant={action === "cancel" ? "destructive" : "default"} onClick={() => void submit()} disabled={saving}>{saving ? "Salvando…" : "Confirmar"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
