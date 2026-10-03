# Vários eventos no mesmo estabelecimento

## Resultado
Permitir que o divulgador preencha e envie dois ou mais eventos de uma vez, mantendo o estabelecimento e o contato em comum.

## Experiência
- Manter o primeiro evento no formato atual.
- Adicionar o botão **“Adicionar outro evento”** após os dados do primeiro.
- Exibir cada evento adicional em um bloco numerado, com opção de remover.
- Cada bloco terá seus próprios detalhes: título, data, horário de início obrigatório, término opcional, atração, categoria, classificação e descrição.
- O local/estabelecimento, endereço, responsável, WhatsApp e aceite serão compartilhados por todos os eventos.
- A revisão mostrará cada evento separadamente e destacará exatamente qual item está incompleto.
- Após o envio, todos os eventos serão cadastrados para moderação no mesmo estabelecimento.

## Regras e segurança
- Data, horário de início e atração serão validados individualmente.
- A agenda da atração será conferida para cada evento, inclusive conflitos entre os itens do próprio envio.
- Se algum evento não puder ser salvo, o usuário verá claramente quais foram enviados e qual precisa ser tentado novamente, evitando duplicar os já cadastrados.
- O formulário continuará aceitando apenas um evento; a lista adicional é opcional.

## Organização técnica
- Criar um tipo/esquema reutilizável para os dados individuais de evento.
- Manter os dados compartilhados no formulário principal e a lista dinâmica em um módulo próprio.
- Reaproveitar a montagem do registro e o fluxo atual de cadastro, sem alterar a estrutura pública dos eventos existentes.
- Atualizar resumo, revisão final, rascunho e estado de envio para suportar a lista.
- Validar os fluxos com testes e conferir em celular e computador.
