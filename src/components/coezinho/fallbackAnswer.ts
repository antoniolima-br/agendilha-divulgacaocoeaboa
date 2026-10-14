const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function coezinhoFallbackAnswer(question: string) {
  const text = normalize(question);

  if (/divulg|cadastr|anunci|publicit|parceria|destaque/.test(text)) {
    return "Para divulgar, abra **Publicar Evento**. Você pode enviar o flyer ou preencher tudo manualmente, revisar e mandar para a curadoria. Para anunciar uma marca ou conhecer as opções, abra **Planos e valores**.";
  }

  if (/hoje|agenda|programacao|rolando|role/.test(text)) {
    return "A programação atual fica na **Agenda**, com filtros de data, categoria e local. Selecione **Todas as datas** para ver os próximos rolês ou escolha uma data disponível no calendário. Abra um card para conferir os detalhes e compartilhar.";
  }

  return "Eu te ajudo a encontrar a programação na **Agenda**, publicar um evento, cuidar dos seus envios e conhecer **Planos e valores**. No **Perfil**, você acessa sua conta. Pode me perguntar sobre qualquer etapa.";
}