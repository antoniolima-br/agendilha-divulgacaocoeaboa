# Performance — resultado e limites

## Correções por prioridade

| Prioridade | Causa confirmada | Correção e impacto |
|---|---|---|
| Alta | Guia pesado antecipado em páginas públicas | Launcher leve; conversa carregada somente ao abrir. AI SDK, Markdown e chat ausentes no carregamento inicial medido. |
| Alta | Avaliações consultadas sem uso na Agenda/Radar | Consultas opcionais; nenhuma requisição de avaliações agregadas na abertura da Agenda. Avaliações dos detalhes preservadas. |
| Alta | Todas as imagens do carrossel montadas | Imagens apenas do slide ativo e vizinhos, incluindo a borda circular; oito slides mantidos, seis imagens montadas em vez de dezesseis. Setas e abertura dos detalhes conferidas. |
| Média | Consultas de artistas antes de abrir a aba | Consulta e apresentação sob demanda; nenhuma consulta de artistas antes da seleção da aba. |
| Média | Canais públicos duplicados e atualizações repetidas | Uma assinatura por QueryClient, contagem de consumidores, agrupamento de invalidações e limpeza ao sair. Testes cobrem rajadas e desmontagem antecipada. |
| Média | Mesma chave para perfil e detalhes administrativos com formatos diferentes | Chaves separadas, impedindo reutilização de um formato incompatível. |
| Média | Uploads JPEG/PNG sem preparação em alguns formulários | Compressão compartilhada e liberação de prévias temporárias. GIF, WebP e SVG não são convertidos pelo novo adaptador. |
| Média | Atualizações de filtros sem mudança efetiva e ordenação repetida | Snapshot estável para alterações idênticas e trabalho derivado reduzido; filtros públicos preservados. |
| Baixa | Marcas de medição retidas ou apagadas durante operações concorrentes | Marcas liberadas quando a operação termina; medições recentes limitadas, sem remover inícios ainda ativos. |
| Baixa | Downloads de páginas sem intenção | Antecipação apenas de código público em interação com links internos; respeita economia de dados e conexões lentas. |

## Evidências

- Suíte final: **80 arquivos, 395 testes aprovados**.
- Verificação automática da prévia: `build OK` após as últimas alterações.
- Lint dos arquivos revisados: sem erros; avisos encontrados nos filtros/Agenda foram eliminados.
- Home medida com uma consulta pública; imagens da página caíram de **28 para 18** e elementos DOM de **567 para 557**.
- Transferência de recursos no ambiente de desenvolvimento: aproximadamente **10,1 MB → 8,3 MB**, com **197 → 199 recursos**. Houve menos bytes, não menos recursos; isto não representa o tamanho de produção nem garante igual resultado para outros eventos/redes.
- JPEG sintético de 3200×2400: **90.761 → 12.010 bytes**, saída 1600×1200. Redução de **86,8% nesse exemplo**, não promessa para qualquer imagem. GIF permaneceu idêntico.
- Home/Agenda sem overflow nas larguras verificadas de 390, 1280 e 1920 px; Guia aberto por ação explícita em computador e celular.
- Flyer real abriu os detalhes completos na **Agenda com parâmetro do evento**, mostrando data, horário e local. O teste anterior procurava incorretamente uma rota `/evento/`.
- Calendário selecionou **10/10/2026** e exibiu programação pública; aba de artistas abriu e Guia continuou disponível sob demanda.

## Preservação e decisões

Não foram alterados design, regras de aprovação, pagamentos, permissões, consentimento ou registros reais. Datas e filtros continuam usando o calendário público de São Paulo. Consultas, rotas e funcionalidades existentes foram mantidas, com carregamento adiado onde seguro.

A consulta administrativa examinada utilizou índice existente, com execução observada de 1,781 ms; não foi criado índice adicional sem evidência. Leituras repetidas de identidade/permissões não foram refatoradas nesta etapa pelo risco de alterar a hidratação de acesso.

## Limites e pendências

- Uploads, Radar e demais fluxos privados não foram exercitados de ponta a ponta: a tentativa de obter sessão própria confirmou ausência de conta correspondente ao solicitante. É necessário entrar na prévia para continuar essas verificações.
- Não foram aferidos Web Vitals de produção, percentis de usuários reais ou comparação de pacotes finais de produção; as medições acima são locais.
- A preparação de imagens foi validada isoladamente no navegador e por testes, não por gravação de um upload privado real.
- A nova varredura dos pontos alterados e testes não equivale a certificação integral de acessibilidade ou segurança de todo o projeto.