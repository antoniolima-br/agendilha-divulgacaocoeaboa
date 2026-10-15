# Auditoria complementar — 15/10/2026

## Alcance

Revisão paralela de estrutura, rotas, autenticação, sessão, permissões, dados, formulários assíncronos, integrações, operações financeiras, intranet, acessibilidade e desempenho. Consultas ao banco somente de leitura. Preservados visual, funcionalidades, fonte protegida de cargos e restrições administrativas. Áreas excluídas pelo solicitante não foram auditadas.

Esta revisão não certifica ausência de todos os defeitos nem prontidão integral para produção.

## Falhas confirmadas corrigidas

| Problema | Causa e impacto | Correção e evidência |
|---|---|---|
| Sessão inicial obsoleta após saída/troca de conta | A resposta tardia de getSession podia sobrescrever um evento de autenticação mais recente. | Sequência e guarda de montagem descartam respostas antigas. Teste reproduz saída antes da conclusão da leitura inicial. |
| Estado administrativo anterior durante troca de conta | isAdmin permanecia com o valor da conta anterior até concluir a hidratação. | Estado anterior limpo imediatamente, mantendo bloqueio durante hidratação. Teste verifica nova identidade sem autoridade anterior. |
| Carregamento infinito quando descoberta de sessão rejeita | A promessa inicial não tinha tratamento de rejeição. | Finalização de carregamento e registro protegido da falha; teste com promessa rejeitada. |
| Saída malsucedida sem aviso | O resultado de signOut era ignorado. | Falha agora mostra orientação para tentar novamente, sem afirmar que a conta saiu. Teste cobre erro devolvido pelo serviço. |
| Favoritos concorrentes com rollback destrutivo | Operações de eventos diferentes podiam executar simultaneamente; restaurar a lista inteira apagava a intenção otimista de outro evento. Atualização da primeira escrita também podia reler antes da segunda terminar. | Fila por proprietário/QueryClient, rollback somente do evento afetado e invalidação após concluir operações do proprietário. Testes cobrem falha da primeira escrita, preservação da segunda e dois controles do mesmo evento. |
| Relação acessível ausente em submenus | Controles de expansão não indicavam o contêiner controlado. | aria-controls e IDs correspondentes, teste de todas as expansões visíveis para Master e conferência real de quatro grupos. |
| Referência vazia instável na Curadoria | Array vazio recriado a cada renderização enquanto a consulta carregava invalidava a memoização da busca. | Referência vazia estável, sem alterar dados ou filtros. |
| Imports sem uso | Configurações e apresentação comercial tinham imports desnecessários. | Removidos, sem alteração visual. |

## Verificações realizadas

- Primeira suíte: 562 testes em 121 arquivos. Suíte final atual: 561 testes em 121 arquivos, todos aprovados; seis novos casos de sessão/concorrência também executados em rodada focada de 32 testes. A contagem não é apresentada como ganho de cobertura: o conjunto de testes anterior mudou durante a rodada.
- Compilação automática: última entrada consultada informa build OK.
- Arquivos alterados: verificador de qualidade sem erros, com dez avisos de manutenção restantes; não ocultados.
- Banco: tabelas públicas com RLS ativo; tabelas sem política permanecem bloqueadas. Intranet exige Master no servidor. Financeiro consultado usa funções protegidas. RLS ativo não é, sozinho, prova de segurança de todas as políticas.
- Sessão real: Agenda, Meus eventos, Financeiro e Visão Consolidada abertos em 390 e 1280 px, sem transbordamento horizontal nas oito verificações.
- Favorito real: adicionado, relido após nova navegação e removido para restaurar a preferência original; estado confirmado na interface.
- Logout real: saída seguida de acesso a Meus eventos levou à autenticação, preservando o destino pretendido.
- Nenhum evento, pagamento, despesa ou conta de terceiros foi criado/alterado/excluído para validar.

## Hipóteses não aplicadas

- Não liberar cargos setoriais em computePermissions: isolamento setorial também é regra no servidor, não um defeito confirmado.
- Não remover o bloqueio conservador quando a verificação de troca de senha falha: isso permitiria contornar proteção de conta por indisponibilidade.
- Não ampliar números aceitos no login sem evidência de conta afetada: o formato legado atende normalização histórica do prefixo, não prova necessidade de aceitar fixos.
- Upsert de senha não apaga automaticamente campos omitidos de um registro existente; a hipótese de perda de dados não foi confirmada.
- Relógio do Financeiro: dependência do relógio local registrada, mas não substituída por RPC inexistente ou novo serviço sem requisito.

## Pendências e limites

- Imagem do Coezinho: no servidor local, o endereço gerenciado do recurso retorna HTML, não imagem; naturalWidth permanece zero. A entrega desse recurso depende da infraestrutura de assets. Não regenerada nem substituída a arte existente.
- Verificador global inicial: 20 erros e 445 avisos de manutenção. Não equivalem a falhas de produção; a lista inclui arquivos gerenciados/excluídos e testes. Não foi declarada limpeza global desses avisos.
- Login com senha real, abertura das apresentações com senha privada, upload/cadastro completo, moderação e baixas financeiras novas não executados. Dependem de senha privada, registro próprio ou autorização de lançamento de teste.
- Configurações hospedadas de senha, integrações externas/webhooks, métricas em carga, Lighthouse e monitoramento contínuo permanecem não verificados.
- As pendências históricas do roadmap continuam válidas; acesso de leitura não comprova um CRUD completo.