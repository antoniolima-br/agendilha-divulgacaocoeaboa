# Organizar menu e listagens de estabelecimentos

## O que será alterado
- Reunir “Atrativos” e “Locais/Estabelecimentos” em um único grupo “Cadastros” na navegação de divulgadores e administradores.
- Reunir “Gerenciar Eventos” e “Moderador de Flyers” em um único grupo “Moderação”.
- Manter os destinos atuais dentro dos novos grupos, sem alterar permissões ou fluxos.
- Colocar as listagens de estabelecimentos do administrador e do divulgador em áreas com altura controlada e rolagem própria.
- Atualizar os testes do menu para garantir que os atalhos não voltem a aparecer soltos.

## Detalhes técnicos
- Usar a estrutura de itens com `children` já suportada pela barra lateral.
- Preservar os papéis atuais (`promoter`, `admin`, `master`) em cada destino.
- Usar dimensões responsivas e `overflow-y-auto` nas listagens, mantendo busca, formulário e cabeçalho fora da rolagem.
