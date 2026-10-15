# Performance 377 — análise, melhorias e limites

## Escopo

Revisão de estrutura/rotas, contextos, hooks, consultas/cache/realtime, paginação, exportadores, assets/CSS e configuração PWA, complementando performance-report.md. Arquivos excluídos pelo solicitante não foram inspecionados. Não representa uma certificação integral de todas as telas ou a identificação de todos os gargalos.

## Prioridades e mudanças reais

| Prioridade | Evidência e impacto | Melhoria |
|---|---|---|
| Alta | html-to-image era importado ao abrir os leitores de cards/estúdio, e JSZip ao abrir o carrossel, mesmo sem exportar. Trabalho e downloads antecipados desnecessários. | Imports dinâmicos nas ações de PNG/JPEG/ZIP; ferramentas do ZIP carregam em paralelo. Arte, formatos e exportação preservados. |
| Média | AuthProvider criava objeto e ações novos a cada renderização; consumidores podiam receber atualizações sem mudança do valor. | Contexto memoizado e ações estáveis; hidratação, rejeição de sessões obsoletas, troca de conta e gate de senha permanecem intactos. Não removidas verificações de segurança nem unificadas consultas com formatos distintos. |
| Média | Observer de formulários consultava controles e geometria em cada entrega de mutações, inclusive nas rotas que já ocultavam o avatar. | Rotas de formulário dispensam observação; demais rotas agrupam varreduras por frame e cancelam trabalho pendente ao desmontar. Ocultação/reaparecimento e abertura explícita do Guia preservados. |

## Validação

- Linha de base: 625 testes / 129 arquivos; após: **628 testes / 129 arquivos aprovados**. Novos testes verificam estabilidade das ações ao renovar token sem reler gates, ausência de observer no formulário e agrupamento/cancelamento dos scans.
- Lint focado: zero erros; três avisos preexistentes do AuthContext (import não usado, ref de cleanup e export de hook junto ao provider). Validação automática da prévia: build OK.
- Navegador real em 390×844 e 1280×1800: Agenda sem overflow; sessão restaurada antes de abrir o carrossel protegido; card real baixado e arquivo PNG visualmente revisado em ambos os tamanhos.
- Carrossel autenticado: **zero módulos html-to-image/JSZip antes de exportar**, html-to-image baixado após clicar. ZIP real com dez imagens gerado, baixado e arquivo validado. Não são eventos inventados nem registros de teste persistidos.
- Meus eventos autenticado abriu as abas pessoais (sem registros próprios na sessão). Formulário de envio autenticado abriu com 14 inputs e avatar oculto, sem salvar/envio de evento.
- Agenda local: 250/244 recursos e 8.584.431/8.584.333 bytes antes, 250/244 recursos e 8.588.414 bytes após (desktop/mobile); DOM 1199/1213 inalterado. **Não houve redução medida do carregamento inicial da Agenda**; ganhos desta rodada são carregamento evitado dos exportadores e trabalho repetido reduzido. Estas medições são Vite em desenvolvimento, não bundle de produção.

## Prioridades restantes e limites

- Grandes listas usam fetchAllPages sequencial para preservar filtros/busca/totais/exportação; uma paginação de interface exige validação completa desses contratos antes de substituir a lista integral. Não truncadas silenciosamente.
- Leituras de papéis e perfil possuem hidratação e formatos distintos; consolidar sem revisar invalidações e frescor pode afetar gates. Mantidas nesta etapa.
- Realtime público recebe mudanças privadas: filtrá-las exige evidência suficiente nos payloads de UPDATE/DELETE para não perder remoções/moderação. Não aplicado filtro que arrisque exibir informação desatualizada.
- Assets originais não substituídos/removidos sem comprovar uso e qualidade; mantida a pendência externa da entrega da imagem gerenciada do mascote já registrada no roadmap.
- Não aferidos bundle final, Lighthouse, percentis de Core Web Vitals, FPS, heap de longa duração, SQL atual de produção ou ganhos percentuais gerais. Nenhuma promessa de aplicação “100% otimizada”.
- Estúdio AIFlyerGenerator não exercitado em seu destino real; import dinâmico segue o mesmo módulo/formatos e regressões gerais passaram. Uploads, pagamentos, publicação e moderação não executados.

Não alterados design, permissões, autenticação hospedada, funções ou tabelas; nenhum cadastro/pagamento/evento real modificado.