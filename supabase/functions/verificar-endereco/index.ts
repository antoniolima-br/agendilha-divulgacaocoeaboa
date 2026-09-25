import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Verificação indisponível no momento." }, 500);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Entre na sua conta pra verificar o endereço." }, 401);

    const body = await req.json().catch(() => ({}));
    const evento = {
      nome_local: s(body.locationName),
      endereco: s(body.eventAddress),
      bairro: s(body.addressNeighborhood),
      cep: s(body.locationCep, 12),
      cidade: s(body.addressCity),
      estado: s(body.addressState, 4),
    };
    let estab: Record<string, unknown> | null = null;
    if (typeof body.estabelecimentoId === "string" && body.estabelecimentoId) {
      const { data } = await admin
        .from("estabelecimentos")
        .select("nome, endereco, numero, complemento, bairro, cep")
        .eq("id", body.estabelecimentoId)
        .maybeSingle();
      estab = data;
    }

    const prompt = `Você confere endereços de eventos na Ilha do Governador (Rio de Janeiro, RJ).
Compare o endereço informado pelo organizador com o cadastro do estabelecimento vinculado (se houver).
Aponte divergências (rua diferente, bairro trocado, CEP incoerente com o bairro, número faltando, bairro misturado na rua, erros de digitação).
Responda SOMENTE com JSON, sem markdown, no formato:
{"ok": boolean, "resumo": "frase curta e simpática em português", "divergencias": [{"campo": "endereco"|"bairro"|"cep", "problema": "texto curto", "sugestao": "valor corrigido ou string vazia"}]}
Máximo 4 divergências. Não invente dados: se não tiver certeza, deixe sugestao vazia.

Evento: ${JSON.stringify(evento)}
Estabelecimento vinculado: ${estab ? JSON.stringify(estab) : "nenhum"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      console.error("gateway", res.status, t);
      const msg =
        res.status === 429 ? "Muitas verificações agora. Tenta de novo em instantes." :
        res.status === 402 ? "Os créditos de IA acabaram. Fala com a equipe." :
        "Não deu pra verificar o endereço agora.";
      return json({ error: msg }, res.status);
    }

    // Consome o SSE e junta só o texto final.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch { /* ignora */ }
      }
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "A verificação não trouxe resposta. Tenta de novo." }, 502);
    const parsed = JSON.parse(match[0]);
    const divergencias = (Array.isArray(parsed.divergencias) ? parsed.divergencias : [])
      .slice(0, 4)
      .filter((d: any) => ["endereco", "bairro", "cep"].includes(d?.campo))
      .map((d: any) => ({ campo: d.campo, problema: s(d.problema, 200), sugestao: s(d.sugestao, 200) }));
    return json({
      ok: !!parsed.ok && divergencias.length === 0,
      resumo: s(parsed.resumo, 240),
      divergencias,
      temEstabelecimento: !!estab,
    });
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error(e);
    return json({ error: "Não deu pra verificar o endereço agora." }, 500);
  }
});
