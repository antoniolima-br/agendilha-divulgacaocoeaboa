# Campo expansível do Coezinho

## Resultado
- Iniciar o campo de mensagem com uma linha compacta.
- Crescer automaticamente conforme o texto e as quebras de linha, até cinco linhas.
- Exibir rolagem interna somente depois de atingir o limite.
- Voltar à altura inicial após enviar ou limpar a mensagem.

## Implementação
- Manter os elementos próprios do chat já utilizados e ajustar somente o campo de mensagem do Coezinho.
- Medir o conteúdo no próprio campo a cada alteração, redefinindo a altura antes de calcular o novo tamanho.
- Limitar a altura com base na altura real da linha e controlar a rolagem vertical conforme o conteúdo exceder o limite.
- Preservar Enter para enviar, Shift+Enter para nova linha, botão de envio e foco atual.

## Validação
- Testar altura inicial, expansão, limite, rolagem interna e retorno ao tamanho compacto.
- Conferir o chat aberto em celular e computador, inclusive com texto longo e quebras de linha.
