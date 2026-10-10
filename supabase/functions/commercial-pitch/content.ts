export function buildPitchContent() {
  const placementTicket = 300;
  const eventTicket = 115;
  const pushTicket = 150;
  const anchorTiers = [
    { title: "Anunciante Master", slots: 1, min: 800, max: 1000, description: "Espaço principal no topo da Home, com banner âncora prioritário e presença de marca na campanha de longo prazo." },
    { title: "Sub-Masters / Co-Patrocinadores", slots: 2, min: 400, max: 500, description: "Dois espaços de apoio na vitrine, com presença complementar à marca principal. Valor mensal por co-patrocinador." },
  ];
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
    technology: { title: "Conceito Tecnológico · PWA", description: "Um aplicativo web leve, acessado direto pelo navegador e com opção de fixar na tela inicial, sem passar por lojas de aplicativos. Usa armazenamento local para arquivos em cache; não significa consumo zero de memória. O conteúdo já armazenado pode abrir offline, mas agenda atualizada, login e envios precisam de conexão." },
    b2c: {
      title: "Plano de Marketing — Atração e Engajamento de Usuários",
      organic: { title: "Estratégia Orgânica · Zero Barreiras", items: [
        { title: "Acesso sem fricção", description: "Um link abre o Coé a Boa? no navegador. Fixar na tela inicial é uma opção, não uma condição para descobrir a programação." },
        { title: "Vozes do bairro", description: "Criar parcerias com micro-influenciadores e páginas de bairro, usando programação real e convites próximos ao público local." },
        { title: "Efeito rede pelo WhatsApp", description: "Divulgadores compartilham os próprios rolês e levam sua audiência à agenda, ampliando a descoberta entre contatos e grupos locais." },
        { title: "QR codes no território", description: "Propor QR codes em pontos parceiros, cartazes e materiais físicos autorizados, conectando a circulação do bairro à agenda digital." },
      ] },
      paid: { title: "Estratégia Paga · Aceleração e Escala", items: [
        { title: "Meta Ads e TikTok por bairro", description: "Testar segmentação geográfica por bairro ou raio disponível em cada plataforma. A localização é aproximada: conferir a origem do público antes de ampliar a verba." },
        { title: "Criativos sobre leveza", description: "Mostrar o acesso direto pelo navegador e a opção de fixar na tela inicial, sem prometer consumo zero de armazenamento ou agenda atualizada sem internet." },
        { title: "Co-marketing local", description: "Planejar campanhas conjuntas com produtores locais, conectando eventos cadastrados a convites e públicos da mesma praça." },
      ] },
    },
    b2b: {
      title: "Plano Comercial & Marketing de Vendas",
      exclusivity: { title: "Argumento de Venda por Exclusividade", description: "Propor ao lojista e patrocinador atenção visual exclusiva para sua cota na abertura ou atualização do app, sem rotação automática dos espaços Master e Sub-Master. A presença sem disputa simultânea valoriza o investimento corporativo e mantém a experiência limpa; não garante atenção integral ou conversão." },
      anchors: { title: "Captação de Parceiros Âncora", description: "Uma abordagem enxuta por praça para converter a cota Master e as duas cotas Sub-Master, buscando previsibilidade de caixa inicial com contratos mensais — nunca tratando negociação como receita já recebida.", steps: [
        { title: "Selecionar parceiros locais", description: "Mapear negócios e produtores com afinidade com a audiência da praça e um responsável por cada contato comercial." },
        { title: "Apresentar uma proposta objetiva", description: "Mostrar região atendida, hierarquia das cotas, entregas propostas, período e valores mensais, com limites e condições transparentes." },
        { title: "Fechar e acompanhar", description: "Registrar o acordo e acompanhar confirmação financeira, aprovação e entregas. Rever renovação com resultados medidos, sem promessas de retorno garantido." },
      ] },
    },
    brandPositioning: "Coé a Boa? é a plataforma e o produto oficial criado e gerido para resolver a curadoria de eventos e a publicidade hiperlocal no Rio de Janeiro. Conecta quem procura um rolê aos eventos selecionados e aproxima negócios do público de cada macro-região.",
    monetization: "Taxas simbólicas para eventos podem ajudar no lançamento e na adesão inicial, mas não sustentam a operação. A base financeira é a venda profissional de espaços publicitários: carrosséis, banners e cards da Agenda segmentados por macro-região, com pacotes de 30 dias. Essa receita dá suporte ao custeio da operação e das campanhas de tráfego pago; patrocínios de eventos em ciclos de 7 dias complementam o faturamento.",
    projectionBasis: "Nota: Os valores apresentados refletem projeções financeiras conservadoras calculadas individualmente por cada região/praça atendida, com pacotes profissionais, não taxas simbólicas de lançamento.",
    projectionRegional: "Cada praça (ex.: Zona Sul, Centro, etc.) opera de forma autônoma e escalável, gerando previsibilidade de receita recorrente através de patrocínios e destaques locais.",
    advertisingExclusivity: {
      title: "Diferencial de Exclusividade e Performance Publicitária",
      description: "Para concentrar a atenção do usuário e eliminar a poluição visual de carrosséis tradicionais, o Coé a Boa? propõe um modelo sofisticado e de alto impacto para os espaços Master e Sub-Master.",
      items: [
        { title: "Exclusividade por Sessão (Abertura/Atualização)", description: "A proposta é apresentar os parceiros com foco único a cada abertura do aplicativo ou atualização da tela, sem carrosséis automáticos nos espaços Master e Sub-Master, banners piscando ou disputa simultânea entre cotas." },
        { title: "Valor Percebido Superior", description: "Para o lojista e o patrocinador, o espaço sem disputa visual favorece a atenção do leitor no momento do impacto e eleva o valor percebido da presença de marca." },
        { title: "Experiência Limpa", description: "A interface permanece elegante, rápida e focada na descoberta de conteúdo local." },
      ],
      disclaimer: "Modelo comercial proposto, ainda sujeito à implantação. Exclusividade visual não garante 100% da atenção do leitor, conversão ou lucro; a performance depende do público, da campanha e dos resultados medidos.",
    },
    projectionGlobal: "Ao expandir e consolidar a operação integrada pelas principais macro-regiões do Rio de Janeiro, o potencial de faturamento mensal total escala proporcionalmente, multiplicando a captação comercial e o alcance do ecossistema. A tabela apresenta os totais consolidados de 1, 3 e 6 regiões em cada fase, não o valor individual por praça. O potencial de rentabilidade depende das vendas realizadas e dos custos da operação.",
    differential: "O comerciante não precisa falar com a cidade inteira. Precisa chegar a quem pode visitar seu negócio. A segmentação por macro-região concentra a divulgação perto do público certo e reduz a dispersão da verba.",
    regionalExample: "Uma campanha na Zona Sul fala com aquele público; outra em Jacarepaguá alcança sua própria região. Cada anunciante escolhe onde quer aparecer, sem misturar audiências de regiões diferentes.",
    formats: [
      { title: "Destaque de Evento Patrocinado", cycle: "Ciclo de 7 dias", min: 80, max: 150, description: "Pacote profissional de destaque para o rolê, conforme região e demanda. Complementa a receita dos espaços; taxas simbólicas de lançamento são ações pontuais, não a base da projeção." },
      { title: "Espaço Publicitário em Carrossel/Agenda", cycle: "Ciclo de 30 dias", min: 200, max: 400, description: "Base da sustentabilidade: carrosséis, banners e cards da Agenda por macro-região, com destino para site, Instagram ou WhatsApp. Precificação profissional para financiar operação e tráfego pago." },
      { title: "Push Patrocinado Regional", cycle: "Por disparo regional", min: pushTicket, max: pushTicket, description: "Preço sugerido por envio a uma macro-região. Pacote recomendado: 4 disparos mensais por R$ 600,00, sem desconto presumido. Proposta sujeita à implantação do canal e à formação de público autorizado." },
      ...anchorTiers.map((tier) => ({ title: tier.title, cycle: tier.slots === 1 ? "Recorrência mensal · 1 espaço principal" : "Recorrência mensal · 2 espaços de apoio", min: tier.min, max: tier.max, priceSuffix: tier.slots === 1 ? "/mês" : "/mês cada", description: tier.description })),
    ],
    capacity: "Limite ideal: 3 a 4 anúncios por região no carrossel. Menos concorrência visual, mais atenção para cada anunciante. A projeção usa 3 espaços vendidos por região; cards da Agenda não são somados como uma segunda venda do mesmo pacote.",
    placementTicket, eventTicket, pushTicket, scenarios,
    anchor: {
      title: "Anunciante Master / Patrocínio Âncora de Longo Prazo",
      description: "Uma frente de captação para grandes marcas e eventos de grande porte, além do comércio de bairro. O planejamento começa com três meses de antecedência para construir presença, despertar interesse e acompanhar o público até a data do evento.",
      tiers: anchorTiers,
      billing: "Recorrência mensal, sem fechamento trimestral antecipado. A cobrança mês a mês facilita a adesão dos parceiros e dá previsibilidade de caixa, mantendo o planejamento de divulgação com três meses de antecedência.",
      monthlyMin: anchorTiers.reduce((sum, tier) => sum + tier.slots * tier.min, 0),
      monthlyMax: anchorTiers.reduce((sum, tier) => sum + tier.slots * tier.max, 0),
      banner: "Um Anunciante Master ocupa o espaço principal no topo da Home. Dois Sub-Masters / Co-Patrocinadores ocupam os espaços de apoio na vitrine, preservando a hierarquia visual e a presença de cada marca.",
      countdown: "Contagem regressiva para o evento, reforçando a proximidade da data ao longo da divulgação.",
      phases: [
        { title: "Teaser", description: "Apresentar a marca ou o evento com antecedência e despertar a curiosidade do público." },
        { title: "Aquecimento", description: "Revelar a programação e os diferenciais, fortalecer o interesse e ampliar a divulgação." },
        { title: "Reta Final", description: "Intensificar os convites perto da data, com contagem regressiva e foco em ingressos, reservas ou participação." },
      ],
      disclaimer: "Formato comercial proposto, sujeito à definição das entregas e implantação do banner prioritário, dos espaços de apoio, da contagem regressiva e das campanhas por fase. Os valores sugeridos são mensais por parceiro. O potencial considera o Master e os dois co-patrocinadores contratados; não é receita garantida. Não está somado à projeção mensal abaixo e não representa receita realizada. Não há cobrança automática ativada.",
    },
    push: {
      title: "Notificações Push Regionais",
      example: "Alerta de Fim de Semana: um convite patrocinado para o rolê chega diretamente ao celular de quem escolheu receber notificações daquela macro-região.",
      value: "Canal de conversão ultra-direto, sem disputar espaço com a poluição visual do feed. Ideal para bares, casas de festas e eventos de grande apelo local, com uma mensagem curta e um link para o rolê ou anunciante. É uma oportunidade de conversão, não uma garantia de visita ou venda.",
      requirements: "Produto proposto, ainda sem disparos ativados. A oferta depende de usuários que autorizem as notificações, segmentação pela macro-região escolhida e implantação do envio. Alcance e frequência precisam respeitar o público disponível e a opção de deixar de receber.",
      packageSends: 4, packagePrice: pushTicket * 4,
    },
    disclaimer: "Cenário ilustrativo, não receita realizada nem promessa de resultado. Os volumes representam vendas por mês, com ocupação integral dos espaços considerados e venda dos disparos projetados. Não inclui impostos, operação, tecnologia (inclusive implantação e envio de push), comissões ou inadimplência. O saldo após marketing não é lucro líquido.",
    marketingMin: 500, marketingMax: 1000,
    selfService: {
      title: "Automação e Autoatendimento (Self-Service)",
      description: "O próximo passo é permitir que anunciantes e divulgadores criem e paguem por seus próprios anúncios diretamente no Coé a Boa?. Cada parceiro poderá escolher o formato, a macro-região e o período de veiculação, enviar o conteúdo e acompanhar a análise na plataforma.",
      strategy: "O ecossistema foi pensado para crescer com autonomia dos parceiros e controle da equipe. Automatizar cadastro, conferências e acompanhamento reduz tarefas repetitivas e abre caminho para ampliar receitas sem inflar o custo operacional na mesma proporção. A equipe concentra seu tempo na qualidade dos anúncios e nas decisões de aprovação, não no preenchimento manual de cada pedido.",
      steps: [
        { title: "Criação e validação de dados", description: "O parceiro prepara o anúncio. Antes do envio, o fluxo valida dados, mídia, destino do anúncio, região escolhida e período, sinalizando o que precisa ser corrigido." },
        { title: "Pagamento prévio obrigatório", description: "O parceiro paga antes da veiculação. A confirmação segura do pagamento é obrigatória; comprovante enviado ou indicação do próprio anunciante não substituem a confirmação financeira." },
        { title: "Fila de aprovação e moderação", description: "O pedido segue para análise do administrador. Pagamento confirmado não significa publicação automática: conteúdo e dados precisam ser aprovados antes de o anúncio aparecer para o público." },
        { title: "Auditoria e veiculação controlada", description: "O fluxo prevê histórico de alterações, confirmação de pagamento e registro de quem aprovou e quando. Somente anúncios com dados válidos, pagamento confirmado e aprovação administrativa poderão ser veiculados, respeitando a região e o período contratados." },
      ],
      disclaimer: "Próxima etapa proposta, ainda não ativada. Esta apresentação não habilita criação autônoma, checkout, cobrança ou publicação automática. A implantação depende de confirmação segura dos pagamentos, validações e controles de acesso e auditoria, com regras claras para correção, rejeição e eventual reembolso. O ganho de escala é uma hipótese estratégica, não uma garantia de receita ou redução de custos.",
    },
    acquisition: [
      { title: "Começar perto", description: "Testar uma macro-região por vez, com conjuntos de anúncios no Meta Ads por bairro ou raio disponível. A localização do Meta é aproximada: acompanhar a origem real do público antes de expandir." },
      { title: "Criativos com contexto", description: "Usar rolês e negócios reais da região, com convite direto para consultar a agenda. Comparar duas mensagens e priorizar a que gera visitas qualificadas e conversas comerciais." },
      { title: "Distribuir a verba", description: "Destinar 70% à descoberta local, 20% a novos criativos e 10% à retomada de contatos, quando houver público suficiente e consentimento. Sem público elegível, manter essa parcela na descoberta." },
      { title: "Medir antes de ampliar", description: "Acompanhar custo por visita, conversa, lead qualificado e anunciante fechado. CAC = investimento de aquisição ÷ novos anunciantes pagantes; ainda não existe CAC validado. Exemplo hipotético: R$ 500 para 5 novos anunciantes = R$ 100 por aquisição." },
    ],
  };
}
