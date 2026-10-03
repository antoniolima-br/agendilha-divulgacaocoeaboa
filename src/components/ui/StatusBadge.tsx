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
    styles: "border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  artist: {
    label: "Músico / Banda",
    icon: User,
    styles: "border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  },
  user: {
    label: "Público",
    icon: User,
    styles: "border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800/40 dark:text-slate-400",
  },
};

export function StatusBadge({ role, className, variant = "outline" }: StatusBadgeProps) {
  const { label, icon: Icon, styles } = config[role] || config.user;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest gap-1 py-0.5 px-2 rounded-full transition-colors",
        styles,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}
