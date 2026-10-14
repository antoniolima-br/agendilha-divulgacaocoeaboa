import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (v: unknown, max = 300): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s ? s : null;
};

const normalizePhone = (raw: unknown): string | null => {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  if (local.length !== 10 && local.length !== 11) return null;
  return `55${local}`;
};

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const baseSchema = z.object({
  kind: z.enum(["atrativo", "estabelecimento"]),
  whatsapp: optionalText(20),
  responsavelNome: optionalText(120),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  social: optionalText(300),
}).strict();

const atrativoSchema = baseSchema.extend({
  kind: z.literal("atrativo"),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  categoryOther: optionalText(80),
  style: optionalText(120),
  description: optionalText(500),
  cidade: optionalText(120),
});

const estabelecimentoSchema = baseSchema.extend({
  kind: z.literal("estabelecimento"),
  nome: z.string().trim().min(1).max(120),
  endereco: z.string().trim().min(1).max(200),
  tipo: optionalText(80),
  numero: optionalText(20),
  complemento: optionalText(80),
  bairro: optionalText(120),
  cep: optionalText(12),
  observacoes: optionalText(500),
});

const payloadSchema = z.discriminatedUnion("kind", [atrativoSchema, estabelecimentoSchema]);

async function requestFingerprint(req: Request): Promise<string> {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent")?.slice(0, 160) ?? "unknown";
  const bytes = new TextEncoder().encode(`${ip}|${ua}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Cadastro público por link (sem login):
 *  - kind = "atrativo": artistas, bandas, DJs e demais atrativos
 *  - kind = "estabelecimento": bares, restaurantes, casas de evento
 *
 * Tudo entra como NÃO aprovado, para curadoria do administrador.
 * O usuário externo só envia: não lê nem edita nada depois.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
    const parsed = payloadSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: "Dados inválidos." }, 400);
    }
    const body = parsed.data;
    const kind = body.kind;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const fingerprint = await requestFingerprint(req);
    const { data: allowed, error: limitError } = await admin.rpc("consume_public_submission_quota", {
      p_fingerprint: fingerprint,
    });
    if (limitError) {
      console.error("[cadastro-publico] quota unavailable", limitError.code);
      return json({ error: "Não deu pra concluir agora. Tenta de novo em instantes." }, 503);
    }
    if (!allowed) return json({ error: "Muitos envios em pouco tempo. Aguarde alguns minutos e tente novamente." }, 429);

    if (kind === "atrativo") {
      const name = clean(body.name, 120);
      const category = clean(body.category, 80);
      const whatsapp = normalizePhone(body.whatsapp);
      if (!name) return json({ error: "Informe o nome do atrativo." }, 400);
      if (!category) return json({ error: "Escolha a categoria do atrativo." }, 400);
      if (body.whatsapp && !whatsapp) {
        return json({ error: "Confira o WhatsApp informado ou deixe o campo vazio." }, 400);
      }

      const categoryOther = clean(body.categoryOther, 80);
      const finalCategory = category === "Outros" && categoryOther ? categoryOther : category;

      const { data, error } = await admin
        .from("atrativos")
        .insert({
          name,
          type: finalCategory,
          tipo_atrativo: finalCategory,
          category_other: category === "Outros" ? categoryOther : null,
          style: clean(body.style, 120),
          description: clean(body.description, 500),
          contact_whatsapp: whatsapp,
          contact_info: whatsapp,
          responsavel_nome: clean(body.responsavelNome, 120),
          responsavel_telefone: whatsapp,
          responsavel_email: clean(body.email, 255),
          responsavel_redes: clean(body.social, 300),
          cidade_regiao: clean(body.cidade, 120),
          pais: "Brasil",
          is_approved: false,
        })
        .select("id")
        .maybeSingle();

      if (error) {
        const msg = /bar|restaurante/i.test(error.message)
          ? "Bares e restaurantes devem usar o formulário de estabelecimentos."
          : "Não deu pra concluir o cadastro. Confira os dados e tente de novo.";
        console.error("[cadastro-publico] atrativo", error.message);
        return json({ error: msg }, 400);
      }
      return json({ ok: true, id: data?.id ?? null });
    }

    if (kind === "estabelecimento") {
      const nome = clean(body.nome, 120);
      const whatsapp = normalizePhone(body.whatsapp);
      const endereco = clean(body.endereco, 200);
      if (!nome) return json({ error: "Informe o nome do estabelecimento." }, 400);
      if (body.whatsapp && !whatsapp) {
        return json({ error: "Confira o WhatsApp informado ou deixe o campo vazio." }, 400);
      }
      if (!endereco) return json({ error: "Informe o endereço." }, 400);

      const tipo = clean(body.tipo, 80);
      const { data, error } = await admin
        .from("estabelecimentos")
        .insert({
          nome,
          tipo,
          tipos: tipo ? [tipo] : [],
          endereco,
          numero: clean(body.numero, 20),
          complemento: clean(body.complemento, 80),
          bairro: clean(body.bairro, 120),
          cep: clean(body.cep, 12),
          contato: whatsapp,
          responsavel_nome: clean(body.responsavelNome, 120),
          responsavel_telefone: whatsapp,
          responsavel_email: clean(body.email, 255),
          responsavel_redes: clean(body.social, 300),
          anotacoes: clean(body.observacoes, 500),
          is_approved: false,
        })
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("[cadastro-publico] estabelecimento", error.message);
        return json({ error: "Não deu pra concluir o cadastro. Confira os dados e tente de novo." }, 400);
      }
      return json({ ok: true, id: data?.id ?? null });
    }

    return json({ error: "Tipo de cadastro não reconhecido." }, 400);
  } catch (e) {
    console.error("[cadastro-publico] erro inesperado", e);
    return json({ error: "Erro inesperado. Tenta de novo em instantes." }, 500);
  }
});
