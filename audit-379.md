# Auditoria 379

## Método e cobertura
Revisão por domínios: rotas, componentes compartilhados, formulários, hooks/dados, sessão, permissões, integrações, migrações e uploads. Suspeitas históricas foram comparadas às funções e políticas instaladas no Lovable Cloud, sem assumir que uma migração antiga representa o estado atual.

## Problemas confirmados
| Problema e causa | Impacto | Correção |
| --- | --- | --- |
| Matcher de miniatura excluía JPEG e extensões maiúsculas | Listagens baixavam arte maior apesar da miniatura existir | Extensões normalizadas e matcher case-insensitive; parâmetros/fragmentos preservados |
| Erro da miniatura acionava fallback genérico | Flyer oficial disponível desaparecia | Agenda/descoberta tentam a arte oficial uma vez, sem loop |
| Selo Hoje derivava a data de UTC | Dia incorreto entre 21h e 24h no Rio | Helper de São Paulo; teste às 01h UTC correspondente a 22h do dia anterior |
| Anúncios paginados só por created_at | Empates podiam duplicar/omitir anúncios entre páginas | Desempate por ID, preservando ordem e filtros |
| CEP sem cancelamento e identificação de requisição | Resposta antiga sobrescrevia endereço novo ou campos após apagar CEP | AbortController, descarte de respostas obsoletas e cancelamento ao desmontar |
| Erro do CEP era descartado | Sem orientação para completar o endereço | Aviso curto mantendo entrada manual |
| Upload sem teclado e clique do input propagando ao pai | Seletor inacessível e ativação repetida | Enter/Espaço, nome acessível, interrupção da propagação e remoção limpa |
| Diálogos sem título associado | Sem nome para leitor de tela; aviso do Radix | DialogTitle nos detalhes e card social |
| Imagem/rodapé consumiam altura dos detalhes no celular | Data/endereço sem área útil | Imagem e ações compactas só no celular; área de conteúdo com rolagem |
| Clientes tinham privilégios de exclusão de perfil sem uso | Risco latente caso políticas futuras fossem ampliadas | Revogados DELETE/TRUNCATE/REFERENCES/TRIGGER; leitura/edição e exclusão confiável preservadas |

## Segurança: hipóteses descartadas
- Todas as tabelas públicas consultadas têm RLS. As tabelas sem política verificadas não têm privilégios diretos de visitantes/contas comuns.
- `is_admin_or_master` instalado já inclui Sênior e isola perfis setoriais. Hierarquia não foi alterada.
- Trigger instalado impede papéis administrativos no perfil: autoridade continua em user_roles.
- Estado persistente do menu entre páginas não foi tratado como defeito confirmado nem removido.
- Visitante foi redirecionado de `/admin/users` para login com retorno preservado.

## Validação
- Baseline: 644 testes/133 arquivos. Final: **654 testes/134 arquivos aprovados**; regressões de CEP, arquivos, imagem, datas e consulta administrativa mantidas no projeto.
- Revisão focalizada dos arquivos alterados: sem erros nem avisos. Verificação automática atual: build OK.
- 68 destinos estáticos em 320/768/1280/2560 px: 272 navegações sem overflow horizontal observado. `/ranking` teve uma falha transitória; nova tentativa como visitante navegou com sucesso para o destino de proteção, sem overflow.
- Sessão real em 390/1280 px: Agenda com 15 eventos, próxima/anterior funcionando, detalhes nomeados e fechamento com Escape. Área de conteúdo dos detalhes: 238px no celular e 663px no computador.
- Perfil, Meus eventos, Radar, Explorar, anúncios, intranet, pitch e cadastro de estabelecimento abertos nos dois tamanhos, sem overflow.
- Migração validada por SQL: DELETE de perfil negado a anon/authenticated; SELECT/UPDATE autenticados e DELETE do serviço confiável preservados.

## Limites
- Nenhum evento, pagamento, conta, moderação ou avaliação real foi criado/alterado para teste. Upload coberto por testes controlados, sem publicação de arte fictícia.
- Login por senha, recuperação assistida, webhooks, entrega externa de WhatsApp e instalação/atualização real de PWA não foram exercitados de ponta a ponta nesta rodada.
- Nem todas as combinações de cargos e CRUDs protegidos foram executadas com contas próprias e dados autorizados.
- A suíte completa ainda emite avisos preexistentes do ambiente de testes (act/flags futuras do roteador); não foram ocultados.
- Esta revisão não é análise linha a linha de todos os arquivos nem certificação de produção; não demonstra ausência de todos os bugs.