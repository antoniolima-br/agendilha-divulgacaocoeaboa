# Responsividade 373

## Ajustes e evidências
- DDI com largura controlada: telefone não ultrapassa o formulário em 320 px.
- Seletores preservam a seta e limitam listas à altura disponível. A lista de regiões ultrapassava o limite inferior em 320 × 680; conferida novamente após correção.
- Popovers, menus e submenus respeitam espaço disponível com rolagem interna.
- Tabelas mantêm rolagem horizontal local e permitem rolagem vertical por toque.
- Nenhuma regra de acesso, pagamento, envio ou informação foi alterada.
- 69 destinos em 320/480/768/1024/1280/2560 px: 414 navegações sem overflow horizontal de página detectado. Artes e áreas explicitamente roláveis foram distinguidas de overflow real.
- Sessão autorizada: telefone preenchido, regiões abertas, menu → Meus eventos com fechamento, formulário de envio aberto; sem alterar registros.
- Interações em 320 × 680, 768 × 1024, 1280 × 1800, 2560 × 1800 e 640 × 360.
- Sem sessão: acesso, recuperação e cadastros público/divulgador/artista sem overflow em 320 px.
- Detalhe real de anúncio aberto em 320/768/1280/2560 px.
- 52 testes aprovados de navegação, formulário, Guia e apresentações. Compilação automática sem erros.
- Scripts e capturas temporários: `/tmp/browser/responsive373/`.

## Limites
- Revisar destinos não prova todos os estados de formulários, diálogos, conteúdos futuros ou aparelhos; não é garantia de 100% em todos os dispositivos.
- Não foram criados eventos, despesas ou pagamentos nem alteradas contas para testes.
- Não havia links reais de detalhes de eventos, lugares e artistas nas listas examinadas; seus estados preenchidos não foram conferidos nesta rodada.
- `/auth` redireciona com sessão ativa e foi conferida separadamente sem sessão, sem mudar essa regra.
- Ranking ficou indisponível em algumas navegações da varredura; conferência posterior abriu sem overflow.
- Imagem gerenciada do Coezinho segue com a pendência de infraestrutura registrada no roadmap; não foi substituída.
- Instalação PWA, teclado virtual nativo e hardware de toque não foram reproduzidos.