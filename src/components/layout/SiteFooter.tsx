import { InstitutionalCredits } from "./InstitutionalCredits";

interface SiteFooterProps {
  variant?: "default" | "muted";
  className?: string;
}

/**
 * Rodapé compartilhado com copyright e um único crédito de criação.
 * Substitui rodapés duplicados ao longo do app.
 */
export function SiteFooter({ variant = "default", className = "" }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const bg = variant === "muted" ? "bg-muted/30" : "bg-card/30";

  return (
    <footer className={`site-footer w-full border-t border-border/40 px-4 py-4 sm:px-6 ${bg} ${className}`}>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        {/* Copyright */}
        <div className="text-xs text-foreground/80 font-medium order-2 sm:order-1">
          © {year} Coé a Boa? — Todos os direitos reservados
        </div>

        {/* Créditos */}
        <div className="text-xs text-foreground/80 font-medium order-3 sm:text-right">
          <InstitutionalCredits />
        </div>
      </div>
    </footer>
  );
}