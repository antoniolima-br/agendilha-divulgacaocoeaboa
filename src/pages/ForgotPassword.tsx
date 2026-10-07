import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSettings, SETTING_KEYS, settingOr } from "@/data/useAppSettings";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { validateWhatsappForAccount } from "@/lib/phone";
import { ROUTES } from "@/routes/config";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [requested, setRequested] = useState(false);
  const { data: settings, isLoading, isError, refetch } = useAppSettings();
  const contact = settingOr(settings, SETTING_KEYS.teamWhatsapp);
  const name = settingOr(settings, SETTING_KEYS.teamContactName);
  const message = `Coé! Esqueci minha senha do Coé a Boa?. Minha conta é ${identifier.trim()}. Preciso recuperar o acesso. Podemos confirmar minha identidade por aqui?`;
  const url = buildWhatsappUrl(contact, message);

  function requestRecovery(event: React.FormEvent) {
    event.preventDefault();
    const value = identifier.trim();
    const problem = value.includes("@")
      ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Confira o e-mail da sua conta.")
      : validateWhatsappForAccount(value);
    if (problem) { toast.error(problem); return; }
    if (!url) { toast.error("O contato da equipe não está disponível. Tenta de novo em instantes."); return; }
    setRequested(true);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-card p-6 shadow-elevated sm:p-8">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-black text-primary">Coé a Boa?</h1>
          <h2 className="font-bold">Esqueci minha senha</h2>
          <p className="text-sm text-muted-foreground">Fale com {name || "a equipe"} no WhatsApp. Após confirmar sua identidade, você recebe uma senha temporária.</p>
        </div>
        <form onSubmit={requestRecovery} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recover-identifier">E-mail ou WhatsApp da conta</Label>
            <Input id="recover-identifier" autoComplete="username" required value={identifier} onChange={(e) => { setIdentifier(e.target.value); setRequested(false); }} placeholder="Seu e-mail ou celular com DDD" />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !url}>
            <MessageCircle className="mr-2 h-4 w-4" /> Solicitar pelo WhatsApp
          </Button>
        </form>
        {(isError || (!isLoading && !url)) && <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>Não deu pra carregar o contato da equipe.</p>
          <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>}
        {requested && <div role="status" className="space-y-3 text-sm">
          <p>Confira a mensagem no WhatsApp e toque em enviar. Sua senha atual só muda quando a equipe liberar a provisória.</p>
          <Button variant="outline" className="w-full" onClick={async () => {
            try { await navigator.clipboard.writeText(message); toast.success("Mensagem copiada!"); }
            catch { toast.error("Não deu pra copiar. Abra o WhatsApp novamente."); }
          }}><Copy className="mr-2 h-4 w-4" /> Copiar solicitação</Button>
          {url && <Button asChild variant="outline" className="w-full"><a href={url} target="_blank" rel="noreferrer">Abrir WhatsApp novamente</a></Button>}
        </div>}
        <p className="text-xs text-muted-foreground">Ao entrar com a senha temporária, você precisa criar uma nova senha pessoal antes de continuar.</p>
        <Button asChild variant="outline" className="w-full"><Link to={ROUTES.AUTH}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login</Link></Button>
      </div>
    </div>
  );
}
