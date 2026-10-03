# Refatoração estrutural sem mudança funcional

## Objetivo
Reorganizar a base por responsabilidades, reduzir duplicações e melhorar tipagem e previsibilidade, preservando integralmente telas, regras de negócio, URLs, permissões e comportamento atual.

## Etapas

### 1. Criar uma linha de base segura
- Manter os 147 testes atuais como contrato de comportamento.
- Registrar e separar alertas preexistentes de lint dos problemas introduzidos pela refatoração.
- Usar as rotas e fluxos principais atuais como referência visual e funcional.

### 2. Organizar infraestrutura global
- Extrair a configuração de consultas/cache e os tratadores globais de erro para módulos próprios.
- Completar o catálogo central de rotas e substituir caminhos literais no roteador.
- Unificar chaves de cache, tempos de atualização e convenções de tratamento de erro.
- Remover aliases e imports legados de permissões, mantendo uma API única para novos usos.

### 3. Consolidar acesso a dados e permissões
- Centralizar consultas e mutações repetidas de eventos, perfis, atrativos e estabelecimentos.
- Reutilizar a fonte de permissões já cacheada, evitando consultas repetidas de papel administrativo.
- Substituir conversões genéricas por tipos e mapeadores explícitos nos pontos refatorados.
- Manter as regras de segurança no servidor e a hierarquia Master, Sênior, Financeiro, Admin e Divulgador.

### 4. Dividir os maiores fluxos por responsabilidade
- Separar esquema, rascunho, navegação de etapas, montagem do envio e efeitos do formulário de eventos.
- Transformar o formulário principal em um coordenador enxuto, preservando campos, validações, mensagens e ordem das etapas.
- Extrair dados, ações e janela de revisão da Gestão de Eventos para módulos específicos.
- Dividir os modos do acesso por PIN e os blocos mais extensos de cadastro/perfil sem alterar a interface.

### 5. Padronizar componentes compartilhados
- Diferenciar componentes homônimos de status para evitar imports incorretos.
- Consolidar a estrutura visual e comportamental dos campos de busca com sugestões, mantendo adaptações por entidade.
- Reaproveitar constantes e transformações existentes para bairros, telefones, categorias, datas e WhatsApp.
- Remover código morto, imports sem uso e duplicações comprovadas.

### 6. Validar compatibilidade
- Rodar verificação de tipos e toda a suíte automatizada após cada frente crítica.
- Conferir no navegador os fluxos públicos, autenticação disponível, envio de evento e áreas administrativas.
- Comparar desktop e celular para garantir ausência de mudanças visuais ou de navegação.
- Encerrar sem tarefas abertas e com o build atual aprovado.

## Detalhes técnicos
- Refatoração incremental, com extrações pequenas e imports atualizados em conjunto.
- Nenhuma alteração de esquema, conteúdo, design, URLs públicas ou regra de negócio.
- Arquivos gerados automaticamente e componentes citados nos erros reportados ficam fora do escopo.
- Prioridade: infraestrutura e rotas → dados/permissões → Gestão de Eventos → formulário de envio → módulos secundários.
