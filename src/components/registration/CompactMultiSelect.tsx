import { useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { normalizeGeography } from '@/lib/regions';
import { cn } from '@/lib/utils';

export interface MultiSelectOption { value: string; label: string }
export function CompactMultiSelect({ id, label, values, groups, onChange, placeholder, exclusiveValue, onCreate, createLabel = 'Inserir', labelFor, searchPlaceholder = 'Buscar...' }: {
  id: string; label: string; values: string[]; groups: { label: string; options: MultiSelectOption[] }[];
  onChange: (values: string[]) => void; placeholder: string; exclusiveValue?: string;
  /** Recebe o texto digitado e devolve o valor a incluir (ou null quando não aceito). */
  onCreate?: (text: string) => string | null; createLabel?: string; labelFor?: (value: string) => string | undefined; searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const options = groups.flatMap(group => group.options);
  const nameOf = (value: string) => options.find(option => option.value === value)?.label ?? labelFor?.(value) ?? value;
  const typed = search.trim();
  const exists = typed.length > 0 && [...options.map(o => o.label), ...values.map(nameOf)].some(l => normalizeGeography(l) === normalizeGeography(typed));
  const createValue = onCreate && typed && !exists ? onCreate(typed) : null;
  const toggle = (value: string) => {
    if (values.includes(value)) onChange(values.filter(item => item !== value));
    else if (value === exclusiveValue) onChange([value]);
    else onChange([...values.filter(item => item !== exclusiveValue), value]);
  };
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} aria-label={label} className="h-11 w-full justify-between gap-2 rounded-md bg-background px-3 font-normal">
        <span className="min-w-0 truncate">{values.length ? `${values.length} ${values.length === 1 ? 'selecionado' : 'selecionados'}` : placeholder}</span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Button></PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-60 overflow-hidden p-0">
        <Command filter={(value, search) => normalizeGeography(value).includes(normalizeGeography(search)) ? 1 : 0}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} aria-label={`Buscar ${label.toLowerCase()}`} />
          <CommandList className="max-h-56 overscroll-contain" aria-multiselectable="true">{!createValue && <CommandEmpty>Nada encontrado. Tente outro nome.</CommandEmpty>}
            {createValue && <CommandGroup forceMount heading="Não achou?"><CommandItem forceMount value={`__create__ ${typed}`} onSelect={() => { if (!values.includes(createValue)) toggle(createValue); setSearch(''); }} className="min-h-10 cursor-pointer gap-2 border-2 border-dashed border-primary font-semibold text-primary data-[selected=true]:bg-muted data-[selected=true]:text-foreground"><Plus aria-hidden="true" strokeWidth={3} className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">+ {createLabel}: {typed}</span></CommandItem></CommandGroup>}
            {groups.map(group => <CommandGroup key={group.label} heading={group.label}>{group.options.map(option => {
              const checked = values.includes(option.value);
              return <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => toggle(option.value)} aria-checked={checked} className={cn(
                "min-h-10 gap-2 cursor-pointer border-2 font-medium transition-colors duration-150 motion-reduce:transition-none",
                checked
                  ? "border-primary bg-primary text-primary-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:ring-primary-foreground"
                  : "border-transparent bg-transparent text-popover-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground data-[selected=true]:ring-border",
                "data-[selected=true]:ring-1 data-[selected=true]:ring-inset"
              )} aria-label={option.label}>
                <span aria-hidden="true" className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors duration-150 motion-reduce:transition-none", checked ? "border-primary-foreground bg-primary-foreground text-primary" : "border-muted-foreground bg-background")}><Check strokeWidth={3} className={cn("h-3.5 w-3.5", checked ? "opacity-100" : "opacity-0")} /></span><span className="min-w-0 break-words">{option.label}</span>
              </CommandItem>;
            })}</CommandGroup>)}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between border-t border-border px-2 py-1"><Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>Limpar</Button><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Concluir</Button></div>
      </PopoverContent>
    </Popover>
    {values.length > 0 && <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto" aria-label={`${label}: escolhas`}>
      {values.map(value => <Button key={value} type="button" variant="default" size="sm" title={`Remover ${nameOf(value)}`} aria-label={`Remover ${nameOf(value)}`} onClick={() => toggle(value)} className="h-7 max-w-full gap-1.5 rounded-md border-2 border-primary bg-primary px-2 text-xs font-semibold text-primary-foreground hover:border-primary-foreground hover:bg-primary hover:text-primary-foreground"><Check aria-hidden="true" strokeWidth={3} className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{nameOf(value)}</span><X aria-hidden="true" className="h-3 w-3 shrink-0" /></Button>)}
    </div>}
  </div>;
}