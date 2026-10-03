
- Níveis admin: papéis `senior` e `financeiro` em user_roles somados ao `admin`; baixa de pagamento só via `payment_records` (financeiro/master) — separa quem modera de quem mexe em dinheiro.
- Eventos novos entram com `is_free=true` e sem flyer automático; gratuitos sem destaque aparecem só como texto no fim da agenda.
- A agenda do atrativo é validada no cliente e no banco; intervalos conhecidos menores que 2h bloqueiam o cadastro, enquanto horários sem término apenas geram aviso.
- A confirmação de envio ao organizador usa link seguro do WhatsApp com mensagem pronta; não simular disparo automático sem um provedor autenticado no servidor.
- O horário de funcionamento do atrativo fica em `atrativos.opening_hours` como texto livre e é exibido ao selecioná-lo no formulário; a agenda de apresentações continua sendo validada separadamente.
- Cadastros de estabelecimento usam uma categoria única e ViaCEP apenas para sugerir rua e bairro, que permanecem editáveis.
