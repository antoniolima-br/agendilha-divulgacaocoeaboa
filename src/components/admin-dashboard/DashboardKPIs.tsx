import { useNavigate } from "react-router-dom";
import { 
  Users, 
  CalendarCheck, 
  Star, 
  Music, 
  MapPin, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Building2
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

interface DashboardKPIsProps {
  stats: {
    totalUsers: number;
    publicUsers: number;
    promoters: number;
    admins: number;
    totalEvents: number;
    pendingEvents: number;
    approvedEvents: number;
    cancelledEvents: number;
    totalFavorites: number;
    totalArtists: number;
    totalPlaces: number;
    neighborhoodsWithEvents: number;
  };
}

export function DashboardKPIs({ stats }: DashboardKPIsProps) {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <StatCard icon={Users} label="Total Usuários" value={stats.totalUsers} tone="border-primary/30 bg-primary/10 text-primary" description="Soma de todos os perfis cadastrados: Público, Divulgadores e Administradores." onClick={() => navigate("/admin/users")} />
      <StatCard icon={Users} label="Público" value={stats.publicUsers} tone="border-border bg-muted text-foreground" description="Usuários que utilizam a agenda para busca e salvamento de favoritos." onClick={() => navigate("/admin/users?type=usuario")} />
      <StatCard icon={Users} label="Divulgadores" value={stats.promoters} tone="border-primary/30 bg-primary/10 text-primary" description="Produtores e estabelecimentos com permissão para publicar eventos." onClick={() => navigate("/admin/users?type=divulgador")} />
      <StatCard icon={Shield} label="Admins" value={stats.admins} tone="border-border bg-muted text-foreground" description="Corpo administrativo com acesso total às ferramentas de gestão." onClick={() => navigate("/admin/users?role=admin")} />
      <StatCard icon={CalendarCheck} label="Total Eventos" value={stats.totalEvents} tone="text-primary bg-primary/10 border-primary/20" description="Volume total de submissões recebidas pela plataforma desde o início." onClick={() => navigate("/admin/events")} />
      <StatCard icon={Clock} label="Pendentes" value={stats.pendingEvents} tone="border-warning/40 bg-warning/10 text-warning" description="Eventos aguardando análise da curadoria para publicação ou ajuste." onClick={() => navigate("/admin/events?status=pending")} />
      <StatCard icon={CheckCircle} label="Aprovados" value={stats.approvedEvents} tone="border-success/40 bg-success/10 text-success" description="Eventos validados e visíveis para o público na agenda cultural." onClick={() => navigate("/admin/events?status=approved")} />
      <StatCard icon={XCircle} label="Cancelados" value={stats.cancelledEvents} tone="border-destructive/40 bg-destructive/10 text-destructive" description="Eventos que foram rejeitados pela curadoria ou cancelados pelo autor." onClick={() => navigate("/admin/events?status=cancelled")} />
      <StatCard icon={Star} label="Favoritos" value={stats.totalFavorites} tone="border-primary/30 bg-primary/10 text-primary" description="Total de marcações de interesse realizadas pelos usuários nos eventos." />
      <StatCard icon={Music} label="Artistas" value={stats.totalArtists} tone="border-border bg-muted text-foreground" description="Base de músicos, bandas e artistas locais cadastrados como atrativos." onClick={() => navigate("/admin/artists")} />
      <StatCard icon={Building2} label="Estabelecimentos" value={stats.totalPlaces} tone="border-primary/30 bg-primary/10 text-primary" description="Casas de show, bares e locais físicos parceiros da Coé a Boa?." onClick={() => navigate("/admin/estabelecimentos")} />
      <StatCard icon={MapPin} label="Bairros Ativos" value={stats.neighborhoodsWithEvents} tone="border-border bg-muted text-foreground" description="Número de bairros diferentes que possuem ao menos um evento ativo." />
    </div>
  );
}
