import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Operation } from '@/lib/intranet';
import { useOperations, usePortalCommand } from './useIntranet';
import { toast } from 'sonner';
const statuses = { pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluído' };
const priorities = { normal: 'Normal', alta: 'Alta', urgente: 'Urgente' };
function OperationDialog({ sector, record, close }: { sector: Operation['sector']; record?: Operation; close: () => void }) {
  const [title, setTitle] = useState(record?.title ?? '');
  const [responsible, setResponsible] = useState(record?.responsible ?? '');
  const [status, setStatus] = useState(record?.status ?? 'pendente');
  const [priority, setPriority] = useState(record?.priority ?? 'normal');
  const [due, setDue] = useState(record?.due_on ?? '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [error, setError] = useState('');
  const command = usePortalCommand();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return setError('Dê um nome à atividade para continuar.');
    const payload = { sector, title: title.trim(), responsible: responsible.trim(), status, priority, due_on: due || null, notes };
    try {
      await command.mutateAsync(() => record ? supabase.from('intranet_operations').update(payload).eq('id', record.id).eq('sector', sector).select().single() : supabase.from('intranet_operations').insert(payload).select().single());
      toast.success('Atividade salva.'); close();
    } catch { setError('Não deu pra salvar. Confira seu acesso e tente novamente.'); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !command.isPending) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{record ? 'Editar atividade' : 'Nova atividade'}</DialogTitle><DialogDescription>{sector === 'desenvolvimento' ? 'Demandas técnicas e entregas do PWA.' : 'Rotinas e pendências da administração.'}</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div><Label htmlFor="operation-title">Atividade</Label><Input id="operation-title" required maxLength={160} value={title} onChange={e => setTitle(e.target.value)}/></div><div><Label htmlFor="operation-responsible">Responsável</Label><Input id="operation-responsible" maxLength={160} value={responsible} onChange={e => setResponsible(e.target.value)}/></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status da atividade"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(statuses).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div><div><Label>Prioridade</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger aria-label="Prioridade"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(priorities).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div></div><div><Label htmlFor="operation-due">Prazo</Label><Input id="operation-due" type="date" value={due} onChange={e => setDue(e.target.value)}/></div><div><Label htmlFor="operation-notes">Atualização / observações</Label><Textarea id="operation-notes" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)}/></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" type="submit" disabled={command.isPending}>{command.isPending ? 'Salvando…' : 'Salvar atividade'}</Button></form></DialogContent></Dialog>;
}
export function Operations({ sector, canEdit }: { sector: Operation['sector']; canEdit: boolean }) {
  const query = useOperations(sector); const command = usePortalCommand();
  const [edit, setEdit] = useState<Operation | null | undefined>();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('todos');
  const rows = (query.data ?? []).filter(r => (status === 'todos' || status === r.status) && `${r.title} ${r.responsible}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  async function remove(row: Operation) {
    if (!window.confirm('Excluir esta atividade?')) return;
    try { await command.mutateAsync(() => supabase.from('intranet_operations').delete().eq('id', row.id).eq('sector', sector).select().single()); toast.success('Atividade excluída.'); }
    catch { toast.error('Não deu pra excluir. Tente novamente.'); }
  }
  return <section className="border-b py-6"><header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{sector === 'desenvolvimento' ? 'Demandas e entregas' : 'Auditoria e rotinas de curadoria'}</h2>{canEdit&&<Button onClick={() => setEdit(null)}><Plus className="mr-2 h-4 w-4"/>Atividade</Button>}</header><div className="my-5 flex flex-wrap gap-3"><Input aria-label="Buscar atividade" placeholder="Buscar atividade ou responsável" className="min-w-0 flex-1" value={search} onChange={e => setSearch(e.target.value)}/><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-44" aria-label="Filtrar atividades"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem>{Object.entries(statuses).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>{query.isError ? <div role="alert"><p>Não deu pra carregar as atividades.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div> : query.isLoading ? <p>Carregando atividades…</p> : !rows.length ? <p className="py-6 text-sm text-muted-foreground">Nenhuma atividade encontrada. Cadastre uma ou ajuste os filtros.</p> : <ul className="divide-y">{rows.map(r => <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{r.title}</h3><div className="my-2 flex flex-wrap gap-2"><Badge variant="outline">{statuses[r.status as keyof typeof statuses]}</Badge><Badge variant="secondary">{priorities[r.priority as keyof typeof priorities]}</Badge></div><p className="break-words text-sm text-muted-foreground">{r.responsible || 'Responsável a definir'} · {r.due_on ? r.due_on.split('-').reverse().join('/') : 'Sem prazo'}</p>{r.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.notes}</p>}</div>{canEdit&&<div className="flex"><Button size="icon" variant="ghost" title="Editar atividade" aria-label={`Editar ${r.title}`} onClick={() => setEdit(r)}><Pencil className="h-4 w-4"/></Button><Button size="icon" variant="ghost" title="Excluir atividade" aria-label={`Excluir ${r.title}`} disabled={command.isPending} onClick={() => void remove(r)}><Trash2 className="h-4 w-4"/></Button></div>}</li>)}</ul>}{canEdit&&edit !== undefined && <OperationDialog sector={sector} record={edit ?? undefined} close={() => setEdit(undefined)}/>}</section>;
}