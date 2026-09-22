# Simplificar a Gestão de Eventos

## Objetivo
Deixar `/admin/events` focada na curadoria, removendo controles repetidos sem alterar as ações existentes sobre os eventos.

## Alterações
- Remover da página o bloco de “Solicitações de alteração”.
- Remover os chips de “Filtro rápido”.
- Manter os quatro cards de métricas no topo e reforçar seu uso como filtros clicáveis, com estado selecionado visível e acessibilidade por teclado.
- Manter somente a busca e os seletores de status e categoria abaixo das métricas.
- Preservar o botão de limpar filtros e todas as ações da listagem.
- Ajustar espaçamento para aproximar métricas, filtros e resultados.

## Validação
- Confirmar que cada card aplica o status correspondente e que “Total” limpa o status.
- Confirmar busca, categoria, status e limpeza de filtros.
- Executar os testes relacionados e a validação de tipos.
