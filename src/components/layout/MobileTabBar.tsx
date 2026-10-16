import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Home, Menu, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/config";
import { PartnershipMenu } from "./PartnershipMenu";

interface Props {
  onMenuClick: () => void;
}

const items = [
  { label: "Início", icon: Home, path: "/", match: (p: string) => p === "/" },
  { label: "Meu Radar", icon: Radar, path: ROUTES.SEU_RADAR, match: (p: string) => p === ROUTES.SEU_RADAR },
  { label: "Agenda", icon: CalendarDays, path: ROUTES.AGENDA, match: (p: string) => p === ROUTES.AGENDA || p.startsWith(`${ROUTES.AGENDA}/`) },
];

export const OPEN_KOE_EVENT = "koe:open";

export function isTabBarHidden(pathname: string) {
  return (
    pathname.startsWith("/enviar-evento") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/evento/")
  );
}

export function MobileTabBar({ onMenuClick }: Props) {
  const { pathname } = useLocation();

  if (isTabBarHidden(pathname)) return null;


  return (
    <nav
      aria-label="Navegação principal"
      className="app-bottom-navigation fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid w-full max-w-screen-sm grid-cols-5 px-1 xs:px-2">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label} className="min-w-0">
              <Link
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[var(--bottom-navigation-height)] flex-col items-center justify-center gap-1 px-1 transition-colors",
                  active ? "text-nav-active font-bold" : "text-nav-inactive"
                )}
              >
                <div className="relative flex flex-col items-center">
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
                  {active && <div className="nav-active-dot absolute -bottom-1.5 h-1 w-1 rounded-full animate-in zoom-in duration-300" />}
                </div>
                <span className="w-full truncate text-center text-[10px] font-semibold leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0"><PartnershipMenu compact /></li>
        <li className="min-w-0">
          <Button
            variant="ghost"
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu lateral"
            aria-haspopup="dialog"
            className={cn(
               "flex h-[var(--bottom-navigation-height)] w-full flex-col items-center justify-center gap-1 rounded-none px-1 transition-colors",
              "text-nav-inactive"
            )}
          >
            <div className="relative flex flex-col items-center">
              <Menu className="h-5 w-5 shrink-0" />
            </div>
            <span className="w-full truncate text-center text-[10px] font-semibold leading-none">Menu</span>
          </Button>
        </li>
      </ul>
    </nav>
  );
}

export function MobileTabBarSpacer() {
  return <div className="md:hidden h-[calc(var(--bottom-navigation-height)+env(safe-area-inset-bottom))]" aria-hidden="true" />;
}
