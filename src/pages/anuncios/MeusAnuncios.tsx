import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCircle2, Clock3, Plus, ShoppingBag, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { normalizeAds, useMyAds } from "@/data/useAds";
import { AdCard } from "@/components/anuncios/AdCard";
import { ROUTES } from "@/routes/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function AdList({ ads, emptyMessage }: { ads: ReturnType<typeof normalizeAds>; emptyMessage: string }) {
  if (ads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <div key={ad.id} className="space-y-2">
          <AdCard ad={ad} showStatus />
          {ad.status === "recusado" && ad.rejection_reason && (
            <p className="px-3 text-xs text-destructive">Motivo: {ad.rejection_reason}</p>
          )}
          {ad.status !== "publicado" && (
            <Button asChild variant="outline" size="sm" className="w-full font-semibold sm:w-auto">
              <Link to={`/anuncios/${ad.id}/editar`}>Editar e reenviar</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MeusAnuncios() {
  const { user } = useAuth();
  const { isPromoter, isAdmin, loading } = useAppPermissions();
  const { data, isLoading } = useMyAds(user?.id);
  const anuncios = useMemo(() => normalizeAds(data), [data]);
  const publicados = useMemo(() => anuncios.filter((ad) => ad.status === "publicado"), [anuncios]);
  const aguardando = useMemo(() => anuncios.filter((ad) => ad.status === "pendente"), [anuncios]);
  const ajustes = useMemo(() => anuncios.filter((ad) => ad.status === "recusado"), [anuncios]);

  if (loading) return <LoadingState message="Verificando seu acesso…" fullPage />;
  if (!user) return <Navigate to={ROUTES.AUTH} replace />;
  if (!isPromoter && !isAdmin) return <Navigate to={ROUTES.ANUNCIOS} replace />;

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Meus anúncios
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Acompanhe seus anúncios e saiba quando cada um entrar no ar.
          </p>
          <Button asChild className="w-full font-bold sm:w-auto">
            <Link to={ROUTES.ANUNCIO_NOVO}>
              <Plus className="h-4 w-4 mr-2" />
              Criar anúncio
            </Link>
          </Button>
        </header>

        <Alert className="border-success/30 bg-success/5">
          <BellRing className="h-4 w-4 text-success" />
          <AlertTitle>Avisos de aprovação</AlertTitle>
          <AlertDescription>
            Quando a equipe aprovar um anúncio, você recebe um aviso no sino e ele aparece em Publicados.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <LoadingState message="Carregando seus anúncios…" />
        ) : anuncios.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center space-y-2">
            <p className="font-semibold">Você ainda não tem anúncios.</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro no botão acima: leva menos de dois minutos.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue={aguardando.length > 0 ? "aguardando" : "publicados"}>
              <TabsList className="grid h-auto w-full grid-cols-2">
                <TabsTrigger value="publicados" className="min-w-0 gap-1.5 px-2 py-2.5 sm:gap-2 sm:px-3">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Publicados ({publicados.length})
                </TabsTrigger>
                <TabsTrigger value="aguardando" className="min-w-0 gap-1 px-1.5 py-2.5 text-xs sm:gap-2 sm:px-3 sm:text-sm">
                  <Clock3 className="h-4 w-4 text-warning" />
                  <span className="sm:hidden">Aguardando ({aguardando.length})</span>
                  <span className="hidden sm:inline">Aguardando aprovação ({aguardando.length})</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="publicados" className="mt-4">
                <AdList ads={publicados} emptyMessage="Nenhum anúncio publicado ainda. Os aprovados aparecem aqui." />
              </TabsContent>
              <TabsContent value="aguardando" className="mt-4">
                <AdList ads={aguardando} emptyMessage="Nenhum anúncio aguardando aprovação agora." />
              </TabsContent>
            </Tabs>

            {ajustes.length > 0 && (
              <section className="space-y-3 border-t pt-5" aria-labelledby="ajustes-title">
                <h2 id="ajustes-title" className="flex items-center gap-2 text-lg font-bold">
                  <Wrench className="h-4 w-4 text-destructive" />
                  Precisam de ajuste ({ajustes.length})
                </h2>
                <AdList ads={ajustes} emptyMessage="Nenhum anúncio precisa de ajuste." />
              </section>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
