# Guia do Coé com agenda e rotas reais

## Objetivo
Fazer o Guia consultar a agenda e os estabelecimentos cadastrados a cada conversa, usando os dados atuais para responder sobre eventos, horários, locais e deslocamento.

## Alterações
- Consultar eventos públicos ativos e aprovados no momento de cada mensagem.
- Consultar os estabelecimentos aprovados e relacioná-los aos eventos pelo cadastro do local, com fallback seguro para o endereço informado no próprio evento.
- Montar para cada evento um endereço completo e um link real “Vá de Uber”, incluindo coordenadas quando disponíveis.
- Reforçar as respostas do Guia para listar os eventos do dia com nome, horário, local, link “ver rolê” e “Vá de Uber”, sem inventar dados nem responder genericamente quando houver opções cadastradas.
- Manter o comportamento atual quando não houver evento compatível, sugerindo o próximo evento real disponível.

## Verificação
- Validar a função do Guia com dados reais da agenda.
- Conferir uma consulta de “Rolês de hoje” e os links retornados.
- Confirmar que o aplicativo continua compilando sem regressões.

## Detalhes técnicos
A atualização ficará concentrada na função segura do Guia. A consulta será refeita por mensagem, sem cache fixo, usando somente eventos publicados/aprovados e estabelecimentos aprovados. Nenhuma nova tabela será criada.
