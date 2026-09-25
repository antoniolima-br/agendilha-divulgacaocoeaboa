import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";

import { 
  CalendarDays, 
  ClipboardList, 
  Heart,
  LogOut, 
  Users, 
  Menu, 
  X, 
  ArrowLeft, 
  CheckCircle, 
  Shield, 
  Settings, 
  ChevronDown, 
  UserCog, 
  Crown, 
  Trophy, 
  Megaphone, 
  Sun, 
  Moon,
  ExternalLink,
  Share2
} from "lucide-react";
import { MapPin } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
 import logoCoeABoa from "@/assets/coeaboa-logo.webp";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
 import { useAuth } from "@/contexts/AuthContext";
 import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { useUserBadge } from "@/hooks/useUserBadge";
 import { Badge } from "@/components/ui/badge";
  import { HeaderUserMenu } from "@/components/HeaderUserMenu";
 import { SidebarMenu } from "@/components/SidebarMenu";
import SubmissionsPanel from "@/components/SubmissionsPanel";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UpdateAppButton } from "@/components/system/UpdateAppButton";
import { MobileTabBar, MobileTabBarSpacer } from "@/components/layout/MobileTabBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function useCurrentDate() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function RoleBadge({
  status,
  isAdmin,
  perms,
}: {
   status: "master" | "admin" | "collaborator" | "artist" | "user" | null;
  isAdmin: boolean;
  perms: { loaded: boolean; canApprove: boolean; isCollaborator: boolean };
}) {
  if (status === "master") {
    return (
      <Badge
        variant="outline"
        className="text-xs gap-1 border-secondary text-secondary bg-secondary/10 font-semibold shadow-sm"
      >
        <Crown className="h-3 w-3" strokeWidth={2.5} />
        Admin Master
      </Badge>
    );
  }
  if (isAdmin) {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-accent border-accent">
        <Shield className="h-3 w-3" strokeWidth={2.5} />
        Admin
      </Badge>
    );
  }
  if (perms.loaded && perms.isCollaborator) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground">
        Colaborador
      </Badge>
    );
  }
  return null;
}

export default function Header({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { savedCount } = useSubmissions();
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem("agendilha_favorites");
        const parsed = saved ? JSON.parse(saved) : [];
        setFavoritesCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setFavoritesCount(0);
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("agendilha:favorites", updateCount);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("agendilha:favorites", updateCount);
    };
  }, []);
   const { user, signOut, isAdmin } = useAuth();
   const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const perms = useAppPermissions();
  const { isDivulgador } = useDivulgadorStatus();
  // Só Divulgador (ou admin) cria evento — o resto vai pedir acesso.
  const irParaDivulgar = () => {
    if (!user) return navigate("/auth?redirect=/enviar-evento");
    if (!isDivulgador) {
      toast.info("Acesso exclusivo para Divulgadores", {
        description: "Para divulgar eventos, você precisa ser aprovado como Divulgador.",
      });
      return navigate("/divulgador/status");
    }
    navigate("/enviar-evento");
  };
  const { status, name: badgeName } = useUserBadge();
  const isMaster = status === "master";
  const navigate = useNavigate();
  const currentDate = useCurrentDate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Fallback: when no toggle is provided by the parent (e.g. Landing page),
  // open an internal Sheet drawer so the hamburger always works.
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const handleMobileMenu = onMobileMenuToggle ?? (() => setInternalMobileOpen(true));
  const { pathname: _p } = useLocation();
  useEffect(() => { setInternalMobileOpen(false); }, [_p]);
   const { pathname } = useLocation();
   const isHome = pathname === "/" || pathname === "/lp" || pathname === "/landing";
   const isAgenda = pathname === "/agenda";
   const isSubmit = pathname === "/enviar-evento";
   const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/master") || pathname === "/ranking";
 
   // Home / Landing - Transparent floating style
   const [scrolled, setScrolled] = useState(false);
   useEffect(() => {
     if (!isHome) return;
     const onScroll = () => setScrolled(window.scrollY > 12);
     window.addEventListener("scroll", onScroll, { passive: true });
     onScroll();
     return () => window.removeEventListener("scroll", onScroll);
   }, [isHome]);
 
    if (isHome) {
      return (
         <>
        <header className={`fixed top-0 inset-x-0 z-50 border-b border-border transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-xl" : "bg-background"}`}>
          <div className="mx-auto w-full max-w-6xl px-3 pb-3 pt-2 sm:px-8">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <Link to="/" className="group shrink-0 justify-self-start" aria-label="Coé a Boa? - Página Inicial">
                <img src={logoCoeABoa} alt="Coé a Boa?" className="h-16 w-16 rounded-full object-cover ring-1 ring-primary/40 transition-transform group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]" />
              </Link>
              <Link to="/explorar" className="flex min-h-11 min-w-0 items-center gap-1 justify-self-end text-xs text-muted-foreground hover:text-foreground" aria-label="Localização: Ilha do Governador, Rio de Janeiro, RJ, Brasil">
                <span className="text-right leading-tight">Ilha do Governador,<br />Rio de Janeiro, RJ, Brasil</span>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:mx-auto sm:max-w-md">
              <Button onClick={irParaDivulgar} className="btn-gold h-10 rounded-full text-xs font-bold uppercase tracking-wide hover:opacity-90">Divulgar</Button>
              {user ? (
                <Button onClick={handleMobileMenu} className="btn-gold h-10 rounded-full text-xs font-bold uppercase tracking-wide hover:opacity-90">Perfil</Button>
              ) : (
                <Button onClick={() => navigate("/auth")} className="btn-gold h-10 rounded-full text-xs font-bold uppercase tracking-wide hover:opacity-90">Logar</Button>
              )}
            </div>
          </div>
        </header>
        <MobileTabBar onMenuClick={handleMobileMenu} />
         {!onMobileMenuToggle && (
           <Sheet open={internalMobileOpen} onOpenChange={setInternalMobileOpen}>
              <SheetContent side="left" className="w-[min(20rem,calc(100vw-1rem))] border-r border-border bg-sidebar p-0">
               <SidebarMenu onClose={() => setInternalMobileOpen(false)} />
             </SheetContent>
           </Sheet>
         )}
         </>
      );
    }
 
    // Public view for agenda - responsive & polished
    if (isAgenda) {
      return (
        <>
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-sm">
          <div className="mx-auto flex h-16 sm:h-18 max-w-5xl items-center justify-between px-4 sm:px-6 gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile Menu Trigger for Agenda - Always show trigger */}
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleMobileMenu} 
                  className="text-primary hover:bg-primary/5 active:scale-90 transition-all"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>

              <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-80 transition-opacity group shrink-0" aria-label="AgendIlha - Página Inicial">
                <img src={logoCoeABoa} alt="AgendIlha" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 rounded-full ring-2 ring-primary/5 shadow-sm" />
                <div className="flex flex-col leading-[1]">
                  <span className="font-display text-lg sm:text-xl font-black text-primary tracking-tight">AgendIlha</span>
                  <span className="text-[9px] sm:text-[10px] text-secondary font-black uppercase tracking-[0.15em]">Coé a Boa?</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <UpdateAppButton compact />
              {(isAdmin || isDivulgador || perms.isCollaborator) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={irParaDivulgar}
                  className="hidden sm:inline-flex rounded-full text-xs font-semibold tracking-tight border border-foreground/15 text-foreground hover:bg-foreground/5 bg-transparent shadow-none px-5 h-9 sm:h-10 active:scale-95"
                >
                  Divulgar evento
                </Button>
              )}
              
              <HeaderUserMenu variant="desktop" hideContext={true} />
            </div>
          </div>
          <div className="h-1 w-full gradient-pumpkin-strip opacity-90" />
        </header>
        <MobileTabBar onMenuClick={handleMobileMenu} />
        {!onMobileMenuToggle && (
          <Sheet open={internalMobileOpen} onOpenChange={setInternalMobileOpen}>
            <SheetContent side="left" className="p-0 w-[280px] sm:w-80 bg-sidebar border-r border-border">
              <SidebarMenu onClose={() => setInternalMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        )}
        </>
      );
    }
  const showEventos = isAdmin || (perms.loaded && perms.isCollaborator);
  const showCollaborators = isAdmin || (perms.loaded && perms.canApprove);
   const hasAdminLinks = showEventos || isAdmin || showCollaborators;
 
   // Final fallback header (Admin Area / Protected pages / Other)
   return (
     <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Row 1: menu + brand + user */}
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMobileMenu}
                className="shrink-0 text-primary hover:bg-primary/5 active:scale-90 transition-all"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>

              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
                <img src={logoCoeABoa} alt="AgendIlha" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 rounded-full shadow-sm" />
                <div className="flex flex-col leading-none min-w-0">
                  <span className="font-display text-base sm:text-lg font-black text-primary tracking-tight truncate">AgendIlha</span>
                  <span className="text-[8px] sm:text-[9px] text-secondary font-black uppercase tracking-widest opacity-80">Coé a Boa?</span>
                </div>
              </Link>

              {/* Desktop-only inline date + role */}
              <div className="hidden md:flex flex-col ml-3">
                <span className="text-[10px] text-muted-foreground capitalize leading-none mb-1">{currentDate}</span>
                {isAdminArea && <RoleBadge status={status} isAdmin={isAdmin} perms={perms} />}
              </div>
            </div>

            {/* Right (row 1): user dropdown only on mobile, full actions on sm+ */}
            {!user && (
              <div className="ml-auto flex items-center">
                <UpdateAppButton compact />
              </div>
            )}
            {user && !isAgenda && (() => {
            // Use centralized name resolution from useUserBadge (profile → company → collaborator → metadata → email/phone)
            const fullName = badgeName && badgeName !== "Usuário" ? badgeName : "Divulgador";
            const firstName = fullName.split(" ")[0];
            const roleLabel = isMaster
              ? "Admin Master"
              : isAdmin
              ? "Admin"
              : perms.isCollaborator
              ? "Divulgador"
              : "Usuário";

            // Role-aware icon for the trigger
            const RoleIcon = isMaster ? Crown : isAdmin ? Shield : UserCog;
            const roleAccent = isMaster
              ? "text-secondary"
              : isAdmin
              ? "text-accent"
              : "text-muted-foreground";

            return (
             <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <UpdateAppButton compact />
              <NotificationBell />
              {/* Envios — desktop/tablet only */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SubmissionsPanel>
                      <Button
                        size="sm"
                       variant="ghost"
                       aria-label="Ver meus envios"
                       className="hidden sm:inline-flex text-foreground/70 hover:text-foreground hover:bg-foreground/5 font-medium text-xs sm:text-sm px-2 sm:px-3"
                     >
                       <ClipboardList className="h-4 w-4 mr-1.5" />
                       <span className="hidden sm:inline">Envios</span>
                        {savedCount > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] font-medium bg-foreground/10 text-foreground border-none">
                            {savedCount}
                          </Badge>
                        )}
                      </Button>
                    </SubmissionsPanel>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Meus envios e rascunhos</TooltipContent>
              </Tooltip>

               {/* Enviar Evento CTA — desktop/tablet only */}
               {(isAdmin || perms.isCollaborator) && (
                 <Button 
                   size="sm" 
                   onClick={irParaDivulgar} 
                   className="hidden sm:inline-flex rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-tight shadow-none text-xs sm:text-sm px-4 sm:px-5 h-9"
                 >
                   <Megaphone className="h-4 w-4 sm:mr-1.5" />
                   <span className="hidden sm:inline">Divulgar evento</span>
                 </Button>
               )}

              {/* User dropdown — moved to the far right */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                    aria-label={`Menu do ${roleLabel}`}
                  >
                    <div className="relative">
                      <Avatar className={`h-6 w-6 ${isMaster ? "ring-2 ring-secondary ring-offset-1 ring-offset-background" : isAdmin ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}`}>
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground">
                          {getInitials(fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <RoleIcon
                        className={`absolute -top-1.5 -right-1.5 h-3.5 w-3.5 ${roleAccent} ${isMaster ? "fill-secondary" : ""} drop-shadow-sm`}
                        strokeWidth={2}
                        aria-label={roleLabel}
                      />
                    </div>
                    <span className="hidden min-[420px]:inline truncate max-w-[80px] sm:max-w-[120px]">{firstName}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground truncate">{fullName}</span>
                      {isMaster && <Crown className="h-3.5 w-3.5 text-secondary fill-secondary shrink-0" strokeWidth={2} />}
                    </div>
                    <div className={`font-normal text-[11px] mt-0.5 ${isMaster ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
                      {roleLabel}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Admin & Master: Eventos */}
                  {(isAdmin || isMaster) && (
                    <DropdownMenuItem onClick={() => navigate("/admin/events")} className="cursor-pointer">
                      <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                      Eventos
                    </DropdownMenuItem>
                  )}

                  {/* Master only: Usuários */}
                  {isMaster && (
                    <DropdownMenuItem onClick={() => navigate("/admin/users")} className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      Usuários
                    </DropdownMenuItem>
                  )}

                  {/* Master only: Ranking */}
                  {isMaster && (
                    <DropdownMenuItem onClick={() => navigate("/ranking")} className="cursor-pointer">
                      <Trophy className="h-4 w-4 mr-2 text-secondary" />
                      Ranking
                    </DropdownMenuItem>
                  )}
                  

                  {(isAdmin || isMaster) && user && (
                    <DropdownMenuItem 
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/divulgador/${user.id}`;
                        const shareText = `Confira meu perfil de divulgador no AgendIlha: ${shareUrl}`;
                        
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: 'Perfil no AgendIlha',
                              text: shareText,
                              url: shareUrl,
                            });
                          } catch (err) {
                            console.error("Erro ao compartilhar:", err);
                          }
                        } else {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success("Link do perfil copiado!");
                          } catch (err) {
                            toast.error("Não foi possível copiar o link.");
                          }
                        }
                      }} 
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Share2 className="h-4 w-4 mr-2 text-primary" />
                      Compartilhar Perfil
                    </DropdownMenuItem>
                  )}

                  {(isAdmin || isMaster) && <DropdownMenuSeparator />}

                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout is inside the user dropdown above */}
            </div>
            );
          })()}
          </div>

          {/* Row 2 (mobile only): date + role + secondary actions */}
          {user && !isAgenda && (
            <div className="md:hidden flex items-center justify-between gap-2 pb-2.5 pt-0.5">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground capitalize leading-tight truncate">{currentDate}</span>
                {isAdminArea && (
                  <div className="mt-1"><RoleBadge status={status} isAdmin={isAdmin} perms={perms} /></div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <SubmissionsPanel>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Ver meus envios"
                    className="h-9 px-2.5 text-foreground/70 hover:text-foreground hover:bg-foreground/5 font-medium text-xs"
                  >
                    <ClipboardList className="h-4 w-4" />
                    {savedCount > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] font-medium bg-foreground/10 text-foreground border-none">
                        {savedCount}
                      </Badge>
                    )}
                  </Button>
                </SubmissionsPanel>
                {(isAdmin || perms.isCollaborator) && (
                  <Button
                    size="sm"
                    onClick={irParaDivulgar}
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-tight shadow-none text-xs px-3.5 h-9"
                  >
                    <Megaphone className="h-3.5 w-3.5 mr-1" />
                    Divulgar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      {/* Decorative pumpkin/terracotta strip below the header */}
      <div className="sticky top-[var(--header-strip-offset,0)] z-40 h-1 w-full gradient-pumpkin-strip shadow-[0_2px_8px_-2px_hsl(22_70%_55%/0.25)]" aria-hidden="true" />
      <MobileTabBar onMenuClick={handleMobileMenu} />
      {!onMobileMenuToggle && (
        <Sheet open={internalMobileOpen} onOpenChange={setInternalMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] sm:w-80 bg-sidebar border-r border-border">
            <SidebarMenu onClose={() => setInternalMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  );
}
