# Gestão de patrocinadores e destaque da Home

## Objetivo
Criar uma área administrativa completa para cadastrar e excluir anúncios patrocinados, atualizar os carrosséis automaticamente e alternar patrocinadores com eventos no destaque principal da Home.

## O que será feito
- Ampliar a tela **Anúncios (Gestão)** com um botão de novo patrocinador e formulário administrativo integrado.
- Permitir cadastrar título, descrição, categoria, contato, localização, valor, imagens, publicação e período de destaque.
- Adicionar exclusão com confirmação para evitar remoções acidentais.
- Atualizar imediatamente todas as listas e carrosséis após cadastro, edição, publicação ou exclusão.
- Reaproveitar a mesma fonte de anúncios publicados no carrossel existente e no destaque principal da Home.
- No topo da Home, alternar eventos válidos e patrocinadores em um único carrossel, com identificação clara de conteúdo patrocinado.
- Manter os detalhes do patrocinador com WhatsApp, mapa e acesso ao anúncio completo.
- Preservar a apresentação atual como alternativa quando não houver conteúdo disponível.

## Detalhes técnicos
- Manter `ads` como fonte única dos patrocinadores e as regras de acesso existentes para administração.
- Centralizar invalidação de cache na chave `ADS_KEY`, permitindo atualização automática em todos os pontos que consomem anúncios.
- Adicionar a operação de exclusão à tela administrativa usando o fluxo existente de `useDeleteAd`.
- Extrair/reutilizar a apresentação dos slides patrocinados para evitar lógica duplicada entre o topo e o carrossel inferior.
- Misturar anúncios publicados com os eventos válidos do dia/próximos dias no destaque da Home, mantendo autoplay, pausa e acessibilidade.

## Validação
- Cadastrar um patrocinador pela área administrativa e confirmar sua entrada nos dois carrosséis sem recarregar manualmente.
- Excluir com confirmação e verificar remoção imediata.
- Testar abertura do modal, WhatsApp, mapa e anúncio completo.
- Conferir a Home em computador e celular, incluindo cenário sem anúncios ou sem eventos.
