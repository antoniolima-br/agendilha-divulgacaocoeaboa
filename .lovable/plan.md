# Gestão de eventos publicados e atrativos

## Alterações
- Criar uma página administrativa focada nos eventos publicados, com busca, data, início, término, local e ações de editar ou excluir com confirmação.
- Manter a edição rápida existente para preservar as validações e atualizar a lista imediatamente após salvar.
- Ampliar “Gerenciar Atrativos” para cadastrar, editar e excluir nome, categoria, descrição e horário de funcionamento.
- Salvar o horário de funcionamento junto ao atrativo e disponibilizá-lo na busca usada pelo formulário de eventos.
- Exibir no formulário o horário do atrativo selecionado, sem confundi-lo com a agenda de apresentações já cadastradas.
- Adicionar os acessos às duas áreas no menu administrativo, respeitando as permissões atuais.

## Regras preservadas
- Somente administradores com as permissões atuais poderão editar ou excluir.
- A exclusão sempre pedirá confirmação.
- O horário previsto para término do evento continuará opcional.
- A validação de intervalo mínimo de duas horas na agenda do atrativo continuará ativa.

## Detalhes técnicos
- A lista de eventos usará apenas estados públicos e bloqueará itens moderados como indisponíveis.
- O horário de funcionamento será um campo textual flexível, adequado para formatos como “Ter–Dom, 10h–22h”.
- A base receberá a nova informação com as mesmas regras de acesso já aplicadas aos atrativos.
- Serão atualizados testes de navegação, filtros e operações principais; depois, as duas páginas serão conferidas em celular e desktop.
