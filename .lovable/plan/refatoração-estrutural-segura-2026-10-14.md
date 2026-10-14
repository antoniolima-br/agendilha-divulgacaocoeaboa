# Refatoração estrutural segura

## Objetivo
Reduzir duplicação e complexidade interna sem mudar telas, fluxos, dados, permissões ou comportamento público.

## Prioridades
1. **Mapa e contratos** — consolidar o diagnóstico por domínio, preservar rotas, tipos exportados e regras de acesso existentes.
2. **Autenticação e cadastro** — extrair validações, dados comuns e etapas repetidas sem unir os três perfis separados.
3. **Dados e consultas** — centralizar seleções, normalização e tratamento de erros repetidos; manter chaves de consulta e escopos de usuário.
4. **Rotas e navegação** — reduzir configuração duplicada, mantendo exatamente os mesmos destinos e permissões.
5. **Componentes grandes** — decompor somente trechos isoláveis com cobertura existente, começando pelos maiores pontos de manutenção.
6. **Limpeza** — remover imports, estados, helpers e ramificações comprovadamente mortos; padronizar nomes e organização.

## Execução segura
- Refatorar em lotes pequenos por domínio.
- Rodar testes focados após cada lote e a suíte completa no final.
- Validar tipos, formatação do diff e os fluxos centrais no navegador.
- Não alterar banco, regras comerciais, textos, aparência ou interfaces públicas.

## Resultado
Código menor e mais previsível, responsabilidades mais claras, menos duplicação e um registro objetivo das melhorias e limites verificados.
