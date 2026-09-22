# Relatório, autocomplete, arquivo e cards sem flyer

## Resultado esperado
- O texto do “Coé a Boa?” mostra `Rua, número - Bairro`, tanto na prévia quanto no compartilhamento direto.
- O cadastro encontra nomes com ou sem acento e mantém o vínculo correto quando um local existente é selecionado.
- A agenda ganha um acesso “Eventos Anteriores / Arquivo”; eventos de hoje continuam públicos até a virada do dia em São Paulo.
- Eventos sem flyer recebem artes automáticas com paletas variadas e consistentes, em vez do mesmo fundo para todos.

## Implementação
1. **Relatório diário**
   - Centralizar a montagem do endereço na ordem rua/número/bairro, evitando número duplicado.
   - Incluir `address_number` também na consulta da rota de compartilhamento e ampliar os testes do texto final.

2. **Autocomplete e vínculo de local**
   - Normalizar busca e comparação com NFD, remoção de diacríticos e minúsculas em todos os autocompletes do formulário.
   - Atualizar a busca de estabelecimentos no backend para comparar nome normalizado, mantendo paginação e permissões atuais.
   - Incluir `estabelecimentoId` no modelo validado do formulário; ao selecionar uma sugestão, preencher os dados uma única vez e preservar o ID até o envio.
   - Cobrir seleção, edição manual e envio com testes para impedir criação duplicada de local.

3. **Eventos anteriores / arquivo**
   - Criar o modo público `/explorar?view=archive`, acessível pela navegação de eventos, sem mover ou duplicar registros no banco.
   - Separar eventos por `YYYY-MM-DD` usando o dia de São Paulo: atuais quando `data >= hoje`; arquivo quando `data < hoje`.
   - Aplicar a mesma regra na Home e na agenda para que o evento do dia só saia após a meia-noite local.
   - Exibir o arquivo do mais recente para o mais antigo, com busca e filtros existentes.

4. **Cards automáticos sem flyer**
   - Criar um conjunto de paletas semânticas variadas e escolher uma de forma estável pelo evento, evitando troca de cor a cada carregamento.
   - Aplicar a arte dinâmica aos cards sem imagem e aos flyers automáticos novos, mantendo contraste, leitura e identidade do Coé a Boa?.
   - Preservar flyers enviados pelos usuários sem qualquer alteração.

## Validação
- Testar relatório, normalização de busca, vínculo do estabelecimento, corte de data e escolha estável de paleta.
- Conferir no navegador o envio com local existente, a Home no dia atual, o arquivo e cards sem flyer em celular e desktop.
