import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "npm:ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "../_shared/run-id.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

function saoPauloToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "O Guia tá fora do ar agora. Tenta daqui a pouco." }, 500);

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? (body.messages as UIMessage[]).slice(-30) : [];
    if (messages.length === 0) return json({ error: "Manda uma mensagem pra começar." }, 400);

    const today = saoPauloToday();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: events } = await sb
      .from("public_submissions")
      .select("event_title, date, start_time, end_time, location, address_neighborhood, category, description, slug, id, is_highlight")
      .in("status", ["aprovado", "publicado", "divulgado"])
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(60);

    const { data: settings } = await sb.from("app_settings").select("key, value").in("key", ["team_whatsapp", "team_contact_name", "live_overrides"]);
    const setting = (k: string) => String((settings ?? []).find((r: any) => r.key === k)?.value ?? "").trim();
    let overrides: Record<string, boolean> = {};
    try { overrides = JSON.parse(setting("live_overrides") || "{}"); } catch { /* */ }
    const nowHM = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    const isLive = (e: any) => {
      if (e.id in overrides) return !!overrides[e.id];
      if (String(e.date ?? "").slice(0, 10) !== today || !e.start_time) return false;
      const s = String(e.start_time).slice(0, 5), en = String(e.end_time || "23:59").slice(0, 5);
      return en > s ? nowHM >= s && nowHM <= en : nowHM >= s || nowHM <= en;
    };

    const agenda = (events ?? [])
      .map((e: any) =>
        `- ${isLive(e) ? "🔴 ROLANDO AGORA | " : ""}${e.is_highlight ? "⭐ DESTAQUE | " : ""}${e.event_title ?? "Rolê sem título"} | ${String(e.date ?? "").slice(0, 10)} ${e.start_time ?? ""} | ${e.location ?? ""}${e.address_neighborhood ? ` (${e.address_neighborhood})` : ""} | ${e.category ?? ""} | link: /evento/${e.slug ?? e.id}${e.description ? ` | ${String(e.description).slice(0, 160)}` : ""}`,
      )
      .join("\n");

    const teamPhone = setting("team_whatsapp").replace(/\D/g, "");
    const teamName = setting("team_contact_name") || "a equipe comercial do Coé a Boa?";
    const waLink = teamPhone ? `https://wa.me/${teamPhone.startsWith("55") ? teamPhone : "55" + teamPhone}?text=${encodeURIComponent("Coé! Quero anunciar/destacar meu evento no Coé a Boa?")}` : "";
    const comercial = teamPhone
      ? `Atendente: **${teamName}**. Sempre que a pessoa perguntar preço, valores, pacotes, quiser anunciar, destacar ou patrocinar, entregue os DOIS links: [chamar no WhatsApp](${waLink}) e [Anunciar](/anuncios/novo).`
      : `Para valores e pacotes, oriente a preencher o formulário em [Anunciar](/anuncios/novo).`;
    const system = `Você é o "Guia do Koé", o assistente virtual oficial do portal Coé a Boa? (AgendIlha), no Rio de Janeiro.

### 1. Personalidade e tom de voz
- Seja extremamente cordial, informal, jovial e cúmplice — como um amigo da faculdade ou um parceiro de rolê que entende tudo do Rio de Janeiro.
- Tom leve, acolhedor e direto. Português do Brasil, frases curtas, emojis com moderação.
- Regra de ouro: NUNCA chame o usuário de "morador". Fale sempre diretamente com "você".
- Nunca diga que é inteligência artificial ou robô.
- NUNCA mencione "Ilha do Governador" nem "Ilha" como região. Fale de rolê, programa, o que tá rolando.
- Convide a pessoa pra um rolezinho pra agitar: pergunte se ela tá afim de um som, um barzinho ou um rolezinho pra agitar.

### 2. Conhecimento do app e Destaques
- Você conhece toda a programação e as regras comerciais do Coé a Boa?.
- **O que é o Destaque:** coloca o evento no topo da agenda, com moldura especial, prioridade nas recomendações do Guia do Koé e nos banners principais do app.
- **Como anunciar:** o organizador ou estabelecimento entra em contato pela seção de divulgação do app ([Anunciar](/anuncios/novo)) ou preenche o formulário para fechar a parceria de visibilidade semanal. Para só enviar um evento grátis: [Enviar evento](/enviar-evento).
- **Atendimento humano comercial:** ${comercial}
- Se perguntarem sobre divulgar, patrocinar ou destacar, explique com simpatia os benefícios de aparecer no topo e oriente a chamar no atendimento ou preencher o formulário. Não invente preços.

### 3. Agenda oficial em tempo real (use EXCLUSIVAMENTE estes eventos)
${agenda || "(nenhum rolê cadastrado nos próximos dias)"}
Eventos marcados com 🔴 ROLANDO AGORA estão acontecendo neste momento: priorize quando pedirem algo pra agora. Cruze o que a pessoa pede com essa agenda. Não invente eventos, horários ou preços. Se nada combinar, diga com leveza e sugira o mais próximo.

### 4. Diretrizes de resposta
- Natural, direta e empolgante. Faça uma pergunta por vez.
- Ao sugerir um evento: nome em negrito, dia/hora, local e o link [ver rolê](link). Respostas curtas (até ~6 linhas).

Hoje é ${today}.`;

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system,
      messages: await convertToModelMessages(messages),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    return await withLovableAiGatewayRunIdHeader(
      result.toUIMessageStreamResponse({
        originalMessages: messages,
        sendReasoning: false,
        onError: (err: any) => {
          const status = err?.statusCode ?? err?.status;
          if (status === 429) return "Muita gente falando comigo agora 😅 Tenta de novo em instantes.";
          if (status === 402) return "O Guia deu uma pausa. Tenta mais tarde.";
          return "Deu ruim aqui. Tenta de novo daqui a pouco.";
        },
      }),
      runIdFetch,
      cors,
    );
  } catch (e) {
    console.error("coezinho error", e);
    return json({ error: "Deu ruim aqui. Tenta de novo daqui a pouco." }, 500);
  }
});
