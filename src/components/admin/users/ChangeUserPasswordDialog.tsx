import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrengthMeter, calculatePasswordScore } from "@/components/PasswordStrengthMeter";
import { callEdge } from "@/lib/edge";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import type { UserWithRole } from "./types";

const passwordSchema = z.object({
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
  confirmation: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmation) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmation"], message: "As senhas não coincidem." });
  }
  if (calculatePasswordScore(data.password) < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "Use maiúscula, minúscula, número e símbolo." });
  }
});

interface Props {
  user: UserWithRole | null;
  onOpenChange: (user: UserWithRole | null) => void;
}

export function ChangeUserPasswordDialog({ user, onOpenChange }: Props) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [requireChange, setRequireChange] = useState(true);
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setPassword("");
      setConfirmation("");
      setRequireChange(true);
      setErrors({});
    }
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const parsed = passwordSchema.safeParse({ password, confirmation });
    if (!parsed.success) {
      const nextErrors: { password?: string; confirmation?: string } = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "password" && !nextErrors.password) nextErrors.password = issue.message;
        if (field === "confirmation" && !nextErrors.confirmation) nextErrors.confirmation = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await callEdge("admin-set-password", {
        user_id: user.id,
        new_password: parsed.data.password,
        require_change: requireChange,
      });
      toast.success("Senha alterada com sucesso");
      onOpenChange(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Não deu pra alterar a senha. Tenta de novo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && !saving && onOpenChange(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Alterar senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para {user?.responsible_name || user?.email}. A senha atual deixará de funcionar.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="admin-new-password">Nova senha</Label>
            <PasswordInput id="admin-new-password" value={password} maxLength={72} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} disabled={saving} />
            <PasswordStrengthMeter password={password} />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirmar nova senha</Label>
            <PasswordInput id="admin-confirm-password" value={confirmation} maxLength={72} autoComplete="new-password" onChange={(e) => setConfirmation(e.target.value)} disabled={saving} />
            {errors.confirmation && <p className="text-xs text-destructive">{errors.confirmation}</p>}
          </div>
          <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3">
            <Checkbox id="require-password-change" checked={requireChange} onCheckedChange={(checked) => setRequireChange(checked === true)} disabled={saving} />
            <Label htmlFor="require-password-change" className="cursor-pointer leading-5">Exigir que o usuário troque a senha no próximo acesso</Label>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(null)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Salvar nova senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}