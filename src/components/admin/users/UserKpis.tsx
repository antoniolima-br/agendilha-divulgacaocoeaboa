import { Users, User, UserCheck, Music, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";

export interface UserKpisData {
  total: number;
  publico: number;
  divulgadores: number;
  artistas: number;
  admins: number;
  semBairro: number;
}

export function UserKpis({ kpis }: { kpis: UserKpisData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <StatCard icon={Users} label="Total" value={kpis.total} variant="minimal" />
      <StatCard icon={User} label="Público" value={kpis.publico} tone="text-blue-700" variant="minimal" className="border-blue-500/30 bg-blue-500/5" />
      <StatCard icon={UserCheck} label="Divulgadores" value={kpis.divulgadores} tone="text-emerald-700" variant="minimal" className="border-emerald-500/30 bg-emerald-500/5" />
      <StatCard icon={Music} label="Artistas" value={kpis.artistas} tone="text-purple-700" variant="minimal" className="border-purple-500/30 bg-purple-500/5" />
      <StatCard 
        icon={ShieldAlert} 
        label="Sem bairro" 
        value={kpis.semBairro} 
        tone="text-amber-700" 
        variant="minimal" 
        className={cn(
          "col-span-2 sm:col-span-1 border-amber-500/30 bg-amber-500/5",
          kpis.semBairro > 0 && "ring-1 ring-amber-500/40"
        )} 
      />
    </div>
  );
}
