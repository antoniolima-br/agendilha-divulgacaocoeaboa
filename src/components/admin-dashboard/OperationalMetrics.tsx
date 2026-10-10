import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle, 
  Zap,
  MousePointer2
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

interface OperationalMetricsProps {
  metrics: {
    approvalRate: number;
    rejectionRate: number;
    avgModerationTime: string;
    awaitingAnalysis: number;
    eventsWithZeroFavs: number;
    newUsersInPeriod: number;
    clickThroughRate?: number;
  };
}

export function OperationalMetrics({ metrics }: OperationalMetricsProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Métricas Operacionais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            label="Taxa de Aprovação" 
            value={`${metrics.approvalRate}%`} 
            icon={CheckCircle} 
            description="Eventos aprovados vs total"
            variant="compact"
          />
          <StatCard 
            label="Taxa de Rejeição" 
            value={`${metrics.rejectionRate}%`} 
            icon={XCircle} 
            description="Eventos rejeitados vs total"
            variant="compact"
          />
          <StatCard 
            label="Tempo de Moderação" 
            value={metrics.avgModerationTime} 
            icon={Clock} 
            description="Média entre cadastro e status"
            variant="compact"
          />
          <StatCard 
            label="Aguardando Análise" 
            value={metrics.awaitingAnalysis} 
            icon={Search} 
            description="Status pending/analysis"
            variant="compact"
          />
          <StatCard 
            label="Sem Engajamento" 
            value={metrics.eventsWithZeroFavs} 
            icon={AlertCircle} 
            description="Eventos com 0 favoritos"
            variant="compact"
          />
          <StatCard 
            label="Novos Usuários" 
            value={metrics.newUsersInPeriod} 
            icon={MousePointer2} 
            description="Cadastrados no período"
            variant="compact"
          />
        </div>
      </CardContent>
    </Card>
  );
}
