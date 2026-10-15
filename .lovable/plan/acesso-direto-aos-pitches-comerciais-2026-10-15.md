# Acesso direto aos pitches comerciais

## O que será alterado
- Tornar “Pitch para Sócios” e “Pitch para Anunciantes” páginas públicas, sem login, perfil ou senha.
- Manter os dois conteúdos separados e o endereço antigo redirecionando para Sócios.
- Exibir os dois atalhos no menu lateral para visitantes e contas conectadas.
- Preservar integralmente preços, textos, aparência e comportamento responsivo.

## Detalhes técnicos
- Retirar as três rotas de dentro do bloqueio administrativo e remover `pitch.read` desses destinos públicos.
- Permitir que a função de conteúdo responda publicamente apenas aos dois documentos comerciais, sem consultar conta ou cargo.
- Trocar o carregamento autenticado por uma chamada pública específica, sem ampliar o acesso a outras funções ou áreas administrativas.
- Remover formulário de senha, estados de bloqueio e expiração da página.
- Atualizar testes de rotas, menu e apresentação para cobrir acesso direto aos dois públicos.

## Validação
- Executar os testes focados dos pitches e do menu.
- Abrir os dois links como visitante em computador e celular, confirmando conteúdo imediato, tela ampla e ausência de rolagem lateral.
- Conferir a validação automática do projeto após as alterações.