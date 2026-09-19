# Espaços de publicidade patrocinada

## O que será feito
- Evoluir o carrossel existente para exibir até 6 anúncios publicados, mantendo a troca automática a cada 4 segundos.
- Identificar cada peça com um selo discreto “Patrocinado”.
- Ao tocar em um anúncio, abrir detalhes na própria tela, sem abertura automática.
- Nos detalhes, mostrar imagem, nome, descrição, categoria, localização e preço quando disponível.
- Oferecer ações diretas para WhatsApp e mapa, usando apenas os dados já cadastrados.
- Manter setas, indicadores e pausa durante toque, mouse ou foco.
- Preservar os espaços atuais da Home e da curadoria, sem inserir publicidade em excesso.

## Regras
- Somente anúncios publicados entram no carrossel.
- Destaques aparecem primeiro; anúncios vencidos não devem ser exibidos.
- Caso não existam anúncios publicados, o espaço continua oculto.
- O modal só abre após ação da pessoa.

## Detalhes técnicos
- Reaproveitar a consulta e o armazenamento de imagens existentes.
- Criar um painel de detalhes reutilizável dentro do módulo de anúncios.
- Manter navegação acessível, controles por teclado e respeito à redução de movimento.
- Validar o carrossel e o painel em telas grandes e pequenas.
