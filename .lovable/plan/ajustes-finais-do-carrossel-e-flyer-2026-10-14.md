# Ajustes finais do carrossel e flyer

## Resultado
- Manter o carrossel principal avançando a cada 5 segundos.
- Pausar somente enquanto houver pressão ativa de mouse ou toque; ao soltar, reiniciar os 5 segundos completos.
- Abrir o flyer em uma visualização limpa e, ao fechar, voltar diretamente à Home e ao carrossel.
- Remover da experiência pública contagens de visualizações, downloads de formatos e o selo “Ver detalhes”.
- Exibir a arte completa do flyer ampliado, sem cortes, preservando a proporção original.
- Manter métricas disponíveis apenas em Marketing e Curadoria na Gestão Setorial.

## Implementação
- Ajustar os estados de interação do carrossel para pressão ativa, preservando gestos laterais e teclado.
- Atualizar o fluxo de abertura da Home para usar a visualização ampliada sem desviar para telas intermediárias.
- Simplificar as ações públicas da visualização do evento para compartilhamento, mapa, transporte, denúncia e fechamento.
- Trocar a imagem ampliada para enquadramento integral com fundo discreto.
- Remover a contagem pública da Agenda, sem alterar coleta ou painéis internos.

## Validação
- Cobrir autoplay, pausa durante pressão e retomada após 5 segundos.
- Cobrir abertura e fechamento com retorno à Home.
- Confirmar ausência de “Feed”, downloads, “Ver detalhes” e contagens públicas.
- Conferir flyers verticais e horizontais em celular e computador, sem cortes ou overflow.
