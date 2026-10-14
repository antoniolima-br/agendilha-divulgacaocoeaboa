import { CalendarDays, ImagePlus, Megaphone, Settings2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { ROUTES } from "@/routes/config";
import { MainFlyerEditor } from "@/components/admin-control/MainFlyerEditor";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPublishedEvents from "./AdminPublishedEvents";
import AdminAds from "./AdminAds";

export default function AdminControlCenter() {
  const { hasPermission, isAdmin, loading } = useAppPermissions();
  const allowed = isAdmin && hasPermission("events.update") && hasPermission("ads.manage");
  if (loading) return <LoadingState fullPage message="Verificando seu acesso..." />;
  if (!allowed) return <Navigate to={ROUTES.AGENDA} replace />;

  return (
    <PageContainer maxWidth="7xl" className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3"><Settings2 className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold sm:text-3xl">Central da Home e Divulgação</h1></div>
        <p className="max-w-3xl text-sm text-muted-foreground">Atualize a pauta, parceiros do Guia e o flyer principal em um só lugar.</p>
      </header>
      <Tabs defaultValue="schedule" className="min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
          <TabsTrigger value="schedule" className="gap-2 whitespace-normal"><CalendarDays className="h-4 w-4" />Horários, datas e local</TabsTrigger>
          <TabsTrigger value="ads" className="gap-2 whitespace-normal"><Megaphone className="h-4 w-4" />Anúncios e promoções</TabsTrigger>
          <TabsTrigger value="flyer" className="gap-2 whitespace-normal"><ImagePlus className="h-4 w-4" />Flyer principal</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-6"><AdminPublishedEvents /></TabsContent>
        <TabsContent value="ads" className="mt-6"><AdminAds /></TabsContent>
        <TabsContent value="flyer" className="mt-6 rounded-md border border-border bg-card p-4 sm:p-6"><MainFlyerEditor /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}