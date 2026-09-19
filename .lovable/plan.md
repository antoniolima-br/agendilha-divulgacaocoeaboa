# Compartilhar Agendilha Informa

## Objetivo
Criar um atalho no painel que abra o WhatsApp com o relatório atualizado do dia, sem copiar e colar.

## Alterações
- Criar a rota protegida `/admin/agenda-informa/compartilhar`.
- Ao acessar, buscar os eventos públicos válidos do dia no horário de São Paulo.
- Gerar o texto no modelo atual do Agendilha Informa.
- Encaminhar automaticamente para o WhatsApp com a mensagem preenchida.
- Mostrar um estado claro enquanto a programação é preparada e permitir tentar novamente em caso de falha.
- Adicionar o atalho “Compartilhar Agendilha Informa” na área administrativa.
- Preservar a tela atual de conferência e seleção manual.
