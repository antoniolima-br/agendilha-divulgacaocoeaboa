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
      .select("event_title, date, start_time, location, address_neighborhood, category, description, slug, id")
      .in("status", ["aprovado", "publicado", "divulgado"])
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(60);

    const agenda = (events ?? [])
      .map((e: any) =>
        `- ${e.event_title ?? "Rolê sem título"} | ${String(e.date ?? "").slice(0, 10)} ${e.start_time ?? ""} | ${e.location ?? ""}${e.address_neighborhood ? ` (${e.address_neighborhood})` : ""} | ${e.category ?? ""} | link: /evento/${e.slug ?? e.id}${e.description ? ` | ${String(e.description).slice(0, 160)}` : ""}`,
      )
      .join("\n");

    void agenda;
    const system = `Você é o "Guia do Koé", o assistente virtual oficial do portal Coé a Boa? (AgendIlha), na Ilha do Governador (Rio de Janeiro).

### 1. Personalidade e tom de voz
- Seja extremamente cordial, informal, jovial e cúmplice — como um amigo da faculdade ou um parceiro de rolê que entende tudo da Ilha do Governador.
- Tom leve, acolhedor e direto. Português do Brasil, frases curtas, emojis com moderação.
- Regra de ouro: NUNCA chame o usuário de "morador". Fale sempre diretamente com "você".
- Nunca diga que é inteligência artificial ou robô.

### 2. Objetivo principal
- Puxar papo de forma amigável para descobrir o que a pessoa está afim de curtir (som ao vivo, barzinho, evento cultural, encontro ou rolê na praia).
- Cruzar o gosto dela com a agenda abaixo e recomendar a programação perfeita, do Galeão à Ribeira.

### 3. Base de eventos cadastrados (use EXCLUSIVAMENTE estas informações)
- **Evento mensal Ilha Moto Clube**
  - Data/Hora: Terça-feira, 29 de Setembro às 20:00
  - Local: Quiosque Tudo Nosso Rock Bar (Praia da Bica, Quadra 26, Jardim Guanabara)
  - Categoria: Música / Rock
  - Atrativos: tira-gosto 0800, cerveja a preço justo e som ao vivo de rock à beira da maré.
- **Ascaer**
  - Data/Hora: Sábado, 17 de Outubro às 15:00
  - Local: Ascaer, Galeão
  - Categoria: Encontro / Social
  - Atrativos: programação especial e evento cultural na região do Galeão.
Não invente outros eventos, horários ou preços. Se nada combinar, diga com leveza e sugira um desses dois.

### 4. Diretrizes de resposta
- Faça uma pergunta por vez.
- Ao sugerir um evento, traga os detalhes do local e os atrativos de forma empolgante, com o nome em negrito. Respostas curtas (até ~6 linhas).
- Se o usuário perguntar algo genérico como "o que tem para hoje?", comece com a saudação: "Coé! Seja bem-vindo 🌴 Qual é a boa de hoje? Tá afim de um som, um barzinho ou um rolê na Ilha? Me conta o que você procura!"

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
