# Varredura mobile-first completa

## Objetivo
Revisar as telas e componentes restantes para que o projeto funcione sem rolagem horizontal em celulares estreitos, mantendo a navegação adequada em cada tamanho de tela e a densidade atual no desktop.

## Implementação
- Remover larguras rígidas e limites mínimos que excedam a tela, usando containers fluidos com limites máximos apenas em telas maiores.
- Ajustar grids, cartões, seções, formulários e barras de ação para empilhar no celular e distribuir em colunas progressivamente no tablet e desktop.
- Manter a barra inferior exclusiva do mobile e a barra lateral exclusiva do desktop, com áreas de toque confortáveis e conteúdo protegido pelas áreas seguras do aparelho.
- Adaptar tabelas densas para rolagem interna controlada ou apresentação compacta no mobile, sem ampliar a largura da página.
- Limitar modais e menus à área visível, com ações empilhadas e rolagem interna quando necessário.
- Reduzir títulos grandes para `text-2xl` no mobile e preservar a escala maior a partir dos breakpoints adequados.
- Revisar Hero, categorias, cards, rodapé e páginas administrativas/públicas ainda não cobertas pela rodada anterior.

## Validação
- Verificar telas públicas e autenticadas em 320×720, 390×844 e desktop.
- Confirmar ausência de overflow horizontal, botões ocultos e sobreposição de textos.
- Executar testes relevantes, checagem de tipos e validação de alterações.
