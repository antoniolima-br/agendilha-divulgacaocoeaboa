# Auditoria técnica — 10/10/2026

## Escopo e limites

Revisão paralela de estrutura, rotas, autenticação e hidratação de sessão, permissões, consultas pessoais/públicas, formulários, compartilhamento, estado global, APIs, funções, migrations, moderação, publicidade, finanças e responsividade. Consultas ao banco foram somente de leitura; migrations modificaram apenas funções e permissões, sem alterar registros de negócio. O design existente foi preservado.

Não é uma certificação de ausência de todos os bugs nem uma garantia de prontidão para produção. Não foram criados eventos, feitas baixas financeiras, removidas contas ou enviadas mensagens reais para teste.

## Problemas confirmados e correções

| Problema | Causa e impacto | Correção |
|---|---|---|
| Privacidade na busca de atrativos e locais | Três RPCs SECURITY DEFINER retornavam registros pendentes de outras contas, contornando a restrição de visibilidade e incluindo contatos. | Aplicada visibilidade por aprovação, proprietário/responsável ou equipe autorizada antes da busca e paginação. Execução anônima recusada. Contatos de registros aprovados continuam disponíveis ao cadastro autenticado. |
| Concorrência nos favoritos | Cliques rápidos em vários controles podiam duplicar gravações; a intenção dependia de estado anterior e o rollback podia atingir a conta ativa após troca de sessão. | Gravações serializadas por proprietário/QueryClient; intenção e proprietário explícitos; rollback e invalidação no cache original. |
| Respostas atrasadas nas sugestões | Acertos de cache, fechamento e paginação não invalidavam uniformemente requisições anteriores; cliques imediatos podiam duplicar páginas. | Sequência invalidada no ciclo completo, cancelamento da busca/paginação, trava síncrona de paginação e descarte de respostas obsoletas. |
| Falhas silenciosas nos formulários | Erros de consulta eram convertidos em listas vazias, sugerindo ausência de cadastro. | Erros propagados ao hook, sem cache de falha; mensagens acionáveis nos seletores de atrativos e locais. |
| Página ativa incorreta no menu | Comparação por prefixo ativava Meus eventos e Compartilhar meus eventos simultaneamente. | Helper central por segmentos, correspondência exata de irmãos e aria-current para leitores de tela. |
| Reassinatura de notificações | useToast reinstalava o listener em cada mudança de estado. | Uma assinatura por montagem, com sincronização inicial e limpeza ao desmontar. |
| Lacunas de regressão em compartilhamento | Fluxos nativo, cancelamento, falha e ausência de clipboard não tinham testes próprios. | Cobertura de compartilhamento nativo/fallback, cancelamento silencioso, cópia e codificação de WhatsApp. |

## Achados descartados após confirmação

- `event_day` existe na view pública ativa; a consulta do Guia não foi alterada por uma hipótese incorreta de coluna ausente.
- `search_atrativos_autocomplete_v2` já estava versionada em `drizzle/migrations/0001_add_attraction_opening_hours.sql`; não foi criada uma cópia redundante.
- Ações de promover/rebaixar usuários já possuem guarda `canManageUsers`, além de proteção no banco; não houve alteração desnecessária.
- Filtros globais compartilhados entre Home, Agenda e Guia são requisito; não foram reiniciados por página.
- Financeiro mantém RPCs protegidos e registros de receita imutáveis; não foram apagados autores históricos por uma hipótese de dados órfãos.
- O período de fim de semana no domingo não foi redefinido sem requisito; a interface usa o calendário comum.

## Segurança e verificações

- Todas as tabelas públicas consultadas têm RLS ativo. Duas tabelas legadas sem política permanecem bloqueadas, não foram abertas.
- Os 51 alertas do verificador foram classificados, não tratados como 51 vulnerabilidades: views públicas de campos permitidos e RPCs privilegiados exigem inspeção de sua proteção interna. Não foram removidas permissões necessárias à operação.
- Permissões administrativas vêm de `user_roles`; colaboradores usam suas permissões protegidas. Consultas pessoais continuam restritas ao usuário autenticado.
- Home/Agenda e redirecionamentos de Radar, Meus eventos e Administração foram exercitados sem sessão; calendário abre com dias disponíveis. Esses testes não validam operações autenticadas.
- Primeira suíte: 60 arquivos e 330 testes aprovados. Novos testes cobrem os problemas confirmados; nova suíte completa: 66 arquivos, 349 testes aprovados (19 novos), sem falhas.

## Pendências de verificação, não garantias

- A conta solicitante não tem sessão/conta correspondente disponível para teste autenticado. Login/logout real, persistência após reload, CRUDs administrativos, upload autenticado, edição de campanhas e releitura de favoritos dependem de uma sessão autorizada na prévia.
- Abertura do pitch exige confirmação com a senha privada escolhida; ela não está disponível ao agente.
- Compartilhamento pessoal completo depende de um evento próprio publicado ativo; nenhum evento foi criado para suprir isso.
- Fluxos de produção, falhas de provedores externos, concorrência em carga e auditoria de penetração não estão certificados por esta revisão.
## Nova varredura final

- 349 testes aprovados; compilação automática do projeto confirmada sem erros após correções.
- 15 verificações reais de Home, Agenda, autenticação, escolha de perfil e cadastro público em larguras 390, 1280 e 1920 px: páginas visíveis e sem transbordamento horizontal. Calendário abriu nos três tamanhos; a seleção de uma data não foi afirmada por esta rodada.
- Releitura no banco confirmou os três RPCs com filtro por proprietário e sem permissão de execução anônima.
- Permanecem avisos de teste existentes (act/avisos de futura versão do roteador em harnesses), não ocultados nem tomados como falhas de produção.
- Os fluxos autenticados e os itens antigos bloqueados do roadmap continuam explicitamente pendentes; nenhuma operação sensível foi declarada verificada sem sessão.
