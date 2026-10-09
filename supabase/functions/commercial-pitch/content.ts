export function buildPitchContent() {
  const placementTicket = 300;
  const eventTicket = 115;
  const scenarios = [
    { month: 1, regions: 1, placements: 3, events: 4, marketing: 500 },
    { month: 6, regions: 3, placements: 9, events: 12, marketing: 750 },
    { month: 12, regions: 6, placements: 18, events: 24, marketing: 1000 },
  ].map((scenario) => {
    const placementRevenue = scenario.placements * placementTicket;
    const eventRevenue = scenario.events * eventTicket;
    return { ...scenario, placementRevenue, eventRevenue, revenue: placementRevenue + eventRevenue,
      afterMarketing: placementRevenue + eventRevenue - scenario.marketing };
  });
  return {
    differential: "O comerciante não precisa falar com a cidade inteira. Precisa chegar a quem pode visitar seu negócio. A segmentação por macro-região concentra a divulgação perto do público certo e reduz a dispersão da verba.",
    regionalExample: "Uma campanha na Zona Sul fala com aquele público; outra em Jacarepaguá alcança sua própria região. Cada anunciante escolhe onde quer aparecer, sem misturar audiências de regiões diferentes.",
    formats: [
      { title: "Destaque de Evento Patrocinado", cycle: "Ciclo de 7 dias", min: 80, max: 150, description: "Presença de destaque para o rolê, com valor sugerido conforme a região e a demanda." },
      { title: "Espaço Publicitário em Carrossel/Agenda", cycle: "Ciclo de 30 dias", min: 200, max: 400, description: "Visibilidade regional para o negócio, com destino para site, Instagram ou WhatsApp do anunciante." },
    ],
    capacity: "Limite ideal: 3 a 4 anúncios por região no carrossel. Menos concorrência visual, mais atenção para cada anunciante. A projeção usa 3 espaços vendidos por região; cards da Agenda não são somados como uma segunda venda do mesmo pacote.",
    placementTicket, eventTicket, scenarios,
    disclaimer: "Cenário ilustrativo, não receita realizada nem promessa de resultado. Os volumes representam vendas por mês, com ocupação integral dos espaços considerados. Não inclui impostos, operação, tecnologia, comissões ou inadimplência. O saldo após marketing não é lucro líquido.",
    marketingMin: 500, marketingMax: 1000,
    acquisition: [
      { title: "Começar perto", description: "Testar uma macro-região por vez, com conjuntos de anúncios no Meta Ads por bairro ou raio disponível. A localização do Meta é aproximada: acompanhar a origem real do público antes de expandir." },
      { title: "Criativos com contexto", description: "Usar rolês e negócios reais da região, com convite direto para consultar a agenda. Comparar duas mensagens e priorizar a que gera visitas qualificadas e conversas comerciais." },
      { title: "Distribuir a verba", description: "Destinar 70% à descoberta local, 20% a novos criativos e 10% à retomada de contatos, quando houver público suficiente e consentimento. Sem público elegível, manter essa parcela na descoberta." },
      { title: "Medir antes de ampliar", description: "Acompanhar custo por visita, conversa, lead qualificado e anunciante fechado. CAC = investimento de aquisição ÷ novos anunciantes pagantes; ainda não existe CAC validado. Exemplo hipotético: R$ 500 para 5 novos anunciantes = R$ 100 por aquisição." },
    ],
  };
}
