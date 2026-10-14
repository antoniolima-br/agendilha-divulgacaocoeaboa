import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, Radar } from "lucide-react";
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
];

export const OPEN_KOE_EVENT = "koe:open";

export function isTabBarHidden(pathname: string) {
  return (
    pathname.startsWith("/evento/") ||
    pathname.startsWith("/enviar-evento") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/cadastro")
  );
}

/**
 * Barra de navegação inferior — só no mobile.
 * Fica escondida em telas que já têm barra de ação fixa (detalhe do evento, impressão).
 */
export function MobileTabBar({ onMenuClick }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (isTabBarHidden(pathname)) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className={cn("app-bottom-navigation fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]", pathname !== ROUTES.LANDING && "md:hidden")}
    >
      <ul className="mx-auto grid w-full max-w-screen-sm grid-cols-4 px-2 xs:px-3">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.label} className="min-w-0">
              <Link
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[var(--bottom-navigation-height)] flex-col items-center justify-center gap-0.5 px-2 transition-colors",
                  active ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                <div className="relative flex flex-col items-center"><Icon className={cn("h-5 w-5 shrink-0 transition-transform", active && "fill-primary/10 scale-110")} />{active && <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" /></div>
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
            onClick={() => navigate(ROUTES.PERFIL)}
            aria-label="Abrir perfil"
            className="flex h-[var(--bottom-navigation-height)] w-full flex-col items-center justify-center gap-0.5 rounded-none px-2 text-muted-foreground transition-colors active:text-primary"
          >
            <User className="h-5 w-5 shrink-0" />
            <span className="w-full truncate text-center text-[10px] font-semibold leading-none">Perfil</span>
          </Button>
        </li>
      </ul>
    </nav>
  );
}

/** Espaçador para o conteúdo não ficar embaixo da barra inferior. */
export function MobileTabBarSpacer() {
  return <div className="md:hidden h-[calc(var(--bottom-navigation-height)+env(safe-area-inset-bottom))]" aria-hidden="true" />;
}
