import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { REGIONS } from '@/lib/regions';
import { BAIRROS } from '@/lib/neighborhoods';
import { NOTIFICATION_INTERESTS } from '@/lib/notificationPreferences';

export function NotificationPreferences({ 
  geographies, 
  onGeographiesChange, 
  interests, 
  onInterestsChange, 
  id = 'notification-geography' 
}: {
  geographies: string[]; 
  onGeographiesChange: (value: string[]) => void; 
  interests: string[]; 
  onInterestsChange: (value: string[]) => void; 
  id?: string;
}) {
  const handleAddGeography = (value: string) => {
    if (value === 'all') {
      onGeographiesChange(['all']);
    } else {
      const filtered = geographies.filter(g => g !== 'all');
      if (!filtered.includes(value)) {
        onGeographiesChange([...filtered, value]);
      }
    }
  };

  const handleRemoveGeography = (value: string) => {
    const next = geographies.filter(g => g !== value);
    onGeographiesChange(next.length === 0 ? ['all'] : next);
  };

  const getLabel = (val: string) => {
    if (val === 'all') return 'Todas as Regiões';
    if (val.startsWith('region:')) return val.slice(7);
    if (val.startsWith('neighborhood:')) return val.slice(13);
    return val;
  };

  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <Label htmlFor={id}>Locais de preferência</Label>
        <Select value="" onValueChange={handleAddGeography}>
          <SelectTrigger id={id} className="h-12 w-full [&>span]:truncate">
            <SelectValue placeholder="Adicionar região ou bairro..." />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-72">
            <SelectItem value="all">Todas as Regiões</SelectItem>
            <SelectGroup>
              <SelectLabel>Macro-regiões</SelectLabel>
              {REGIONS.map(r => <SelectItem key={r} value={`region:${r}`}>{r}</SelectItem>)}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Bairros</SelectLabel>
              {BAIRROS.map(b => <SelectItem key={b} value={`neighborhood:${b}`}>{b}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {geographies.map(g => (
            <Badge key={g} variant="secondary" className="flex items-center gap-1 py-1 px-3">
              {getLabel(g)}
              <button 
                type="button" 
                onClick={() => handleRemoveGeography(g)}
                className="hover:text-destructive transition-colors"
                aria-label={`Remover ${getLabel(g)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="min-w-0 space-y-2">
        <Label>Interesses</Label>
        <div className="flex flex-wrap gap-2">
          {NOTIFICATION_INTERESTS.map(i => (
            <Button 
              key={i} 
              type="button" 
              size="sm" 
              variant={interests.includes(i) ? 'default' : 'outline'} 
              aria-pressed={interests.includes(i)} 
              onClick={() => onInterestsChange(interests.includes(i) ? interests.filter(x => x !== i) : [...interests, i])}
            >
              {i}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
