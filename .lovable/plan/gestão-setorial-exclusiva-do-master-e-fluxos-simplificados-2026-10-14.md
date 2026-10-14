# Gestão Setorial exclusiva do Master e fluxos simplificados

## Resultado
- A Gestão Setorial ficará invisível e inacessível para qualquer perfil que não seja Master, inclusive por link direto.
- O cadastro continuará começando pelo flyer, com o Coezinho preenchendo nome, data, horário, local e atração para revisão.
- A Curadoria terá uma fila mobile-first com flyer em destaque e ações claras para aprovar, rejeitar, suspender e editar.
- Marketing, Comercial e Financeiro manterão apenas cartões e listas simples, sem gráficos desnecessários.

## Implementação
1. **Acesso Master em todas as camadas**
   - Restringir menu e rotas da Gestão Setorial ao Master.
   - Restringir consultas, alterações e relatórios setoriais no backend usando somente o papel protegido de Master.
   - Preservar o Financeiro administrativo separado e suas regras atuais, sem transformar acesso visual em permissão de alteração.

2. **Cadastro por flyer**
   - Conferir o fluxo já existente de upload, leitura automática e preenchimento somente de campos vazios.
   - Manter revisão obrigatória pelo usuário, entrada manual e mensagem amigável quando a leitura não funcionar.

3. **Curadoria ágil**
   - Reorganizar a fila em cartões grandes para celular, com flyer, dados principais e histórico artístico.
   - Disponibilizar Aprovar, Rejeitar, Suspender e Editar com confirmações e proteção no backend.
   - Garantir que rolês suspensos saiam das áreas públicas sem serem apagados.

4. **Painéis setoriais simples**
   - Marketing: visualizações e cliques por rolê em cartões/listas.
   - Comercial: lista de convidados e parceiros com próximo contato visível.
   - Financeiro: entradas, saídas e patrocínios em lista limpa, removendo gráficos e termos desnecessários dentro da Gestão Setorial.

5. **Validação**
   - Atualizar testes de acesso, navegação, moderação e regras de suspensão.
   - Conferir celular e computador sem overflow, além da validação de tipos e do estado final da aplicação.

## Limites preservados
- Dados financeiros, métricas e interações continuarão sendo reais; nenhum número será inventado.
- Papéis e ações sensíveis continuarão validados no backend.
- As experiências públicas, do divulgador e administrativas permanecerão separadas.
