# Otimização profunda de performance

## Objetivo
Reduzir o tempo de carregamento inicial, acelerar transições, diminuir requisições e trabalho de renderização, e preservar integralmente regras, dados e aparência atual.

## Gargalos identificados e prioridade

### Alta prioridade
- O pacote inicial ainda concentra cerca de 778 KB de JavaScript porque recursos globais pesados, especialmente o Guia, carregam em todas as páginas mesmo fechados.
- A Home dispara consultas sobrepostas da mesma fonte para agenda, gratuitos, flyers e contagem diária; isso transfere e processa dados repetidos.
- A agenda carrega até 1.000 eventos e depois busca avaliações usando todos os IDs, aumentando resposta, memória e tempo de interação.
- O carrossel principal mantém até seis flyers grandes no DOM e executa leitura de pixels em canvas para cada imagem, inclusive slides invisíveis.
- O provedor global de envios e permissões repetem leituras de papéis/perfil já disponíveis em cache, criando trabalho duplicado durante navegação.

### Média prioridade
- Algumas imagens visíveis ou administrativas não têm dimensões, carregamento tardio e decodificação assíncrona consistentes, favorecendo saltos visuais e consumo antecipado.
- Invalidações em tempo real atualizam grupos inteiros de consultas, mesmo quando uma alteração afeta um único item.
- A Home recalcula filtros de categoria repetidamente durante a renderização e possui conteúdo morto que continua no arquivo-fonte.
- O cache da aplicação é curto para dados públicos estáveis e não reaproveita dados de agenda entre Home, agenda e detalhes tão bem quanto poderia.
- Os indicadores de rota usam um único carregamento genérico, o que pode causar troca visual brusca.

### Baixa prioridade
- Há CSS global redundante e efeitos de blur/backdrop que podem pesar em aparelhos móveis modestos.
- Arquivos de ícones duplicam conteúdo e o cache offline inclui recursos que não precisam ser baixados imediatamente.
- Dependências de PDF, gráficos e animação já estão separadas, mas os limites entre pacotes podem ser refinados para melhorar cache entre versões.

## Implementação

1. **Carregamento inicial e rotas**
   - Carregar o Guia e o instalador somente após a primeira pintura/tempo ocioso, mantendo seus acionamentos existentes.
   - Manter divisão por página e adicionar pré-carregamento apenas para destinos públicos prováveis, acionado por intenção do usuário.
   - Trocar o carregamento genérico por uma estrutura estável que evite mudança brusca de altura.

2. **Home e renderização**
   - Consolidar as consultas públicas sobrepostas em uma fonte compartilhada com seleção derivada em memória e chaves de cache centralizadas.
   - Pré-calcular agrupamentos de região, bairro e categoria uma vez por atualização dos eventos.
   - Otimizar o carrossel para renderizar somente o slide ativo e vizinhos; executar análise visual apenas quando necessária e fora do caminho crítico.
   - Estabilizar callbacks e propriedades dos cartões para que listas não renderizem novamente sem mudança real.

3. **Agenda e dados**
   - Aplicar paginação/limites apropriados e carregar avaliações apenas para eventos exibidos, sem alterar os filtros públicos.
   - Reaproveitar o cache público entre Home e agenda quando os campos forem compatíveis.
   - Tornar atualizações em tempo real específicas e agrupadas, evitando tempestades de recarga.
   - Eliminar leituras duplicadas de perfil e permissões e evitar buscas globais de envios fora das telas que realmente usam esses dados.

4. **Imagens, assets e CSS**
   - Padronizar dimensões, `loading`, `decoding` e prioridade das imagens conforme posição visível.
   - Garantir que somente o primeiro flyer crítico seja prioritário; demais imagens ficam sob demanda.
   - Reduzir efeitos visuais caros em mobile e remover regras/conteúdo morto sem alterar o visual percebido.
   - Ajustar o cache offline para não antecipar pacotes grandes de relatórios, gráficos e geração de mídia.

5. **Bundle e memória**
   - Isolar bibliotecas do Guia, relatórios, PDF, gráficos e geração visual em pacotes carregados apenas quando usados.
   - Remover imports e dependências comprovadamente sem uso, sem tocar em recursos ativos.
   - Garantir limpeza de temporizadores, observadores, canais em tempo real e carregamentos de imagem.

6. **Validação**
   - Cobrir as novas funções de seleção, paginação e cache com testes.
   - Validar Home, agenda, detalhes e navegação em desktop e mobile, incluindo estados com e sem eventos.
   - Comparar tamanho dos pacotes, quantidade de requisições, estabilidade visual e tempo até interação antes/depois.
   - Registrar no projeto as decisões arquiteturais permanentes e documentar o resultado final por impacto.

## Limites de segurança
- Nenhuma regra de negócio, permissão, fluxo financeiro, conteúdo público ou aparência será removida.
- Alterações de consulta preservarão o corte de datas de São Paulo e todos os status públicos atuais.
- Otimizações serão aplicadas em etapas pequenas e verificáveis para facilitar reversão de qualquer regressão.
