import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/data/useFinance';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/data/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from '@/components/ui/select';
import { usePortalCommand } from './useIntranet';
import { ChartView } from './SectorViews';
import { toast } from 'sonner';
const labels: Record<string,string>={'30_dias':'30 dias','7_dias':'7 dias',pushes:'Pushes',sem_classificacao:'Sem classificação'};
export default function FinanceMetrics({days}:{days:number}) {
 const {user}=useAuth();const {canSettlePayments}=useAppPermissions();const finance=useFinance();const command=usePortalCommand();const [item,setItem]=useState('');const [category,setCategory]=useState('30_dias');const [due,setDue]=useState('');
 const query=useQuery({queryKey:qk.intranet.dashboard(user?.id ?? null,'finance-categories',days),enabled:!!user,queryFn:async()=>{const {data,error}=await supabase.rpc('intranet_finance_metrics',{p_days:days});if(error)throw error;return data as unknown as {categories:{name:string;value:number}[];overdue:number;unclassified:number};}});
 async function save(e:React.FormEvent){e.preventDefault();const selected=finance.data?.items.find(i=>`${i.item_type}:${i.item_id}`===item);if(!selected)return;try{await command.mutateAsync(()=>supabase.rpc('intranet_classify_finance',{p_type:selected.item_type,p_id:selected.item_id,p_category:category,p_due:due || undefined}));toast.success('Classificação financeira salva.');}catch{toast.error('Não deu pra classificar. Tente novamente.');}}
 return <section className="border-b py-6">{query.isError?<p role="alert">Não deu pra carregar a classificação financeira.</p>:query.data?<><ChartView title="Receita recebida por formato" money points={query.data.categories.map(p=>({...p,name:labels[p.name] ?? p.name}))}/><p className="py-4 text-sm">Inadimplência: <strong>{query.data.overdue} cobranças vencidas</strong> · {query.data.unclassified} sem vencimento definido</p></>:<p>Carregando classificação…</p>}{canSettlePayments && <form onSubmit={save} className="flex flex-wrap items-end gap-3"><div className="min-w-0 w-full lg:w-72"><Label>Cobrança</Label><Select value={item} onValueChange={setItem}><SelectTrigger aria-label="Cobrança para classificar"><SelectValue placeholder="Escolher cobrança"/></SelectTrigger><SelectContent>{finance.data?.items.map(i=><SelectItem key={`${i.item_type}:${i.item_id}`} value={`${i.item_type}:${i.item_id}`}>{i.title}</SelectItem>)}</SelectContent></Select></div><div className="w-full sm:w-40"><Label>Formato</Label><Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Formato financeiro"><SelectValue/></SelectTrigger><SelectContent>{['30_dias','7_dias','pushes'].map(c=><SelectItem key={c} value={c}>{labels[c]}</SelectItem>)}</SelectContent></Select></div><div className="w-full sm:w-44"><Label htmlFor="due">Vencimento</Label><Input id="due" type="date" value={due} onChange={e=>setDue(e.target.value)}/></div><Button type="submit" disabled={!item || command.isPending}>Salvar classificação</Button></form>}</section>;
}
