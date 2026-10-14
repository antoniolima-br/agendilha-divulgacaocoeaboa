import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { LucideIcon, Shield, ShieldCheck, Crown, User } from "lucide-react";

type RoleType = "master" | "admin" | "collaborator" | "user" | "artist";

interface StatusBadgeProps {
  role: RoleType;
  className?: string;
  variant?: "outline" | "solid";
}

const config: Record<RoleType, { label: string; icon: LucideIcon; styles: string }> = {
  master: {
    label: "Admin Master",
    icon: Crown,
    styles: "border-secondary/50 text-secondary bg-secondary/10",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    styles: "border-primary/50 text-primary bg-primary/10",
  },
  collaborator: {
    label: "Divulgador",
    icon: ShieldCheck,
    styles: "border-success/30 bg-success/10 text-success",
  },
  artist: {
    label: "Músico / Banda",
    icon: User,
    styles: "border-primary/30 bg-primary/10 text-primary",
  },
  user: {
    label: "Público",
    icon: User,
    styles: "border-border bg-muted/60 text-muted-foreground",
  },
};

export function StatusBadge({ role, className, variant = "outline" }: StatusBadgeProps) {
  const { label, icon: Icon, styles } = config[role] || config.user;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-2 py-0.5 text-[10px] font-bold uppercase transition-colors",
        styles,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}
