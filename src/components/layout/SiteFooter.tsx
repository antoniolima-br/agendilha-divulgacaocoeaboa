import logo from "@/assets/coeaboa-logo.webp";
import { InstitutionalCredits } from "./InstitutionalCredits";

interface SiteFooterProps {
  variant?: "default" | "muted";
  className?: string;
}

/**
 * Rodapé único, consolidado em 3 colunas:
 *  1) Copyright
 *  2) Marca + slogan
 *  3) Créditos do autor
 * Substitui rodapés duplicados ao longo do app.
 */
export function SiteFooter({ variant = "default", className = "" }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const bg = variant === "muted" ? "bg-muted/30" : "bg-card/30";

  return (
    <footer className={`w-full border-t border-border/40 px-4 py-10 sm:px-6 ${bg} ${className}`}>
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center gap-6 text-center sm:grid-cols-3 sm:text-left">
        {/* Copyright */}
        <div className="text-xs text-foreground/80 font-medium order-2 sm:order-1">
          © {year} Coé a Boa? — Todos os direitos reservados
        </div>

        {/* Marca + slogan */}
        <div className="flex min-w-0 items-center justify-center gap-2 order-1 sm:order-2">
          <img
            src={logo}
            alt="Coé a Boa?"
            className="h-7 w-7 rounded-full ring-1 ring-primary/15"
          />
          <div className="min-w-0 leading-tight">
            <div className="font-display text-sm font-black text-foreground tracking-tight">
              Coé a Boa?
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-foreground font-semibold">
              Transparência e Cultura
            </div>
          </div>
        </div>

        {/* Créditos */}
        <div className="text-xs text-foreground/80 font-medium order-3 sm:text-right">
          <InstitutionalCredits />
        </div>
      </div>
    </footer>
  );
}