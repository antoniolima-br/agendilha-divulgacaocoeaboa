import { Suspense, lazy } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { isIntranetDirector } from "@/lib/intranet";
import { ROUTES } from "@/routes/config";

const AccessPanel = lazy(() => import("./AccessPanel"));

/** Directors-only page for partner access; kept out of BI and sector panels. Server RPCs re-check the role. */
export default function PartnerAccessPage() {
  const { roles, loading } = useAppPermissions();
  if (loading) return <p className="p-6" role="status">Carregando…</p>;
  if (!isIntranetDirector(roles ?? [])) return <Navigate to={ROUTES.INTRANET} replace />;
  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-background px-4 py-6 text-foreground sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to={ROUTES.INTRANET}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar pra gestão</Link>
      </Button>
      <h1 className="text-2xl font-semibold">Acessos dos sócios</h1>
      <Suspense fallback={<p className="py-6">Carregando acessos…</p>}><AccessPanel /></Suspense>
    </main>
  );
}
