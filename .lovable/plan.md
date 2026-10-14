# BI de aberturas e conversões

## Objetivo
Integrar à Visão Consolidada e ao Marketing uma leitura única de aberturas de flyers, campanhas, origens de tráfego, leads e conversões comprovadas, com período selecionável e boa leitura no celular.

## Implementação
1. Criar uma camada protegida de coleta e relatório que relacione aberturas de flyers e campanhas às origens conhecidas: redes sociais, WhatsApp, Radar e acesso direto.
2. Tratar como conversão apenas interações já comprováveis pelos dados do produto; quando presença física não estiver coletada, mostrar essa limitação claramente em vez de estimar.
3. Adicionar ao BI consolidado comparativos diários entre aberturas, campanhas, investimento realizado, leads e conversões, incluindo totais e taxas por origem.
4. Adicionar ao Marketing uma tela de funil com evolução diária, distribuição por origem e percurso de abertura até lead/conversão.
5. Reutilizar filtros de período, gráficos e padrões visuais existentes, adaptando cartões, legendas e navegação para smartphones sem rolagem lateral.
6. Cobrir regras de cálculo, origem e conversão com testes e validar os fluxos protegidos e a apresentação em celular e desktop.

## Detalhes técnicos
- Relatórios serão servidos por funções protegidas com autorização setorial no servidor.
- A coleta será mínima e agregada, sem expor dados pessoais.
- Visão Consolidada e Marketing compartilharão o mesmo relatório para evitar divergência entre números.
- Dados ausentes serão exibidos como “sem coleta”, nunca como zero ou resultado estimado.