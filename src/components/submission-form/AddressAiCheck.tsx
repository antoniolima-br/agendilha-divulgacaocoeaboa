import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Div = { campo: "endereco" | "bairro" | "cep"; problema: string; sugestao: string };
type Result = { ok: boolean; resumo: string; divergencias: Div[] };

const FIELD: Record<Div["campo"], string> = {
  endereco: "eventAddress",
  bairro: "addressNeighborhood",
  cep: "locationCep",
};
const LABEL: Record<Div["campo"], string> = { endereco: "Endereço", bairro: "Bairro", cep: "CEP" };

/** Confere o endereço do evento com o estabelecimento vinculado e sugere correções. */
export function AddressAiCheck({ form }: { form: UseFormReturn<any> }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const verificar = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setApplied(new Set());
    const v = form.getValues();
    const { data, error } = await supabase.functions.invoke("verificar-endereco", {
      body: {
        locationName: v.locationName,
        eventAddress: v.eventAddress,
        addressNeighborhood: v.addressNeighborhood,
        locationCep: v.locationCep,
        addressCity: v.addressCity,
        addressState: v.addressState,
        estabelecimentoId: v.estabelecimentoId,
      },
    });
    setLoading(false);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* */ }
      setError(msg || "Não deu pra verificar agora. Tenta de novo em instantes.");
      return;
    }
    setResult(data as Result);
  };

  const aplicar = (d: Div, i: number) => {
    form.setValue(FIELD[d.campo], d.sugestao, { shouldValidate: true, shouldDirty: true });
    setApplied((s) => new Set(s).add(i));
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <p className="text-sm text-muted-foreground">
          Confere se o endereço bate com o cadastro do local.
        </p>
        <Button type="button" variant="outline" size="sm" className="min-h-11 gap-2" onClick={verificar} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Conferindo..." : "Conferir endereço"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-2">
          <p className="flex items-start gap-2 text-sm font-medium">
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            )}
            {result.resumo || (result.ok ? "Tudo certo com o endereço." : "Achei umas diferenças.")}
          </p>
          {result.divergencias.map((d, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-3 text-sm space-y-2">
              <p><span className="font-semibold">{LABEL[d.campo]}:</span> {d.problema}</p>
              {d.sugestao && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <span className="text-muted-foreground break-words">Sugestão: <strong className="text-foreground">{d.sugestao}</strong></span>
                  <Button type="button" size="sm" className="min-h-11" disabled={applied.has(i)} onClick={() => aplicar(d, i)}>
                    {applied.has(i) ? "Aplicado" : "Usar sugestão"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
