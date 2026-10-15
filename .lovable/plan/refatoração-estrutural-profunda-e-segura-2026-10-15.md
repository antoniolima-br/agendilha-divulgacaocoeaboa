# Refatoração estrutural profunda e segura

## Objetivo
Melhorar organização, tipagem, separação de responsabilidades e previsibilidade interna sem mudar telas, rotas, acessos, dados, regras comerciais ou comportamento público.

## Execução
1. **Criar contratos de regressão**
   - Cobrir primeiro os fluxos ainda sem proteção suficiente: edição de perfil, geração de flyer administrativo e montagem do envio de eventos.
   - Manter os testes atuais como contrato e acrescentar casos apenas onde uma extração precisa de equivalência comprovada.

2. **Centralizar dados derivados de conta**
   - Reutilizar uma leitura compartilhada de cargos nas consultas de permissões e detalhes, preservando a hidratação independente da sessão.
   - Centralizar invalidações relacionadas a perfil e colaboradores para impedir estados temporariamente divergentes.
   - Manter separadas as chaves que representam respostas e escopos diferentes.

3. **Decompor o envio de eventos**
   - Extrair persistência do rascunho, sincronização de perfil, montagem tipada do lote e criação opcional de entidades.
   - Transformar o formulário principal em coordenador das etapas, sem mudar campos, textos, ordem, validações, flyer, cotas ou envio atômico.
   - Remover conversões genéricas somente nos trechos cobertos pelos novos contratos.

4. **Decompor operações administrativas**
   - Isolar carregamento, geração de flyer e estado dos diálogos da Gestão de Eventos.
   - Preservar moderação, pagamentos, cortesias, arte original, mensagens e invalidações existentes.
   - Reutilizar confirmações compartilhadas apenas onde a interação for realmente equivalente.

5. **Organizar perfil e utilitários**
   - Separar estado de endereço e mapeamento de dados do Perfil sem unir os três tipos de cadastro.
   - Remover utilitário de telefone comprovadamente redundante, direcionando o único uso para a fonte compartilhada equivalente.
   - Documentar os limites entre telefone nacional, internacional e WhatsApp para evitar novas duplicações.

6. **Validar e documentar**
   - Rodar testes focados após cada lote e a suíte completa ao final.
   - Conferir os fluxos centrais disponíveis no navegador em celular e computador, sem alterar dados reais sensíveis.
   - Atualizar o relatório de refatoração com mudanças, evidências e limites não validados.

## Detalhes técnicos
- Mudanças incrementais, com arquivos de dependência criados antes dos consumidores.
- Nenhuma migração, mudança de permissões, design, conteúdo, URL ou contrato público.
- Arquivos gerados automaticamente permanecem intocados.
- A sessão continua independente do cache de consultas; autoridade e proteções do servidor permanecem inalteradas.
- Componentes grandes só serão divididos por responsabilidades já isoláveis e cobertas, nunca apenas pelo número de linhas.

## Resultado esperado
Menos duplicação e conversões frágeis, páginas mais enxutas, dados derivados sincronizados e responsabilidades claras, com equivalência funcional demonstrada por testes e validação dos fluxos acessíveis.