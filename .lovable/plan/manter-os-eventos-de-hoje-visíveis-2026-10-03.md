# Manter os eventos de hoje visíveis

## Objetivo
Garantir que a agenda pública considere o calendário de São Paulo e esconda somente eventos com data anterior ao dia atual.

## Alterações
- Centralizar a decisão “hoje ou futuro” na regra compartilhada de datas.
- Aplicar essa regra às consultas e listas públicas que ainda usam cortes de data inconsistentes.
- Preservar a página de arquivo, que continuará mostrando apenas eventos anteriores.
- Adicionar testes cobrindo ontem, hoje, amanhã e datas inválidas.

## Validação
- Executar os testes da agenda e a verificação de tipos.
- Conferir no navegador que um evento de hoje aparece e um de ontem não aparece na agenda atual.
