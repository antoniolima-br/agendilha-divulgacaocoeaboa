import { CalendarDays, CheckCircle2, ImagePlus, Megaphone, Settings2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { ROUTES } from "@/routes/config";
import { MainFlyerEditor } from "@/components/admin-control/MainFlyerEditor";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPublishedEvents from "./AdminPublishedEvents";
import AdminAds from "./AdminAds";
import AdminAprovarEventos from "./AdminAprovarEventos";

export default function AdminControlCenter() {
  const { hasPermission, isAdmin, loading } = useAppPermissions();
  const allowed = isAdmin && hasPermission("events.update") && hasPermission("ads.manage");
  if (loading) return <LoadingState fullPage message="Verificando seu acesso..." />;
  if (!allowed) return <Navigate to={ROUTES.AGENDA} replace />;

  return (
    <PageContainer maxWidth="7xl" className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3"><Settings2 className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold sm:text-3xl">Central da Home e Divulgação</h1></div>
        <p className="max-w-3xl text-sm text-muted-foreground">Aprove eventos e anúncios, atualize a pauta e organize o flyer principal em um só lugar.</p>
      </header>
      <Tabs defaultValue="schedule" className="min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
          <TabsTrigger value="moderation" className="gap-2 whitespace-normal"><CheckCircle2 className="h-4 w-4" />Moderação</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2 whitespace-normal"><CalendarDays className="h-4 w-4" />Horários, datas e local</TabsTrigger>
          <TabsTrigger value="ads" className="gap-2 whitespace-normal"><Megaphone className="h-4 w-4" />Anúncios e promoções</TabsTrigger>
          <TabsTrigger value="flyer" className="gap-2 whitespace-normal"><ImagePlus className="h-4 w-4" />Flyer principal</TabsTrigger>
        </TabsList>
        <TabsContent value="moderation" className="mt-6"><AdminAprovarEventos /></TabsContent>
        <TabsContent value="schedule" className="mt-6"><AdminPublishedEvents /></TabsContent>
        <TabsContent value="ads" className="mt-6"><AdminAds /></TabsContent>
        <TabsContent value="flyer" className="mt-6 rounded-md border border-border bg-card p-4 sm:p-6"><MainFlyerEditor /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}