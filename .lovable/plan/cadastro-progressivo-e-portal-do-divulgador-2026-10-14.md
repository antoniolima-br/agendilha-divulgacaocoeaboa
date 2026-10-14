# Cadastro progressivo e portal do divulgador

## Objetivo
Criar uma jornada mobile-first em três níveis, preservando a separação entre usuário público e divulgador:

1. **Perfil sem login** — tela acolhedora ao tocar em Perfil, explicando os benefícios e oferecendo cadastro ou entrada.
2. **Cadastro básico** — nome, WhatsApp e consentimento opcional para notificações, com validação clara e sem exigir dados extras.
3. **Upgrade para divulgador** — complemento cadastral, criação de senha e etapa de confirmação por código antes de liberar o painel.

## Experiência
- Atualizar a área de Perfil para mostrar o convite correto quando não houver sessão.
- Simplificar o cadastro público para os três campos pedidos, mantendo preferências adicionais fora desta primeira etapa.
- Incluir no perfil autenticado a ação “Quero ser um Divulgador”, com progresso visível e estados: dados, senha, confirmação e análise/liberação.
- Exibir o painel pessoal somente após confirmação e aprovação, sempre limitado aos eventos enviados pelo próprio divulgador.
- Padronizar os estados dos envios com textos diretos, incluindo “Aguardando liberação da curadoria” e “Aprovado / ativo”.

## Confirmação por WhatsApp
- Preparar a estrutura segura de solicitação e validação de código, com expiração, limite de tentativas e armazenamento protegido.
- Como o envio automático não será conectado agora, não gerar nem expor códigos no navegador.
- Mostrar a etapa como indisponível até a conexão oficial ser ativada; nenhuma conta será liberada sem confirmação válida.

## Dados e segurança
- Manter usuário público, divulgador e artista como jornadas e registros separados.
- Usar o WhatsApp normalizado como identificador e validar entradas no navegador e no backend.
- Manter papéis somente na fonte protegida de permissões; o upgrade não concede acesso por alteração de dados editáveis do perfil.
- Aplicar regras de acesso para que cada divulgador veja e gerencie apenas os próprios envios.

## Arquivos e validação
- Reaproveitar os formulários, controles, tokens visuais, rotas e consultas pessoais existentes.
- Adicionar testes para cadastro básico, estados do upgrade, bloqueio sem confirmação, permissões e rótulos do painel.
- Validar a jornada em smartphone e desktop, sem overflow e com alvos de toque confortáveis.
