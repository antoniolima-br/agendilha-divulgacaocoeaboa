import { Navigate } from "react-router-dom";
import { Check, Megaphone } from "lucide-react";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { formatDurationDays, formatPriceBRL, useAdPlans } from "@/data/useAdPlans";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdPlansCatalog() {
  const { canSubmit, loading: permissionsLoading } = useAppPermissions();
  const { data: plans = [], isLoading } = useAdPlans();

  if (permissionsLoading || isLoading) return <LoadingState message="Carregando planos e valores…" />;
  if (!canSubmit) return <Navigate to="/agenda" replace />;

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold sm:text-3xl">Planos e valores</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Consulte as opções disponíveis para ampliar a divulgação do seu evento.
        </p>
      </header>

      {plans.length === 0 ? (
        <p className="border-y border-border py-8 text-sm text-muted-foreground">
          Nenhum plano disponível agora. Confira novamente em breve.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-2xl font-bold text-primary">{formatPriceBRL(plan.price_cents)}</p>
                <p className="text-sm text-muted-foreground">por {formatDurationDays(plan.duration_days)}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                {plan.benefits.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}