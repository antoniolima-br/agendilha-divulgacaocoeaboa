import type { GuideEvent, GuideEstablishment } from "./agenda.ts";
import { resolveEstablishment } from "./agenda.ts";

export function guideIntent(question: string): string | null {
  const q = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/senha|login|entrar na conta|recuperar.*conta/.test(q)) return "account";
  if (/flyer|cartaz|arte.*evento/.test(q)) return "flyer";
  if (/radar|favorit|notific|preferencia/.test(q)) return "preferences";
  if (/preco|valor|pacote|patrocin|destaque|publicit|anunci|contratar|parceria/.test(q)) return "commercial";
  if (/cadastr|divulgar|enviar.*evento|curadoria|aprov|arquivad/.test(q)) return "submission";
  if (/(hoje|amanha|proxim|programacao|agenda|rolando|role|eventos)/.test(q)) {
    // Specific requests remain with the model; never answer a genre/place request with unrelated events.
    if (/samba|rock|forro|pagode|funk|jazz|infantil|gratis|gratuit|agora|bairro|regiao|zona|em |no |na /.test(q)) return null;
    if (/amanha/.test(q)) return "tomorrow";
    return /hoje/.test(q) ? "today" : "agenda";
  }
  if (/naveg|funciona|o que.*app|o que.*coe|ajuda|funcionalidade/.test(q)) return "navigation";
  return null;
}

export function confirmedGuideAnswer(intent: string, events: GuideEvent[], places: GuideEstablishment[], today: string, contact: { name: string; phone: string }): string {
  if (intent === "account") return "Você entra com WhatsApp e senha, sem e-mail obrigatório nem PIN. Se esqueceu a senha, use a recuperação assistida na tela de login. A equipe verifica sua identidade antes de entregar uma senha provisória; você precisa trocá-la ao entrar. Eu não acesso nem entrego senhas por aqui.";
  if (intent === "flyer") return "Você pode enviar o flyer no início do cadastro para preencher os dados automaticamente e revisar antes de enviar. Também pode preencher manualmente. Seu flyer fica como arte oficial e não é substituído. A arte padrão só é gerada ao concluir um evento patrocinado sem imagem.";
  if (intent === "preferences") return "Meu Radar fica na navegação inferior ou lateral. Ali você escolhe interesses e lugares para ver a programação que combina com você. Nos detalhes de um rolê, você pode favoritar e compartilhar. As preferências de notificações aceitam bairros e macro-regiões; escolher preferências não autoriza envios automaticamente.";
  if (intent === "submission") return "Para cadastrar, abra Divulgar/Contratar na navegação inferior ou lateral e escolha Cadastrar Evento. Você pode enviar um flyer ou preencher os dados manualmente, revisar e enviar para a curadoria. Depois, acompanhe seus próprios envios no painel do divulgador. Há um evento gratuito por dia por estabelecimento; novas atrações no mesmo local e data precisam de horários de início diferentes. Enviar não significa publicação imediata.";
  if (intent === "commercial") {
    const phone = contact.phone.replace(/\D/g, "");
    const link = phone ? `https://wa.me/${phone.startsWith("55") ? phone : "55" + phone}?text=${encodeURIComponent("Coé! Quero saber sobre divulgação e espaço publicitário.")}` : "";
    return `Abra Divulgar/Contratar na navegação inferior ou lateral. Cadastrar Evento é para a programação de um rolê; Espaço Publicitário é para anunciar sua marca. O Destaque amplia a visibilidade, mas continua respeitando região, categoria e data. Valores, disponibilidade e confirmação de pagamento são com a equipe, não pelo chat.${link ? ` Fale com **${contact.name || "a equipe comercial"}**: [chamar no WhatsApp](${link}).` : " Consulte o atendimento pelo formulário de Espaço Publicitário."}`;
  }
  if (intent === "navigation") return "Coé! Sou o Coezinho, guia do Coé a Boa? Na Agenda, você encontra a programação por data, categoria e local. Meu Radar reúne seus interesses e lugares. Divulgar/Contratar separa cadastro de eventos de espaço publicitário. Perfil dá acesso à sua conta. Abra os detalhes de um rolê para conferir informações, favoritar e compartilhar. Qual parte você quer conhecer?";
  const date = intent === "tomorrow" ? new Date(Date.parse(`${today}T12:00:00Z`) + 86400000).toISOString().slice(0, 10) : today;
  const selected = intent === "agenda" ? events : events.filter(event => event.date?.slice(0, 10) === date);
  if (!selected.length) return `Não encontrei rolês ${intent === "today" ? "para hoje" : intent === "tomorrow" ? "para amanhã" : "na programação"} nos filtros selecionados. Você pode mudar a data, a categoria ou o local na Agenda.`;
  const rows = selected.slice(0, 8).map(event => {
    const place = resolveEstablishment(event, places);
    const day = event.date?.slice(0, 10).split("-").reverse().join("/");
    const address = [place?.endereco || event.address_street, place?.numero || event.address_number, place?.bairro || event.address_neighborhood].filter(Boolean).join(", ");
    const href = event.slug || event.id;
    return `- **${event.event_title || "Rolê sem título"}** — ${day}, ${event.start_time?.slice(0, 5) || "horário a confirmar"}. ${place?.nome || event.location || "Local a confirmar"}${address ? ` · ${address}` : ""}.${href ? ` [Ver rolê](/evento/${encodeURIComponent(href)})` : ""}`;
  });
  return `Consultei a programação pública agora, respeitando seus filtros:\n\n${rows.join("\n\n")}${selected.length > 8 ? "\n\nHá mais rolês na Agenda com esses filtros." : ""}`;
}