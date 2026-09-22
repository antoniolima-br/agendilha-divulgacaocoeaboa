# Revisão mobile-first e responsiva

## Objetivo
Garantir navegação confortável e sem cortes nas telas principais do AgendIlha, com controles adequados ao toque e menus que se adaptem ao celular.

## O que será ajustado

### 1. Base responsiva compartilhada
- Padronizar botões, seletores, itens de lista e controles interativos com área mínima de toque de 44 × 44 px no celular.
- Fazer diálogos ocuparem a largura útil da tela, respeitarem margens e área segura, e terem rolagem interna quando o conteúdo for alto.
- Fazer gavetas laterais usarem largura fluida no celular, sem ultrapassar a tela, com fechamento confortável.
- Limitar menus suspensos à largura e altura visíveis do aparelho, com rolagem interna quando necessário.

### 2. Navegação lateral
- Manter a barra lateral como gaveta no celular e como painel estável nas telas maiores.
- Aumentar as áreas de toque de itens e subitens, preservar o fechamento após navegar e evitar textos espremidos.
- Respeitar a área segura inferior em aparelhos com barra de gestos.

### 3. Home e Painel do Divulgador
- Revisar faixas horizontais, cards, banners, abas e ações para impedir overflow e cortes em telas estreitas.
- Garantir dimensões estáveis para navegação dos carrosséis e botões circulares.
- Tornar cabeçalhos e ações do painel empilháveis no celular, mantendo abas legíveis e tocáveis.

### 4. Central de Relatórios / WhatsApp
- Empilhar seletor de data e atalhos no celular, mantendo largura total quando necessário.
- Preservar as duas colunas no desktop e uma coluna no celular.
- Fazer a lista e a prévia rolarem internamente sem ultrapassar a altura da tela.
- Empilhar os botões de copiar e compartilhar no celular.

### 5. Moderação e Cadastros
- Adaptar barras de busca, filtros, indicadores e ações para telas estreitas.
- Aumentar os botões de ação da moderação no celular e permitir quebra organizada das ações expandidas.
- Manter listas longas com rolagem própria, sem overflow horizontal.
- Ajustar formulários de Atrativos e Estabelecimentos para campos e ações em largura total no celular.

### 6. Validação visual
- Verificar Home, Painel do Divulgador, Central de Relatórios, Moderação, Atrativos e Estabelecimentos em celular estreito e desktop.
- Conferir ausência de overflow horizontal, textos cortados e controles menores que o recomendado.
- Rodar os testes relacionados à navegação e aos fluxos alterados.

## Detalhes técnicos
- Priorizar ajustes nos componentes compartilhados de botão, input, seleção, diálogo, gaveta, popover e abas para obter consistência global.
- Aplicar correções locais somente onde a densidade da tela exigir comportamento específico.
- Preservar a identidade visual, as regras de acesso e toda a lógica atual do aplicativo.
