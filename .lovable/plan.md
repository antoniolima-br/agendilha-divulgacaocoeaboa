# Validação da agenda do atrativo

## Objetivo
Evitar dois eventos incompatíveis para o mesmo atrativo ou artista no mesmo dia e avisar quando já existir outra apresentação.

## O que será feito
- Consultar automaticamente a agenda ao escolher o atrativo, a data e os horários.
- Exibir no cadastro um aviso claro com o horário de cada apresentação já cadastrada naquele dia.
- Liberar o envio quando houver pelo menos 2 horas entre o término de uma apresentação e o início da outra.
- Bloquear o avanço e a publicação quando o intervalo conhecido for menor que 2 horas.
- Quando algum evento não tiver horário de término, mostrar um aviso de possível conflito, mas permitir o envio.
- Revalidar no momento do envio para evitar que dois cadastros simultâneos ultrapassem a regra.

## Regras consideradas
- A conferência incluirá eventos aguardando análise, aprovados, publicados e divulgados; recusados e excluídos não contam.
- O evento em edição será ignorado na própria conferência.
- A identificação usará o vínculo do atrativo/artista quando existir e o nome normalizado como alternativa.
- Horários completos terão proteção no banco; agendas sem término serão apenas sinalizadas, conforme definido.

## Detalhes técnicos
- Criar uma função segura para retornar somente os horários necessários à conferência, sem expor dados privados de outros organizadores.
- Criar proteção no banco para impedir gravações com intervalo conhecido inferior a 2 horas, inclusive em envios simultâneos.
- Vincular corretamente o identificador do atrativo ou artista ao evento enviado.
- Centralizar o cálculo de intervalos em um utilitário testável e integrar o resultado à etapa principal e à revisão final.
- Registrar a regra estrutural no guia técnico do projeto.

## Validação
- Testar conflito anterior e posterior, limite exato de 2 horas, horários sem término, evento recusado e troca de atrativo/data.
- Confirmar que o aviso aparece, o bloqueio funciona e um horário válido continua publicável.
