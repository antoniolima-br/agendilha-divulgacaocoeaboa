// Utilities to validate Brazilian WhatsApp numbers and build wa.me links.
import { onlyDigits, maskBrPhone as formatPhoneDisplay } from "./phone";

export { onlyDigits, formatPhoneDisplay };

// Lista oficial de DDDs brasileiros válidos (ANATEL).
const VALID_BR_DDDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function normalizePhone(phone: string): string {
  const d = onlyDigits(phone);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export type PhoneValidation =
  | { valid: true; e164: string; display: string }
  | { valid: false; reason: string };

export function validateBrazilianMobile(
  phone: string | null | undefined, 
  strict: boolean = true
): PhoneValidation {
  const rawInput = (phone ?? "").trim();
  let d = onlyDigits(rawInput);
  
  if (!d) return { valid: false, reason: "Informe o número do WhatsApp." };
  
  if (d.startsWith("0055")) d = d.slice(4);
  else if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);

  if (strict) {
    if (d.length !== 10 && d.length !== 11) {
      return { valid: false, reason: "O número deve ter DDD + número (10 ou 11 dígitos)." };
    }
    const ddd = parseInt(d.slice(0, 2), 10);
    if (!VALID_BR_DDDS.has(ddd)) {
      return { valid: false, reason: "Esse DDD não é válido no Brasil." };
    }
    if (d.length === 11 && d[2] !== "9") {
      return { valid: false, reason: "Celulares brasileiros devem começar com 9 após o DDD." };
    }
  } else {
    if (d.length < 10) {
      return { valid: false, reason: "Número incompleto. Informe DDD + Número." };
    }
    if (d.length > 11) {
      return { valid: false, reason: "Número muito longo. Use o formato (DD) 9XXXX-XXXX." };
    }
  }

  if (/^(\d)\1+$/.test(d)) {
    return { valid: false, reason: "O número não pode ter todos os dígitos iguais." };
  }

  const formatted = formatPhoneDisplay(d);

  return {
    valid: true,
    e164: `55${d}`,
    display: formatted,
  };
}

export function isValidBrazilianMobile(phone: string): boolean {
  return validateBrazilianMobile(phone).valid;
}

export interface TempPasswordMessageInput {
  recipientName?: string | null;
  tempPassword: string;
  loginUrl?: string;
  customNote?: string | null;
}

export function buildTempPasswordMessage({
  recipientName,
  tempPassword,
  loginUrl = "https://coeaboa.online/auth",
  customNote,
}: TempPasswordMessageInput): string {
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

export function buildWhatsappUrl(phone: string, message: string): string | null {
  const v = validateBrazilianMobile(phone);
  if (!v.valid) return null;
  return `https://wa.me/${v.e164}?text=${encodeURIComponent(message)}`;
}

export interface EventSubmissionConfirmationInput {
  responsibleName?: string | null;
  eventTitle?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
}

export function buildEventSubmissionConfirmation({
  responsibleName,
  eventTitle,
  date,
  startTime,
  endTime,
  location,
}: EventSubmissionConfirmationInput): string {
  const firstName = responsibleName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Coé, ${firstName}!` : "Coé!";
  const dateLabel = date
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(`${date.slice(0, 10)}T12:00:00Z`))
    : "Data a confirmar";
  const timeLabel = startTime
    ? `${startTime.slice(0, 5)}${endTime ? ` às ${endTime.slice(0, 5)}` : ""}`
    : "Horário a confirmar";
  return [
    `${greeting} Seu evento foi enviado para a curadoria do Coé a Boa? ✅`,
    "",
    `🎫 *${eventTitle?.trim() || "Evento"}*`,
    `🗓️ ${dateLabel}`,
    `🕒 ${timeLabel}`,
    `📍 ${location?.trim() || "Local a confirmar"}`,
    "",
    "Confirmo que essas informações estão corretas.",
  ].join("\n");
}

export function renderTemplate(body: string, vars: Record<string, string | null | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

export const TEMPLATE_VARIABLES = [
  { key: "nome", desc: "Primeiro nome do responsável" },
  { key: "titulo", desc: "Título do evento" },
  { key: "data", desc: "Data do evento (DD/MM/AAAA)" },
  { key: "hora", desc: "Horário de início" },
  { key: "local", desc: "Local / endereço resumido" },
  { key: "url", desc: "URL pública do evento" },
  { key: "motivo", desc: "Motivo da rejeição (apenas no template de rejeição)" },
  { key: "meus_eventos_url", desc: "Link para /meus-eventos do divulgador" },
] as const;
