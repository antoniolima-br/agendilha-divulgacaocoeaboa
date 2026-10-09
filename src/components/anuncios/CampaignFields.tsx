import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGIONS } from "@/lib/regions";

export function CampaignFields({ products, productId, onProduct, destination, onDestination, regions, onRegions }: {
  products: { id: string; name: string; is_active: boolean }[]; productId: string; onProduct: (id: string) => void;
  destination: string; onDestination: (value: string) => void; regions: string[]; onRegions: (values: string[]) => void;
}) {
  return <div className="space-y-4">
    <div className="space-y-2"><Label htmlFor="campaign-product">Produto publicitário</Label><Select value={productId} onValueChange={onProduct}><SelectTrigger id="campaign-product"><SelectValue placeholder="Escolha o espaço" /></SelectTrigger><SelectContent>{products.filter((p) => p.is_active || p.id === productId).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{!p.is_active ? " · Inativo" : ""}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label htmlFor="campaign-destination">Link de destino</Label><Input id="campaign-destination" type="url" value={destination} onChange={(e) => onDestination(e.target.value)} placeholder="https://…" /></div>
    <fieldset className="space-y-3"><legend className="text-sm font-medium">Regiões da campanha</legend><div className="grid gap-3 sm:grid-cols-2">{REGIONS.map((r) => <label key={r} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={regions.includes(r)} onCheckedChange={(checked) => onRegions(checked === true ? [...regions, r] : regions.filter((v) => v !== r))} />{r}</label>)}</div></fieldset>
  </div>;
}