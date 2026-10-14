import { lazy, Suspense, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { moneyBR } from '@/lib/finance';
import { type IntranetDashboard } from '@/lib/intranet';
import { toast } from 'sonner';
import { usePortalCommand, useSectorRecords, type Lead, type Sample } from './useIntranet';
import { RecordDialog } from './RecordDialog';
import { Operations } from './Operations';
const Chart = lazy(() => import('./PortalChart'));
const Finance = lazy(() => import('@/pages/AdminFinanceiro'));
const Advertising = lazy(() => import('@/pages/AdminAds'));
const FlyerEngagementPanel = lazy(() => import('./FlyerEngagementPanel'));
const GuestAnalyticsPanel = lazy(() => import('./GuestAnalyticsPanel'));
const CurationOperationsPanel = lazy(() => import('./CurationOperationsPanel').then((module) => ({ default: module.CurationOperationsPanel })));
export const ChartView = ({title,points,money=false}: {title:string;points:{name:string;value:number}[];money?:boolean}) => <Suspense fallback={<p className="py-10 text-muted-foreground">Carregando gráfico…</p>}><Chart title={title} points={points} money={money} /></Suspense>;
const dateBR = (value: string | null) => value ? new Date(value.length===10 ? `${value}T12:00:00-03:00` : value).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}) : 'Não definido';
const ErrorState = ({ retry }: { retry: () => void }) => <div role="alert" className="py-8 space-y-3"><p>Não deu pra carregar os registros. Tente novamente.</p><Button onClick={retry} variant="outline">Tentar novamente</Button></div>;
const leadLabels: Record<string,string> = {novo:'Novo',contato:'Em contato',proposta:'Proposta',ganho:'Ganho',perdido:'Perdido'};
function nextCommercialAction(stage: string): string {
  if (stage === 'novo') return 'Fazer o primeiro contato';
  if (stage === 'contato') return 'Entender a necessidade do parceiro';
  if (stage === 'proposta') return 'Acompanhar a proposta';
  if (stage === 'ganho') return 'Fazer o pós-venda e planejar a próxima ação';
  return 'Registrar o motivo e avaliar uma nova oportunidade';
}
export function Commercial({ data, canEdit }: {data:IntranetDashboard;canEdit:boolean}) {
  const query=useSectorRecords<Lead>('intranet_leads'); const command=usePortalCommand();
  const [edit,setEdit]=useState<Lead | null | undefined>(undefined); const [search,setSearch]=useState('');
  const leads=query.data ?? []; const visible=leads.filter(l=>`${l.company} ${l.contact}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const active=leads.filter(l=>l.stage==='ganho' && (!l.starts_on || l.starts_on<=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})) && (!l.ends_on || l.ends_on>=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})));
  async function remove(id:string) { if (!window.confirm('Excluir este anunciante do CRM?')) return; try {await command.mutateAsync(()=>supabase.from('intranet_leads').delete().eq('id',id)); toast.success('Anunciante excluído.');} catch {toast.error('Não deu pra excluir. Tente novamente.');} }
  return <><Suspense fallback={<p className="py-8">Reunindo convidados…</p>}><GuestAnalyticsPanel days={30} mode="marketing"/></Suspense><dl className="grid gap-3 border-b py-6 sm:grid-cols-2"><div className="rounded-lg border bg-card p-5"><dt className="text-sm text-muted-foreground">Parceiros cadastrados</dt><dd className="mt-3 text-3xl font-bold">{leads.length}</dd></div><div className="rounded-lg border bg-card p-5"><dt className="text-sm text-muted-foreground">Propostas mensais ativas</dt><dd className="mt-3 text-3xl font-bold">{moneyBR(active.reduce((n,l)=>n+l.monthly_cents,0))}</dd><p className="mt-1 text-xs text-muted-foreground">Não representa receita recebida.</p></div></dl><section className="py-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Parceiros e anunciantes</h2><p className="mt-1 text-sm text-muted-foreground">Prospecção, propostas, fechamento e pós-venda em um só lugar.</p></div>{canEdit&&<Button className="min-h-12 w-full sm:w-auto" onClick={()=>setEdit(null)}><Plus className="mr-2 h-4 w-4"/>Novo parceiro</Button>}</header><Input aria-label="Buscar parceiro" placeholder="Buscar por nome ou contato" value={search} onChange={e=>setSearch(e.target.value)} className="my-4 max-w-md"/>{query.isError ? <ErrorState retry={()=>void query.refetch()}/> : query.isLoading ? <p>Carregando parceiros…</p> : visible.length===0 ? <p className="py-8 text-sm text-muted-foreground">Nenhum parceiro encontrado. Cadastre um contato para começar.</p> : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map(l=><li key={l.id} className="flex min-w-0 flex-col justify-between gap-4 rounded-lg border bg-card p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold">{l.company}</h3><Badge variant="outline">{leadLabels[l.stage]}</Badge></div><p className="mt-2 break-words text-sm text-muted-foreground">{l.contact}</p><p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Próxima ação</p><p className="mt-1 text-sm">{nextCommercialAction(l.stage)}</p><p className="mt-3 text-sm text-muted-foreground">{dateBR(l.starts_on)} a {dateBR(l.ends_on)}</p></div>{canEdit&&<div className="grid grid-cols-2 gap-2 border-t pt-3"><Button variant="outline" className="min-h-11" onClick={()=>setEdit(l)}><Pencil className="mr-2 h-4 w-4"/>Atualizar</Button><Button variant="ghost" className="min-h-11" disabled={command.isPending} onClick={()=>void remove(l.id)}><Trash2 className="mr-2 h-4 w-4"/>Excluir</Button></div>}</li>)}</ul>}</section>{canEdit&&edit!==undefined && <RecordDialog kind="lead" record={edit ?? undefined} close={()=>setEdit(undefined)}/>}</>;
}
export function Marketing({data,canEdit,days=30}:{data:IntranetDashboard;canEdit:boolean;days?:number}) {
 void data; void canEdit;
  return <div className="min-w-0 space-y-8"><section aria-labelledby="marketing-ads-title"><header className="border-b py-6"><h2 id="marketing-ads-title" className="text-xl font-semibold">Anúncios e patrocinadores</h2><p className="mt-2 text-sm text-muted-foreground">Crie artes, escolha os espaços do app e defina onde cada campanha aparece.</p></header><Suspense fallback={<p className="py-10">Carregando anúncios…</p>}><Advertising embedded/></Suspense></section><section className="min-w-0 border-t pt-6" aria-label={`Impacto de Marketing nos últimos ${days} dias`}><h2 className="text-xl font-semibold">Engajamento das campanhas</h2><Suspense fallback={<p className="py-10">Reunindo o impacto dos flyers…</p>}><FlyerEngagementPanel/></Suspense></section></div>;
}
export function Administration({data,canEdit}:{data:IntranetDashboard;canEdit:boolean}) {
 void data;
 return <Suspense fallback={<p className="py-8">Carregando a fila da Curadoria…</p>}><CurationOperationsPanel canEdit={canEdit}/></Suspense>;
}
export function Development({canEdit}:{canEdit:boolean}){
 const query=useSectorRecords<Sample>('intranet_health_samples');const command=usePortalCommand();const [error,setError]=useState('');
 async function probe(){setError('');const start=performance.now();try{const {error:failed}=await supabase.rpc('intranet_health_probe');if(failed)throw failed;const latency=Math.round(performance.now()-start);const storage=await navigator.storage?.estimate();await command.mutateAsync(()=>supabase.from('intranet_health_samples').insert({latency_ms:latency,storage_used:storage?.usage ?? null,storage_quota:storage?.quota ?? null}).select().single());toast.success('Medição registrada.');}catch{setError('Não foi possível medir agora. Confira sua conexão e tente novamente.');}}
 const samples=query.data ?? [];const latest=samples[0];
 return <><Operations sector="desenvolvimento" canEdit={canEdit}/><header className="flex flex-wrap items-center justify-between gap-4 py-6"><h2 className="text-xl font-semibold">Monitoramento do PWA</h2>{canEdit&&<Button disabled={command.isPending} onClick={()=>void probe()}><RefreshCw className="mr-2 h-4 w-4"/>Medir agora</Button>}</header>{error && <p role="alert" className="text-destructive">{error}</p>}{query.isError && <ErrorState retry={()=>void query.refetch()}/>}<dl className="grid grid-cols-2 gap-6 border-y py-6"><div><dt className="text-sm text-muted-foreground">Última latência da consulta</dt><dd className="text-xl font-bold">{latest?`${latest.latency_ms} ms`:'Sem medição'}</dd></div><div><dt className="text-sm text-muted-foreground">Armazenamento desta origem</dt><dd className="text-xl font-bold">{latest?.storage_used!=null?`${(latest.storage_used/1048576).toFixed(2)} MB`:'Sem medição'}</dd></div></dl><ChartView title="Latência das medições manuais (ms)" points={samples.slice(0,30).reverse().map(s=>({name:new Date(s.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),value:s.latency_ms}))}/><section className="py-6"><h2 className="text-lg font-semibold">Estabilidade e logs</h2><p className="mt-3 text-sm text-muted-foreground">Uptime, taxa de erros e logs centralizados aguardam conexão com monitoramento contínuo. Medições manuais não representam disponibilidade histórica.</p></section></>;
}
export function Financial(){return <Suspense fallback={<p className="py-8">Carregando conciliação…</p>}><Finance embedded/></Suspense>;}
