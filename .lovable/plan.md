# Vitrine pública e gestão de pagamentos de destaques

## O que será entregue
- Criar uma página pública de destaques, acessível sem login, mostrando flyer, evento, data, horário, local e ação de rota.
- Adicionar acesso público a essa vitrine pela navegação existente.
- Criar uma tela administrativa para acompanhar e alterar cada destaque entre `Pendente`, `Confirmado` e `Cancelado`.
- Preservar a cortesia promocional: ela pode ativar o destaque imediatamente sem exigir pagamento, enquanto registros pagos continuam vinculados à baixa financeira.
- Ativar um evento real aprovado como destaque e validar sua presença na página pública, na Home e nas respostas do Guia.

## Regras
- Somente eventos aprovados, atuais ou futuros e com destaque ativo aparecem na vitrine pública.
- A rota usa os dados reais de localização do evento e abre a navegação externa; se faltarem dados, a ação não será exibida.
- `Confirmado` exige registro financeiro existente; `Pendente` não ativa prioridade paga; `Cancelado` remove o destaque.
- Cortesias permanecem identificadas separadamente e ativas sem transação financeira.

## Detalhes técnicos
- Centralizar as novas rotas e chaves de consulta nos módulos já usados pelo projeto.
- Ampliar o registro financeiro com status controlado e compatível com os dados atuais.
- Reutilizar os cartões, botões, permissões e atualização imediata já existentes.
- Validar os fluxos públicos e administrativos com testes focados e navegação real.
