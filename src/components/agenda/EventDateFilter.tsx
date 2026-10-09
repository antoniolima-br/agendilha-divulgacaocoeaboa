import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EventDateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventDateFilter({ value, onChange }: EventDateFilterProps) {
  const [open, setOpen] = useState(false);
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
          <span>{selected ? format(selected, "dd/MM/yyyy") : "dd/mm/aaaa"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="theme-coeaboa w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected}
          onSelect={(day) => {
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