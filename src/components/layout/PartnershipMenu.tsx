import { Link } from "react-router-dom";
import { CalendarPlus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/routes/config";
import { cn } from "@/lib/utils";

export function PartnershipMenu({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" title="Divulgar/Contratar" className={cn("w-full rounded-none text-muted-foreground hover:text-foreground", compact ? "h-16 flex-col gap-1 px-1" : "justify-start gap-3 px-3")}>
        <Megaphone className="h-5 w-5 shrink-0" />
        <span className={compact ? "text-center text-[10px] font-semibold leading-tight" : "text-sm"}>Divulgar/Contratar</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="top" align="center" sideOffset={8} className="z-[60] w-56">
      <DropdownMenuItem asChild><Link to={ROUTES.ENVIAR_EVENTO} onClick={onNavigate} className="gap-3 py-3"><CalendarPlus className="h-4 w-4" />Cadastrar Evento</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link to={ROUTES.ANUNCIO_NOVO} onClick={onNavigate} className="gap-3 py-3"><Megaphone className="h-4 w-4" />Espaço Publicitário</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}