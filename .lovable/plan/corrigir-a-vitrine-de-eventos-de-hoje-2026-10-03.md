# Corrigir a vitrine de eventos de hoje

## Objetivo
Garantir que a Home reconheça a data do evento pelo calendário de São Paulo e não esconda flyers válidos do dia por conversão de fuso, formato ou limite do carrossel.

## Alterações
- Normalizar toda data recebida antes de compará-la com o dia atual de São Paulo.
- Ordenar os flyers colocando todos os eventos de hoje antes dos eventos futuros.
- Ajustar a quantidade da vitrine para comportar integralmente os flyers de hoje, preservando a rotação futura existente.
- Manter título, horário, local e flyer vinculados ao evento correto.
- Adicionar testes para datas simples, datas em formato brasileiro, timestamps próximos à virada do dia e vários eventos no mesmo dia.

## Validação
- Executar os testes focados da seleção de destaques e das datas.
- Conferir a Home em desktop e celular, verificando quantidade, informações e navegação dos flyers de hoje.

## Detalhes técnicos
A comparação usará a normalização centralizada de datas e `America/Sao_Paulo`, sem depender do fuso local do navegador. O limite dinâmico será no mínimo a quantidade de eventos de hoje, evitando truncamento quando o volume diário exceder o limite padrão.
