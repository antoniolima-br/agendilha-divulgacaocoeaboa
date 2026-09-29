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
    if (!apiKey) return json({ error: "O Coezinho tá fora do ar agora. Tenta daqui a pouco." }, 500);

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? (body.messages as UIMessage[]).slice(-30) : [];
    if (messages.length === 0) return json({ error: "Manda uma mensagem pra começar." }, 400);

    const today = saoPauloToday();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: events } = await sb
      .from("public_submissions")
      .select("event_title, date, start_time, location, address_neighborhood, category, description, slug, id")
      .in("status", ["aprovado", "approved", "publicado", "published"])
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(60);

    const agenda = (events ?? [])
      .map((e: any) =>
        `- ${e.event_title ?? "Rolê sem título"} | ${String(e.date ?? "").slice(0, 10)} ${e.start_time ?? ""} | ${e.location ?? ""}${e.address_neighborhood ? ` (${e.address_neighborhood})` : ""} | ${e.category ?? ""} | link: /evento/${e.slug ?? e.id}${e.description ? ` | ${String(e.description).slice(0, 160)}` : ""}`,
      )
      .join("\n");

    const system = `Você é o Coezinho, o parceiro do Coé a Boa? que manja de tudo que rola na Ilha do Governador (Rio de Janeiro).
Jeito: jovial, informal, íntimo, como um amigo da Ilha. Fale direto com "você". NUNCA use a palavra "morador". Nunca diga que é IA, robô ou assistente virtual.
Frases curtas, emojis com moderação, português do Brasil. Respostas curtas (até ~5 linhas ou uma listinha de até 4 rolês).
Seu papel: descobrir o que a pessoa tá afim de curtir (estilo, dia, bairro, com quem vai, grana) fazendo no máximo uma pergunta por vez, e recomendar rolês da agenda abaixo.
Só recomende eventos que estão na agenda. Não invente eventos, horários ou preços. Se não tiver nada que combine, diga isso com leveza e sugira outra opção da lista.
Ao citar um evento, use negrito no nome, diga dia/hora e local, e ponha o link em markdown: [ver rolê](link).
Hoje é ${today}. Agenda de próximos rolês:
${agenda || "(agenda vazia no momento — diga que ainda não tem rolê cadastrado e convide a voltar depois)"}`;

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
          if (status === 402) return "O Coezinho deu uma pausa. Tenta mais tarde.";
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
