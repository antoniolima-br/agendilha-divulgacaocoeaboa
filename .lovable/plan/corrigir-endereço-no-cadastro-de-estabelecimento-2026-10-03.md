# Corrigir endereço no cadastro de estabelecimento

## Resultado
Aplicar a mesma experiência em todos os pontos que criam um estabelecimento: cadastro público, área do divulgador, administração e cadastro rápido durante o envio de evento.

## Alterações
- Exibir o link discreto **“Não sei o CEP”** junto ao campo CEP.
- Abrir uma busca por Estado, Cidade, Bairro e Rua, preencher o CEP encontrado e fechar o painel.
- Remover o campo separado **“Complemento”** somente dos formulários de criação.
- Permitir número e complemento juntos no campo **“Número”**.
- Preservar complementos já cadastrados nas telas de consulta e edição, evitando perda de dados existentes.
- Conferir o fluxo em tela pequena e desktop.

## Detalhes técnicos
- Reutilizar um único bloco de busca de CEP para evitar diferenças entre os formulários.
- Manter a consulta ViaCEP e os campos de rua e bairro editáveis.
