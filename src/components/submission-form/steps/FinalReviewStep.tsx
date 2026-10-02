import { UseFormReturn } from "react-hook-form";
import { AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import { cn } from "@/lib/utils";

/** Campos que travam o "Publicar evento" — mesmos que o formulário exige. */
export const FINAL_REQUIRED_FIELDS = ["date", "startTime", "atrativoName", "legalAcceptance"] as const;

export function missingFinalFields(values: Record<string, any>): string[] {
  return FINAL_REQUIRED_FIELDS.filter((f) => {
    const v = values?.[f];
    if (typeof v === "boolean") return !v;
    return !(typeof v === "string" ? v.trim() : v);
  });
}

type Row = { field: string; label: string; value: string | null; required?: boolean; step: number };

export function FinalReviewStep({ form, goToStep }: { form: UseFormReturn<any>; goToStep: (s: number) => void }) {
  const v = form.watch();
  const local = [v.locationName, v.eventAddress, v.addressNeighborhood].map((x: string) => (x || "").trim()).filter(Boolean).join(" · ");

  const rows: Row[] = [
    { field: "eventTitle", label: "Nome do evento", value: v.eventTitle, step: 1 },
    { field: "date", label: "Data", value: v.date ? formatEventDateTimeBR(v.date) : null, required: true, step: 1 },
    { field: "startTime", label: "Horário de início", value: v.startTime, required: true, step: 1 },
    { field: "endTime", label: "Horário de término", value: v.endTime || "Sem término definido", step: 1 },
    { field: "atrativoName", label: "Atração", value: v.atrativoName, required: true, step: 1 },
    { field: "local", label: "Local", value: local || null, step: 1 },
    { field: "category", label: "Categoria", value: v.category, step: 1 },
    { field: "description", label: "Descrição", value: v.description, step: 1 },
    { field: "legalAcceptance", label: "Aceite dos termos", value: v.legalAcceptance ? "Aceito" : null, required: true, step: 2 },
  ];

  const missing = rows.filter((r) => r.required && !(r.value && String(r.value).trim()));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Revisão</h1>
        <p className="text-sm text-muted-foreground">Confere tudo antes de publicar. Tá certo? É só mandar.</p>
      </div>

      {missing.length > 0 ? (
        <div role="alert" className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" /> Faltam informações obrigatórias
          </p>
          <ul className="mt-2 space-y-1 text-base font-semibold text-destructive">
            {missing.map((r) => (
              <li key={r.field}>
                • {r.label}{" "}
                <button type="button" className="underline" onClick={() => goToStep(r.step)}>preencher</button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-destructive">O botão "Publicar evento" libera assim que tudo estiver preenchido.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-4 font-semibold text-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> Tudo certo! Pode publicar.
        </div>
      )}

      <dl className="divide-y divide-border rounded-2xl border bg-card/30">
        {rows.map((r) => {
          const empty = !(r.value && String(r.value).trim());
          const bad = r.required && empty;
          return (
            <div key={r.field} className={cn("flex items-start gap-3 px-4 py-3", bad && "bg-destructive/10")}>
              <div className="min-w-0 flex-1">
                <dt className={cn("text-xs uppercase tracking-wide text-muted-foreground", bad && "text-base font-bold normal-case text-destructive")}>
                  {r.label}{r.required ? " *" : ""}
                </dt>
                <dd className={cn("break-words text-sm", empty && !bad && "text-muted-foreground italic", bad && "text-base font-bold text-destructive")}>
                  {bad ? "Não preenchido" : empty ? "Não informado" : r.value}
                </dd>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Editar ${r.label}`} onClick={() => goToStep(r.step)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
