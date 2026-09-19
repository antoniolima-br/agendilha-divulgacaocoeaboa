# Relatório diário e gratuitos na Home

## Objetivo
Deixar clara a diferença entre divulgação paga e programação gratuita, mantendo os destaques visuais e tornando os gratuitos mais compactos.

## Alterações
- Renomear os dois blocos do relatório e do texto compartilhado para “Anúncios / Eventos Pagos (Destaques)” e “Eventos Gratuitos (Não Pagos)”.
- Manter a seleção, a ordem por horário, a data de São Paulo e o compartilhamento no WhatsApp já existentes.
- Remover eventos gratuitos não destacados das áreas visuais superiores da Home.
- Manter anúncios e eventos pagos/destacados com flyer ou banner.
- Renderizar os gratuitos não destacados apenas no fim da Home, em linhas textuais com data, horário, título e local, sem imagem.
- Preservar o acesso aos detalhes e o link “Ver tudo”.

## Validação
- Atualizar os testes do texto do relatório para os novos títulos.
- Verificar a Home em desktop e celular, confirmando a ausência de imagens na lista gratuita e a preservação dos destaques visuais.
- Confirmar que não há erros na navegação e no compartilhamento.

## Detalhes técnicos
- Reutilizar os filtros públicos atuais: status aprovado/publicado/divulgado, data válida em `America/Sao_Paulo`, gratuidade pelo preço e ausência de destaque.
- Derivar as coleções visuais da Home excluindo os IDs já classificados como gratuitos não destacados, evitando duplicidade.
