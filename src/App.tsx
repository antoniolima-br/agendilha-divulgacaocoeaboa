import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubmissionProvider } from "@/contexts/SubmissionContext";
import Header from "@/components/Header";
import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppPermissions, type PermissionName } from "@/hooks/useAppPermissions";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { queryClient } from "@/lib/queryClient";
import { installGlobalErrorHandlers } from "@/lib/globalErrorHandlers";
import { ROUTES } from "@/routes/config";
import { PromotorRoute } from "@/components/auth/PromotorRoute";
import { OPEN_KOE_EVENT } from "@/components/layout/MobileTabBar";

// Critical (above-the-fold) — keep eager
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes (code-split)
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AdminPublishedEvents = lazy(() => import("./pages/AdminPublishedEvents"));
const AgendaCultural = lazy(() => import("./pages/AgendaCultural"));
const EventosEmDestaque = lazy(() => import("./pages/EventosEmDestaque"));
const Explorar = lazy(() => import("./pages/Explorar"));
const CuradoriaHoje = lazy(() => import("./pages/CuradoriaHoje"));
const AdminCollaborators = lazy(() => import("./pages/AdminCollaborators"));
const AdminMaster = lazy(() => import("./pages/AdminMaster"));
const Ranking = lazy(() => import("./pages/Ranking"));
const SubmitEvent = lazy(() => import("./pages/SubmitEvent"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const ArtistSetup = lazy(() => import("./pages/ArtistSetup"));
const AdminArtists = lazy(() => import("./pages/AdminArtists"));
const ArtistFeed = lazy(() => import("./pages/ArtistFeed"));
const AdminMedia = lazy(() => import("./pages/AdminMedia"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminAgendaInforma = lazy(() => import("./pages/AdminAgendaInforma"));
const CompartilharAgendaInforma = lazy(() => import("./pages/CompartilharAgendaInforma"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const PrintEvent = lazy(() => import("./pages/PrintEvent"));
const EstabelecimentoDetail = lazy(() => import("./pages/EstabelecimentoDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const MustChangePassword = lazy(() => import("./pages/MustChangePassword"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const CadastroEscolha = lazy(() => import("./pages/cadastro/CadastroEscolha"));
const CadastroPublico = lazy(() => import("./pages/cadastro/CadastroPublico"));
const CadastroArtista = lazy(() => import("./pages/cadastro/CadastroArtista"));
const CadastroBanda = lazy(() => import("./pages/cadastro/CadastroBanda"));
const CadastroSucesso = lazy(() => import("./pages/cadastro/CadastroSucesso"));
const CadastroAtrativoPublico = lazy(() => import("./pages/cadastro/CadastroAtrativoPublico"));
const CadastroEstabelecimentoPublico = lazy(() => import("./pages/cadastro/CadastroEstabelecimentoPublico"));
const Carrossel = lazy(() => import("./pages/Carrossel"));
const EventoEnviado = lazy(() => import("./pages/EventoEnviado"));
const ContratarDestaqueEvento = lazy(() => import("./pages/ContratarDestaqueEvento"));
const MeusEventos = lazy(() => import("./pages/MeusEventos"));
const AdminWhatsAppTemplates = lazy(() => import("./pages/AdminWhatsAppTemplates"));
const AdminDestaques = lazy(() => import("./pages/AdminDestaques"));
const AdminHighlightPayments = lazy(() => import("./pages/AdminHighlightPayments"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminRolandoAgora = lazy(() => import("./pages/AdminRolandoAgora"));
const AdminAprovarEventos = lazy(() => import("./pages/AdminAprovarEventos"));
const AdminAdPlans = lazy(() => import("./pages/AdminAdPlans"));
const AdminAds = lazy(() => import("./pages/AdminAds"));
const Anuncios = lazy(() => import("./pages/anuncios/Anuncios"));
const AnuncioDetalhe = lazy(() => import("./pages/anuncios/AnuncioDetalhe"));
const NovoAnuncio = lazy(() => import("./pages/anuncios/NovoAnuncio"));
const MeusAnuncios = lazy(() => import("./pages/anuncios/MeusAnuncios"));
const AdminEstabelecimentos = lazy(() => import("./pages/AdminEstabelecimentos"));
const AdminNegocios = lazy(() => import("./pages/AdminEstabelecimentos").then((module) => ({ default: module.AdminNegocios })));
const AdminAtrativos = lazy(() => import("./pages/AdminAtrativos"));
const CadastroPromotor = lazy(() => import("./pages/cadastro/CadastroPromotor"));
const PromotorEstabelecimentos = lazy(() => import("./pages/promotor/PromotorEstabelecimentos"));
const PromotorNegocios = lazy(() => import("./pages/promotor/PromotorEstabelecimentos").then((module) => ({ default: module.PromotorNegocios })));
const PromotorAtrativos = lazy(() => import("./pages/promotor/PromotorAtrativos"));
const PromotorPerfil = lazy(() => import("./pages/PromotorPerfil"));
const TermosPage = lazy(() => import("./pages/PlaceholderInfo").then(m => ({ default: m.TermosPage })));
const PrivacidadePage = lazy(() => import("./pages/PlaceholderInfo").then(m => ({ default: m.PrivacidadePage })));
const ImpulsionamentoPage = lazy(() => import("./pages/PlaceholderInfo").then(m => ({ default: m.ImpulsionamentoPage })));
const StatusDivulgador = lazy(() => import("./pages/divulgador/StatusDivulgador"));
const PublicProfile = lazy(() => import("./pages/divulgador/PublicProfile"));
const CoezinhoChat = lazy(() => import("@/components/coezinho/CoezinhoChat").then((module) => ({ default: module.CoezinhoChat })));
const InstallBanner = lazy(() => import("@/components/system/InstallBanner").then((module) => ({ default: module.InstallBanner })));

installGlobalErrorHandlers();


const PageFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center" aria-live="polite" aria-label="Carregando página">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function DeferredAppFeatures() {
  const { loading, mustChangePassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [chatRequested, setChatRequested] = useState(false);

  useEffect(() => {
    const openChat = () => {
      setChatRequested(true);
      setReady(true);
    };
    window.addEventListener(OPEN_KOE_EVENT, openChat);

    const schedule = window.requestIdleCallback?.bind(window);
    const idleId = schedule ? schedule(() => setReady(true), { timeout: 1800 }) : undefined;
    const timerId = schedule ? undefined : window.setTimeout(() => setReady(true), 1200);

    return () => {
      window.removeEventListener(OPEN_KOE_EVENT, openChat);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  if (!ready || loading || mustChangePassword) return null;
  return (
    <Suspense fallback={null}>
      <CoezinhoChat initiallyOpen={chatRequested} />
      <InstallBanner />
    </Suspense>
  );
}

export function ProtectedRoute({ 
  children, 
  requiredPermission,
  masterOnly,
  staffOnly,
}: { 
  children: React.ReactNode; 
  requiredPermission?: PermissionName;
  masterOnly?: boolean;
  staffOnly?: boolean;
}) {
  const { user, loading: authLoading, mustChangePassword } = useAuth();
  const { hasPermission, isMaster, isAdmin, isSenior, isFinanceiro, loading: permsLoading } = useAppPermissions();
  const location = useLocation();
  
  if (authLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (mustChangePassword && location.pathname !== ROUTES.TROCAR_SENHA) {
    return <Navigate to={ROUTES.TROCAR_SENHA} replace />;
  }

  if (masterOnly && !isMaster) {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  if (staffOnly && !(isAdmin || isSenior || isFinanceiro)) {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  return <>{children}</>;
}

export const AppRoutes = () => {
  const { user, loading, mustChangePassword } = useAuth();
  const location = useLocation();
  if (loading) return <PageFallback />;
  if (user && mustChangePassword) {
    return location.pathname === ROUTES.TROCAR_SENHA
      ? <Suspense fallback={<PageFallback />}><MustChangePassword /></Suspense>
      : <Navigate to={ROUTES.TROCAR_SENHA} replace />;
  }
  return (
  <SubmissionProvider>
    <SectionErrorBoundary context="AppRoutes">
      <Suspense fallback={<PageFallback />}>
        <Routes>
        {/* Públicas */}
        <Route path={ROUTES.LANDING} element={<SectionErrorBoundary context="Home" title="Não deu pra carregar a página inicial agora." description="Tenta de novo em instantes."><Landing /></SectionErrorBoundary>} />
        <Route path={ROUTES.EXPLORAR} element={<Explorar />} />
         <Route path={ROUTES.CURADORIA_HOJE} element={<CuradoriaHoje />} />
        <Route path={ROUTES.EVENTO_IMPRIMIR} element={<PrintEvent />} />

        {/* Cadastro por perfil (sem AppShell, fullscreen mobile-first) */}
        <Route path={ROUTES.CADASTRO} element={<CadastroEscolha />} />
        <Route path={ROUTES.CADASTRO_PUBLICO} element={<CadastroPublico />} />
        <Route path={ROUTES.CADASTRO_DIVULGADOR} element={<CadastroPromotor />} />
        <Route path={ROUTES.CADASTRO_ARTISTA} element={<CadastroArtista />} />
        <Route path={ROUTES.CADASTRO_BANDA} element={<ProtectedRoute><CadastroBanda /></ProtectedRoute>} />
        <Route path={ROUTES.CADASTRO_SUCESSO} element={<CadastroSucesso />} />
        <Route path={ROUTES.CADASTRO_ATRATIVO} element={<CadastroAtrativoPublico />} />
        <Route path={ROUTES.CADASTRO_ESTABELECIMENTO} element={<CadastroEstabelecimentoPublico />} />
        <Route path={ROUTES.CADASTRO_PROMOTOR} element={<CadastroPromotor />} />
        
        {/* App Wrapper for standard pages */}
        <Route element={<AppShell maxWidth="md"><Outlet /></AppShell>}>
          <Route path={ROUTES.AGENDA} element={<AgendaCultural />} />
          <Route path={ROUTES.ARTISTAS} element={<ArtistFeed />} />
          <Route path={ROUTES.AUTH} element={<Auth />} />
          <Route path={ROUTES.CONFIGURAR_ARTISTA} element={<ProtectedRoute><ArtistSetup /></ProtectedRoute>} />
          <Route path={ROUTES.ENVIAR_EVENTO} element={<PromotorRoute><SectionErrorBoundary context="EventForm" title="O formulário do evento deu um tropeço." description="Seu rascunho fica salvo. Toca em tentar de novo."><SubmitEvent /></SectionErrorBoundary></PromotorRoute>} />
          <Route path={ROUTES.EVENTOS_DESTAQUE} element={<EventosEmDestaque />} />
          <Route path={ROUTES.MEUS_EVENTOS} element={<ProtectedRoute><MeusEventos /></ProtectedRoute>} />
          <Route path={ROUTES.EVENTO_ENVIADO} element={<ProtectedRoute><EventoEnviado /></ProtectedRoute>} />
          <Route path={ROUTES.EVENTO_CONTRATAR_DESTAQUE} element={<ProtectedRoute><ContratarDestaqueEvento /></ProtectedRoute>} />
          <Route path={ROUTES.DIVULGADOR_STATUS} element={<ProtectedRoute><StatusDivulgador /></ProtectedRoute>} />
          <Route path={ROUTES.DIVULGADOR_PUBLIC_PROFILE} element={<PublicProfile />} />
        </Route>

        {/* Full width detail pages */}
        <Route element={<AppShell maxWidth="lg"><Outlet /></AppShell>}>
          <Route path={ROUTES.ARTISTA_PROFILE} element={<ArtistProfile />} />
          <Route path={ROUTES.EVENTO_DETAIL} element={<EventDetail />} />
          <Route path={ROUTES.ESTABELECIMENTO_DETAIL} element={<EstabelecimentoDetail />} />
          <Route path={ROUTES.ANUNCIOS} element={<Anuncios />} />
          <Route path={ROUTES.ANUNCIO_NOVO} element={<NovoAnuncio />} />
          <Route path={ROUTES.ANUNCIO_EDITAR} element={<NovoAnuncio />} />
          <Route path={ROUTES.MEUS_ANUNCIOS} element={<MeusAnuncios />} />
          <Route path={ROUTES.ANUNCIO_DETALHE} element={<AnuncioDetalhe />} />
        </Route>

        {/* Admin Pages - Full sidebar integration */}
        <Route element={<ProtectedRoute staffOnly><AppShell showSidebar={true} maxWidth="xl"><Outlet /></AppShell></ProtectedRoute>}>
          <Route path={ROUTES.ADMIN_EVENTS} element={<AdminEvents />} />
          <Route path={ROUTES.ADMIN_PUBLISHED_EVENTS} element={<AdminPublishedEvents />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
          <Route path={ROUTES.ADMIN_COLLABORATORS} element={<AdminCollaborators />} />
          <Route path={ROUTES.ADMIN_NEWSLETTER} element={<AdminNewsletter />} />
          <Route path={ROUTES.ADMIN_ARTISTS} element={<AdminArtists />} />
          <Route path={ROUTES.ADMIN_MEDIA} element={<AdminMedia />} />
          <Route path={ROUTES.ADMIN_AGENDA_INFORMA} element={<AdminAgendaInforma />} />
          <Route path={ROUTES.ADMIN_AGENDA_INFORMA_COMPARTILHAR} element={<CompartilharAgendaInforma />} />
          <Route path={ROUTES.ADMIN_WHATSAPP_TEMPLATES} element={<AdminWhatsAppTemplates />} />
          <Route path={ROUTES.ADMIN_DESTAQUES} element={<AdminDestaques />} />
          <Route path={ROUTES.ADMIN_PAGAMENTOS_DESTAQUE} element={<AdminHighlightPayments />} />
          <Route path={ROUTES.ADMIN_CONFIGURACOES} element={<AdminSettings />} />
          <Route path={ROUTES.ADMIN_ROLANDO_AGORA} element={<AdminRolandoAgora />} />
          <Route path={ROUTES.ADMIN_APROVAR_EVENTOS} element={<AdminAprovarEventos />} />
          <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReports />} />
          <Route path={ROUTES.ADMIN_ESTABELECIMENTOS} element={<AdminEstabelecimentos />} />
          <Route path={ROUTES.ADMIN_NEGOCIOS} element={<AdminNegocios />} />
          <Route path={ROUTES.ADMIN_ATRATIVOS} element={<AdminAtrativos />} />
          <Route path={ROUTES.ADMIN_ANUNCIOS} element={<AdminAds />} />
          <Route path={ROUTES.ADMIN_PLANOS_ANUNCIO} element={<AdminAdPlans />} />
        </Route>

        {/* Promotor area — guarded by user_type=divulgador (admins/masters incluídos) */}
        <Route element={<PromotorRoute><AppShell maxWidth="lg"><Outlet /></AppShell></PromotorRoute>}>
          <Route path={ROUTES.PROMOTOR_HOME} element={<Navigate to={ROUTES.PROMOTOR_ESTABELECIMENTOS} replace />} />
          <Route path={ROUTES.PROMOTOR_ESTABELECIMENTOS} element={<PromotorEstabelecimentos />} />
          <Route path={ROUTES.PROMOTOR_NEGOCIOS} element={<PromotorNegocios />} />
          <Route path={ROUTES.PROMOTOR_ATRATIVOS} element={<PromotorAtrativos />} />
          <Route path={ROUTES.PROMOTOR_PERFIL} element={<PromotorPerfil />} />
        </Route>


        {/* Master Pages - isolated from regular admin permissions */}
        <Route element={<ProtectedRoute masterOnly><AppShell showSidebar={true} maxWidth="xl"><Outlet /></AppShell></ProtectedRoute>}>
          <Route path={ROUTES.MASTER_DASHBOARD} element={<AdminMaster />} />
          <Route path={ROUTES.MASTER_USUARIOS} element={<AdminUsers />} />
          <Route path={ROUTES.MASTER_LOGS} element={<AdminAuditLogs />} />
          <Route path={ROUTES.ADMIN_AUDIT} element={<AdminAuditLogs />} />
          <Route path={ROUTES.RANKING} element={<Ranking />} />
        </Route>

        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.TROCAR_SENHA} element={<ProtectedRoute><MustChangePassword /></ProtectedRoute>} />
        <Route element={<AppShell maxWidth="md"><Outlet /></AppShell>}>
          <Route path={ROUTES.CONFIGURACOES} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path={ROUTES.PERFIL} element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path={ROUTES.TERMOS} element={<TermosPage />} />
          <Route path={ROUTES.PRIVACIDADE} element={<PrivacidadePage />} />
          <Route path={ROUTES.IMPULSIONAMENTO} element={<ImpulsionamentoPage />} />
        </Route>
        <Route path={ROUTES.LEGACY_COEABOA} element={<Navigate to={ROUTES.AGENDA} replace />} />
        <Route path={ROUTES.LEGACY_LANDING} element={<Navigate to={ROUTES.LANDING} replace />} />
        {/* Defensive: bare /master and /admin should land on a real page */}
        <Route path={ROUTES.MASTER_ROOT} element={<Navigate to={ROUTES.MASTER_DASHBOARD} replace />} />
        <Route path={ROUTES.LEGACY_ADMIN_MASTER} element={<Navigate to={ROUTES.MASTER_DASHBOARD} replace />} />
        <Route path={ROUTES.ADMIN_ROOT} element={<Navigate to={ROUTES.ADMIN_EVENTS} replace />} />
        <Route path={ROUTES.CARROSSEL} element={<Carrossel />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SectionErrorBoundary>

  </SubmissionProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AppRoutes />
            <DeferredAppFeatures />
          </AuthProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>

);

export default App;
