import { CompactMultiSelect } from './CompactMultiSelect';
import { REGIONS } from '@/lib/regions';
import { BAIRROS } from '@/lib/neighborhoods';
import { NOTIFICATION_INTERESTS } from '@/lib/notificationPreferences';

export function NotificationPreferences({ geographies, onGeographiesChange, interests, onInterestsChange, id = 'notification-geography' }: {
 geographies: string[]; onGeographiesChange: (value: string[]) => void; interests: string[]; onInterestsChange: (value: string[]) => void; id?: string;
}) {
 return <div className="grid min-w-0 items-start gap-3 sm:grid-cols-2">
  <CompactMultiSelect id={id} label="Região ou bairro de preferência" values={geographies} onChange={onGeographiesChange} placeholder="Escolher regiões ou bairros" exclusiveValue="all" groups={[
   { label: 'Abrangência', options: [{ value: 'all', label: 'Todas as Regiões' }] },
   { label: 'Macro-regiões', options: REGIONS.map(r => ({ value: `region:${r}`, label: r })) },
   { label: 'Bairros', options: BAIRROS.map(b => ({ value: `neighborhood:${b}`, label: b })) },
  ]} />
  <CompactMultiSelect id={`${id}-interests`} label="Interesses" values={interests} onChange={onInterestsChange} placeholder="Escolher interesses" groups={[{ label: 'Tipos de rolê', options: NOTIFICATION_INTERESTS.map(i => ({ value: i, label: i })) }]} />
 </div>;
}
