# Flyers padrão com variação visual

## O que será feito
- Criar um conjunto de estilos para os flyers automáticos, com paletas e composições diferentes.
- Sortear um estilo a cada nova geração, mantendo título, categoria, data, horário e local sempre legíveis.
- Variar posição do título, tratamento da categoria, elementos gráficos, marca e bloco de informações.
- Manter o formato quadrado e o arquivo leve usado hoje.

## Detalhes técnicos
- Concentrar as variações no gerador de flyer padrão já usado no envio e na gestão de eventos.
- Separar paleta e composição para ampliar as combinações sem duplicar a lógica de conteúdo.
- Preservar o carregamento da marca e o fallback quando a imagem da marca não estiver disponível.
- Adicionar testes para garantir variedade, saída válida e segurança com campos opcionais.

## Validação
- Executar os testes específicos do gerador e a verificação de tipos.
- Gerar amostras para conferir legibilidade e diferenças visuais entre os estilos.
