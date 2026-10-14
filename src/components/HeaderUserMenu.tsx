import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, Shield, Crown, ChevronDown } from "lucide-react";
 import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBadge } from "@/hooks/useUserBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusIcon = {
  master: Crown,
  admin: Shield,
  senior: Shield,
  financeiro: Shield,
  collaborator: UserIcon,
  artist: UserIcon,
  user: UserIcon,
} as const;

const statusStyles = {
  master:
    "bg-secondary/15 text-secondary border-secondary/30",
  admin:
    "bg-primary/10 text-primary border-primary/25",
  senior: "bg-secondary/15 text-secondary border-secondary/30",
  financeiro: "bg-primary/10 text-primary border-primary/25",
  collaborator:
    "bg-foreground/[0.06] text-foreground/75 border-foreground/15",
  artist:
    "bg-foreground/[0.06] text-foreground/75 border-foreground/15",
  user: "bg-muted text-muted-foreground border-border",
} as const;

interface Props {
   variant?: "desktop" | "mobile";
   onNavigate?: () => void;
   hideContext?: boolean;
}

export function profileAccessTitle(roles: string[], isDivulgador: boolean): string {
  if (roles.includes("master")) return "Master";
  if (roles.includes("senior")) return "Admin Sênior";
  if (roles.includes("financeiro")) return "Admin Financeiro";
  if (roles.includes("marketing")) return "Admin Marketing";
  if (roles.includes("admin")) return "Admin Curador";
  if (isDivulgador || roles.some((role) => ["promoter", "collaborator"].includes(role))) return "Divulgador";
  return "Visitante";
}

 export function HeaderUserMenu({ variant = "desktop", onNavigate, hideContext }: Props) {
  const { user, signOut } = useAuth();
  const { isDivulgador } = useDivulgadorStatus();
  const { roles } = useAppPermissions();
  const { name, initials, status, loaded } = useUserBadge();
  const navigate = useNavigate();

   const { pathname } = window.location;
   const isAgenda = pathname === "/agenda";
 
   if (!user) {
     return (
       <div className={variant === "mobile" ? "flex flex-col gap-2.5" : "flex items-center gap-2"}>
          {variant === "mobile" && !isAgenda && (
            <Link to="/agenda" onClick={onNavigate}>
              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-full border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5 font-medium"
              >
                Ver agenda
              </Button>
            </Link>
          )}
         <Link to="/auth" onClick={onNavigate}>
           <Button
             size="sm"
             variant="ghost"
             className={cn(
               "rounded-full transition-all duration-300",
               variant === "mobile" ? "w-full h-12 bg-muted/50 justify-start px-6 gap-3" : "h-10 px-4 hover:bg-primary/10 text-muted-foreground hover:text-primary"
             )}
             title="Entrar ou Cadastrar"
           >
             <UserIcon className="h-4 w-4" />
             <span className="text-sm font-bold">Entrar</span>
           </Button>
         </Link>
       </div>
     );
   }

  const Icon = status ? statusIcon[status] : UserIcon;
  const badgeStyle = status ? statusStyles[status] : statusStyles.user;
  const accessTitle = profileAccessTitle(roles, isDivulgador);
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
    navigate("/");
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <Avatar className="h-10 w-10 ring-1 ring-primary/50">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-display text-sm font-medium text-foreground truncate">
              {loaded ? name : "Carregando..."}
            </div>
            <div className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeStyle}`}>
              <Icon className="h-2.5 w-2.5" strokeWidth={2} />
              {accessTitle}
            </div>
          </div>
        </div>
        <Link to="/perfil" onClick={onNavigate}>
          <Button size="lg" variant="outline" className="h-12 w-full justify-start rounded-lg bg-background px-4 text-foreground">
            <UserIcon className="mr-2 h-4 w-4" />
            Ver/Editar Perfil
          </Button>
        </Link>
        <Button
          size="lg"
          variant="ghost"
          className="h-12 w-full justify-start rounded-lg px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 rounded-full px-1.5 pr-2.5 hover:bg-primary/10" aria-label={`Abrir menu do perfil: ${accessTitle}`}>
          <Avatar className="h-9 w-9 ring-2 ring-primary">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
           {!hideContext && (
             <div className="flex flex-col items-start leading-tight">
               <span className="font-display text-[13px] font-medium text-foreground max-w-[140px] truncate">
                 {loaded ? name.split(" ")[0] : "..."}
               </span>
              <span className="mt-0.5 hidden text-[10px] font-medium text-muted-foreground sm:inline">{accessTitle}</span>
             </div>
           )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border-border bg-popover p-2 shadow-elevated">
        <DropdownMenuLabel className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-11 w-11 ring-1 ring-primary/50">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-medium text-foreground truncate">{name}</div>
              <div className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeStyle}`}>
                <Icon className="h-2.5 w-2.5" strokeWidth={2} />
                {accessTitle}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11 cursor-pointer rounded-md px-3 font-medium">
          <Link to="/perfil" onClick={onNavigate}>
            <UserIcon className="h-4 w-4 mr-2" />
            Ver/Editar Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="min-h-11 cursor-pointer rounded-md px-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
