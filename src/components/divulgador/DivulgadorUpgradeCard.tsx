import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clock3, KeyRound, Loader2, LockKeyhole, Megaphone, MessageCircleWarning, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";
import { useCreateDivulgadorRequest } from "@/data/useDivulgadorRequest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskBrPhone, validateWhatsappForAccount } from "@/lib/phone";
import { BAIRROS } from "@/lib/neighborhoods";

const TYPES = ["Produtor(a) de eventos", "Espaço cultural", "Artista/Banda", "Coletivo", "Outro"];

export function DivulgadorUpgradeCard() {
  const { user } = useAuth();
  const { loading, isDivulgador, profile, request } = useDivulgadorStatus();
  const createRequest = useCreateDivulgadorRequest();
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [social, setSocial] = useState("");
  const [about, setAbout] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName((value) => value || profile.responsible_name || "");
    setPhone((value) => value || maskBrPhone(profile.whatsapp_phone || profile.phone || ""));
  }, [profile]);

  const state = useMemo(() => {
    if (request?.status === "pendente" && request.verification_status !== "confirmado") return "verification";
    if (request?.status === "pendente") return "review";
    if (request?.status === "recusado") return "rejected";
    return "start";
  }, [request]);

  if (!user || loading || isDivulgador) return null;

  const validateDetails = () => {
    if (name.trim().length < 2) return "Conta pra gente como você quer ser chamado.";
    const phoneProblem = validateWhatsappForAccount(phone);
    if (phoneProblem) return phoneProblem;
    if (!type) return "Escolha como você atua.";
    if (!neighborhood) return "Escolha seu bairro de atuação.";
    if (about.trim().length < 10) return "Conta rapidinho o que você pretende divulgar.";
    return null;
  };

  const submit = async () => {
    const detailsProblem = validateDetails();
    if (detailsProblem) return toast.error("Falta só um detalhe", { description: detailsProblem });
    if (password.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return toast.error("As senhas não estão iguais.");

    try {
      await createRequest.mutateAsync({
        userId: user.id,
        nome: name.trim(),
        whatsapp: phone.replace(/\D/g, ""),
        tipo_divulgador: type,
        motivo: about.trim(),
        neighborhood,
        social_profile: social.trim() || null,
      });
      setStep(3);
      toast.success("Dados salvos. Falta confirmar seu WhatsApp.");
    } catch {
      return;
    }
  };

  if (state === "verification" || step === 3) {
    return (
      <Card className="border-primary/30 bg-primary/5" data-testid="divulgador-verification-pending">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary"><MessageCircleWarning className="h-5 w-5" /></div>
          <CardTitle>Confirmação pelo WhatsApp</CardTitle>
          <CardDescription>Seus dados foram salvos. A liberação só acontece depois de confirmar sua identidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-background/70 p-4 text-sm text-muted-foreground">
            O envio do código ainda não está conectado. Por segurança, nenhum código é criado ou mostrado aqui e seu acesso continua bloqueado.
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <LockKeyhole className="h-4 w-4 text-primary" /> Aguardando ativação do envio oficial
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "review") {
    return <Card className="border-primary/30"><CardContent className="flex gap-3 p-5"><Clock3 className="h-5 w-5 shrink-0 text-primary" /><div><h3 className="font-bold">Cadastro em análise</h3><p className="mt-1 text-sm text-muted-foreground">Identidade confirmada. Agora a curadoria confere seus dados antes de liberar os envios.</p></div></CardContent></Card>;
  }

  return (
    <Card className="border-primary/25 bg-card">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary"><Megaphone className="h-5 w-5" /></div>
          <div>
            <CardTitle>Quero ser um Divulgador</CardTitle>
            <CardDescription className="mt-1">Complete seus dados, crie uma senha e confirme seu WhatsApp antes da liberação.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="grid grid-cols-3 gap-2" aria-label="Etapas do cadastro de divulgador">
          {[{ n: 1, label: "Dados", Icon: UserRoundCheck }, { n: 2, label: "Senha", Icon: KeyRound }, { n: 3, label: "Confirmar", Icon: MessageCircleWarning }].map(({ n, label, Icon }) => (
            <li key={n} className={`flex min-w-0 flex-col items-center gap-1 rounded-md border px-2 py-2 text-center text-xs ${step >= n ? "border-primary/45 bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
              {step > n ? <Check className="h-4 w-4 text-primary" /> : <Icon className="h-4 w-4" />}
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ol>

        {!expanded ? (
          <Button className="min-h-12 w-full sm:w-auto" onClick={() => setExpanded(true)}>Começar meu cadastro</Button>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="upgrade-name">Nome ou nome do projeto</Label><Input id="upgrade-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="upgrade-phone">WhatsApp</Label><Input id="upgrade-phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(maskBrPhone(event.target.value))} maxLength={15} /></div>
            <div className="space-y-2"><Label>Como você atua?</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Escolha uma opção" /></SelectTrigger><SelectContent>{TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Bairro de atuação</Label><Select value={neighborhood} onValueChange={setNeighborhood}><SelectTrigger><SelectValue placeholder="Escolha o bairro" /></SelectTrigger><SelectContent>{BAIRROS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="upgrade-social">Rede social <span className="text-muted-foreground">(opcional)</span></Label><Input id="upgrade-social" value={social} onChange={(event) => setSocial(event.target.value)} maxLength={300} placeholder="@perfil ou link" /></div>
            <div className="space-y-2"><Label htmlFor="upgrade-about">O que você quer divulgar?</Label><Textarea id="upgrade-about" value={about} onChange={(event) => setAbout(event.target.value)} maxLength={500} rows={3} /></div>
            {state === "rejected" && <p className="text-sm text-destructive">Você pode corrigir os dados e enviar uma nova solicitação.</p>}
            <Button className="min-h-12 w-full" onClick={() => { const problem = validateDetails(); if (problem) toast.error("Falta só um detalhe", { description: problem }); else setStep(2); }}>Continuar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">Essa senha será usada junto com seu WhatsApp para entrar no portal do divulgador.</div>
            <div className="space-y-2"><Label htmlFor="upgrade-password">Crie uma senha</Label><PasswordInput id="upgrade-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} autoComplete="new-password" /></div>
            <div className="space-y-2"><Label htmlFor="upgrade-password-confirm">Repita a senha</Label><PasswordInput id="upgrade-password-confirm" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} autoComplete="new-password" /></div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" className="min-h-12 sm:flex-1" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="min-h-12 sm:flex-1" onClick={() => void submit()} disabled={createRequest.isPending}>{createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" />Salvar e confirmar</>}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}