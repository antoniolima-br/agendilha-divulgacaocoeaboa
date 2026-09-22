# Proteger listas de anúncios

## Alterações
- Validar os dados de anúncios em um único ponto, aceitando apenas registros com identificador e campos essenciais válidos.
- Normalizar fotos e demais valores opcionais para impedir listas nulas ou formatos inesperados.
- Reforçar vitrines, painel, anúncios do usuário e galerias antes de filtrar, fatiar ou percorrer dados.
- Manter estados vazios com uma orientação clara quando não houver anúncios válidos.

## Validação
- Cobrir a normalização com testes de listas nulas, objetos inválidos e fotos inesperadas.
- Executar testes relacionados e verificação de tipos.
