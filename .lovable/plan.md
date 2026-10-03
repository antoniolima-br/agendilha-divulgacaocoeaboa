# Compartilhamento unificado de eventos

## Objetivo
Remover ações repetidas e apresentar um único botão “Compartilhar” nas telas de detalhes de eventos.

## Implementação
- Criar uma ação compartilhada que tenta abrir o menu nativo do aparelho.
- Quando o menu nativo não estiver disponível, abrir uma janela simples com somente WhatsApp e Copiar link.
- Aplicar essa ação à página completa e à janela de detalhes da Agenda.
- Remover botões redundantes de envio ou compartilhamento dessas telas, preservando contato para dúvidas e demais ações não relacionadas.

## Validação
- Confirmar que cada detalhe de evento exibe apenas uma ação de compartilhamento.
- Testar o menu alternativo e conferir as telas no navegador.
