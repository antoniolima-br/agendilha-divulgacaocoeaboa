# Autocomplete no cadastro de eventos

## Objetivo
Agilizar o preenchimento do cadastro com sugestões de dados já existentes, sem mudar as regras de validação ou o fluxo em duas etapas.

## O que já está atendido
- O relatório já separa “Anúncios / Eventos Pagos (Destaques)” de “Eventos Gratuitos (Não Pagos)”.
- Os gratuitos já aparecem no fim da Home em linhas sem imagens.
- O carrossel já consulta anúncios publicados na base, troca automaticamente a cada 4 segundos, pausa no toque, mouse ou foco e possui indicadores.

## Implementação
- Reaproveitar o campo de sugestões já existente no projeto, com busca protegida pelas permissões atuais da base.
- Manter os autocompletes completos de atrativo, estabelecimento e responsável, que já preenchem dados relacionados.
- Adicionar sugestões aos campos textuais editáveis restantes do formulário atual: descrição, bairro, contatos, e-mail e categoria livre.
- Preservar máscaras de telefone, limites de caracteres, preenchimento por CEP, bloqueios de permissão e validações atuais.
- Se uma coluna protegida não puder ser lida, o campo continuará funcionando normalmente sem sugestões.

## Validação
- Testar os campos alterados e o fluxo de cadastro.
- Revalidar relatório, Home e carrossel para evitar regressões.
