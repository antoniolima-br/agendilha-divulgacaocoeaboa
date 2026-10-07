// Shared helpers for temporary password flows

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz!@#$%";

export function generateTempPassword(length = 16): string {
  const size = Math.max(length, 16);
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < size) {
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    for (const byte of bytes) {
      if (byte < limit && out.length < size) out += ALPHABET[byte % ALPHABET.length];
    }
  }
  return /[A-Z]/.test(out) && /[a-z]/.test(out) && /\d/.test(out) && /[!@#$%]/.test(out)
    ? out : generateTempPassword(size);
}

export function normalizePhone(phone: string): string {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  return `55${digits}`;
}

export function isValidBrazilianMobile(phone: string): boolean {
  const d = normalizePhone(phone).slice(2);
  return /^[1-9]\d9\d{8}$/.test(d) && !/^(\d)\1+$/.test(d);
}

export interface BuildMessageInput {
  tempPassword: string;
  recipientName?: string | null;
  customNote?: string | null;
  loginUrl?: string;
}

export function buildTempPasswordMessage({
  tempPassword,
  recipientName,
  customNote,
  loginUrl = "https://coeaboa.online/auth",
}: BuildMessageInput): string {
  const name = (recipientName ?? "").trim().split(" ")[0];
  const greeting = name ? `Olá, ${name}! 👋` : "Olá! 👋";
  const extra = customNote?.trim() ? `\n\n📝 ${customNote.trim()}` : "";
  return (
    `🔐 *Coé a Boa? — Senha temporária*\n\n` +
    `${greeting}\n\n` +
    `Sua nova senha de acesso é: *${tempPassword}*\n\n` +
    `👉 Acesse: ${loginUrl}\n` +
    `Por segurança, você precisará trocar esta senha logo após entrar.${extra}\n\n` +
    `Se você não solicitou esta redefinição, ignore esta mensagem.`
  );
}

export function buildWhatsappUrl(
  phone: string,
  tempPassword: string,
  opts: { recipientName?: string | null; customNote?: string | null } = {},
): string | null {
  if (!isValidBrazilianMobile(phone)) return null;
  const normalized = normalizePhone(phone);
  const message = buildTempPasswordMessage({ tempPassword, ...opts });
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}