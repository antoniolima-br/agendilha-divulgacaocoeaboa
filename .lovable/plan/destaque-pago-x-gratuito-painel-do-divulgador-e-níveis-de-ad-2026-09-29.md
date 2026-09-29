# Destaque pago x gratuito, painel do divulgador e níveis de admin

## 1. Tipos de evento
- Evento em Destaque (pago): continua com flyer automático, prioridade no topo da agenda, nas seções principais e nos banners da Home.
- Evento Gratuito (somente novos envios): não gera flyer automático. Aparece no fim das listagens, numa lista simples de texto (título, data, hora, local) com um convite "Quer mais visibilidade? Destaque seu rolê".
- Os eventos gratuitos que já existem ficam como estão.

## 2. Painel do Divulgador
- Página própria "Meus anúncios e eventos" mostra só o que o divulgador enviou.
- Itens pendentes podem ser editados; aprovados ficam travados, com o botão "Pedir alteração" (nova submissão para a equipe revisar).
- A trava e a privacidade continuam garantidas também no banco, não só na tela.

## 3. Níveis de administrador
- Admin comum (todos os admins atuais): modera e vê o status de pagamento, mas não dá baixa.
- Administrador Sênior: moderação e gestão de todos os módulos.
- Administrador Financeiro: o único que dá baixa em pagamentos de anúncios e destaques, registrando valor recebido e comprovante.
- Master: tudo, incluindo usuários, liberação de admins e configurações. Na tela "Gerenciar Usuários", o Master escolhe o nível de cada admin.

## Detalhes técnicos
- Novos papéis `senior` e `financeiro` no enum `app_role` (user_roles continua a única fonte).
- Nova tabela `payment_records` (item, tipo anúncio/evento, valor, comprovante, quem deu baixa, data) com RLS: leitura para admins, gravação só para financeiro/master; bucket privado para comprovantes.
- Coluna `is_free` em submissions derivada da ausência de pacote de destaque; ordenação da agenda: destaques primeiro, gratuitos no fim.
- Envio gratuito pula o `generateFallbackFlyer`.
- `useAppPermissions` expõe `isSenior`, `isFinanceiro`, `canSettlePayments`.
