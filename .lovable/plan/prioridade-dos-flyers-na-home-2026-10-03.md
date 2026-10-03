# Prioridade dos flyers na Home

## Objetivo
Ajustar apenas a seleção do destaque principal da página inicial durante a promoção de lançamento.

## Implementação
- Separar os eventos com flyer entre “hoje” e “futuros”.
- Exibir automaticamente todos os flyers de hoje no destaque principal.
- Quando houver evento hoje, incluir flyers futuros somente se o destaque administrativo estiver ativo e válido.
- Quando não houver evento hoje, usar os flyers futuros como preenchimento automático.
- Preservar anúncios patrocinados, aleatoriedade da visita, limites atuais e atualização em tempo real.
- Atualizar a regra compartilhada e os registros técnicos do projeto para não alterar indevidamente a Agenda ou o Guia.

## Validação
- Cobrir os três cenários: hoje com flyer; futuro sem evento hoje; futuro liberado manualmente quando há evento hoje.
- Conferir a página inicial no navegador e confirmar que a seleção segue a data de São Paulo.
