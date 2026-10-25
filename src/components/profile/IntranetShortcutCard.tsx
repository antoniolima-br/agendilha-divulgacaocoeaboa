import { ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { canViewIntranetOverview, isIntranetDirector } from "@/lib/intranet";
import { Users } from "lucide-react";
import { ROUTES } from "@/routes/config";

/** Only partners (Sênior, Master, sector holders) see the Intranet entry; route still checks server-side roles. */
export function IntranetShortcutCard() {
  const { roles, loading } = useAppPermissions();
  if (loading || !canViewIntranetOverview(roles)) return null;
  return (
    <div className="space-y-2">
    <Button asChild size="lg" className="min-h-12 w-full font-bold">
      <Link to={ROUTES.INTRANET}>
        <Building2 className="mr-2 h-5 w-5" aria-hidden="true" />
        Acessar Gestão Setorial
        <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
    {isIntranetDirector(roles) && (
      <Button asChild variant="outline" className="min-h-11 w-full">
        <Link to={ROUTES.INTRANET_ACESSOS}><Users className="mr-2 h-4 w-4" aria-hidden="true" />Acessos dos sócios</Link>
      </Button>
    )}
    </div>
  );
}
