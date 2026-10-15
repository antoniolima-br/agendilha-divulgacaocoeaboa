# Refatoração interna — organização e duplicações

## Análise e prioridades

Revisão por áreas de dados, hooks, utilitários, componentes, navegação, autenticação e integração. As fontes de autoridade, rotas e chaves de consultas já têm módulos centralizados; substituí-los sem necessidade aumentaria risco. Esta rodada não é uma certificação linha a linha de toda a base.

1. **Paginação repetida (prioridade alta):** histórico pessoal, compartilhamento pessoal e Curadoria repetiam acumulação, cálculo de intervalos, tratamento de falhas e parada. Centralizados em `src/data/pagination.ts`, mantendo consultas novas por página, filtros, ordenação e tamanho original.
2. **Transporte misturado à apresentação (prioridade alta):** buscas de atrativos/estabelecimentos executavam chamadas diretamente nos componentes. Adaptadores tipados foram extraídos para `src/data/autocomplete.ts`, sem alterar contratos públicos dos componentes, cancelamento, mensagens ou critérios de busca.
3. **Código morto e efeitos duplicados (prioridade média):** removidos cálculo nunca consumido, callback sempre falso, imports sem uso, índice sem uso e propriedade duplicada do autocomplete. As duas buscas reutilizam `useEntityRevision` para atualização de entidades, substituindo efeitos locais equivalentes. Removidos imports e variável não utilizados nos módulos de eventos/perfis.

## Limites de segurança e compatibilidade

- Nenhuma migração, alteração de dados, permissões, autenticação, rotas, cobrança ou regras de negócio.
- Propriedade deriva da sessão, não do argumento arbitrário do chamador; Curadoria continua separada das consultas pessoais.
- Os critérios diferentes de cada consulta foram preservados, não fundidos em uma abstração genérica de visibilidade.
- Nomes exportados e interfaces dos componentes/hooks existentes permanecem compatíveis.
- Nenhuma alteração de classes visuais ou controles.
- Telas privadas exigem sessão autorizada para validação real; não foram usadas contas arbitrárias nem realizadas operações reais de moderação ou pagamento.

## Validação

- Antes da refatoração: 66 arquivos / 349 testes aprovados.
- Regressões acrescentadas: limites inclusivos, múltiplas páginas, resultado vazio, falha sem retorno parcial, parâmetros de busca, cancelamento, erros do servidor e filtros da Curadoria em cada página.
- Resultado final: 72 arquivos / 376 testes aprovados; lint dos módulos alterados sem apontamentos e compilação automática confirmada.
- Seleção de atrativo/local e fechamento da lista cobertos por testes de interação; atualização por entidade e isolamento entre tipos cobertos por regressões.
- Agenda real conferida com eventos cadastrados e calendário aberto em 1280 px, sem mudança de aparência; isso não valida telas privadas.

## Continuidade

Refatorações futuras devem seguir evidência de duplicação e testes equivalentes; mover pastas ou unificar jornadas apenas por estética não é uma melhoria segura. Fluxos protegidos sem sessão real permanecem fora da afirmação de equivalência end-to-end desta rodada.

## Rodada 358 — dados derivados, perfil e utilitários

### Mudanças executadas

- As leituras repetidas de cargos usadas por permissões, detalhes administrativos e situação do divulgador passaram por um adaptador compartilhado. A hidratação inicial da sessão continua independente para não acoplar o acesso ao cache de consultas.
- Invalidações derivadas de alterações de perfil, colaborador e cargo foram centralizadas e cobertas por testes. Edições agora atualizam explicitamente permissões, situação de divulgação, detalhes do usuário e listas administrativas relacionadas.
- O endereço do Perfil foi extraído para um bloco tipado e um único estado, preservando os campos, nomes de preenchimento automático, textos e apresentação. O contrato do perfil passou a declarar os campos que a tela já consumia, removendo conversões genéricas nesse fluxo.
- O utilitário redundante de telefone foi removido; seu único uso agora chama a fonte compartilhada equivalente. Os limites entre número nacional, internacional e WhatsApp foram documentados no módulo canônico.

### Evidências

- 37 testes focados aprovaram permissões, situação do divulgador, invalidações e regras de cadastro após o primeiro lote.
- A suíte completa intermediária aprovou 562 testes em 121 arquivos.
- Após a extração do Perfil, seis testes focados aprovaram cache derivado, identificação do usuário e acesso à página.
- Verificação de tipos concluída sem erros e compilação automática registrada como aprovada após as alterações.

### Limites reais

- O envio de eventos e a Gestão de Eventos foram analisados, mas não decompostos nesta rodada: são fluxos extensos e sensíveis, e as extrações de persistência, lote e flyer exigem novos contratos específicos antes de uma mudança segura.
- Salvar Perfil como divulgador/artista, mudar cargo administrativo e operar moderação não foram executados com dados reais nesta rodada; a equivalência nesses caminhos foi verificada por tipos e testes automatizados disponíveis.
- Exportações em PDF continuam sem cobertura própria suficiente para uma unificação segura das máscaras de telefone.