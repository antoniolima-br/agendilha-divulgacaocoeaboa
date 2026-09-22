# Otimização profunda de performance

## Objetivo
Deixar o app mais rápido no primeiro acesso, nas trocas de página e no uso contínuo, preservando design, regras, rotas e recursos atuais.

## Gargalos e prioridade

### 1. Consultas e estado duplicados — impacto crítico
- Perfil, permissões, cargos e colaborador são consultados repetidamente por diferentes áreas da mesma tela.
- A lista de envios mantém uma segunda fonte de dados global, fora do cache compartilhado, e baixa colunas sem limite.
- A agenda baixa todos os eventos aprovados e todas as avaliações, inclusive registros que não serão exibidos.
- Efeito: mais tráfego, espera após login, dados divergentes, memória crescente e recargas desnecessárias.

### 2. Código e trabalho no carregamento inicial — impacto alto
- A página inicial importa seções abaixo da primeira tela e componentes animados antes de serem necessários.
- Cada card de evento cria observadores e animações JavaScript próprias.
- Algumas bibliotecas instaladas não têm uso no produto.
- Efeito: mais JavaScript para baixar e processar, especialmente perceptível em celulares.

### 3. Imagens, fontes e conteúdo visual — impacto alto
- Logos e banners ainda têm arquivos grandes; carrosséis carregam versões duplicadas e miniaturas antecipadamente.
- A fonte externa é descoberta tarde pelo navegador.
- Algumas imagens fora da primeira tela não usam carregamento adiado.
- Efeito: piora do primeiro conteúdo visível, consumo de dados e competição com conteúdo prioritário.

### 4. Atualizações em tempo real e tarefas contínuas — impacto médio
- Telas podem abrir canais repetidos; favoritos usam nomes aleatórios; mudanças em lote geram várias atualizações seguidas.
- O registro offline mantém listeners e intervalo sem rotina central de descarte.
- Efeito: conexões e processamento redundantes em sessões longas.

### 5. Fluidez visual e navegação — impacto médio
- A barra lateral pode surgir depois da autorização e deslocar a página.
- Alguns cálculos de menu e filtros se repetem sem necessidade.
- Efeito: pequenas travadas, piscadas e mudanças de posição.

## Implementação

### Etapa A — ganhos seguros e imediatos
1. Adiar imagens fora da primeira tela, definir decodificação assíncrona e priorizar apenas a imagem principal.
2. Remover prefetch individual de imagens em listas e impedir que carrosséis carreguem todas as cópias borradas imediatamente.
3. Substituir animações JavaScript repetidas nos cards por animações CSS leves, respeitando redução de movimento.
4. Memorizar filtros de menu e estabilizar funções/valores retornados por hooks frequentes.
5. Padronizar tempos de cache e chaves de favoritos; estabilizar o canal em tempo real e agrupar invalidações em rajada.
6. Remover dependências confirmadamente sem uso.

### Etapa B — dados e cache compartilhado
1. Migrar perfil e identificação visual para cache compartilhado, mantendo o evento atual de atualização de perfil compatível.
2. Evitar leituras repetidas de cargos/permissões entre autenticação, menu e identificação do usuário.
3. Transformar o estado global de envios em uma camada fina sobre o cache já existente, preservando a interface usada pelas telas.
4. Trocar projeções amplas por campos explícitos nas listagens de maior tráfego e aplicar limites seguros nas telas administrativas.
5. Buscar avaliações apenas dos eventos carregados e limitar a agenda ao intervalo necessário, mantendo arquivo e filtros funcionais.

### Etapa C — carregamento e navegação
1. Separar seções abaixo da primeira tela em blocos carregados sob demanda, com espaços reservados estáveis.
2. Pré-carregar páginas prováveis durante intenção do usuário, sem baixar áreas administrativas para visitantes.
3. Reservar o espaço da navegação lateral enquanto as permissões carregam, evitando deslocamento visual.
4. Ajustar o cache offline para não revalidar respostas de dados sensíveis ou dinâmicos como conteúdo estático.

### Etapa D — assets e produção
1. Gerar versões WebP/AVIF adequadas dos logos e anúncios, preservando os originais quando necessários para instalação.
2. Aplicar dimensões explícitas e `srcset` onde houver imagens grandes com exibição pequena.
3. Revisar divisão de pacotes para manter PDF, gráficos, editor e ferramentas administrativas fora do carregamento público.
4. Remover CSS e arquivos comprovadamente órfãos apenas após checar todas as referências.

## Segurança contra regressões
- Não alterar os arquivos excluídos pelo pedido atual.
- Fazer a migração de cache mantendo contratos existentes antes de remover código antigo.
- Não mudar aparência, textos, permissões, regras de datas ou fluxos de cadastro.
- Medir antes/depois: tamanho dos pacotes, quantidade de requisições, imagens transferidas e estabilidade visual.

## Validação
- Executar testes automatizados e verificação de tipos após cada etapa.
- Testar navegação pública, login, menu por perfil, agenda, arquivo, favoritos, envio e moderação.
- Conferir desktop e celular com navegador real, incluindo carregamento frio, trocas de página e ausência de erros novos.
