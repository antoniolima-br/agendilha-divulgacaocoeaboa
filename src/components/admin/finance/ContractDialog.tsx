import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { parseFinanceAmount, type FinanceContract } from "@/lib/finance";
import { commercialLabels } from "@/lib/financeAnalytics";
import { toast } from "sonner";
type ContractInput = { itemType: "evento" | "anuncio"; itemId: string; commercialType: "paid" | "courtesy" | "barter"; amount: number; startsOn?: string; endsOn?: string; notes: string };
export function ContractDialog({ item, onClose, onConfirm }: { item: FinanceContract; onClose: () => void; onConfirm: (input: ContractInput) => Promise<void> }) {
  const [type, setType] = useState(item.commercial_type);
  const [value, setValue] = useState((item.reference_amount_cents / 100).toFixed(2).replace(".", ","));
  const [start, setStart] = useState(item.starts_on ?? "");
  const [end, setEnd] = useState(item.ends_on ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  async function submit() {
    const amount = parseFinanceAmount(value);
    if (amount === null || (start && end && end < start)) return void toast.error("Confira o valor e as datas do contrato.");
    setSaving(true);
    try { await onConfirm({ itemType: item.item_type, itemId: item.item_id, commercialType: type, amount, startsOn: start || undefined, endsOn: end || undefined, notes }); toast.success("Contrato atualizado!"); onClose(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não deu pra salvar. Tenta de novo."); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Contrato e veiculação</DialogTitle><DialogDescription>{item.title}</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Tipo de contratação</Label><Select value={type} onValueChange={(v) => { if (v === "paid" || v === "courtesy" || v === "barter") setType(v); }}><SelectTrigger aria-label="Tipo de contratação"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(commercialLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="contract-value">Valor de referência (R$)</Label><Input id="contract-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="contract-start">Início da veiculação</Label><Input id="contract-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="contract-end">Fim da veiculação</Label><Input id="contract-end" type="date" min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="contract-notes">Observações / contrapartida</Label><Textarea id="contract-notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></div><p className="text-sm text-muted-foreground">Cortesias e permutas não entram como receita. Este registro não publica nem altera o prazo do destaque.</p></div><DialogFooter><Button variant="outline" disabled={saving} onClick={onClose}>Voltar</Button><Button disabled={saving} onClick={() => void submit()}>{saving ? "Salvando…" : "Salvar contrato"}</Button></DialogFooter></DialogContent></Dialog>;
}