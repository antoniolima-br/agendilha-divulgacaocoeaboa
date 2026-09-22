# Simplificar Gestão de Usuários

## Objetivo
Deixar a página mais limpa, removendo os indicadores rápidos que disputam atenção com os filtros e tornando a busca o principal ponto de entrada.

## Alterações
- Remover a faixa de indicadores coloridos e os chips/pingos de acesso rápido acima dos filtros.
- Destacar uma busca global em largura maior, com texto claro e botão para limpar.
- Fazer a busca localizar por nome, e-mail, WhatsApp, bairro, tipo e papel do usuário, ignorando diferenças de acentos e maiúsculas.
- Manter os filtros de tipo, papel e período como opções secundárias, organizadas numa única barra compacta.
- Compactar o cabeçalho e o espaçamento vertical, preservando criação, PDF, WhatsApp, solicitações e todas as ações dos usuários.
- Adicionar testes focados na busca global e na ausência dos chips redundantes.

## Detalhes técnicos
- Simplificar `UserFiltersBar` e suas propriedades.
- Extrair a correspondência da busca para uma função testável.
- Remover cálculos e imports que deixarem de ser usados em `AdminUsers`.
- Validar tipos, testes e o resultado visual em desktop e celular.
