# Separação operacional da Gestão Setorial

## Objetivo
Organizar a Gestão Setorial em quatro áreas simples e independentes, mantendo acesso exclusivo do Master e os dados reais já existentes.

## Implementação
- **Curadoria:** manter somente eventos enviados, leitura do flyer, título obrigatório e ações de aprovar, rejeitar, suspender e editar. Preservar a trava de pagamento antes da liberação de evento pago.
- **Marketing:** incorporar a gestão visual de patrocinadores, banners, imagens, regiões e espaços do app; manter os cartões de engajamento como apoio.
- **Financeiro:** apresentar conciliação de eventos pagos e patrocínios em listas diretas, com comprovantes, baixa e liberação rastreáveis, sem gráficos ou termos complexos dentro da Gestão Setorial.
- **Comercial:** organizar parceiros e anunciantes por etapa, contato, proposta, fechamento e pós-venda, com ações fáceis de tocar.
- Ajustar títulos, descrições e navegação mobile para deixar clara a responsabilidade de cada área.

## Segurança e validação
- Manter autoridade somente nos papéis protegidos e todas as ações sensíveis validadas no backend.
- Reutilizar os fluxos protegidos de anúncios, pagamentos e Curadoria, sem duplicar dados nem mover responsabilidades para o navegador.
- Atualizar testes de separação dos módulos e validar tipos, testes focados e build.
