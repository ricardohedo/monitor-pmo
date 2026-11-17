/* exported alertaDiario, alertaSemanal, testarSemEnviar, testarEnvio, instalarAcionadores */
/* ===== PMO Alertas - cola do Google (Apps Script) =====
   Lê o Trello (SOMENTE LEITURA), aplica as mesmas regras das visões do Power-Up e avisa
   por e-mail e Google Chat. Fase 1: só para o Ricardo. Nada é escrito no Trello.
   Segredos ficam em "Propriedades do script" (nunca no código): TRELLO_KEY, TRELLO_TOKEN,
   EMAIL_DESTINO, CHAT_WEBHOOK_PMO (opcional), ENVIAR ('sim' para enviar de verdade), BOARD_ID (opcional). */

var BOARD_PADRAO = 'iKiPCV77';

function propriedades_() { return PropertiesService.getScriptProperties(); }

// Chama a API do Trello. O erro mostra só o caminho, nunca a URL (ela leva a chave e o token).
function trello_(caminho, params) {
  var p = propriedades_();
  var chave = p.getProperty('TRELLO_KEY');
  var token = p.getProperty('TRELLO_TOKEN');
  if (!chave || !token) throw new Error('Faltam TRELLO_KEY e TRELLO_TOKEN nas Propriedades do script.');
  var url = 'https://api.trello.com/1/' + caminho + '?key=' + encodeURIComponent(chave) +
    '&token=' + encodeURIComponent(token) + (params ? '&' + params : '');
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('O Trello respondeu ' + r.getResponseCode() + ' em ' + caminho);
  return JSON.parse(r.getContentText());
}

function lerDados_(agora) {
  var M = MonitorPMO;
  var board = propriedades_().getProperty('BOARD_ID') || BOARD_PADRAO;
  var quadro = trello_('boards/' + board, 'fields=name');
  var cards = trello_('boards/' + board + '/cards',
    'customFieldItems=true&fields=name,idList,idMembers,labels,due,dueComplete,dateLastActivity,desc,badges,url,isTemplate');
  var listas = trello_('boards/' + board + '/lists', 'fields=name');
  var campos = trello_('boards/' + board + '/customFields');
  var membros = trello_('boards/' + board + '/members', 'fields=fullName,username');
  var checklists = trello_('boards/' + board + '/checklists', 'checkItems=all&checkItem_fields=name,state,due&fields=name,idCard');
  M.anexarChecklistsRest(cards, checklists);
  var ctx = { agora: agora, camposDef: campos, listas: listas, membros: membros };
  return { nomeBoard: quadro.name, cards: cards, ctx: ctx, itens: M.montarItens(cards, ctx, M.config) };
}

function lerEstado_() {
  try { return JSON.parse(propriedades_().getProperty('ESTADO') || '{}'); } catch (erro) {
    Logger.log('Estado ilegível, recomeçando do zero: ' + erro.message);
    return {};
  }
}

// Uma propriedade aceita ~9 KB: se o estado crescer, esquece os avisos mais antigos.
function gravarEstado_(estado) {
  var enviados = estado.enviados || {};
  var chaves = Object.keys(enviados).sort(function (a, b) { return enviados[a] < enviados[b] ? -1 : 1; });
  while (JSON.stringify(estado).length > 8000 && chaves.length) delete enviados[chaves.shift()];
  propriedades_().setProperty('ESTADO', JSON.stringify(estado));
}

function diaUtil_(agora) {
  var M = MonitorPMO;
  var local = new Date(agora.getTime() + M.config.tzOffsetHoras * 3600000);
  var dow = local.getUTCDay();
  var iso = local.toISOString().slice(0, 10);
  return dow !== 0 && dow !== 6 && M.config.varejo.feriados.indexOf(iso) === -1;
}

// Envia por e-mail e Chat. Sem ENVIAR='sim' (ou em simulação) só registra no log.
function enviar_(assunto, texto, forcar, simular) {
  var p = propriedades_();
  var real = forcar || (!simular && p.getProperty('ENVIAR') === 'sim');
  if (!real) {
    Logger.log('[SIMULAÇÃO - nada foi enviado] ' + assunto + '\n' + texto);
    return { enviado: false, email: false, chat: false };
  }
  var res = { enviado: true, email: false, chat: false };
  var email = p.getProperty('EMAIL_DESTINO');
  if (email) { MailApp.sendEmail(email, assunto, texto); res.email = true; Logger.log('E-mail enviado para ' + email + '.'); }
  var hook = p.getProperty('CHAT_WEBHOOK_PMO');
  if (hook) {
    var resp = UrlFetchApp.fetch(hook, {
      method: 'post', contentType: 'application/json; charset=UTF-8', muteHttpExceptions: true,
      payload: JSON.stringify({ text: MonitorPMO.limitarTexto('*' + assunto + '*\n' + texto, MonitorPMO.config.alertas.limiteChat) })
    });
    var codigo = resp.getResponseCode();
    res.chat = codigo >= 200 && codigo < 300;
    // Nunca registra o endereço do webhook, só o resultado.
    Logger.log(res.chat ? 'Chat: mensagem enviada ao espaço.' : 'Chat: o Google respondeu ' + codigo + ' (confira CHAT_WEBHOOK_PMO).');
  }
  if (!res.email && !res.chat) Logger.log('Atenção: nem EMAIL_DESTINO nem CHAT_WEBHOOK_PMO estão preenchidos.');
  return res;
}

function executarDiario_(opcoes) {
  var o = opcoes || {};
  var M = MonitorPMO;
  var agora = o.agora || new Date();
  if (!o.simular && !diaUtil_(agora)) { Logger.log('Fim de semana ou feriado: nada a fazer.'); return null; }
  var dados = lerDados_(agora);
  var r = M.montarAlertas(dados, M.config, agora, lerEstado_());
  var texto = M.formatarTexto(r.alertas, 'PMO - alertas do dia', agora, M.config);
  var envio = null;
  if (texto) envio = enviar_('[PMO] Alertas do dia', texto, false, o.simular);
  else Logger.log('Nenhum alerta novo hoje.');
  // Só grava o estado se o aviso foi mesmo enviado (ou se não havia o que avisar). Em simulação ou com
  // ENVIAR desligado nada é "gasto": quando você ligar o envio, os avisos saem na primeira execução real.
  if (!o.simular && (!texto || (envio && envio.enviado))) gravarEstado_(r.estado);
  return { texto: texto, envio: envio, alertas: r.alertas };
}

function executarSemanal_(opcoes) {
  var o = opcoes || {};
  var M = MonitorPMO;
  var agora = o.agora || new Date();
  var dados = lerDados_(agora);
  var s = M.montarSemanal(dados, M.config, agora, dados.nomeBoard);
  return { texto: s.texto, envio: enviar_('[PMO] ' + s.titulo, s.texto, false, o.simular) };
}

// ----- Funções que você executa / que o relógio chama (sem parâmetros: o relógio manda um objeto de evento) -----
function alertaDiario() { return executarDiario_({}); }
function alertaSemanal() { return executarSemanal_({}); }

// 1) Veja no log o que SERIA enviado, sem enviar nada e sem gravar nada.
function testarSemEnviar() {
  executarDiario_({ simular: true });
  executarSemanal_({ simular: true });
}

// 2) Prova que o e-mail/Chat chegam (manda uma mensagem de teste de verdade).
function testarEnvio() {
  return enviar_('[TESTE] PMO Alertas', 'Se você recebeu isto, o canal está funcionando. Nada foi alterado no Trello.', true, false);
}

function instalarAcionadores() {
  removerAcionadores();
  ScriptApp.newTrigger('alertaDiario').timeBased().everyDays(1).atHour(7).nearMinute(30).create();
  ScriptApp.newTrigger('alertaSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).nearMinute(45).create();
  Logger.log('Acionadores criados: alertaDiario (todo dia, ~07:30) e alertaSemanal (segunda, ~07:45).');
}

function removerAcionadores() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'alertaDiario' || f === 'alertaSemanal') ScriptApp.deleteTrigger(t);
  });
}
