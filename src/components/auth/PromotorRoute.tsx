import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";
import { ROUTES } from "@/routes/config";
import { FullPageSpinner } from "./FullPageSpinner";

/**
 * Guard que só permite acesso a usuários cujo `profiles.user_type`
 * seja `promotor`/`divulgador` ou que sejam admin/master.
 * Usuários `publico` são redirecionados para a agenda pública.
 */
export function PromotorRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { loading: statusLoading, isDivulgador } = useDivulgadorStatus();

  if (authLoading || (!!user && statusLoading)) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return (
      <Navigate
         to={`${ROUTES.AUTH}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (!isDivulgador) {
    return <Navigate to={ROUTES.SEU_RADAR} replace />;
  }

  return <>{children}</>;
}