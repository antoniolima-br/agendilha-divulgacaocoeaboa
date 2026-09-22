# Validade dos eventos na gestão ativa

## Alterações
- Criar uma regra única de validade usando data, horário final e fuso de São Paulo.
- Manter na Gestão de Eventos somente eventos futuros ou ainda em andamento.
- Considerar eventos de hoje sem horário final válidos até o fim do dia.
- Excluir da gestão ativa registros vencidos, inválidos ou sem data, independentemente do status.
- Calcular métricas, filtros, exportação e resumos apenas sobre a lista ativa.
- Preservar os aprovados vencidos na visão pública de Arquivo já existente.

## Validação
- Cobrir eventos futuros, em andamento, encerrados, sem término e com data inválida.
- Confirmar que filtros e métricas usam somente eventos ativos.
