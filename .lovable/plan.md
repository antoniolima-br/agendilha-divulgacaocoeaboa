# Ajustes integrados do relatório, Home, menu e divulgação

## Resultado esperado
- Manter o Relatório Diário com uma única lista cronológica, sem o rótulo “Anúncios Pagos / Destaques”.
- Renomear a listagem inferior da Home para “Outras programações” e remover as chamadas antigas de gratuidade.
- Organizar o menu administrativo e entregar ao Divulgador um painel próprio e seguro para seus envios.
- Deixar o cadastro de eventos flexível, preservando apenas data, horário, atrativo e aceite como bloqueios mínimos atuais.

## Implementação
1. **Relatório e Home**
   - Confirmar e reforçar no gerador e nos testes que nenhum rótulo de destaques aparece no WhatsApp.
   - Trocar o título da seção inferior para “Outras programações”, inclusive textos de acessibilidade e estado vazio que ainda mencionem “gratuito”.

2. **Menu lateral**
   - Criar o menu pai “Relatório Diário (Coé a Boa?)” com dois acessos internos: relatório e compartilhamento.
   - Reservar “Operação” e “Governança” para Admin e Master.
   - Mover “Meus Envios”, “Enviar Evento” e “Perfil de Divulgador” para uma seção própria “Divulgação”, mantendo o painel acessível ao Divulgador sem expor áreas administrativas.

3. **Formulário e sugestões**
   - Revisar as duas etapas e remover marcações ou validações rígidas além do mínimo necessário para cadastrar um evento identificável e aceitar os termos.
   - Completar as sugestões nos campos textuais do fluxo de divulgação e da edição rápida, usando somente fontes permitidas pelas regras de acesso atuais.
   - Preservar telefone, e-mail, CEP, datas e horários como campos livres com validação apenas quando preenchidos; não sugerir dados pessoais de outros usuários.

4. **Painel do Divulgador e trava de aprovação**
   - Consolidar “Meus eventos” como painel dos envios do usuário, com filtros, status, criação e edição dos registros permitidos.
   - Bloquear o botão de edição para `aprovado`, `publicado` e `divulgado`, exibindo orientação para procurar a curadoria.
   - Aplicar a mesma trava no banco: o proprietário poderá alterar somente eventos ainda não aprovados; Admin e Master continuarão podendo editar qualquer status.
   - Manter a checagem de proprietário em todas as alterações.

## Validação
- Atualizar e executar os testes do relatório, menu, formulário e painel.
- Confirmar no navegador, em celular e desktop, os títulos da Home, o agrupamento do menu e o bloqueio visual de edição.
- Testar no banco que um Divulgador não altera evento aprovado nem força outro proprietário, e que Admin/Master preservam a edição.
