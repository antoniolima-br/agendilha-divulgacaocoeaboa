# Performance — resultado e limites

## Nova análise e melhorias — 15/10/2026

### Cobertura e prioridades

Revisão independente de infraestrutura/rotas/contextos, dados/queries/backend e imagens/CSS/PWA. Os arquivos excluídos pelo solicitante não foram inspecionados. A análise não equivale a medir cada fluxo ou a garantir ausência de todos os gargalos.

| Prioridade | Evidência | Melhoria aplicada / impacto |
|---|---|---|
| Alta | Agenda/Radar antecipavam apenas código, sem compartilhar uma definição de consulta com a antecipação de dados. | Consulta pública extraída, com os mesmos filtros e cancelamento; intenção nos links antecipa Agenda/Radar sem acessar dados pessoais. Cache recente é reutilizado ao navegar. |
| Alta | Cada observador de anúncio público possuía um relógio de atualização próprio; duas implementações repetiam a consulta. | Um relógio por QueryClient, pausado em aba oculta, atualizado ao retornar. Uma consulta paginada e ordenada compartilhada; seleção regional permanece por observador. |
| Média | Rajadas contínuas reiniciavam indefinidamente o atraso de atualização. | Prazo máximo de três segundos, mantendo agrupamento de 750 ms; limpeza cancela ambos os relógios. |
| Média | Menu lateral invisível de desktop permanecia montado no celular, executando hooks e consultas. | Só o menu da tela correspondente é montado. Menu móvel é criado ao abrir; o de desktop mantém reserva e reabertura. |
| Média | Estado do contexto e funções de verificação de permissões mudavam de referência sem mudança dos dados. | Contexto memoizado, funções estáveis e menu filtrado memoizado; regras de autorização intactas. |
| Média | Imagem da Agenda aplicava blur/transições gerais e tentava buscar outra imagem externa ao falhar, embora a arte local já fosse exibida. | Transição só de opacidade, respeitando movimento reduzido; arte local sem segundo download, flyer oficial intacto, componente memoizado. |

### Backend: o que foi realmente observado

- Estatísticas cumulativas mostraram leitura de papéis 30.163 vezes, média 0,89 ms; leituras administrativas completas tiveram médias de aproximadamente 78–105 ms. Isso não determina latência por visitante nem prova que o custo principal está no banco.
- Plano da consulta pública real retornou 29 linhas com índice existente `idx_submissions_status_date`, execução observada de 6,577 ms e ordenação de 32 kB.
- A função de dia paulista é `STABLE`, não `IMMUTABLE`; portanto a sugestão de índice funcional direto não é válida. Não foram mudadas semânticas de data, permissões, funções ou índices sem uma justificativa segura.
- Leituras repetidas de identidade foram identificadas; a hidratação do bloqueio de senha provisória foi preservada. Não foi removida a espera de segurança para acelerar telas.
- Paginação progressiva de grandes painéis exigiria redesenhar busca/contagens/seleção/exportação; não foi trocada cegamente a leitura completa por uma lista parcial.

### Validação e limites

- 85 testes focados aprovados antes da suíte de regressão; novos testes cobrem compartilhamento, pausa/retomada, cancelamento, filtros, arte oficial e limite de espera em rajadas.
- Home → Agenda com dados públicos reais: uma leitura de eventos antes, após intenção e após navegação, em 390 e 1280 px. A Agenda reaproveita os eventos, sem leitura adicional; ambas as larguras sem overflow.
- Medição inicial local em desenvolvimento: 216 recursos e 8.246.098 bytes de transferência; DOM 852 elementos. Não é tamanho de pacote de produção, Lighthouse ou resultado de Core Web Vitals.
- Logos PNG foram testados com compressão sem perdas: principais ícones de 512 px já não encolheram; não foram substituídos por imagens com perda nem removidos assets que possam ser referenciados em arquivos excluídos.
- Bibliotecas grandes e Guia já são carregados sob demanda. Não foram alterados chunks/PWA sem pacote de produção medido, nem eliminado CSS cuja utilização não pudesse ser descartada.
- Nenhum pagamento, aprovação, cadastro ou conteúdo real foi modificado. Métricas de produção, uploads e operações financeiras privadas não foram aferidos nesta etapa.

---

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