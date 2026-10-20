import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { INTRANET_SECTORS, assignedIntranetSector, isAdministrativeMember, isIntranetSector, sectorLabels, type IntranetSector } from '@/lib/intranet';
import { useMembers, usePortalCommand, type Member } from './useIntranet';
import { toast } from 'sonner';

const DURATIONS = [{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: 'sem', label: 'Sem prazo' }];

function GrantRow({ member, busy, onGrant, onRevoke }: { member: Member; busy: boolean; onGrant: (sector: IntranetSector, days: number | null) => void; onRevoke: (sector: string) => void }) {
  const own = assignedIntranetSector(member.roles);
  const options = INTRANET_SECTORS.filter((s) => s !== own);
  const [sector, setSector] = useState<IntranetSector>(options[0]);
  const [duration, setDuration] = useState('7');
  return <div className="mt-3 space-y-2">
    {(member.grants ?? []).length > 0 && <div className="flex flex-wrap gap-2">{member.grants!.map((g) => <Badge key={g.sector} variant="outline" className="gap-2">
      Edita {isIntranetSector(g.sector) ? sectorLabels[g.sector] : g.sector}{g.expires_at ? ` até ${new Date(g.expires_at).toLocaleDateString('pt-BR')}` : ''}
      <button type="button" className="font-semibold" aria-label={`Tirar edição de ${g.sector}`} disabled={busy} onClick={() => onRevoke(g.sector)}>×</button>
    </Badge>)}</div>}
    {own && <div className="flex flex-wrap items-center gap-2">
      <Select value={sector} onValueChange={(v) => setSector(v as IntranetSector)}><SelectTrigger className="w-40" aria-label={`Setor extra de ${member.name}`}><SelectValue /></SelectTrigger><SelectContent>{options.map((s) => <SelectItem key={s} value={s}>{sectorLabels[s]}</SelectItem>)}</SelectContent></Select>
      <Select value={duration} onValueChange={setDuration}><SelectTrigger className="w-32" aria-label="Prazo"><SelectValue /></SelectTrigger><SelectContent>{DURATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => onGrant(sector, duration === 'sem' ? null : Number(duration))}>Liberar edição</Button>
    </div>}
  </div>;
}

export default function AccessPanel() {
  const { user } = useAuth(); const query = useMembers(true); const command = usePortalCommand(); const [search, setSearch] = useState('');
  async function run(call: () => PromiseLike<{ error: unknown }>, ok: string) { try { await command.mutateAsync(call as never); toast.success(ok); } catch { toast.error('Não deu pra alterar o acesso. Tente de novo.'); } }
  const assign = (id: string, sector: string) => run(() => supabase.rpc('intranet_assign_sector', { p_user: id, p_sector: sector }), 'Responsável do setor atualizado.');
  const grant = (id: string, sector: IntranetSector, days: number | null) => run(() => supabase.rpc('intranet_set_edit_grant', { p_user: id, p_sector: sector, p_days: days as number, p_revoke: false }), 'Edição liberada.');
  const revoke = (id: string, sector: string) => run(() => supabase.rpc('intranet_set_edit_grant', { p_user: id, p_sector: sector, p_days: null as unknown as number, p_revoke: true }), 'Edição retirada.');
  const members = (query.data ?? []).filter((m) => isAdministrativeMember(m.roles) && m.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <section className="border-t py-8">
    <h2 className="text-xl font-semibold">Acessos dos sócios</h2>
    <p className="py-3 text-sm text-muted-foreground">Todo sócio vê todos os setores. Só o responsável edita o próprio setor. Aqui você escolhe o responsável e libera edição extra, com prazo, quando o titular estiver fora. Sênior e Master editam tudo.</p>
    <Input className="max-w-md" aria-label="Buscar sócio" placeholder="Buscar sócio" value={search} onChange={(e) => setSearch(e.target.value)} />
    {query.isError ? <p role="alert" className="py-5">Não deu pra carregar a equipe. Tente de novo mais tarde.</p> : query.isLoading ? <p className="py-5">Carregando equipe…</p> : members.length === 0 ? <p className="py-5 text-muted-foreground">Nenhum sócio encontrado.</p> :
      <ul className="mt-5 divide-y">{members.map((m) => <li key={m.id} className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="min-w-0 break-words">{m.name}</span>
          {m.roles.some((r) => ['master', 'senior'].includes(r)) ? <span className="text-sm text-primary">Diretoria · edita tudo</span> :
            <Select value={assignedIntranetSector(m.roles) ?? 'nenhum'} disabled={command.isPending || m.id === user?.id} onValueChange={(v) => void assign(m.id, v)}><SelectTrigger className="w-52" aria-label={`Setor de ${m.name}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">Sem setor</SelectItem>{INTRANET_SECTORS.map((s) => <SelectItem key={s} value={s}>Responsável: {sectorLabels[s]}</SelectItem>)}</SelectContent></Select>}
        </div>
        {!m.roles.some((r) => ['master', 'senior'].includes(r)) && m.id !== user?.id && <GrantRow member={m} busy={command.isPending} onGrant={(s, d) => void grant(m.id, s, d)} onRevoke={(s) => void revoke(m.id, s)} />}
      </li>)}</ul>}
  </section>;
}
