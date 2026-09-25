import { Link, useLocation } from "react-router-dom";
import { CalendarPlus, Home, Megaphone, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onMenuClick: () => void;
}

const items = [
  { label: "Início", icon: Home, path: "/", match: (p: string) => p === "/" },
  { label: "Divulgar", icon: CalendarPlus, path: "/divulgador/status", match: (p: string) => p.startsWith("/divulgador") || p.startsWith("/enviar-evento") },
  { label: "Contratar", icon: Megaphone, path: "/anuncios", match: (p: string) => p.startsWith("/anuncios") || p.startsWith("/meus-anuncios") },
];

/**
 * Barra de navegação inferior — só no mobile.
 * Fica escondida em telas que já têm barra de ação fixa (detalhe do evento, impressão).
 */
export function MobileTabBar({ onMenuClick }: Props) {
  const { pathname } = useLocation();

  const hidden =
    pathname.startsWith("/evento/") ||
    pathname.startsWith("/enviar-evento") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/cadastro");

  if (hidden) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
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
                  "flex h-16 flex-col items-center justify-center gap-1 px-2 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "fill-primary/10")} />
                <span className="w-full truncate text-center text-[10px] font-semibold leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu"
            className="flex h-16 w-full flex-col items-center justify-center gap-1 px-2 text-muted-foreground transition-colors active:text-primary"
          >
            <Menu className="h-5 w-5 shrink-0" />
            <span className="w-full truncate text-center text-[10px] font-semibold leading-none">Perfil</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Espaçador para o conteúdo não ficar embaixo da barra inferior. */
export function MobileTabBarSpacer() {
  return <div className="md:hidden h-16 pb-[env(safe-area-inset-bottom)]" aria-hidden="true" />;
}
