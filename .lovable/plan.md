# Gestão administrativa de contas

## Objetivo
Adicionar à Gestão de Usuários duas ações protegidas: criar uma conta completa e definir uma nova senha para uma conta existente.

## O que será feito
- Incluir um botão de destaque **Novo Usuário** no topo da tela.
- Criar um formulário com Nome, E-mail, Telefone, Bairro, Perfil inicial e senha provisória com confirmação.
- Disponibilizar os perfis Público, Divulgador, Artista e Admin, mantendo cada jornada de perfil separada.
- Adicionar **Alterar senha** dentro de **Gerenciar**, com nova senha, confirmação e opção de exigir troca no próximo acesso.
- Atualizar a lista e os indicadores após cada ação, com mensagens claras de sucesso e erro.

## Segurança e regras
- Executar criação e troca de senha somente no ambiente protegido do projeto.
- Validar novamente no servidor se quem chamou é Admin ou Master; a interface sozinha não concede acesso.
- Gravar Admin exclusivamente na tabela oficial de papéis; os demais perfis ficam no cadastro de perfil correspondente ao acesso inicial.
- Impedir que um Admin comum altere senha de Admin/Master; somente Master poderá fazê-lo.
- Validar e-mail, telefone brasileiro, senha forte e duplicidade de conta.
- Registrar as ações administrativas no histórico de auditoria.

## Validação
- Cobrir validações e permissões com testes automatizados.
- Verificar tipos, criação, atualização da listagem e os dois formulários em telas grandes e pequenas.
