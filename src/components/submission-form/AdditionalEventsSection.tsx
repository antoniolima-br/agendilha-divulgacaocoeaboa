import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SubmissionFormData } from "./schema";

const CATEGORIES = ["Música", "Cultura", "Gastronomia", "Esporte", "Turismo", "Promoções", "Outros"];
const RATINGS = ["Livre", "10+", "12+", "14+", "16+", "18+"] as const;

export function AdditionalEventsSection({ form }: { form: UseFormReturn<SubmissionFormData> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "additionalEvents" });

  return (
    <section className="space-y-4" aria-labelledby="additional-events-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="additional-events-title" className="font-bold">Mais eventos neste estabelecimento</h2>
          <p className="text-sm text-muted-foreground">O local, endereço e contato serão os mesmos. Pode repetir a data usando horários de início diferentes.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={fields.length >= 10}
          onClick={() => append({ eventTitle: "", date: "", startTime: "", endTime: "", atrativoName: "", category: "", ageRating: "Livre", description: "" })}
        >
          <Plus className="h-4 w-4" /> Adicionar outro evento
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 rounded-md border border-border bg-card/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Evento {index + 2}</h3>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remover evento ${index + 2}`} onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <FormField control={form.control} name={`additionalEvents.${index}.eventTitle`} render={({ field: input }) => (
            <FormItem><FormLabel>Título do rolé</FormLabel><FormControl><Input maxLength={120} placeholder="Ex.: Festival de Inverno" {...input} /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField control={form.control} name={`additionalEvents.${index}.date`} render={({ field: input }) => (
              <FormItem><FormLabel>Data do evento *</FormLabel><FormControl><Input type="date" {...input} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`additionalEvents.${index}.startTime`} render={({ field: input }) => (
              <FormItem><FormLabel>Horário de início *</FormLabel><FormControl><Input type="time" {...input} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`additionalEvents.${index}.endTime`} render={({ field: input }) => (
              <FormItem><FormLabel>Horário de término</FormLabel><FormControl><Input type="time" {...input} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <FormField control={form.control} name={`additionalEvents.${index}.atrativoName`} render={({ field: input }) => (
            <FormItem><FormLabel>Atração *</FormLabel><FormControl><Input maxLength={120} placeholder="Nome do artista, banda ou atração" {...input} /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name={`additionalEvents.${index}.category`} render={({ field: input }) => (
              <FormItem><FormLabel>Categoria</FormLabel><Select value={input.value || ""} onValueChange={input.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name={`additionalEvents.${index}.ageRating`} render={({ field: input }) => (
              <FormItem><FormLabel>Classificação</FormLabel><Select value={input.value || "Livre"} onValueChange={input.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{RATINGS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
          </div>

          <FormField control={form.control} name={`additionalEvents.${index}.description`} render={({ field: input }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea maxLength={500} placeholder="Conta rapidinho como vai ser este rolê..." {...input} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      ))}
    </section>
  );
}