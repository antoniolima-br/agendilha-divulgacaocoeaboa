# Auditoria de eventos futuros da agenda

## Objetivo
Garantir que eventos futuros aprovados e publicados apareçam corretamente, respeitando o horário de São Paulo e bloqueando rascunhos ou pendências.

## Alterações
- Alinhar a consulta da agenda aos três estados públicos já reconhecidos pelo sistema: aprovado, publicado e divulgado.
- Tornar a leitura de datas estrita e previsível para datas simples e horários em UTC.
- Remover da agenda pública registros sem data válida, em vez de agrupá-los como eventos futuros.
- Adicionar diagnósticos temporários em ambiente de desenvolvimento para respostas vazias, formatos inválidos e registros descartados.
- Cobrir datas, fuso horário, estados públicos e formatos inválidos com testes.

## Verificação
- Executar os novos testes da agenda e a validação de tipos.
- Confirmar que pendentes e rascunhos continuam fora da agenda pública.

## Detalhes técnicos
A consulta continuará usando a visão pública segura e o filtro de moderação existente. Nenhuma regra de aprovação ou fluxo administrativo será alterado.
