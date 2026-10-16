import type { PitchContent } from "./types";

/** Textos fixos do pitch de sócios aplicados sobre o conteúdo recebido. */
export function withInvestorCopy(sourceContent: PitchContent): PitchContent {
  return {
    ...sourceContent,
    brandPositioning: "O Coé a Boa? é o app PWA de curadoria de eventos e publicidade hiperlocal no Rio de Janeiro. Conecta público, produtores e negócios aos rolês de cada região.",
    technology: sourceContent.technology && { ...sourceContent.technology, description: "Abre pelo navegador, sem loja de aplicativos, com opção de fixar na tela inicial. Agenda atualizada, login e envios exigem conexão." },
    projectionBasis: "Projeção conservadora por praça, baseada em espaços profissionais e patrocínios — não em taxas simbólicas de lançamento.",
    projectionRegional: "Receita local com espaços de 30 dias e patrocínios de eventos de 7 dias. Expansão conforme vendas e validação de cada praça.",
    projectionGlobal: "A tabela consolida 1, 3 e 6 regiões nas fases previstas. São totais, não valores por praça; o resultado depende das vendas e dos custos.",
    b2c: sourceContent.b2c && {
      ...sourceContent.b2c,
      organic: { ...sourceContent.b2c.organic, items: [
        { title: "Zero barreiras", description: "Um link abre a agenda. Sem instalação obrigatória para descobrir os rolês." },
        { title: "Boca a boca e comunidade", description: "Produtores, páginas de bairro e micro-influenciadores compartilham eventos no WhatsApp e nas redes." },
        { title: "QR codes locais", description: "Cartazes e pontos parceiros autorizados conectam o público à programação." },
      ] },
      paid: { ...sourceContent.b2c.paid, items: [
        { title: "Geolocalização", description: "Testar Meta Ads e TikTok por bairro ou raio. Conferir a origem do público antes de ampliar a verba." },
        { title: "Co-marketing local", description: "Campanhas com produtores e comerciantes da praça, usando eventos reais e convites diretos." },
        { title: "Medir e ajustar", description: "Comparar custo por visita, contato e anunciante conquistado. Escalar o que funcionar." },
      ] },
    },
    b2b: sourceContent.b2b && {
      ...sourceContent.b2b,
      exclusivity: { ...sourceContent.b2b.exclusivity, description: "Abordagem direta ao comércio local: visibilidade no bairro e proposta de exclusividade visual Master/Sub-Master na abertura do app. Medir visitas, contatos e vendas atribuíveis à campanha, quando houver dados; com acompanhamento mensal." },
      anchors: { ...sourceContent.b2b.anchors, description: "Captar um Master e dois Sub-Masters por praça, com proposta clara e acompanhamento mensal.", steps: [
        { title: "Selecionar parceiros locais", description: "Priorizar negócios e produtores alinhados ao público do bairro." },
        { title: "Apresentar uma proposta objetiva", description: "Definir região, espaço, período, entregas e preço." },
        { title: "Fechar e acompanhar", description: "Confirmar pagamento e aprovação. Avaliar resultados para renovar." },
      ] },
    },
  };
}
