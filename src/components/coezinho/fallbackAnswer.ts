const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function coezinhoFallbackAnswer(question: string) {
  const text = normalize(question);

  if (/divulg|cadastr|evento|anunci|publicit|parceria|destaque/.test(text)) {
    return "Para divulgar, abra **Divulgar/Contratar** na navegação e escolha **Cadastrar Evento**. Você pode enviar o flyer ou preencher tudo manualmente, revisar e mandar para a curadoria. Para anunciar uma marca, escolha **Espaço Publicitário**.";
  }

  if (/hoje|agenda|programacao|rolando|role/.test(text)) {
    return "A programação atual fica na **Agenda**, com filtros de data, categoria e local. Selecione **Todas as datas** para ver os próximos rolês ou escolha uma data disponível no calendário. Abra um card para conferir os detalhes e compartilhar.";
  }

  return "O Coé a Boa? reúne a programação na **Agenda**, recomendações no **Meu Radar** e cadastro de eventos em **Divulgar/Contratar**. No **Perfil**, você acessa sua conta. Posso orientar sobre qualquer uma dessas áreas.";
}