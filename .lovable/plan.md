# Central administrativa e rodapé compacto

## Resultado
- Criar uma única central administrativa, visível somente para Admin, Sênior e Master autenticados.
- Reunir três áreas em abas: pauta da Home, anúncios/parcerias do Coezinho e flyer principal.
- Reduzir e estabilizar o espaço inferior do rodapé e da navegação móvel.

## Implementação
1. Adicionar uma rota administrativa protegida e um único atalho no menu lateral.
2. Na aba **Pauta da Home**, reutilizar a gestão segura de eventos publicados para editar data, horário e local; salvar e atualizar as consultas da Home imediatamente.
3. Na aba **Anúncios e Promoções**, reutilizar a gestão de campanhas existente e identificar as peças destinadas ao Guia, mantendo publicação e regiões sob as permissões atuais.
4. Na aba **Flyer Principal**, listar os eventos públicos em destaque e permitir substituir a imagem oficial pelo fluxo de armazenamento existente, sem alterar aprovação ou pagamento.
5. Usar as permissões derivadas de `user_roles` na interface e manter a autorização das gravações no backend; acesso direto sem papel administrativo redireciona para a Agenda.
6. Tornar rodapé e reserva inferior compactos com variáveis compartilhadas, safe-area e limites fixos, evitando espaço duplicado.
7. Adicionar testes para visibilidade das abas, bloqueio de acesso e espaçamento compacto; validar os fluxos centrais em celular e desktop.

## Detalhes técnicos
- A nova página será apenas um ponto central sobre módulos e mutações existentes, sem duplicar regras de publicação, anúncios ou moderação.
- Atualizações usarão invalidação das chaves compartilhadas para refletir na Home sem recarregar a página.
- Nenhum papel será lido de perfil, armazenamento local ou valor hardcoded.
