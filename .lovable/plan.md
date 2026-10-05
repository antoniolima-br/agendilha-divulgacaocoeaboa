# Auditoria técnica integral e estabilização

## Objetivo
Revisar a aplicação inteira, corrigir falhas comprovadas sem mudar as regras de negócio ou o visual existente e validar os fluxos públicos e administrativos em celular e computador.

## Prioridades

1. **Segurança, autenticação e permissões**
   - Revisar entrada, saída, recuperação, persistência de sessão e proteção de todas as páginas restritas.
   - Unificar a hierarquia `admin`, `senior`, `financeiro` e `master`, mantendo baixa financeira exclusivamente por `payment_records`.
   - Corrigir regras excessivamente abertas, funções privilegiadas e acesso a configurações, modelos e arquivos conforme o público real de cada recurso.
   - Verificar uploads, dados pessoais, validações no banco e operações administrativas contra alteração indevida.

2. **Dados e integrações**
   - Auditar consultas, gravações, exclusões, lotes, paginação, cache e atualizações em tempo real.
   - Corrigir condições de corrida, duplicações, dados parciais e falhas silenciosas em eventos, anúncios, estabelecimentos, atrativos, destaques e pagamentos.
   - Tornar respostas externas e dados opcionais seguros contra valores ausentes ou formatos inesperados.
   - Revisar as funções do backend e seus registros de falha, preservando todas as regras atuais.

3. **Interface e fluxos completos**
   - Percorrer páginas públicas, cadastros, área do divulgador e administração em desktop e celular.
   - Corrigir navegação, carregamentos, estados vazios/erro, formulários, modais, foco, contraste, rótulos, alvos de toque, sobreposição e rolagem horizontal.
   - Garantir que eventos, flyers e dados válidos continuem aparecendo corretamente, inclusive em casos de fuso horário e campos opcionais.

4. **Performance e confiabilidade**
   - Reduzir consultas repetidas, leituras amplas, renderizações desnecessárias, listeners, timers e consumo de memória.
   - Corrigir dependências vulneráveis por versões compatíveis e manter pacotes pesados sob demanda.
   - Revisar carregamento de imagens, cache offline, divisão de pacotes e comportamento em conexões lentas.

5. **Qualidade e prevenção de regressões**
   - Corrigir tipagem e avisos relevantes e ampliar testes para cada falha encontrada.
   - Executar validação de tipos, testes completos, auditoria de segurança e checagem visual dos fluxos centrais.
   - Repetir a varredura final e registrar separadamente qualquer risco que dependa de decisão de produto ou serviço externo.

## Critérios de conclusão
- Nenhuma falha crítica confirmada permanece sem correção ou bloqueador explícito.
- Permissões e operações financeiras respeitam integralmente as regras atuais.
- Fluxos públicos e protegidos funcionam em celular e desktop sem erros visíveis.
- Tipos, testes, segurança e verificações finais passam após as alterações.
