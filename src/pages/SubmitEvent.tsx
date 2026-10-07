import SubmissionForm from "@/components/SubmissionForm";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState } from "@/components/ui/LoadingState";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyEventHistory } from "@/data/useMyEventHistory";
import { repeatEventDraft } from "@/lib/eventArchive";
import { Button } from "@/components/ui/button";

/**
 * A divulgação rápida fica disponível mesmo com o perfil incompleto.
 * Quando existirem, os dados do perfil apenas agilizam o preenchimento.
 */
const SubmitEvent = () => {
  const { loaded } = useProfile();
  const { user } = useAuth();
  const location = useLocation();
  const repeatId = typeof location.state?.repeatEventId === "string" ? location.state.repeatEventId : null;
  const history = useMyEventHistory(repeatId ? user?.id : undefined);
  const original = repeatId ? history.data?.find((row) => row.id === repeatId && row.user_id === user?.id) : undefined;

  if (!loaded || (repeatId && history.isLoading)) return <LoadingState />;
  if (repeatId && !original) return <div role="alert" className="space-y-3 p-6"><p>Não deu pra recuperar seu evento. Volte aos Arquivados e tente novamente.</p><Button variant="outline" onClick={() => void history.refetch()}>Tentar novamente</Button></div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8">
        <div className="max-w-4xl mx-auto">
          <SubmissionForm key={repeatId ?? "new"} initialValues={original ? repeatEventDraft(original) : undefined} />
        </div>
      </main>
    </div>
  );
};

export default SubmitEvent;