import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { parseFinanceAmount } from '@/lib/finance';
import { validCampaignDestination } from '@/lib/intranet';
import { usePortalCommand, type Lead, type Campaign } from './useIntranet';
import { toast } from 'sonner';
export function RecordDialog({ kind, record, close }: { kind: 'lead' | 'campaign'; record?: Lead | Campaign; close: () => void }) {
  const lead = record && 'company' in record ? record : undefined;
  const campaign = record && 'destination' in record ? record : undefined;
  const [name,setName] = useState(lead?.company ?? campaign?.name ?? '');
  const [contact,setContact] = useState(lead?.contact ?? campaign?.destination ?? '');
  const [amount,setAmount] = useState(((lead?.monthly_cents ?? campaign?.budget_cents ?? 0)/100).toFixed(2).replace('.',','));
  const [stage,setStage] = useState(lead?.stage ?? campaign?.status ?? (kind === 'lead' ? 'novo' : 'planejada'));
  const [channel,setChannel] = useState(campaign?.channel ?? 'organico');
  const [starts,setStarts] = useState(lead?.starts_on ?? '');
  const [ends,setEnds] = useState(lead?.ends_on ?? '');
  const [notes,setNotes] = useState(lead?.notes ?? '');
  const [error,setError] = useState('');
  const command = usePortalCommand();
  const stages = kind === 'lead' ? [['novo','Novo'],['contato','Em contato'],['proposta','Proposta'],['ganho','Ganho'],['perdido','Perdido']] : [['planejada','Planejada'],['ativa','Ativa'],['encerrada','Encerrada']];
  async function save(e: React.FormEvent) {
    e.preventDefault(); const cents = parseFinanceAmount(amount);
    if (!name.trim() || cents === null) return setError('Informe o nome e um valor válido.');
    if (kind === 'campaign' && !validCampaignDestination(contact)) return setError('Informe um link HTTPS válido, sem usuário ou senha.');
    if (ends && starts && ends < starts) return setError('O término deve ser depois do início.');
    try {
      if (kind === 'lead') { const payload = {company:name.trim(),contact,monthly_cents:cents,stage,starts_on:starts || null,ends_on:ends || null,notes}; await command.mutateAsync(() => record ? supabase.from('intranet_leads').update(payload).eq('id',record.id).select().single() : supabase.from('intranet_leads').insert(payload).select().single()); }
      else { const payload = {name:name.trim(),destination:contact,channel,status:stage,budget_cents:cents}; await command.mutateAsync(() => record ? supabase.from('intranet_campaigns').update(payload).eq('id',record.id).select().single() : supabase.from('intranet_campaigns').insert(payload).select().single()); }
      toast.success('Registro salvo.'); close();
    } catch { setError('Não deu pra salvar. Confira seu acesso e tente de novo.'); }
  }
  return <Dialog open onOpenChange={v => {if (!v) close();}}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{record ? 'Editar' : 'Novo'} {kind === 'lead' ? 'anunciante' : 'campanha'}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4"><div className="space-y-1"><Label htmlFor="record-name">{kind === 'lead' ? 'Empresa' : 'Campanha'}</Label><Input id="record-name" required maxLength={160} value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-1"><Label htmlFor="record-contact">{kind === 'lead' ? 'Contato' : 'Link de destino'}</Label><Input id="record-contact" type={kind === 'lead' ? 'text' : 'url'} maxLength={kind === 'lead' ? 200 : 2000} required={kind==='campaign'} value={contact} onChange={e => setContact(e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="record-value">{kind==='lead' ? 'Mensalidade proposta (R$)' : 'Orçamento (R$)'}</Label><Input id="record-value" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></div><div className="space-y-1"><Label>Status</Label><Select value={stage} onValueChange={setStage}><SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger><SelectContent>{stages.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div></div>{kind==='lead' ? <><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="record-start">Início</Label><Input id="record-start" type="date" value={starts} onChange={e=>setStarts(e.target.value)} /></div><div><Label htmlFor="record-end">Término</Label><Input id="record-end" type="date" value={ends} onChange={e=>setEnds(e.target.value)} /></div></div><Label htmlFor="record-notes">Observações</Label><Textarea id="record-notes" maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} /></> : <div><Label>Canal</Label><Select value={channel} onValueChange={setChannel}><SelectTrigger aria-label="Canal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="organico">Orgânico</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent></Select></div>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={command.isPending}>{command.isPending ? 'Salvando…' : 'Salvar'}</Button></form></DialogContent></Dialog>;
}
