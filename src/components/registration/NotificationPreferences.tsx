import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGIONS } from '@/lib/regions';
import { BAIRROS } from '@/lib/neighborhoods';
import { NOTIFICATION_INTERESTS } from '@/lib/notificationPreferences';
export function NotificationPreferences({ geography, onGeographyChange, interests, onInterestsChange, id = 'notification-geography' }: {
 geography: string; onGeographyChange: (value: string) => void; interests: string[]; onInterestsChange: (value: string[]) => void; id?: string;
}) {
 return <div className="grid min-w-0 gap-5 sm:grid-cols-2">
  <div className="min-w-0 space-y-2"><Label htmlFor={id}>Região ou bairro de preferência</Label>
   <Select value={geography} onValueChange={onGeographyChange}><SelectTrigger id={id} className="h-12 w-full [&>span]:truncate"><SelectValue /></SelectTrigger>
    <SelectContent position="popper" className="max-h-72"><SelectItem value="all">Todas as Regiões</SelectItem>
     <SelectGroup><SelectLabel>Macro-regiões</SelectLabel>{REGIONS.map(r => <SelectItem key={r} value={`region:${r}`}>{r}</SelectItem>)}</SelectGroup>
     <SelectGroup><SelectLabel>Bairros</SelectLabel>{BAIRROS.map(b => <SelectItem key={b} value={`neighborhood:${b}`}>{b}</SelectItem>)}</SelectGroup>
    </SelectContent></Select>
  </div>
  <div className="min-w-0 space-y-2"><Label>Interesses</Label><div className="flex flex-wrap gap-2">{NOTIFICATION_INTERESTS.map(i => <Button key={i} type="button" size="sm" variant={interests.includes(i) ? 'default' : 'outline'} aria-pressed={interests.includes(i)} onClick={() => onInterestsChange(interests.includes(i) ? interests.filter(x => x !== i) : [...interests, i])}>{i}</Button>)}</div></div>
 </div>;
}
