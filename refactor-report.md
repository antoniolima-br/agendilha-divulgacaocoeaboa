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
- Resultado final da suíte e conferência visual: a registrar após validação.

## Continuidade

Refatorações futuras devem seguir evidência de duplicação e testes equivalentes; mover pastas ou unificar jornadas apenas por estética não é uma melhoria segura. Fluxos protegidos sem sessão real permanecem fora da afirmação de equivalência end-to-end desta rodada.