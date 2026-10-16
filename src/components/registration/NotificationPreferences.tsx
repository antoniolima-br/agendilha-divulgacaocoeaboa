import { useMemo, useState } from 'react';
import { Check, MapPin, Plus, X } from 'lucide-react';
import { CompactMultiSelect } from './CompactMultiSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { REGIONS, normalizeGeography, regionOf } from '@/lib/regions';
import { BAIRROS } from '@/lib/neighborhoods';
import { KNOWN_LOCALITIES, LOCALITY_MAX, NOTIFICATION_INTERESTS, cleanLocality } from '@/lib/notificationPreferences';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string; hint: string };

const OPTIONS: Option[] = [
 ...REGIONS.map(r => ({ value: `region:${r}`, label: r, hint: 'Região inteira' })),
 ...BAIRROS.map(b => ({ value: `neighborhood:${b}`, label: b, hint: regionOf({ address_neighborhood: b, address_city: 'Rio de Janeiro' }) ?? 'Bairro' })),
 ...Object.entries(KNOWN_LOCALITIES).flatMap(([n, list]) => list.map(l => ({ value: `locality:${l}`, label: l, hint: `Localidade · ${n}` }))),
];
const SEARCH_INDEX = OPTIONS.map(o => ({ o, key: normalizeGeography(o.label) }));
const labelOf = (value: string) => OPTIONS.find(o => o.value === value)?.label ?? value.replace(/^(region|neighborhood|locality):/, '');

/** Busca instantânea única: digita, escolhe ou insere uma localidade nova. Sem escolha = todas as regiões. */
function GeographyAutocomplete({ id, values, onChange }: { id: string; values: string[]; onChange: (v: string[]) => void }) {
 const [query, setQuery] = useState('');
 const [open, setOpen] = useState(false);
 const [active, setActive] = useState(0);
 const chosen = values.filter(v => v !== 'all');
 const q = normalizeGeography(query);

 const results = useMemo(() => {
  if (!q) return [];
  const starts = SEARCH_INDEX.filter(({ key }) => key.startsWith(q) || key.split(/[\s()-]+/).some(w => w.startsWith(q)));
  const contains = SEARCH_INDEX.filter(({ key }) => key.includes(q) && !starts.some(s => s.key === key));
  return [...starts, ...contains].map(({ o }) => o).slice(0, 8);
 }, [q]);

 const typed = cleanLocality(query);
 const exact = [...OPTIONS.map(o => o.label), ...chosen.map(labelOf)].some(l => normalizeGeography(l) === normalizeGeography(typed));
 const localityCount = chosen.filter(v => v.startsWith('locality:')).length;
 const canCreate = typed.length >= 2 && !exact && localityCount < LOCALITY_MAX;
 const items: Option[] = [...results, ...(canCreate ? [{ value: `locality:${typed}`, label: typed, hint: '__new__' }] : [])];

 const pick = (value: string) => {
  const next = chosen.includes(value) ? chosen.filter(v => v !== value) : [...chosen, value];
  onChange(next.length ? next : ['all']);
  setQuery(''); setActive(0);
 };
 const remove = (value: string) => { const next = chosen.filter(v => v !== value); onChange(next.length ? next : ['all']); };
 const listId = `${id}-list`;
 const showList = open && q.length > 0;

 return <div className="relative min-w-0 space-y-2">
  <Label htmlFor={id}>Bairro ou localidade</Label>
  <div className="relative">
   <MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
   <Input id={id} role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list" autoComplete="off" enterKeyHint="done"
    aria-activedescendant={showList && items[active] ? `${listId}-${active}` : undefined}
    value={query} placeholder={chosen.length ? 'Adicionar outro bairro...' : 'Digite um bairro (ex.: Ban, Jar, Pra)'}
    className="h-11 bg-background pl-9 text-base sm:text-sm"
    onChange={e => { setQuery(e.target.value.slice(0, 80)); setOpen(true); setActive(0); }}
    onFocus={() => setOpen(true)}
    onBlur={() => setTimeout(() => setOpen(false), 120)}
    onKeyDown={e => {
     if (!showList || !items.length) return;
     if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % items.length); }
     else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + items.length) % items.length); }
     else if (e.key === 'Enter') { e.preventDefault(); pick(items[active].value); }
     else if (e.key === 'Escape') setOpen(false);
    }} />
  </div>
  {showList && <ul id={listId} role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
   {items.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{localityCount >= LOCALITY_MAX ? `Limite de ${LOCALITY_MAX} localidades.` : 'Digite pelo menos 2 letras.'}</li>}
   {items.map((o, i) => {
    const isNew = o.hint === '__new__';
    const checked = chosen.includes(o.value);
    return <li key={o.value} id={`${listId}-${i}`} role="option" aria-selected={checked}
     onMouseDown={e => e.preventDefault()} onClick={() => pick(o.value)} onMouseEnter={() => setActive(i)}
     className={cn('flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm', i === active && 'bg-muted', isNew && 'mt-1 border-2 border-dashed border-primary font-semibold text-primary', checked && 'bg-primary text-primary-foreground')}>
     {isNew ? <Plus aria-hidden="true" strokeWidth={3} className="h-4 w-4 shrink-0" /> : <Check aria-hidden="true" strokeWidth={3} className={cn('h-4 w-4 shrink-0', checked ? 'opacity-100' : 'opacity-0')} />}
     <span className="min-w-0 flex-1 break-words">{isNew ? `+ Inserir nova localidade: ${o.label}` : o.label}</span>
     {!isNew && <span className={cn('shrink-0 text-xs', checked ? 'text-primary-foreground' : 'text-muted-foreground')}>{o.hint}</span>}
    </li>;
   })}
  </ul>}
  <div className="flex flex-wrap gap-1.5" aria-label="Bairros e localidades escolhidos">
   {chosen.length === 0
    ? <p className="text-xs text-muted-foreground">Sem escolha, você recebe rolês de todas as regiões.</p>
    : chosen.map(v => <Button key={v} type="button" size="sm" onClick={() => remove(v)} aria-label={`Remover ${labelOf(v)}`} className="h-7 max-w-full gap-1.5 rounded-md border-2 border-primary px-2 text-xs font-semibold">
     <span className="truncate">{labelOf(v)}</span><X aria-hidden="true" className="h-3 w-3 shrink-0" />
    </Button>)}
  </div>
 </div>;
}

export function NotificationPreferences({ geographies, onGeographiesChange, interests, onInterestsChange, id = 'notification-geography' }: {
 geographies: string[]; onGeographiesChange: (value: string[]) => void; interests: string[]; onInterestsChange: (value: string[]) => void; id?: string;
}) {
 return <div className="grid min-w-0 items-start gap-3 sm:grid-cols-2">
  <GeographyAutocomplete id={id} values={geographies} onChange={onGeographiesChange} />
  <CompactMultiSelect id={`${id}-interests`} label="Interesses" values={interests} onChange={onInterestsChange} placeholder="Escolher interesses" groups={[{ label: 'Tipos de rolê', options: NOTIFICATION_INTERESTS.map(i => ({ value: i, label: i })) }]} />
 </div>;
}
