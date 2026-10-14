# Blindagem do chat do Coezinho

## Alterações
- Manter cada abertura como uma conversa nova, sem histórico ou rascunho persistido.
- Substituir falhas de conexão por uma resposta útil dentro da conversa, escolhida pelo assunto perguntado.
- Cobrir programação de hoje, divulgação e funcionamento do app sem inventar eventos, preços ou dados.
- Fazer a função do Guia usar a mesma saída segura quando o serviço de conversa livre estiver indisponível.

## Verificação
- Testar os três assuntos de fallback e a limpeza ao fechar e reabrir.
- Conferir no chat real que a resposta aparece como mensagem do Coezinho, sem aviso genérico.
