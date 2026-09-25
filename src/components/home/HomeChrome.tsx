import { Link, useLocation } from "react-router-dom";
import { CalendarPlus, Home, MapPin, Sparkles, UserRound } from "lucide-react";
import logo from "@/assets/coeaboa-logo.webp";
import { cn } from "@/lib/utils";

export function HomeTopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-screen-lg flex-col items-center justify-center px-4">
        <Link to="/" aria-label="Coé a Boa? — início" className="flex items-center gap-2">
          <img src={logo} alt="Coé a Boa?" className="h-8 w-8 rounded-full ring-1 ring-primary/15" />
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          Ilha do Governador · Rio de Janeiro, RJ
        </p>
      </div>
    </header>
  );
}

const ITEMS = [
  { label: "Início", icon: Home, path: "/", match: (p: string) => p === "/" },
  { label: "Hoje", icon: Sparkles, path: "/hoje", match: (p: string) => p.startsWith("/hoje") },
  { label: "Divulgar", icon: CalendarPlus, path: "/divulgador/status", match: (p: string) => p.startsWith("/divulgador") },
  { label: "Perfil", icon: UserRound, path: "/meus-eventos", match: (p: string) => p.startsWith("/meus-eventos") },
];

export function HomeBottomBar() {
  const { pathname } = useLocation();
  return (
    <>
      <div className="h-20 pb-[env(safe-area-inset-bottom)]" aria-hidden="true" />
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <ul className="mx-auto grid h-16 w-full max-w-screen-sm grid-cols-4">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <li key={item.label} className="min-w-0">
                <Link
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
