# Curadoria operacional de eventos

## Objetivo
Reunir, somente na aba Curadoria da Gestão Setorial, o cadastro rápido, a gestão completa e o compartilhamento de rolês.

## Entrega
- Criar uma área interna com três visões: **Cadastro rápido**, **Gerenciar rolês** e **Divulgação**.
- Permitir cadastro e edição de nome, data, horário, link externo e flyer por arquivo ou link, com validações claras.
- Exibir todos os rolês autorizados em lista responsiva, com busca, edição e exclusão protegidas.
- Atualizar imediatamente as listas públicas, carrossel e radares após cada alteração aprovada, usando a sincronização em tempo real já existente.
- Gerar para cada rolê um link direto compacto, QR Code para visualizar/baixar e convite pronto para WhatsApp.
- Manter alto contraste, alvos de toque confortáveis e ausência de rolagem horizontal em smartphones.

## Segurança e regras
- Restringir leitura e alterações às permissões server-side da Curadoria, Sênior e Master.
- Preservar os estados de aprovação, regras de publicação, anti-duplicidade, cotas e proteção dos campos de moderação.
- Confirmar exclusões antes de executá-las e refletir a remoção nas áreas públicas sem apagar o histórico por caminhos não autorizados.

## Detalhes técnicos
- Reutilizar os dados de eventos, componentes de QR Code, compartilhamento e chaves de atualização já presentes.
- Criar funções protegidas no backend apenas se os fluxos existentes não cobrirem com segurança o cadastro e as alterações da Curadoria.
- Adicionar testes pequenos para autorização, payload de cadastro/edição e mensagem/link de compartilhamento.
- Validar a aba autenticada em celular e desktop, incluindo criação/edição sem dados fictícios persistidos.
