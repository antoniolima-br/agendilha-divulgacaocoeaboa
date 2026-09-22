import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { AD_CATEGORIES, normalizeAds, useAllAds, useCreateAd, useDeleteAd, useModerateAd, type Ad, type AdStatus } from "@/data/useAds";
import { useAdPlans, formatDurationDays, formatPriceBRL } from "@/data/useAdPlans";
import { AdCard } from "@/components/anuncios/AdCard";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdPhotoUploader } from "@/components/anuncios/AdPhotoUploader";
import { inputToCents } from "@/data/useAdPlans";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";

const FILTROS: { valor: AdStatus | "todos"; label: string }[] = [
  { valor: "pendente", label: "Em análise" },
  { valor: "publicado", label: "Publicados" },
  { valor: "recusado", label: "Recusados" },
  { valor: "todos", label: "Todos" },
];

export default function AdminAds() {
  const { user } = useAuth();
  const { isAdmin, loading: permsLoading } = useAppPermissions();
  const { data, isLoading } = useAllAds(isAdmin);
  const anuncios = useMemo(() => normalizeAds(data), [data]);
  const { data: planos = [] } = useAdPlans(true);
  const moderar = useModerateAd();
  const criar = useCreateAd();
  const excluir = useDeleteAd();

  const [filtro, setFiltro] = useState<AdStatus | "todos">("pendente");
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [planoEscolhido, setPlanoEscolhido] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("Rio de Janeiro");
  const [neighborhood, setNeighborhood] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [duration, setDuration] = useState("30");

  const lista = useMemo(
    () => (filtro === "todos" ? anuncios : anuncios.filter((a) => a.status === filtro)),
    [anuncios, filtro],
  );

  async function aplicar(id: string, patch: Parameters<typeof moderar.mutateAsync>[0]["patch"], msg: string) {
    try {
      await moderar.mutateAsync({ id, patch });
      toast.success(msg);
    } catch (e) {
      handleError(e, "Não deu pra atualizar o anúncio");
    }
  }

  function publicar(ad: Ad) {
    void aplicar(
      ad.id,
      { status: "publicado", rejection_reason: null, published_at: new Date().toISOString() },
      "Anúncio publicado.",
    );
  }

  function recusar(ad: Ad) {
    const motivo = (motivos[ad.id] ?? "").trim();
    if (motivo.length < 5) {
      toast.error("Escreva o motivo pra pessoa saber o que ajustar.");
      return;
    }
    void aplicar(ad.id, { status: "recusado", rejection_reason: motivo }, "Anúncio recusado.");
  }

  function ativarDestaque(ad: Ad) {
    const planoId = planoEscolhido[ad.id];
    const plano = planos.find((p) => p.id === planoId);
    if (!plano) {
      toast.error("Escolha o plano contratado.");
      return;
    }
    const ate = new Date();
    ate.setDate(ate.getDate() + plano.duration_days);
    void aplicar(
      ad.id,
      { is_highlight: true, highlight_plan_id: plano.id, highlight_until: ate.toISOString() },
      `Destaque ${plano.name} ativado por ${formatDurationDays(plano.duration_days)}.`,
    );
  }

  function tirarDestaque(ad: Ad) {
    void aplicar(
      ad.id,
      { is_highlight: false, highlight_plan_id: null, highlight_until: null },
      "Destaque removido.",
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("");
    setPrice("");
    setWhatsapp("");
    setCity("Rio de Janeiro");
    setNeighborhood("");
    setPhotos([]);
    setDuration("30");
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (title.trim().length < 4 || description.trim().length < 20 || !category) {
      toast.error("Preencha nome, categoria e uma descrição com pelo menos 20 letras.");
      return;
    }
    const phone = validateBrazilianMobile(whatsapp);
    if (phone.valid === false) {
      toast.error(phone.reason);
      return;
    }
    const priceCents = price.trim() ? inputToCents(price) : null;
    if (price.trim() && priceCents === null) {
      toast.error("Confira o valor informado.");
      return;
    }
    if (photos.length === 0) {
      toast.error("Adicione uma imagem para o carrossel.");
      return;
    }

    try {
      const ad = await criar.mutateAsync({
        userId: user.id,
        input: {
          title: title.trim(),
          description: description.trim(),
          category,
          price_cents: priceCents,
          contact_whatsapp: phone.e164,
          city: city.trim() || null,
          neighborhood: neighborhood.trim() || null,
          photos,
        },
      });
      const until = new Date();
      until.setDate(until.getDate() + Number(duration));
      await moderar.mutateAsync({
        id: ad.id,
        patch: {
          status: "publicado",
          rejection_reason: null,
          is_highlight: true,
          highlight_until: until.toISOString(),
          published_at: new Date().toISOString(),
        },
      });
      toast.success("Patrocinador publicado nos carrosséis.");
      setFormOpen(false);
      resetForm();
    } catch (error) {
      handleError(error, "Não deu pra cadastrar o patrocinador");
    }
  }

  async function confirmarExclusao() {
    if (!deleteTarget) return;
    try {
      await excluir.mutateAsync(deleteTarget.id);
      toast.success("Anúncio excluído dos carrosséis.");
      setDeleteTarget(null);
    } catch (error) {
      handleError(error, "Não deu pra excluir o anúncio");
    }
  }

  if (permsLoading) return <LoadingState message="Verificando seu acesso…" fullPage />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              Patrocinadores
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Cadastre, publique, destaque ou retire anúncios dos carrosséis.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2 font-bold">
            <Plus className="h-4 w-4" /> Novo patrocinador
          </Button>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button key={f.valor} type="button" onClick={() => setFiltro(f.valor)}>
              <Badge
                variant={filtro === f.valor ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
              >
                {f.label}
              </Badge>
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState message="Carregando anúncios…" />
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">Nada nessa lista agora.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lista.map((ad) => (
              <Card key={ad.id} className="rounded-2xl">
                <CardContent className="pt-6 space-y-4">
                  <AdCard ad={ad} showStatus />

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {ad.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {ad.status !== "publicado" && (
                      <Button size="sm" onClick={() => publicar(ad)} className="font-semibold">
                        <Check className="h-4 w-4 mr-1.5" />
                        Publicar
                      </Button>
                    )}
                    {ad.is_highlight ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => tirarDestaque(ad)}
                        className="font-semibold"
                      >
                        Tirar destaque
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`plano-${ad.id}`} className="text-xs">
                            Plano contratado
                          </Label>
                          <Select
                            value={planoEscolhido[ad.id] ?? ""}
                            onValueChange={(v) =>
                              setPlanoEscolhido((prev) => ({ ...prev, [ad.id]: v }))
                            }
                          >
                            <SelectTrigger id={`plano-${ad.id}`} className="h-9 w-56">
                              <SelectValue placeholder="Escolha o plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {planos.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} · {formatPriceBRL(p.price_cents)} ·{" "}
                                  {formatDurationDays(p.duration_days)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => ativarDestaque(ad)}
                          className="font-semibold"
                        >
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          Ativar destaque
                        </Button>
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(ad)} className="ml-auto text-destructive hover:text-destructive">
                      <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
                    </Button>
                  </div>

                  {ad.status !== "recusado" && (
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="space-y-1 flex-1 min-w-[220px]">
                        <Label htmlFor={`motivo-${ad.id}`} className="text-xs">
                          Motivo da recusa
                        </Label>
                        <Input
                          id={`motivo-${ad.id}`}
                          value={motivos[ad.id] ?? ""}
                          onChange={(e) =>
                            setMotivos((prev) => ({ ...prev, [ad.id]: e.target.value }))
                          }
                          placeholder="Ex.: faltou foto do produto"
                          className="h-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => recusar(ad)}
                        className="text-destructive hover:text-destructive font-semibold"
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Recusar
                      </Button>
                    </div>
                  )}

                  {ad.status === "recusado" && ad.rejection_reason && (
                    <p className="text-xs text-destructive">Motivo: {ad.rejection_reason}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo patrocinador</DialogTitle>
            <DialogDescription>Ao salvar, o anúncio entra publicado nos carrosséis da Home.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void cadastrar(e)} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="sponsor-title">Nome</Label><Input id="sponsor-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do anunciante ou oferta" /></div>
            <div className="space-y-1.5"><Label htmlFor="sponsor-description">Descrição</Label><Textarea id="sponsor-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Conte o que está sendo divulgado" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger><SelectContent>{AD_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="sponsor-price">Valor (opcional)</Label><Input id="sponsor-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="150,00" /></div>
              <div className="space-y-1.5"><Label htmlFor="sponsor-whatsapp">WhatsApp</Label><Input id="sponsor-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(formatPhoneDisplay(e.target.value))} inputMode="tel" placeholder="(21) 99999-9999" /></div>
              <div className="space-y-1.5"><Label htmlFor="sponsor-duration">Tempo no carrossel</Label><Select value={duration} onValueChange={setDuration}><SelectTrigger id="sponsor-duration"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="15">15 dias</SelectItem><SelectItem value="30">30 dias</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="sponsor-city">Cidade</Label><Input id="sponsor-city" value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="sponsor-neighborhood">Bairro</Label><Input id="sponsor-neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
            </div>
            {user && <div className="space-y-2"><Label>Imagem do carrossel</Label><AdPhotoUploader userId={user.id} paths={photos} onChange={setPhotos} /></div>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit" disabled={criar.isPending || moderar.isPending} className="gap-2 font-bold">{(criar.isPending || moderar.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}Publicar patrocinador</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir este anúncio?</AlertDialogTitle><AlertDialogDescription>“{deleteTarget?.title}” sairá imediatamente dos carrosséis e não poderá ser recuperado.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void confirmarExclusao()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir anúncio</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
