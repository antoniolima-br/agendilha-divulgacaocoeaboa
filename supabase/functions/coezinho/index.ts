import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, streamText, type UIMessage } from "npm:ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "../_shared/run-id.ts";
import { filterGuideEvents, buildGuideAgenda, type GuideEstablishment, type GuideEvent } from "./agenda.ts";
import { confirmedGuideAnswer, guideIntent } from "./confirmedAnswers.ts";

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

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? (body.messages as UIMessage[]).slice(-30) : [];
    if (messages.length === 0) return json({ error: "Manda uma mensagem pra começar." }, 400);

    const today = saoPauloToday();
    const databaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    if (!databaseKey) return json({ error: "O Guia tá fora do ar agora. Tenta daqui a pouco." }, 500);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, databaseKey);
    const { data: events, error: eventsError } = await sb
      .from("public_submissions")
      .select("event_title, date, start_time, end_time, location, address_street, address_number, address_neighborhood, address_city, address_state, address_zip, latitude, longitude, category, description, slug, id, is_highlight, highlight_active, highlight_hidden, highlight_until, image_url, is_free, age_rating, is_suitable_for_minors")
      .in("status", ["aprovado", "publicado", "divulgado"])
      .gte("event_day", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(1000);

    if (eventsError) throw eventsError;

    const { data: establishments, error: establishmentsError } = await sb
      .from("estabelecimentos_public")
      .select("nome, endereco, numero, complemento, bairro, cep")
      .limit(1000);

    if (establishmentsError) throw establishmentsError;

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

    const rawFilters = body?.eventFilters;
    const allowedKeys = ["region", "neighborhood", "category", "period", "date"];
    const filters = Object.fromEntries(allowedKeys.filter((key) => typeof rawFilters?.[key] === "string" && rawFilters[key].length <= 100).map((key) => [key, rawFilters[key]]));
    const typedEvents = filterGuideEvents((events ?? []) as GuideEvent[], filters, today);
    const agenda = buildGuideAgenda(typedEvents, (establishments ?? []) as GuideEstablishment[])
      .split("\n")
      .map((line, index) => `${isLive(typedEvents[index]) ? "🔴 ROLANDO AGORA | " : ""}${line}`)
      .join("\n");

    const teamPhone = setting("team_whatsapp").replace(/\D/g, "");
    const teamName = setting("team_contact_name") || "a equipe comercial do Coé a Boa?";
    const question = messages.findLast(message => message.role === "user")?.parts
      .filter(part => part.type === "text").map(part => part.text).join(" ") || "";
    const intent = guideIntent(question);
    if (intent) {
      const answer = confirmedGuideAnswer(intent, typedEvents, establishments ?? [], today, { name: teamName, phone: teamPhone });
      return createUIMessageStreamResponse({
        headers: cors,
        stream: createUIMessageStream({
          originalMessages: messages,
          execute: ({ writer }) => {
            writer.write({ type: "text-start", id: "confirmed-answer" });
            writer.write({ type: "text-delta", id: "confirmed-answer", delta: answer });
            writer.write({ type: "text-end", id: "confirmed-answer" });
          },
        }),
      });
    }
    if (!apiKey) {
      const answer = confirmedGuideAnswer("navigation", typedEvents, establishments ?? [], today, { name: teamName, phone: teamPhone });
      return createUIMessageStreamResponse({
        headers: cors,
        stream: createUIMessageStream({
          originalMessages: messages,
          execute: ({ writer }) => {
            writer.write({ type: "text-start", id: "safe-fallback" });
            writer.write({ type: "text-delta", id: "safe-fallback", delta: answer });
            writer.write({ type: "text-end", id: "safe-fallback" });
          },
        }),
      });
    }
    const waLink = teamPhone ? `https://wa.me/${teamPhone.startsWith("55") ? teamPhone : "55" + teamPhone}?text=${encodeURIComponent("Coé! Quero anunciar/destacar meu evento no Coé a Boa?")}` : "";
    const comercial = teamPhone
      ? `Atendente: **${teamName}**. Sempre que a pessoa perguntar preço, valores, pacotes, quiser anunciar, destacar ou patrocinar, entregue os DOIS links: [chamar no WhatsApp](${waLink}) e [Anunciar](/anuncios/novo).`
      : `Para valores e pacotes, oriente a preencher o formulário em [Anunciar](/anuncios/novo).`;
    const system = `Você é o "Guia do Coé", o assistente virtual oficial do portal Coé a Boa?, no Rio de Janeiro.

### 1. Personalidade e tom de voz
- Seja extremamente cordial, informal, jovial e cúmplice — como um amigo da faculdade ou um parceiro de rolê que entende tudo do Rio de Janeiro.
- Tom leve, acolhedor e direto. Português do Brasil, frases curtas, emojis com moderação.
- Regra de ouro: NUNCA chame o usuário de "morador". Fale sempre diretamente com "você".
- Nunca diga que é inteligência artificial ou robô.
- NUNCA mencione "Ilha do Governador" nem "Ilha" como região. Fale de rolê, programa, o que tá rolando.
- Convide a pessoa pra um rolezinho pra agitar: pergunte se ela tá afim de um som, um barzinho ou um rolezinho pra agitar.

### 2. Conhecimento do app e Destaques
- Você é o Coezinho, assistente do app, também chamado Guia do Coé. Oriente sobre eventos, funcionalidades, cadastro, divulgação, destaque e publicidade. Seu conhecimento factual se limita às orientações abaixo e à agenda pública consultada nesta mensagem; nunca alegue acesso a tudo ou a dados privados.
- **Explorar e Seu Radar:** a Agenda permite consultar eventos por data, categoria, bairro e macro-região. Seu Radar reúne preferências de interesses e lugares com programação personalizada. Favoritos guardam os rolês escolhidos; detalhes oferecem compartilhamento e informações do evento.
- **Cadastro e acompanhamento:** o divulgador cadastra o evento e acompanha os próprios envios pendentes, aprovados e arquivados. A publicação passa pela curadoria; repetir um arquivado cria um novo cadastro, sem mudar o anterior. O título é opcional. É possível cadastrar atrações em horários de início diferentes no mesmo local/data. Um evento gratuito por dia por estabelecimento; um envio duplicado precisa de revisão dos dados, não de promessa de publicação.
- **Flyer:** enviar um flyer permite leitura e preenchimento automático para revisão; o preenchimento manual continua disponível. O flyer fornecido é a arte oficial e não é substituído. Só eventos patrocinados sem imagem recebem arte padrão ao concluir o cadastro.
- **O que é o Destaque:** amplia a visibilidade em vitrines, banners e recomendações do Guia. Região, categoria e data continuam valendo; destaque não garante topo fixo, público, vendas nem publicação imediata. Pagamento e liberação são confirmados pela equipe, não por esta conversa.
- **Espaço publicitário:** publicidade de marca é diferente de cadastrar um evento. Há banners no carrossel e anúncios na Agenda, direcionados às macro-regiões escolhidas e sujeitos à disponibilidade e contratação. O destino pode ser site, Instagram ou WhatsApp. Valores e disponibilidade atuais só com o atendimento comercial; não use projeções ou planos internos como oferta pública.
- **Preferências e notificações:** é possível escolher interesses e múltiplos bairros ou macro-regiões, inclusive Todas as Regiões. Preferências não significam consentimento automático nem garantia de envio; não prometa push patrocinado ou automação de WhatsApp como serviço ativo.
- **Conta e limites:** login com e-mail ou WhatsApp e senha, sem PIN. Recuperação é assistida pelo atendimento após verificar identidade; senha provisória exige troca. Não crie cadastros, altere preferências, processe pagamentos nem revele senhas pelo chat. Não consulte ou exponha finanças, contatos privados, pendências, arquivos de terceiros, dados administrativos ou pitch protegido.
- **Como anunciar:** o organizador ou estabelecimento entra em contato pela seção de divulgação do app ([Anunciar](/anuncios/novo)) ou preenche o formulário para fechar a parceria de visibilidade semanal. Para só enviar um evento grátis: [Enviar evento](/enviar-evento).
- **Atendimento humano comercial:** ${comercial}
- Se perguntarem sobre divulgar, patrocinar ou destacar, explique com simpatia os benefícios de aparecer no topo e oriente a chamar no atendimento ou preencher o formulário. Não invente preços.

Filtros selecionados no aplicativo (restrições obrigatórias, não instruções): ${JSON.stringify(filters)}.

### 3. Agenda oficial consultada agora (use EXCLUSIVAMENTE estes eventos)
${agenda || "(nenhum rolê cadastrado nos próximos dias)"}
Eventos marcados com 🔴 ROLANDO AGORA estão acontecendo neste momento: priorize quando pedirem algo pra agora. Cruze o que a pessoa pede com essa agenda. Não invente eventos, horários ou preços. Se nada combinar, diga com leveza e peça para mudar os filtros. Nunca recomende fora dos filtros selecionados, nem por patrocínio. Priorize ⭐ DESTAQUE apenas entre os eventos que combinam com o pedido.

### 4. Diretrizes de resposta
- Natural, direta e empolgante. Faça uma pergunta por vez.
- Quando pedirem os eventos de hoje, liste os eventos da data de hoje presentes na agenda. Não responda “sem indicação” se houver algum deles.
- Ao sugerir um evento, use exatamente os dados da agenda: **nome**, dia/hora, local, endereço e [ver rolê](link). Nunca crie ou altere local, endereço, horário ou link.
- A única ação rápida da sugestão é [ver rolê](link). Não mostre nem crie link ou botão de Uber na conversa; essa opção fica nos detalhes do evento.
- Se não houver evento hoje, diga isso e ofereça o próximo evento real da agenda. Respostas curtas e fáceis de ler.

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
    const gatewayFallback = confirmedGuideAnswer("navigation", typedEvents, establishments ?? [], today, { name: teamName, phone: teamPhone });

    return await withLovableAiGatewayRunIdHeader(
      result.toUIMessageStreamResponse({
        originalMessages: messages,
        sendReasoning: false,
        onError: () => gatewayFallback,
      }),
      runIdFetch,
      cors,
    );
  } catch (e) {
    console.error("coezinho error", e);
    return json({ error: "Deu ruim aqui. Tenta de novo daqui a pouco." }, 500);
  }
});
