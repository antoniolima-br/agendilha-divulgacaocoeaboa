# Auditoria técnica integral e correções

## Objetivo
Revisar o aplicativo de ponta a ponta, corrigir falhas comprovadas sem alterar as regras de negócio atuais e deixar evidências de validação para os fluxos principais.

## Prioridades de execução

1. **Segurança e acesso**
   - Corrigir a recuperação de conta para exigir prova forte de titularidade, sem depender apenas de PIN curto.
   - Restringir funções privilegiadas e regras antigas de permissões ao público correto.
   - Revisar uploads públicos, configurações e modelos de WhatsApp para separar dados públicos de administrativos.
   - Neutralizar fórmulas maliciosas nas exportações de planilha.

2. **Autenticação e permissões**
   - Unificar a interpretação de `admin`, `senior`, `financeiro` e `master` entre sessão, menus, páginas e ações.
   - Garantir que cada página administrativa valide a permissão específica da ação, não apenas uma permissão genérica.
   - Cobrir entrada, saída, recuperação, troca obrigatória de senha e redirecionamentos protegidos.

3. **Dados, formulários e integrações**
   - Revisar consultas, gravações em lote, uploads, modais e estados assíncronos para evitar dados parciais, duplicados ou silenciosamente perdidos.
   - Tornar listas e respostas externas defensivas contra valores ausentes ou formatos inesperados.
   - Revisar as funções do backend e seus registros de falha, mantendo as regras atuais de eventos, estabelecimentos, destaques e pagamentos.

4. **Interface, acessibilidade e responsividade**
   - Percorrer páginas públicas, cadastro, divulgador e administração em desktop e celular.
   - Corrigir sobreposição, rolagem horizontal, alvos de toque, foco, rótulos, contraste e estados vazio/erro/carregamento.
   - Remover avisos reais de controles inconsistentes e efeitos assíncronos instáveis.

5. **Desempenho e confiabilidade**
   - Reduzir consultas repetidas e leituras excessivas, especialmente eventos e papéis de usuário.
   - Corrigir dependências vulneráveis sem atualizações incompatíveis.
   - Revisar cache, listeners, timers e carregamento de pacotes pesados.

6. **Validação final**
   - Ampliar testes para regressões corrigidas, permissões, formulários e estados ausentes.
   - Executar tipos, testes completos, auditoria de segurança e verificação visual dos fluxos centrais.
   - Registrar separadamente qualquer risco que dependa de decisão de produto ou serviço externo.

## Critérios de conclusão
- Nenhuma falha crítica confirmada permanece sem correção ou bloqueador explícito.
- A hierarquia administrativa e a baixa financeira continuam respeitando as regras atuais.
- Páginas públicas e fluxos protegidos funcionam em celular e desktop.
- Testes, tipos e verificação final passam após as alterações.