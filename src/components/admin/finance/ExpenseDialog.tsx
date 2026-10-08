import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { parseFinanceAmount } from "@/lib/finance";
import { saoPauloTodayISO } from "@/lib/eventDate";
import { toast } from "sonner";
type ExpenseInput = { description: string; category: string; amount: number; date: string; notes: string };
export function ExpenseDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (input: ExpenseInput) => Promise<void> }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operacional");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(saoPauloTodayISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    const amount = parseFinanceAmount(value);
    if (description.trim().length < 2 || amount === null || amount <= 0 || !date || date > saoPauloTodayISO()) return void toast.error("Confira a descrição, o valor e a data da despesa paga.");
    setSaving(true);
    try { await onConfirm({ description, category, amount, date, notes }); toast.success("Despesa registrada no caixa!"); onClose(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não deu pra salvar. Tenta de novo."); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Registrar despesa</DialogTitle><DialogDescription>Saída já paga, com data e valor do pagamento.</DialogDescription></DialogHeader><div className="space-y-4">
    <div className="space-y-2"><Label htmlFor="expense-description">Descrição</Label><Input id="expense-description" value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} /></div>
    <div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Categoria da despesa"><SelectValue /></SelectTrigger><SelectContent>{["Operacional", "Marketing", "Equipe", "Infraestrutura", "Impostos", "Outros"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="expense-amount">Valor pago (R$)</Label><Input id="expense-amount" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="49,90" /></div><div className="space-y-2"><Label htmlFor="expense-date">Data do pagamento</Label><Input id="expense-date" type="date" max={saoPauloTodayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></div></div>
    <div className="space-y-2"><Label htmlFor="expense-notes">Observações</Label><Textarea id="expense-notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
  </div><DialogFooter><Button variant="outline" disabled={saving} onClick={onClose}>Voltar</Button><Button disabled={saving} onClick={() => void submit()}>{saving ? "Salvando…" : "Registrar despesa"}</Button></DialogFooter></DialogContent></Dialog>;
}