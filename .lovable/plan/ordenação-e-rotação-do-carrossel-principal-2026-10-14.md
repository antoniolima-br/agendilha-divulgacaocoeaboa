# Ordenação e rotação do carrossel principal

## Resultado
- Exibir primeiro o rolê válido mais próximo, seguido dos demais por data e horário, sem ordem aleatória.
- Manter a faixa superior sincronizada com a data do flyer em foco durante toque, arraste, teclado e rotação automática.
- Girar os flyers a cada 5 segundos.
- Pausar enquanto houver mouse, toque, arraste ou foco sobre o carrossel e reiniciar a contagem completa após a interação terminar.

## Implementação
- Centralizar a comparação cronológica usando a data normalizada de São Paulo, horário inicial e um desempate estável.
- Aplicar a ordenação antes do limite de itens do carrossel, preservando somente eventos públicos atuais/futuros com flyer e os filtros ativos.
- Ajustar a pausa e retomada para mouse e toque sem interferir no toque central, nas laterais ou no gesto de arraste.
- Manter o callback do item ativo como fonte da seleção visual na faixa de dias.

## Validação
- Adicionar testes para ordem por data, ordem por horário e estabilidade em empates.
- Cobrir autoplay aos 5 segundos, pausa por mouse/toque e retomada com nova contagem de 5 segundos.
- Cobrir a atualização da faixa superior ao trocar o flyer.
- Conferir a Home em computador e celular, incluindo arraste, toque central e ausência de rolagem lateral.
