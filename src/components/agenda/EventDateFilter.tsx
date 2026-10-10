import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePublicEvents } from "@/data/usePublicEvents";
import { useGlobalEventFilters } from "@/hooks/useGlobalEventFilters";
import { availableEventDays } from "@/lib/eventCalendar";

interface EventDateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventDateFilter({ value, onChange }: EventDateFilterProps) {
  const [open, setOpen] = useState(false);
  const { data: events = [] } = usePublicEvents();
  const { filters } = useGlobalEventFilters();
  const availableDays = useMemo(() => availableEventDays(events, filters), [events, filters]);
  const hasEvent = (day: Date) => availableDays.has(format(day, "yyyy-MM-dd"));
  const firstAvailable = [...availableDays].sort()[0];
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label="Data dos rolês"
          className={cn("h-11 w-full justify-start gap-2 text-left font-normal sm:w-48", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span>{selected ? format(selected, "dd/MM/yyyy") : "Calendário"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="theme-coeaboa w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
           defaultMonth={selected ?? (firstAvailable ? parseISO(firstAvailable) : undefined)}
           disabled={(day) => !hasEvent(day)}
           modifiers={{ event: hasEvent }}
           modifiersClassNames={{ event: "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary aria-selected:after:bg-primary-foreground" }}
          onSelect={(day) => {
             if (day && !hasEvent(day)) return;
            onChange(day ? format(day, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}