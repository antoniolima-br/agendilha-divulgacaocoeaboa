import { Check } from "lucide-react";
import { passwordSchema } from "@/schemas/auth";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const valid = passwordSchema.safeParse(password).success;
  return <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
    {valid && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
    {valid ? "Senha com tamanho válido." : "Use de 6 a 72 caracteres."}
  </p>;
}
