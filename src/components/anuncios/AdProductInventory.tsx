import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useSetAdProductActive } from "@/data/useAdProducts";
import { handleError } from "@/lib/error-handler";

export function AdProductInventory({ products }: { products: { id: string; name: string; description: string; is_active: boolean }[] }) {
  const update = useSetAdProductActive();
  return <section className="space-y-3 border-b border-border pb-6"><h2 className="text-lg font-bold">Produtos publicitários</h2><ul className="divide-y divide-border">{products.map((p) => <li key={p.id} className="flex items-start justify-between gap-4 py-4"><div className="min-w-0 space-y-2"><p className="break-words font-semibold">{p.name}</p><Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "Ativo para venda" : "Inativo"}</Badge><p className="text-sm text-muted-foreground">{p.description}</p></div><Switch aria-label={`Ativar produto ${p.name}`} checked={p.is_active} disabled={update.isPending} onCheckedChange={(active) => update.mutate({ id: p.id, active }, { onError: (e) => handleError(e, "Não deu pra atualizar o produto") })} /></li>)}</ul></section>;
}