import { ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { canViewIntranetOverview } from "@/lib/intranet";
import { ROUTES } from "@/routes/config";

/** Only partners (Sênior, Master, sector holders) see the Intranet entry; route still checks server-side roles. */
export function IntranetShortcutCard() {
  const { roles, loading } = useAppPermissions();
  if (loading || !canViewIntranetOverview(roles)) return null;
  return (
    <Button asChild size="lg" className="min-h-12 w-full font-bold">
      <Link to={ROUTES.INTRANET}>
        <Building2 className="mr-2 h-5 w-5" aria-hidden="true" />
        Acessar Gestão Setorial
        <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}
