# Responsividade integral da aplicação

## Objetivo
Tornar todas as experiências públicas, pessoais e administrativas fluidas entre 320 px e telas ultrawide, preservando funções, identidade navy/amarelo-ouro e regras de acesso.

## Implementação
1. **Base compartilhada**
   - Fortalecer containers, conteúdo flexível, quebra de textos e mídia fluida.
   - Padronizar áreas de toque, campos, menus, abas, dropdowns, diálogos e drawers para celular.
   - Manter rolagem horizontal somente onde ela é necessária e claramente contida, como tabelas extensas.

2. **Navegação e estrutura**
   - Ajustar cabeçalhos, barra inferior, sidebar, rodapé e reservas do Coezinho para 320/390/480/768/1024/1280/1536 px.
   - Evitar sobreposição, corte de rótulos e conteúdo escondido por elementos fixos.

3. **Telas públicas e cadastros**
   - Revisar Home, Agenda, exploração, detalhes, autenticação e todos os cadastros.
   - Adaptar grids, cards, imagens, filtros, formulários e janelas sem remover recursos.

4. **Telas pessoais e divulgação**
   - Revisar Perfil, Seu Radar, Meus Eventos, envio de evento, anúncios e páginas do divulgador.
   - Reorganizar ações e campos em telas estreitas, mantendo leitura e toque confortáveis.

5. **Administração e gestão**
   - Revisar Curadoria, usuários, financeiro, anúncios, relatórios, pitch e Gestão Setorial.
   - Preservar densidade no desktop e oferecer listas, abas, tabelas e formulários utilizáveis no celular/tablet.

## Validação
- Executar testes focados e verificação de tipos.
- Navegar pelas rotas públicas em 320, 390, 768, 1024, 1280 e 1536 px, verificando overflow, legibilidade, toque e elementos fixos.
- Conferir rotas privadas com sessão autorizada quando disponível; onde não houver sessão, validar estrutura por testes e inspeção do código.
- Corrigir somente falhas responsivas confirmadas, sem alterar regras de negócio.
