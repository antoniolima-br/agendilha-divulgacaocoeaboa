export function buildPitchContent() {
  const placementTicket = 300;
  const eventTicket = 115;
  const pushTicket = 150;
  const scenarios = [
    { month: 1, phase: "Fase Inicial", regions: 1, placements: 3, events: 4, pushes: 4, marketing: 500 },
    { month: 6, phase: "Fase de Expansão", regions: 3, placements: 9, events: 12, pushes: 12, marketing: 750 },
    { month: 12, phase: "Fase Consolidada", regions: 6, placements: 18, events: 24, pushes: 24, marketing: 1000 },
  ].map((scenario) => {
    const placementRevenue = scenario.placements * placementTicket;
    const eventRevenue = scenario.events * eventTicket;
    const pushRevenue = scenario.pushes * pushTicket;
    const revenue = placementRevenue + eventRevenue + pushRevenue;
    return { ...scenario, placementRevenue, eventRevenue, pushRevenue, revenue,
      afterMarketing: revenue - scenario.marketing };
  });
  return {
    brandPositioning: "Coé a Boa? é a plataforma e o produto oficial criado e gerido para resolver a curadoria de eventos e a publicidade hiperlocal no Rio de Janeiro. Conecta quem procura um rolê aos eventos selecionados e aproxima negócios do público de cada macro-região.",
    monetization: "Taxas simbólicas para eventos podem ajudar no lançamento e na adesão inicial, mas não sustentam a operação. A base financeira é a venda profissional de espaços publicitários: carrosséis, banners e cards da Agenda segmentados por macro-região, com pacotes de 30 dias. Essa receita dá suporte ao custeio da operação e das campanhas de tráfego pago; patrocínios de eventos em ciclos de 7 dias complementam o faturamento.",
    projectionBasis: "A projeção usa os pacotes profissionais recomendados, não taxas simbólicas de lançamento. A receita de espaços publicitários é a base recorrente estimada; patrocínios de 7 dias e pushes regionais são vendas adicionais no mês. Considera 4 disparos vendidos por região a cada mês, equivalentes a um pacote mensal, sem somar pacote e disparos como receitas diferentes. O crescimento pressupõe uma base regional com autorização para receber notificações e o canal de envio implantado. Nos cenários abaixo, os espaços cobrem o orçamento de marketing previsto, mas isso não garante cobertura dos demais custos nem lucro.",
    differential: "O comerciante não precisa falar com a cidade inteira. Precisa chegar a quem pode visitar seu negócio. A segmentação por macro-região concentra a divulgação perto do público certo e reduz a dispersão da verba.",
    regionalExample: "Uma campanha na Zona Sul fala com aquele público; outra em Jacarepaguá alcança sua própria região. Cada anunciante escolhe onde quer aparecer, sem misturar audiências de regiões diferentes.",
    formats: [
      { title: "Destaque de Evento Patrocinado", cycle: "Ciclo de 7 dias", min: 80, max: 150, description: "Pacote profissional de destaque para o rolê, conforme região e demanda. Complementa a receita dos espaços; taxas simbólicas de lançamento são ações pontuais, não a base da projeção." },
      { title: "Espaço Publicitário em Carrossel/Agenda", cycle: "Ciclo de 30 dias", min: 200, max: 400, description: "Base da sustentabilidade: carrosséis, banners e cards da Agenda por macro-região, com destino para site, Instagram ou WhatsApp. Precificação profissional para financiar operação e tráfego pago." },
      { title: "Push Patrocinado Regional", cycle: "Por disparo regional", min: pushTicket, max: pushTicket, description: "Preço sugerido por envio a uma macro-região. Pacote recomendado: 4 disparos mensais por R$ 600,00, sem desconto presumido. Proposta sujeita à implantação do canal e à formação de público autorizado." },
    ],
    capacity: "Limite ideal: 3 a 4 anúncios por região no carrossel. Menos concorrência visual, mais atenção para cada anunciante. A projeção usa 3 espaços vendidos por região; cards da Agenda não são somados como uma segunda venda do mesmo pacote.",
    placementTicket, eventTicket, pushTicket, scenarios,
    push: {
      title: "Notificações Push Regionais",
      example: "Alerta de Fim de Semana: um convite patrocinado para o rolê chega diretamente ao celular de quem escolheu receber notificações daquela macro-região.",
      value: "Canal de conversão ultra-direto, sem disputar espaço com a poluição visual do feed. Ideal para bares, casas de festas e eventos de grande apelo local, com uma mensagem curta e um link para o rolê ou anunciante. É uma oportunidade de conversão, não uma garantia de visita ou venda.",
      requirements: "Produto proposto, ainda sem disparos ativados. A oferta depende de usuários que autorizem as notificações, segmentação pela macro-região escolhida e implantação do envio. Alcance e frequência precisam respeitar o público disponível e a opção de deixar de receber.",
      packageSends: 4, packagePrice: pushTicket * 4,
    },
    disclaimer: "Cenário ilustrativo, não receita realizada nem promessa de resultado. Os volumes representam vendas por mês, com ocupação integral dos espaços considerados e venda dos disparos projetados. Não inclui impostos, operação, tecnologia (inclusive implantação e envio de push), comissões ou inadimplência. O saldo após marketing não é lucro líquido.",
    marketingMin: 500, marketingMax: 1000,
    acquisition: [
      { title: "Começar perto", description: "Testar uma macro-região por vez, com conjuntos de anúncios no Meta Ads por bairro ou raio disponível. A localização do Meta é aproximada: acompanhar a origem real do público antes de expandir." },
      { title: "Criativos com contexto", description: "Usar rolês e negócios reais da região, com convite direto para consultar a agenda. Comparar duas mensagens e priorizar a que gera visitas qualificadas e conversas comerciais." },
      { title: "Distribuir a verba", description: "Destinar 70% à descoberta local, 20% a novos criativos e 10% à retomada de contatos, quando houver público suficiente e consentimento. Sem público elegível, manter essa parcela na descoberta." },
      { title: "Medir antes de ampliar", description: "Acompanhar custo por visita, conversa, lead qualificado e anunciante fechado. CAC = investimento de aquisição ÷ novos anunciantes pagantes; ainda não existe CAC validado. Exemplo hipotético: R$ 500 para 5 novos anunciantes = R$ 100 por aquisição." },
    ],
  };
}
