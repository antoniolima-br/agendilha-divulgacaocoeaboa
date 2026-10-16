import { useState } from 'react';
import { CompactMultiSelect } from './CompactMultiSelect';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGIONS, type Region } from '@/lib/regions';
import { NOTIFICATION_INTERESTS, cleanLocality, geographyOptionsFor } from '@/lib/notificationPreferences';

const regionFrom = (values: string[]): Region | 'all' => {
 const found = values.find(v => v.startsWith('region:'))?.slice(7);
 return REGIONS.find(r => r === found) ?? 'all';
};

/** Região → bairros/localidades em cascata; bairros vazios mantêm a região inteira (ou todas). */
export function NotificationPreferences({ geographies, onGeographiesChange, interests, onInterestsChange, id = 'notification-geography' }: {
 geographies: string[]; onGeographiesChange: (value: string[]) => void; interests: string[]; onInterestsChange: (value: string[]) => void; id?: string;
}) {
 const [region, setRegion] = useState<Region | 'all'>(() => regionFrom(geographies));
 const places = geographies.filter(v => v.startsWith('neighborhood:') || v.startsWith('locality:'));
 const { neighborhoods, localities } = geographyOptionsFor(region);
 const base = (r: Region | 'all') => (r === 'all' ? ['all'] : [`region:${r}`]);

 const changeRegion = (next: string) => {
  const r = (REGIONS.find(item => item === next) ?? 'all') as Region | 'all';
  setRegion(r);
  onGeographiesChange(base(r));
 };
 const changePlaces = (next: string[]) => onGeographiesChange(next.length ? next : base(region));

 return <div className="grid min-w-0 items-start gap-3 sm:grid-cols-2">
  <div className="min-w-0 space-y-2">
   <Label htmlFor={`${id}-region`}>Região</Label>
   <Select value={region} onValueChange={changeRegion}>
    <SelectTrigger id={`${id}-region`} aria-label="Região" className="h-11 bg-background"><SelectValue /></SelectTrigger>
    <SelectContent>
     <SelectItem value="all">Todas as Regiões</SelectItem>
     {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
    </SelectContent>
   </Select>
  </div>
  <CompactMultiSelect id={id} key={region} label="Bairro ou localidade" values={places} onChange={changePlaces}
   placeholder={region === 'all' ? 'Toda a cidade (opcional: escolher bairros)' : `Toda a ${region} (opcional: escolher bairros)`}
   searchPlaceholder="Buscar ou digitar localidade..."
   createLabel="Inserir nova localidade/bairro"
   onCreate={text => { const name = cleanLocality(text); return name.length >= 2 ? `locality:${name}` : null; }}
   labelFor={value => (value.startsWith('locality:') ? value.slice(9) : value.startsWith('neighborhood:') ? value.slice(13) : undefined)}
   groups={[
    { label: region === 'all' ? 'Bairros' : `Bairros da ${region}`, options: neighborhoods.map(b => ({ value: `neighborhood:${b}`, label: b })) },
    ...(localities.length ? [{ label: 'Localidades conhecidas', options: localities.map(l => ({ value: `locality:${l.name}`, label: `${l.name} (${l.neighborhood})` })) }] : []),
   ]} />
  <div className="min-w-0 sm:col-span-2">
   <CompactMultiSelect id={`${id}-interests`} label="Interesses" values={interests} onChange={onInterestsChange} placeholder="Escolher interesses" groups={[{ label: 'Tipos de rolê', options: NOTIFICATION_INTERESTS.map(i => ({ value: i, label: i })) }]} />
  </div>
 </div>;
}
