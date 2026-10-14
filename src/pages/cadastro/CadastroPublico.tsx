import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WizardShell } from "@/components/registration/WizardShell";
import { FormField } from "@/components/registration/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { maskBrPhone, validateWhatsappForAccount } from "@/lib/phone";
import { handleError } from "@/lib/error-handler";
import { ROUTES } from "@/routes/config";

export default function CadastroPublico() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [aceita, setAceita] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 2) e.nome = "Informe seu nome.";
    const phoneProblem = validateWhatsappForAccount(whatsapp);
    if (phoneProblem) e.whatsapp = phoneProblem;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signUp(whatsapp, crypto.randomUUID(), nome.trim(), {
        profile: {
          user_type: "publico",
          whatsapp_phone: whatsapp,
          push_notifications_enabled: aceita,
          onboarding_completed: true,
        },
      }, "publico");
      if (error) throw error;
      navigate(ROUTES.PERFIL, { replace: true });
    } catch (err) {
      handleError(err, "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell
      title="Seu perfil começa por aqui"
      subtitle="Só o essencial. Você completa o resto quando quiser."
      step={1}
      totalSteps={1}
      onBack={() => navigate(ROUTES.PERFIL)}
      onNext={handleSubmit}
      loading={loading}
      isLast
      nextLabel="Criar minha conta"
    >
      <FormField id="nome" label="Seu nome" value={nome} onChange={setNome} placeholder="Como você quer ser chamado" autoComplete="name" required error={errors.nome} />
      <FormField id="whatsapp" label="WhatsApp" value={whatsapp} onChange={(value) => setWhatsapp(maskBrPhone(value))} placeholder="(21) 99999-9999" inputMode="tel" autoComplete="tel" maxLength={15} required error={errors.whatsapp} />
      <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
        <Checkbox id="aceita" checked={aceita} onCheckedChange={(value) => setAceita(value === true)} className="mt-0.5" />
        <Label htmlFor="aceita" className="cursor-pointer text-sm font-medium leading-relaxed">Autorizo receber novidades e sugestões de rolês pelo WhatsApp.</Label>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Você pode mudar essa autorização depois no seu perfil.</p>
    </WizardShell>
  );
}