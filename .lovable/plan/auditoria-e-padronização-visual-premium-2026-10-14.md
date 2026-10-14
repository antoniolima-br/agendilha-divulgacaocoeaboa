# Auditoria e padronização visual premium

## Objetivo
Uniformizar contraste, campos, modais e superfícies em todo o aplicativo, mantendo a identidade navy com amarelo-ouro e sem alterar funcionalidades.

## Implementação
1. Reforçar os tokens globais de texto, superfícies, bordas, foco e estados semânticos para contraste consistente.
2. Padronizar os componentes compartilhados de formulário, seleção, modal, card, rótulo e botões com acabamento clean e mobile-first.
3. Corrigir exceções de maior impacto que ainda usam combinações visuais legadas fora do design system.
4. Conferir páginas públicas, formulários, modais e áreas administrativas em celular e desktop, incluindo overflow, legibilidade e estados de foco.

## Detalhes técnicos
- Priorizar tokens semânticos e componentes compartilhados para evitar correções duplicadas.
- Preservar artes geradas, peças de exportação e cores semânticas que dependem de composição própria.
- Validar com testes existentes, checagem de tipos, lint focado e navegação visual responsiva.
