import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Heart,
  Menu, 
  X, 
  ArrowLeft, 
  CheckCircle, 
  Shield, 
  Settings, 
  Crown, 
  Sun, 
  Moon,
  ExternalLink
} from "lucide-react";
import { ROUTES } from "@/routes/config";
import { MapPin, UserRound } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
 import logoCoeABoa from "@/assets/coeaboa-logo.webp";
import { Button } from "@/components/ui/button";
 import { useAuth } from "@/contexts/AuthContext";
 import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { useUserBadge, type UserStatus } from "@/hooks/useUserBadge";
 import { Badge } from "@/components/ui/badge";
  import { HeaderUserMenu } from "@/components/HeaderUserMenu";
 import { SidebarMenu } from "@/components/SidebarMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UpdateAppButton } from "@/components/system/UpdateAppButton";
import { MobileTabBar, MobileTabBarSpacer } from "@/components/layout/MobileTabBar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

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
   status: UserStatus;
  isAdmin: boolean;
  perms: { loaded: boolean; canApprove: boolean; isCollaborator: boolean };
}) {
  if (status === "master") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-bold uppercase gap-1 border-secondary text-secondary bg-secondary/10 font-semibold shadow-sm"
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
        {status === "senior" ? "Sênior" : "Admin"}
      </Badge>
    );
  }
  if (status === "financeiro") {
    return <Badge variant="outline" className="text-xs gap-1 text-primary border-primary"><Shield className="h-3 w-3" />Financeiro</Badge>;
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
   const { user, isAdmin } = useAuth();
   const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const perms = useAppPermissions();
  const { status, name: badgeName, initials } = useUserBadge();
  const isMaster = status === "master";
  const currentDate = useCurrentDate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Fallback: when no toggle is provided by the parent (e.g. Landing page),
  // open an internal Sheet drawer so the hamburger always works.
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const handleMobileMenu = onMobileMenuToggle ?? (() => setInternalMobileOpen(true));
  const { pathname: _p, search: menuSearch } = useLocation();
  useEffect(() => { setInternalMobileOpen(false); }, [_p, menuSearch]);
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
        <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-xl" : "bg-background"}`}>
          <div className="mx-auto w-full max-w-6xl px-3 pb-1 pt-2 sm:px-8">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <Link to="/" className="group shrink-0 justify-self-start" aria-label="Coé a Boa? - Página Inicial">
                <img src={logoCoeABoa} alt="Coé a Boa?" className="h-24 w-24 rounded-full object-cover ring-1 ring-primary/40 transition-transform group-hover:scale-105 sm:h-[6.75rem] sm:w-[6.75rem]" />
              </Link>
              <Link to="/explorar" className="flex min-h-11 min-w-0 flex-col items-end justify-self-end text-right hover:opacity-90" aria-label="Localização: Rio de Janeiro, Brasil">
                <span className="flex items-center gap-1.5 font-display text-sm font-semibold leading-tight text-foreground sm:text-lg">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Rio de Janeiro, Brasil
                </span>
                <span className="mt-0.5 text-xs capitalize leading-tight text-primary sm:text-sm">
                  {(() => {
                    const s = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
                    return s.replace(/ de (\p{L})/gu, (_m, c) => ` de ${c.toUpperCase()}`);
                  })()}
                </span>
              </Link>
              {user ? (
                <div className="shrink-0 self-start"><HeaderUserMenu variant="desktop" hideContext /></div>
              ) : (
                <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0 self-start rounded-full">
                  <Link to={ROUTES.CADASTRO_PUBLICO} aria-label="Criar meu perfil"><UserRound className="h-6 w-6 text-primary" /></Link>
                </Button>
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
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 shadow-sm">
          <div className="mx-auto flex h-16 sm:h-18 max-w-5xl items-center justify-between px-4 sm:px-6 gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile Menu Trigger for Agenda - Always show trigger */}

              <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-80 transition-opacity group shrink-0" aria-label="Coé a Boa? - Página Inicial">
                <img src={logoCoeABoa} alt="Coé a Boa?" className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full ring-2 ring-primary/5 shadow-sm" />
                <div className="flex flex-col leading-[1]">
                  <span className="font-display text-lg sm:text-xl font-black text-primary tracking-tight">Coé a Boa?</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <UpdateAppButton compact />
              <HeaderUserMenu variant="desktop" hideContext={true} />
            </div>
          </div>
          <div className="h-1 w-full gradient-pumpkin-strip opacity-90" />
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
  const showEventos = perms.loaded && perms.canSubmit;
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

              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
                <img src={logoCoeABoa} alt="Coé a Boa?" className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full shadow-sm" />
                <div className="flex flex-col leading-none min-w-0">
                  <span className="font-display text-base sm:text-lg font-black text-primary tracking-tight truncate">Coé a Boa?</span>
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
            return (
             <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <UpdateAppButton compact />
              <NotificationBell />
              <HeaderUserMenu variant="desktop" />

              {/* Logout is inside the user dropdown above */}
            </div>
            );
          })()}
          </div>

          {/* Row 2 (mobile only): date + role */}
          {user && !isAgenda && (
            <div className="md:hidden flex items-center justify-between gap-2 pb-2.5 pt-0.5">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground capitalize leading-tight truncate">{currentDate}</span>
                {isAdminArea && (
                  <div className="mt-1"><RoleBadge status={status} isAdmin={isAdmin} perms={perms} /></div>
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
          <SheetContent side="left" className="w-[min(20rem,calc(100vw-1rem))] border-r border-border bg-sidebar p-0">
            <SidebarMenu onClose={() => setInternalMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  );
}
