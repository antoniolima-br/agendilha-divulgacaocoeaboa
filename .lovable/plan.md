# Destaque promocional automático por flyer

## Implementação
- Centralizar a regra promocional que considera automaticamente como destaque todo evento atual ou futuro com flyer válido.
- Aplicar a regra na seleção e ordenação do banner principal da página inicial.
- Aplicar a mesma regra na seção de destaques e na ordenação da agenda, sem exigir ativação individual.
- Manter intactos os controles financeiros e manuais, usando a promoção apenas como prioridade de exibição.
- Cobrir a regra e a ordenação com testes e validar visualmente a página inicial e a agenda.

## Detalhes técnicos
- A promoção será derivada dos dados públicos do evento (`image_url`) e não criará baixas financeiras.
- Eventos anteriores continuarão fora das listas públicas conforme o dia de São Paulo.
- A regra ficará centralizada para impedir divergências entre Home e agenda.
