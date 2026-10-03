# Escolha de anúncio e separação de estabelecimentos

## O que será feito

### Divulgação de eventos
- Adicionar uma escolha obrigatória e clara entre **Anúncio Gratuito** e **Anúncio com Destaque** na revisão do envio.
- Manter eventos gratuitos sem flyer automático e no fim da agenda.
- Para **Com Destaque**, gerar o flyer oficial, salvar a intenção de contratação e, após o envio, abrir uma página própria com os planos disponíveis.
- Na página de contratação, permitir escolher o plano e iniciar o atendimento pelo WhatsApp oficial com evento, plano e link já preenchidos.
- A prioridade na Home só será ativada depois da confirmação financeira pela equipe; até lá, o evento fica como destaque solicitado, sem simular pagamento.
- Preservar o envio de vários eventos no mesmo estabelecimento, aplicando a escolha de divulgação a todos os eventos do lote.

### Locais de rolê e negócios gerais
- Criar uma classificação persistente para diferenciar **Local de evento/rolê** de **Negócio geral**.
- Manter todos os estabelecimentos já cadastrados como locais de rolê.
- Separar cadastro e listagem nos painéis do divulgador e administrador, com categorias próprias para negócios gerais, como farmácia, padaria e mercado.
- Excluir negócios gerais das buscas e seletores usados no cadastro de eventos, impedindo vínculo acidental com a agenda.
- Manter a área de negócios gerais apenas nos painéis, sem criar página pública.

## Detalhes técnicos
- Adicionar `promotion_choice` às submissões e `listing_kind` aos estabelecimentos, com valores padrão compatíveis com os registros atuais.
- Atualizar consultas, tipos, chaves de cache e a busca de estabelecimentos para filtrar por finalidade.
- Criar uma rota protegida de contratação vinculada ao evento enviado.
- Reaproveitar os pacotes, configurações e WhatsApp oficiais existentes.
- Não ativar `is_highlight`, datas de destaque ou baixa financeira pelo cliente; esses campos continuam sob o fluxo administrativo e `payment_records`.

## Validação
- Testar envio gratuito e envio com destaque, incluindo geração do flyer e redirecionamento correto.
- Testar contratação de um plano sem ativação pública antecipada.
- Testar criação, edição e listagem separadas de locais de rolê e negócios gerais.
- Confirmar que negócios gerais não aparecem no seletor de local do evento.
- Verificar os fluxos em computador e celular, além de testes automatizados e validação de tipos.
