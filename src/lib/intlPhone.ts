import { validateBrazilianMobile } from "@/lib/whatsapp";

export interface Ddi {
  code: string; // só dígitos, ex "55"
  country: string;
  flag: string;
  mask?: string; // # = dígito
  min: number;
  max: number;
}

export const DDIS: Ddi[] = [
  { code: "55", country: "Brasil", flag: "🇧🇷", mask: "(##) #####-####", min: 10, max: 11 },
  { code: "351", country: "Portugal", flag: "🇵🇹", mask: "### ### ###", min: 9, max: 9 },
  { code: "1", country: "EUA / Canadá", flag: "🇺🇸", mask: "(###) ###-####", min: 10, max: 10 },
  { code: "54", country: "Argentina", flag: "🇦🇷", min: 8, max: 11 },
  { code: "598", country: "Uruguai", flag: "🇺🇾", min: 7, max: 9 },
  { code: "595", country: "Paraguai", flag: "🇵🇾", min: 7, max: 10 },
  { code: "56", country: "Chile", flag: "🇨🇱", mask: "# #### ####", min: 9, max: 9 },
  { code: "34", country: "Espanha", flag: "🇪🇸", mask: "### ### ###", min: 9, max: 9 },
  { code: "33", country: "França", flag: "🇫🇷", mask: "# ## ## ## ##", min: 9, max: 9 },
  { code: "39", country: "Itália", flag: "🇮🇹", min: 6, max: 11 },
  { code: "44", country: "Reino Unido", flag: "🇬🇧", mask: "#### ######", min: 10, max: 10 },
  { code: "49", country: "Alemanha", flag: "🇩🇪", min: 6, max: 12 },
];

export const DEFAULT_DDI = "55";
const digits = (v: string) => (v ?? "").replace(/\D/g, "");

export const findDdi = (code: string) => DDIS.find((d) => d.code === code) ?? DDIS[0];

/** Separa um valor salvo/digitado em DDI + número nacional. Sem "+" assume Brasil. */
export function splitPhone(value: string | null | undefined): { ddi: string; national: string } {
  const raw = (value ?? "").trim();
  if (!raw) return { ddi: DEFAULT_DDI, national: "" };
  if (raw.startsWith("+")) {
    const d = digits(raw);
    const match = [...DDIS].sort((a, b) => b.code.length - a.code.length).find((x) => d.startsWith(x.code));
    if (match) return { ddi: match.code, national: d.slice(match.code.length) };
    return { ddi: d.slice(0, 3), national: d.slice(3) };
  }
  let d = digits(raw);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return { ddi: DEFAULT_DDI, national: d };
}

export function maskNational(ddi: string, national: string): string {
  const info = findDdi(ddi);
  let d = digits(national).slice(0, info.code === ddi ? info.max : 14);
  if (ddi === "55") {
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (!info.mask || info.code !== ddi) return d;
  let out = "";
  let i = 0;
  for (const ch of info.mask) {
    if (i >= d.length) break;
    if (ch === "#") out += d[i++];
    else out += ch;
  }
  return out;
}

/** Valor exibido/guardado no formulário: "+351 932 495 293". */
export function composePhone(ddi: string, national: string): string {
  const n = digits(national);
  return n ? `+${ddi} ${maskNational(ddi, n)}` : "";
}

export function toE164(value: string | null | undefined): string | null {
  const { ddi, national } = splitPhone(value);
  const n = digits(national);
  return n ? `+${ddi}${n}` : null;
}

export function validateIntlPhone(value: string | null | undefined): string | null {
  const { ddi, national } = splitPhone(value);
  const n = digits(national);
  if (!n) return "Informe o número.";
  if (ddi === "55") {
    const v = validateBrazilianMobile(n);
    return v.valid ? null : v.reason;
  }
  const info = DDIS.find((d) => d.code === ddi);
  if (info && (n.length < info.min || n.length > info.max)) {
    return `Número de ${info.country} deve ter ${info.min === info.max ? info.min : `${info.min} a ${info.max}`} dígitos.`;
  }
  if ((ddi + n).length > 15 || n.length < 6) return "Número internacional inválido.";
  return null;
}
