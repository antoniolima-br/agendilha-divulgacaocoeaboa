import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrengthMeter, calculatePasswordScore } from "@/components/PasswordStrengthMeter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callEdge } from "@/lib/edge";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";

const phonePattern = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").max(255),
  phone: z.string().trim().refine((value) => !value || phonePattern.test(value), "Informe DDD + número."),
  neighborhood: z.string().trim().max(100),
  accessType: z.enum(["publico", "divulgador", "artista", "admin"]),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "As senhas não coincidem." });
  }
  if (calculatePasswordScore(data.password) < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "Use maiúscula, minúscula, número e símbolo." });
  }
});

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "neighborhood" | "accessType" | "password" | "confirmPassword", string>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMaster: boolean;
  onCreated: () => Promise<void> | void;
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  neighborhood: "",
  accessType: "publico" as const,
  password: "",
  confirmPassword: "",
};

export function CreateUserDialog({ open, onOpenChange, isMaster, onCreated }: Props) {
  const [form, setForm] = useState<{ name: string; email: string; phone: string; neighborhood: string; accessType: "publico" | "divulgador" | "artista" | "admin"; password: string; confirmPassword: string }>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  function closeDialog() {
    if (saving) return;
    setForm(initialForm);
    setErrors({});
    onOpenChange(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = createUserSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await callEdge("create-user", {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        neighborhood: parsed.data.neighborhood,
        access_type: parsed.data.accessType,
        password: parsed.data.password,
      });
      toast.success("Usuário criado com sucesso");
      await onCreated();
      setForm(initialForm);
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Não deu pra criar o usuário. Tenta de novo."));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (field: keyof FieldErrors) => errors[field] ? (
    <p className="text-xs text-destructive">{errors[field]}</p>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeDialog()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>Crie o acesso inicial e preencha os dados essenciais.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-user-name">Nome</Label>
              <Input id="new-user-name" value={form.name} maxLength={120} autoComplete="name" onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} disabled={saving} />
              {fieldError("name")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-user-email">E-mail</Label>
              <Input id="new-user-email" type="email" value={form.email} maxLength={255} autoComplete="email" onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} disabled={saving} />
              {fieldError("email")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-phone">Telefone</Label>
              <Input id="new-user-phone" value={form.phone} maxLength={16} inputMode="tel" autoComplete="tel" placeholder="(21) 99999-9999" onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} disabled={saving} />
              {fieldError("phone")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-neighborhood">Bairro</Label>
              <Input id="new-user-neighborhood" value={form.neighborhood} maxLength={100} placeholder="Ex.: Portuguesa" onChange={(e) => setForm((current) => ({ ...current, neighborhood: e.target.value }))} disabled={saving} />
              {fieldError("neighborhood")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-user-access">Tipo / Perfil inicial</Label>
              <Select value={form.accessType} onValueChange={(value: typeof form.accessType) => setForm((current) => ({ ...current, accessType: value }))} disabled={saving}>
                <SelectTrigger id="new-user-access"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="publico">Público</SelectItem>
                  <SelectItem value="divulgador">Divulgador</SelectItem>
                  <SelectItem value="artista">Artista</SelectItem>
                  {isMaster && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
              {!isMaster && <p className="text-xs text-muted-foreground">Somente Master pode criar outro administrador.</p>}
              {fieldError("accessType")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-user-password">Senha inicial</Label>
              <PasswordInput id="new-user-password" value={form.password} maxLength={72} autoComplete="new-password" onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} disabled={saving} />
              <PasswordStrengthMeter password={form.password} />
              {fieldError("password")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-user-confirm-password">Confirmar senha</Label>
              <PasswordInput id="new-user-confirm-password" value={form.confirmPassword} maxLength={72} autoComplete="new-password" onChange={(e) => setForm((current) => ({ ...current, confirmPassword: e.target.value }))} disabled={saving} />
              {fieldError("confirmPassword")}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Criar usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}