- [x] Adicionar criação de usuário e alteração direta de senha na Gestão de Usuários, exclusivas para administradores.
# Roadmap

- [x] Substituir o seletor de período por campo dd/mm/aaaa com calendário interativo na Home e Agenda; abertura, escolha, fechamento e eventos da data conferidos no navegador; 22 testes aprovados.

- [x] Compactar região/bairros e interesses com seleção múltipla pesquisável e tags; 60 testes aprovados, busca/remoção e ausência de overflow conferidas, cadastro fictício salvo e relido com arrays corretos, depois removido.

- [x] Adicionar região/bairro de preferência e Todas as Regiões ao cadastro de notificações da Home e do público, preservando interesses e salvando a segmentação; 24 testes aprovados, cadastro fictício enviado e relido com região/interesses/consentimento corretos, depois removido; sem ativar push.

- [x] Incluir Automação e Autoatendimento no pitch como próximo passo: criação e pagamento pelo anunciante/divulgador, pagamento prévio, validação, moderação e auditoria, sem ativar funcionalidades; 52 testes aprovados, senha inválida recusada com sessão real e seção/bloqueio conferidos com resposta de apresentação.

- [x] Integrar destaques publicados em Home, Guia, Agenda e vitrines regionais com filtros compartilhados; 70 testes aprovados, evento real conferido na Home/Agenda/Guia e exclusão por data na busca, sem alterar pagamentos ou ativar cotas Master.

- [x] Inserir mapa conceitual publicitário no início do pitch, com legenda de valores/períodos e imagem protegida pelo mesmo acesso do conteúdo; 52 testes aprovados, recusa real de senha inválida e imagem/legenda/bloqueio conferidos com resposta de teste.

- [x] Atualizar patrocínio âncora para 1 Master e 2 Sub-Masters, recorrência mensal de R$ 800–1.000 e R$ 400–500 por parceiro; 52 testes aprovados, senha inválida recusada com sessão real e oferta/bloqueio conferidos com resposta de teste; divulgação antecipada mantida, sem ativar cobranças.

- [x] Incluir Anunciante Master / Patrocínio Âncora no pitch: pacote de 90 dias, R$ 1.500–3.000, banner prioritário, contagem regressiva e fases Teaser/Aquecimento/Reta Final; 52 testes aprovados, senha inválida recusada com sessão real e apresentação/bloqueio conferidos com resposta de teste; proposta separada das funcionalidades públicas e projeções mensais.

- [x] Incluir push patrocinado regional no pitch a R$ 150/disparo e pacote sugerido de 4 por R$ 600; projeções das três fases atualizadas, 41 testes aprovados e apresentação/bloqueio conferidos com sessão e resposta de teste, sem ativar envios.

- [x] Ajustar posicionamento e monetização profissional do pitch, ampliando acesso com senha para Admin, Financeiro, Sênior e Master; 52 testes aprovados, senha incorreta recusada com sessão real, apresentação e bloqueio conferidos com resposta de teste.

- [x] Criar Pitch Comercial e Projeção para Master/Sênior com senha adicional, preços sugeridos, projeção e aquisição hiperlocal; 51 testes aprovados, sessão Master real, recusa de senha incorreta e bloqueio de visitantes conferidos; apresentação validada com resposta de teste.
- [ ] Confirmar abertura do pitch com a senha escolhida — senha privada salva pelo usuário não é acessível ao agente; requer confirmação na página.

- [x] Cadastrar banner regional e card da Agenda como produtos ativos; adicionar configuração de destino seguro e público regional, mantendo contratos financeiros separados; 40 testes aprovados, consulta pública e oito opções conferidas.
- [ ] Validar configuração e releitura de uma campanha na gestão com sessão administrativa — a conta solicitante não possui sessão disponível; requer entrar na prévia.

- [x] Consultar CEP automaticamente no cadastro de eventos e exibir cidade/região; 44 testes aprovados, incluindo oito regiões, falhas e respostas atrasadas; ViaCEP real conferido.
- [ ] Conferir CEP e região no formulário com sessão do divulgador — requer entrar na prévia; não existe conta correspondente ao solicitante para obter sessão de teste.

- [x] Ajustar busca por bairros/regiões sem distinção de acentos ou caixa e validar Olaria/Ramos/Bonsucesso/Penha na Zona Norte; 30 testes aprovados e evento real de sábado encontrado por Olaria + Zona Norte no navegador.

- [x] Restaurar todas as oito regiões nos filtros públicos e na seleção de eventos por dia, incluindo Zona Norte/Olaria; 22 testes aprovados e opções conferidas no início, Agenda e sábado no navegador.

- [x] Implementar oito macro-regiões, associação automática de bairros e filtros na Agenda/Seu Radar; 22 testes aprovados e seleção pública conferida no navegador.
- [ ] Validar salvamento e releitura das regiões no Seu Radar — requer entrar na prévia; não existe conta correspondente ao solicitante para obter sessão de teste.

- [x] Ampliar Financeiro: baixa com publicação automática, livro caixa com despesas, evolução e inventário de cortesias/permutas; 33 testes aprovados.
- [ ] Validar nova baixa/publicação e despesa no Financeiro com sessão autorizada — a conta solicitante não tem sessão disponível; é necessário entrar na prévia e autorizar um lançamento de teste.

- [x] Refatorar hierarquia de acessos, proteções de telas e menu lateral por perfil; 53 testes aprovados, agenda pública e bloqueio de visitantes verificados.
- [ ] Validar leitura administrativa e ações exclusivas de Master com sessão real — é necessário entrar na prévia; não foi possível obter sessão da conta solicitante.

- [x] Separar Meus eventos da Curadoria no acesso híbrido admin/divulgador, mantendo somente leitura financeira para admin comum; 29 testes aprovados e envio pessoal isolado relido com sessão real.

- [x] Criar Financeiro centralizado para eventos patrocinados e publicidade, com relatórios e histórico.
- [x] Proteger baixa/liberação para Financeiro, Sênior ou Master e leitura para demais administradores.
- [x] Validar baixa, liberação, relatório e cancelamento com anúncio isolado no navegador; 34 testes de regras e navegação aprovados.

- [x] Separar Seu Radar, Área do Divulgador e Curadoria com rotas e acessos próprios.
- [x] Criar preferências e feed personalizado por categorias, estilos e bairros; salvar e reler com sessão real.
- [x] Isolar consultas e ações de aprovação/rejeição e validar acessos com testes; Curadoria carregada com sessão real.
- [ ] Confirmar aprovação/rejeição de evento de teste no navegador — precisa de um envio de teste autorizado, para não moderar eventos reais de terceiros.

- [x] Ocultar eventos passados de consultas públicas e restringir o histórico ao organizador.
- [x] Adicionar Arquivados no painel pessoal com consulta e repetição em nova data/horário.
- [ ] Validar consulta/repetição de Arquivados com um registro do organizador — sessão atual acessa o painel, mas não possui evento arquivado; precisa de um registro próprio de teste.

- [x] Remover telas de PIN e oferecer recuperação segura assistida por WhatsApp.
- [x] Garantir troca obrigatória após senha provisória e validar os fluxos de acesso.

- [x] Executar otimização profunda de performance, navegação, consultas, assets e experiência visual sem alterar funcionalidades.

- [x] Concluir auditoria técnica integral e corrigir falhas confirmadas em segurança, acesso, dados, interface, desempenho e testes.
  - [x] Auditar frontend, backend, banco, dependências, desempenho e fluxos de acesso.
  - [x] Corrigir falhas críticas de permissões e funções privilegiadas no banco.
  - [x] Corrigir regressões confirmadas de favoritos, compartilhamento, downloads, sessão e layout móvel.
  - [x] Atualizar dependências vulneráveis compatíveis e executar validação final completa.
- [x] Adicionar escolha entre anúncio gratuito e destaque, com flyer e contratação vinculados ao evento.
- [x] Separar locais de rolê de negócios gerais nos cadastros e listagens dos painéis.
- [x] Permitir tornar um evento pago em Destaque no painel e priorizá-lo imediatamente no banner principal da Home com flyer.
- [x] Abrir a edição administrativa pelo botão “Ver evento” da agenda pública e salvar “Destaque na Home” com atualização imediata.
- [x] Liberar Destaque na Home como cortesia promocional imediata, mantendo a opção paga e o registro financeiro futuro.
- [x] Criar vitrine pública de destaques com rota real, gestão administrativa de pagamento e validação na Home e no Guia.
- [x] Promover automaticamente na Home e na agenda todos os eventos atuais ou futuros com flyer durante o lançamento.
- [x] Priorizar flyers de hoje na Home e manter múltiplos flyers futuros na mesma rotação.
- [x] Normalizar as datas da vitrine pelo calendário de São Paulo e exibir todos os eventos de hoje sem corte.
- [x] Manter cada flyer dos carrosséis da Home visível por 5 segundos.
- [x] Unificar o compartilhamento dos detalhes de eventos em uma única ação com menu nativo e fallback essencial.

- [x] Conectar o Guia do Coé à agenda e aos estabelecimentos aprovados, com locais, horários e rotas de Uber reais.
- [x] Manter apenas “ver rolê” nas sugestões do Guia e deixar a opção de Uber nos detalhes do evento.
- [x] Atualizar a saudação e refinar a janela do Guia do Coé com cabeçalho em gradiente e atalhos rápidos.
- [x] Permitir vários eventos no mesmo estabelecimento, com data, início e detalhes individuais.
- [x] Permitir eventos na mesma data no mesmo estabelecimento, exigindo horários de início diferentes.
- [x] Proteger a página inicial e suas seções contra dados ausentes e cobrir o estado vazio com teste.
- [x] Aplicar “Não sei o CEP” e remover o campo separado “Complemento” em todos os cadastros de estabelecimento.
- [x] Manter eventos do dia em todas as listas públicas e ocultá-los somente a partir do dia seguinte em São Paulo.

- [x] Preencher o atendimento comercial com responsável real já cadastrado e manter a seleção dinâmica da equipe.
- [x] Criar uma página pública de eventos com nome, data, horário, local e WhatsApp autorizado.
- [x] Oferecer confirmação do envio ao responsável por mensagem pronta no WhatsApp após o cadastro.
- [x] Validar a agenda do atrativo e garantir intervalo mínimo de 2 horas entre apresentações no mesmo dia.

- [x] Tornar telefone opcional nos cadastros de atrativos, artistas e estabelecimentos, mantendo validação quando preenchido.
- [x] Confirmar que o banco aceita telefones vazios nesses cadastros.
- [x] Atualizar o Agendilha Informa com o relatório diário “Coé a Boa? - [Data]”.
- [x] Separar eventos destacados e gratuitos válidos, ordenados por horário, sem eventos pagos comuns.
- [x] Disponibilizar cópia e compartilhamento direto do relatório pelo WhatsApp.
- [x] Validar o relatório e os formulários com testes automatizados e verificação de tipos.
- [x] Corrigir o atalho Eventos da seção Explorar para abrir a página pública de eventos.
- [x] Exibir na parte inferior da Home os eventos gratuitos não destacados e válidos.
- [x] Corrigir a exibição de anúncios e eventos recém-aprovados na Home e no Agendilha Informa, respeitando o fuso de São Paulo.
- [x] Adicionar à Home um carrossel de anúncios publicados com autoplay de 4 segundos, pausa no toque/hover e indicadores.
- [x] Dar acabamento premium à curadoria diária com destaque amplo, autoplay, filtros de data e região, publicidade, programação e ações rápidas.
- [x] Simplificar a navegação móvel para Início, Divulgar e Perfil, removendo Atrações.
- [x] Separar o Relatório Diário em “Anúncios / Eventos Pagos (Destaques)” e “Eventos Gratuitos (Não Pagos)”.
- [x] Exibir gratuitos não destacados somente no fim da Home, em lista textual sem flyer ou banner.
- [x] Confirmar que o carrossel da Home usa anúncios publicados da base, autoplay, pausa no toque/hover/foco e indicadores.
- [x] Aplicar sugestões da base aos campos textuais editáveis do cadastro de eventos, preservando validações e preenchimentos automáticos existentes.
- [x] Renomear os blocos do Relatório Diário para “Anúncios Pagos / Destaques” e “Demais Eventos Divulgados”, removendo o rótulo anterior.
- [x] Flexibilizar /enviar-evento para envio com nome, data e horário
- [x] Preservar autocomplete global e máscaras existentes
- [x] Unificar o Relatório Diário em uma lista limpa, sem rótulos de destaque
- [x] Renomear a listagem inferior da Home para “Outras programações”
- [x] Implantar carrossel patrocinado com até 6 anúncios, detalhes e ações de contato
- [x] Cadastrar anúncios publicados no carrossel e validar WhatsApp, mapa e anúncio completo
- [x] Ampliar a gestão de patrocinadores com cadastro e exclusão
- [x] Alternar anúncios e eventos no destaque principal da Home
- [x] Validar atualização automática e ações dos patrocinadores
- [x] Preencher anúncios sem capa com flyers de eventos válidos, sem alterar os dados do patrocinador
- [x] Substituir flyers provisórios por banners próprios dos anunciantes fictícios
- [x] Apresentar os eventos válidos da Home como patrocinados no destaque
- [x] Destacar os eventos de hoje em “Acontece hoje na Ilha” e mostrar os próximos dias em cards patrocinados menores
- [x] Atualizar o texto do Agendilha Informa com cabeçalho oficial, data por extenso e eventos em três linhas
- [x] Criar rota protegida para compartilhar automaticamente o Agendilha Informa pelo WhatsApp
- [x] Corrigir o atalho “Coé a Boa?” no rodapé da Home
- [x] Exibir flyers e banners dos eventos cadastrados no destaque da Home
- [x] Separar os cards de eventos dos anúncios patrocinados na Home
- [x] Harmonizar os flyers dos eventos e incluir cards menores abaixo do destaque da Home
- [x] Preencher integralmente os cards da Home com flyers de eventos reais aprovados
- [x] Limitar “Outros Eventos” a três linhas visíveis com rolagem a partir do quarto item
- [x] Agrupar o Relatório Diário e reservar Operação/Governança para administradores
- [x] Tornar sugestões textuais insensíveis a acentos e maiúsculas
- [x] Bloquear a edição de eventos aprovados no painel do Divulgador
- [x] Exibir eventos de hoje em “No seu radar” e aplicar preferências salvas com fallback

- [x] Garantir endereço completo antes do bairro no Relatório Diário, incluindo o número no compartilhamento direto.
- [x] Tornar todos os autocompletes do envio insensíveis a acentos e maiúsculas.
- [x] Preservar e salvar corretamente o vínculo com local pré-cadastrado no envio do evento.
- [x] Criar acesso público a “Eventos Anteriores / Arquivo” com corte pelo dia de São Paulo.
- [x] Manter eventos de hoje ativos até o fim do dia e arquivá-los somente no dia seguinte.
- [x] Variar de forma estável as paletas dos cards gerados sem flyer.
- [x] Auditar gargalos de frontend, navegação, dados, cache, imagens, PWA e pacotes.
- [x] Compartilhar o carregamento do perfil e reduzir consultas repetidas de identificação/permissões.
- [x] Reduzir avaliações baixadas, estabilizar canais e amortecer atualizações em tempo real.
- [x] Remover animação pesada dos cards e otimizar imagens, fontes, vídeos e carrosséis.
- [x] Evitar cache offline de dados dinâmicos e reduzir o pré-carregamento de pacotes administrativos.
- [x] Validar visualmente os fluxos públicos em desktop e celular; fluxos autenticados seguem cobertos por testes automatizados.
- [x] Manter em Configurações somente o WhatsApp oficial da equipe.
- [x] Validar tipos e estados vazios em todas as listas e galerias de anúncios.

- [x] Criar painel do Divulgador com anúncios publicados/aguardando, status visuais e aviso interno de aprovação.
- [x] Ocultar o Ranking de Divulgadores e reorganizar o espaçamento do menu lateral.
- [x] Auditar e corrigir datas, estados públicos e diagnósticos da agenda de eventos futuros.
- [x] Simplificar a Gestão de Eventos com métricas clicáveis, busca e filtros essenciais, removendo blocos repetidos.
- [x] Compactar o topo da Gestão de Eventos e manter a listagem em uma área própria de rolagem.
- [x] Exibir na Gestão de Eventos somente eventos futuros ou ainda em andamento no horário de São Paulo.
- [x] Unificar Relatório Diário, Carrossel e Templates em uma Central de Relatórios / WhatsApp no menu lateral.
- [x] Variar layouts, paletas e composições dos flyers padrão gerados automaticamente.
- [x] Finalizar textos, agrupamento administrativo e filtros segmentados premium em um único bloco.
- [x] Agrupar Cadastros e Moderação no menu e adicionar rolagem própria às listas de estabelecimentos.
- [x] Diferenciar os atalhos e títulos administrativos com “Gerenciar Atrativos” e “Gerenciar Estabelecimentos”.
- [x] Renomear o grupo administrativo para “Gerenciamento de Cadastros”.
- [x] Simplificar a Gestão de Usuários, removendo indicadores redundantes e destacando a pesquisa global.
- [x] Reunir os filtros da Gestão de Usuários em um único botão compacto com contador de filtros ativos.
- [x] Aplicar o mesmo padrão compacto de filtros à Gestão de Eventos e ao painel administrativo.
- [x] Inserir um espaço publicitário rotativo e discreto acima do mapa na Home.
- [x] Mover o espaço publicitário para baixo do mapa e padronizá-lo com os banners de destaque da Home.
- [x] Compactar o espaço entre o banner publicitário e o rodapé da Home.
- [x] Exibir endereço completo com cidade e estado na prévia do Agendilha Informa.
- [x] Aplicar o endereço completo na linha 📌 do relatório, inclusive no compartilhamento direto.
- [x] Revisar interface mobile-first: telas principais, alvos de toque e menus/modais responsivos

- [x] Completar varredura mobile-first global de containers, grids, tabelas e tipografia

- [x] Corrigir responsividade do Informe AgendIlha

- [x] Remover Compartilhar Agendilha Informa da barra lateral
## Concluído
- [x] Invalidar o módulo antigo que causava erros `explode` e validar a página inicial atual no navegador.

- [x] Criar gestão administrativa de eventos publicados com início, término, edição e exclusão.
- [x] Ampliar a gestão de atrativos com cadastro, edição, exclusão, descrição e horário de funcionamento.
- [x] Disponibilizar os dados atualizados dos atrativos no formulário de eventos.
- [x] Atualizar o cadastro público de estabelecimento com ViaCEP e seletor de categoria.
- [x] Garantir contraste WCAG AA em todos os textos do cadastro público de estabelecimento.
- [x] Aplicar ViaCEP e seletor de categoria também aos cadastros administrativo e do divulgador.
- [x] Corrigir contraste WCAG AA em todas as páginas, painéis, tabelas, botões e textos secundários.

## Refatoração estrutural
- [x] Extrair infraestrutura global e centralizar rotas, cache e erros.
- [x] Consolidar acesso a dados, permissões e tipagem compartilhada.
- [x] Separar responsabilidades da Gestão de Eventos e do formulário de envio.
- [x] Padronizar componentes reutilizáveis e remover duplicações comprovadas.
- [x] Validar testes, tipos, build e fluxos principais sem mudança visual.

## Cadastro de estabelecimento
- [x] Permitir buscar o CEP por Estado, Cidade, Bairro e Nome da Rua no cadastro público.
- [x] Remover o campo separado de complemento e permitir informá-lo junto ao número.
