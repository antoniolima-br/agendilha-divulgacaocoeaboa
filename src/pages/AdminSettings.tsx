import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, RotateCcw, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { handleError } from "@/lib/error-handler";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  useAppSettings,
  useSaveAppSettings,
} from "@/data/useAppSettings";
import { useAdminUsers } from "@/data/useAdminUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneDisplay, isValidBrazilianMobile, buildWhatsappUrl } from "@/lib/whatsapp";

const KEYS = [SETTING_KEYS.teamWhatsapp, SETTING_KEYS.teamContactName] as const;
const digits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

type Form = Record<string, string>;

export default function AdminSettings() {
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const { data: settings, isLoading } = useAppSettings();
  const save = useSaveAppSettings();
  const [form, setForm] = useState<Form>({ ...DEFAULT_SETTINGS });

  const canManage = hasPermission("events.read");
  const { data: users } = useAdminUsers(canManage);
  const atendentes = (users ?? []).filter((u) => (u.is_admin || u.is_master) && digits(u.phone).length >= 10);

  useEffect(() => {
    if (settings) {
      const next: Form = {};
      KEYS.forEach((k) => (next[k] = settings[k] ?? DEFAULT_SETTINGS[k]));
      setForm(next);
    }
  }, [settings]);

  const dirty = KEYS.some((k) => (form[k] ?? "") !== (settings?.[k] ?? DEFAULT_SETTINGS[k]));

  const whatsapp = form[SETTING_KEYS.teamWhatsapp] ?? "";
  const contactName = form[SETTING_KEYS.teamContactName] ?? "";
  const matched = atendentes.find((u) => digits(u.phone) === digits(whatsapp) && digits(whatsapp));
  const selectedId = matched?.id ?? "";
  function pickAtendente(id: string) {
    const u = atendentes.find((a) => a.id === id);
    if (!u) return;
    setForm((p) => ({ ...p, [SETTING_KEYS.teamWhatsapp]: formatPhoneDisplay(digits(u.phone)), [SETTING_KEYS.teamContactName]: u.responsible_name || u.email }));
  }
  function typeNumber(value: string) {
    const formatted = formatPhoneDisplay(value);
    const hit = atendentes.find((u) => digits(u.phone) === digits(formatted) && digits(formatted));
    setForm((p) => ({ ...p, [SETTING_KEYS.teamWhatsapp]: formatted, ...(hit ? { [SETTING_KEYS.teamContactName]: hit.responsible_name || hit.email } : {}) }));
  }
  const whatsappOk = whatsapp.trim() === "" || isValidBrazilianMobile(whatsapp);
  const previewUrl = whatsappOk && whatsapp.trim()
    ? buildWhatsappUrl(whatsapp, "Oi! Quero contratar um destaque.")
    : null;

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function salvar() {
    if (!whatsappOk) {
      toast.error("Confere o WhatsApp da equipe: precisa ter DDD e número completo.");
      return;
    }
    try {
      const payload: Form = {};
      KEYS.forEach((k) => (payload[k] = (form[k] ?? "").trim()));
      await save.mutateAsync(payload);
      toast.success("Configurações salvas.");
    } catch (e) {
      handleError(e, "Não deu pra salvar as configurações");
    }
  }

  if (permsLoading || isLoading) return <LoadingState message="Carregando configurações…" />;
  if (!canManage) return <Navigate to="/" replace />;

  return (
    <PageContainer maxWidth="4xl">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Settings2 className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Backoffice</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase">Configurações</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Gerencie o número oficial da equipe.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            WhatsApp oficial da equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">Responsável pelo atendimento</Label>
            <Select value={selectedId} onValueChange={pickAtendente}>
              <SelectTrigger className="h-11"><SelectValue placeholder={atendentes.length ? "Escolha um administrador" : "Nenhum admin com WhatsApp no perfil"} /></SelectTrigger>
              <SelectContent>
                {atendentes.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.responsible_name || u.email} · {formatPhoneDisplay(digits(u.phone))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Escolha alguém e o WhatsApp é preenchido sozinho. Ou digite o número abaixo.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-contact-name" className="text-xs font-bold uppercase tracking-wide">Nome que aparece pro cliente</Label>
            <Input id="team-contact-name" placeholder="Ex.: Ana, do comercial" value={contactName} onChange={(e) => set(SETTING_KEYS.teamContactName, e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-whatsapp" className="text-xs font-bold uppercase tracking-wide">
              Número que recebe as contratações de destaque
            </Label>
            <Input
              id="team-whatsapp"
              inputMode="numeric"
              placeholder="(21) 99999-9999"
              value={whatsapp}
              onChange={(e) => typeNumber(e.target.value)}
              aria-invalid={!whatsappOk}
              className={!whatsappOk ? "border-destructive" : ""}
            />
            {!whatsappOk ? (
              <p className="text-xs text-destructive font-medium">
                Número incompleto. Use DDD + número, ex.: (21) 99999-9999.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Todo botão de destaque abre uma conversa com esse número. Deixe vazio para a pessoa
                escolher o contato.
              </p>
            )}
            {matched && whatsappOk && (
              <p className="text-xs font-semibold text-primary">Esse número é de {matched.responsible_name || matched.email}.</p>
            )}
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-700 underline break-all"
              >
                Testar conversa
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={!dirty}
          onClick={() => {
            const next: Form = {};
            KEYS.forEach((k) => (next[k] = settings?.[k] ?? DEFAULT_SETTINGS[k]));
            setForm(next);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Desfazer
        </Button>
        <Button onClick={salvar} disabled={!dirty || save.isPending} className="font-bold">
          {save.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar configurações
        </Button>
      </div>
    </PageContainer>
  );
}
