import SubmissionForm from "@/components/SubmissionForm";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * A divulgação rápida fica disponível mesmo com o perfil incompleto.
 * Quando existirem, os dados do perfil apenas agilizam o preenchimento.
 */
const SubmitEvent = () => {
  const { loaded } = useProfile();

  if (!loaded) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8">
        <div className="max-w-4xl mx-auto">
          <SubmissionForm />
        </div>
      </main>
    </div>
  );
};

export default SubmitEvent;