const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { gerar, SAIDA } = require('../scripts/gerar-alertas.js');

const SEGREDO_TOKEN = 'TOKEN-SECRETO-NAO-PODE-VAZAR';
const SEGREDO_CHAVE = 'CHAVE-SECRETA-NAO-PODE-VAZAR';
const WEBHOOK = 'https://chat.googleapis.com/v1/spaces/ABC/messages?key=K&token=T';

const SEGUNDA = new Date('2026-11-16T13:00:00.000Z'); // segunda 10h em Brasília
const SABADO = new Date('2026-11-14T13:00:00.000Z');
const dia = (n) => new Date(SEGUNDA.getTime() + n * 86400000).toISOString();

function dadosTrello() {
  return {
    'boards/BOARD': { name: 'PMO - Projetos' },
    'boards/BOARD/cards': [
      { id: 'c1', name: 'Atrasado', url: 'u/1', idList: 'l1', idMembers: ['m1'], labels: [], due: null, dueComplete: false,
        dateLastActivity: dia(0), desc: 'x', badges: { checkItems: 2, checkItemsChecked: 0 }, isTemplate: false,
        customFieldItems: [{ idCustomField: 'f1', value: { date: dia(-5) } }] },
      { id: 'c2', name: 'Em dia', url: 'u/2', idList: 'l1', idMembers: ['m1'], labels: [], due: null, dueComplete: false,
        dateLastActivity: dia(0), desc: 'x', badges: { checkItems: 0, checkItemsChecked: 0 }, isTemplate: false,
        customFieldItems: [{ idCustomField: 'f1', value: { date: dia(60) } }] }
    ],
    'boards/BOARD/lists': [{ id: 'l1', name: 'Em Execução' }],
    'boards/BOARD/customFields': [{ id: 'f1', name: 'Fim planejado', type: 'date' }],
    'boards/BOARD/members': [{ id: 'm1', fullName: 'Ana Souza', username: 'ana' }],
    'boards/BOARD/checklists': [{ id: 'k1', name: 'Plano', idCard: 'c1', checkItems: [
      { id: 'i1', name: 'a', state: 'incomplete', due: dia(-2) }, { id: 'i2', name: 'b', state: 'incomplete', due: null }] }]
  };
}

function ambiente(propsIniciais, opcoes) {
  const o = opcoes || {};
  const props = Object.assign({ TRELLO_KEY: SEGREDO_CHAVE, TRELLO_TOKEN: SEGREDO_TOKEN, BOARD_ID: 'BOARD' }, propsIniciais);
  const log = []; const emails = []; const chamadas = []; const gatilhos = []; const apagados = [];
  const dados = o.dados || dadosTrello();
  const sandbox = {
    Logger: { log: (m) => log.push(String(m)) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = v; }
    }) },
    MailApp: { sendEmail: (para, assunto, corpo) => emails.push({ para, assunto, corpo }) },
    UrlFetchApp: { fetch: (url, opts) => {
      chamadas.push({ url, opts });
      if (url.indexOf('api.trello.com') !== -1) {
        if (o.statusTrello) return { getResponseCode: () => o.statusTrello, getContentText: () => 'erro' };
        const caminho = url.split('/1/')[1].split('?')[0];
        return { getResponseCode: () => 200, getContentText: () => JSON.stringify(dados[caminho]) };
      }
      return { getResponseCode: () => o.statusChat || 200, getContentText: () => 'ok' };
    } },
    ScriptApp: {
      WeekDay: { MONDAY: 'MONDAY' },
      newTrigger: (f) => { const t = { f, tipo: [] }; const enc = { timeBased: () => enc, everyDays: () => enc, atHour: () => enc,
        nearMinute: () => enc, onWeekDay: () => enc, create: () => { gatilhos.push(f); return t; } }; return enc; },
      getProjectTriggers: () => gatilhos.map((f) => ({ getHandlerFunction: () => f })),
      deleteTrigger: (t) => { apagados.push(t.getHandlerFunction()); gatilhos.splice(gatilhos.indexOf(t.getHandlerFunction()), 1); }
    },
    JSON, Date, Object, Array, Math, String, Number, RegExp, Error, encodeURIComponent
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(SAIDA, 'utf8'), sandbox);
  const rodar = (codigo) => vm.runInContext(codigo, sandbox);
  return { props, log, emails, chamadas, gatilhos, apagados, rodar, sandbox };
}

describe('arquivo do Google (PMO-Alertas.gs)', () => {
  test('o arquivo gerado está em dia com os fontes (rode npm run alertas:gerar)', () => {
    expect(fs.readFileSync(SAIDA, 'utf8')).toBe(gerar());
  });

  test('carrega no ambiente do Google e expõe as funções que o relógio e o Ricardo usam', () => {
    const e = ambiente({});
    ['alertaDiario', 'alertaSemanal', 'testarSemEnviar', 'testarEnvio', 'instalarAcionadores', 'removerAcionadores']
      .forEach((f) => expect(e.rodar('typeof ' + f)).toBe('function'));
    expect(e.rodar('typeof MonitorPMO.montarAlertas')).toBe('function');
  });

  test('simulação (ENVIAR desligado): mostra no log, não envia e NÃO grava estado', () => {
    const e = ambiente({ EMAIL_DESTINO: 'ricardo@bigbox.com.br', CHAT_WEBHOOK_PMO: WEBHOOK });
    const r = e.rodar('executarDiario_({ agora: new Date("' + SEGUNDA.toISOString() + '") })');
    expect(r.texto).toContain('Alertas ligados: linha de base registrada');
    expect(e.emails).toHaveLength(0);
    expect(e.chamadas.filter((c) => c.url.indexOf('chat.googleapis') !== -1)).toHaveLength(0);
    expect(e.log.join('\n')).toContain('[SIMULAÇÃO - nada foi enviado]');
    expect(e.props.ESTADO).toBeUndefined();
  });

  test('envio real: e-mail + Chat uma vez, estado gravado, segunda execução não repete', () => {
    const e = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br', CHAT_WEBHOOK_PMO: WEBHOOK });
    const agora = 'new Date("' + SEGUNDA.toISOString() + '")';
    e.rodar('executarDiario_({ agora: ' + agora + ' })');
    expect(e.emails).toHaveLength(1);
    expect(e.emails[0].para).toBe('ricardo@bigbox.com.br');
    expect(e.emails[0].assunto).toBe('[PMO] Alertas do dia');
    expect(e.emails[0].corpo).toContain('2 projetos ativos, 1 críticos');
    const chat = e.chamadas.filter((c) => c.url === WEBHOOK);
    expect(chat).toHaveLength(1);
    expect(JSON.parse(chat[0].opts.payload).text).toContain('*[PMO] Alertas do dia*');
    expect(JSON.parse(e.props.ESTADO).iniciado).toBe(true);
    e.rodar('executarDiario_({ agora: ' + agora + ' })');
    expect(e.emails).toHaveLength(1);   // nada novo: não manda de novo
    expect(e.log.join('\n')).toContain('Nenhum alerta novo hoje.');
  });

  test('só e-mail quando não há webhook do Chat; só Chat quando não há e-mail', () => {
    const a = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    a.rodar('executarDiario_({ agora: new Date("' + SEGUNDA.toISOString() + '") })');
    expect(a.emails).toHaveLength(1);
    expect(a.chamadas.filter((c) => c.url.indexOf('chat.googleapis') !== -1)).toHaveLength(0);
    const b = ambiente({ ENVIAR: 'sim', CHAT_WEBHOOK_PMO: WEBHOOK });
    b.rodar('executarDiario_({ agora: new Date("' + SEGUNDA.toISOString() + '") })');
    expect(b.emails).toHaveLength(0);
    expect(b.chamadas.filter((c) => c.url === WEBHOOK)).toHaveLength(1);
  });

  test('o log prova o envio por e-mail e Chat, sem mostrar o endereço do webhook', () => {
    const e = ambiente({ EMAIL_DESTINO: 'ricardo@bigbox.com.br', CHAT_WEBHOOK_PMO: WEBHOOK });
    const r = e.rodar('testarEnvio()');
    expect(r).toEqual({ enviado: true, email: true, chat: true });
    const log = e.log.join(' | ');
    expect(log).toContain('E-mail enviado para ricardo@bigbox.com.br.');
    expect(log).toContain('Chat: mensagem enviada ao espaço.');
    expect(log).not.toContain('chat.googleapis.com');
  });

  test('Chat que recusa (ex.: webhook errado) aparece no log como falha, sem derrubar o e-mail', () => {
    const e = ambiente({ EMAIL_DESTINO: 'ricardo@bigbox.com.br', CHAT_WEBHOOK_PMO: WEBHOOK }, { statusChat: 404 });
    const r = e.rodar('testarEnvio()');
    expect(r).toEqual({ enviado: true, email: true, chat: false });
    expect(e.log.join(' | ')).toContain('Chat: o Google respondeu 404');
    expect(e.log.join(' | ')).not.toContain('chat.googleapis.com');
  });

  test('fim de semana não roda (nem consulta o Trello)', () => {
    const e = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    const r = e.rodar('executarDiario_({ agora: new Date("' + SABADO.toISOString() + '") })');
    expect(r).toBeNull();
    expect(e.chamadas).toHaveLength(0);
    expect(e.log.join('\n')).toContain('Fim de semana ou feriado');
  });

  test('o Trello é lido só com GET e a leitura traz as checklists com itens', () => {
    const e = ambiente({ EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    e.rodar('executarDiario_({ simular: true, agora: new Date("' + SEGUNDA.toISOString() + '") })');
    const trello = e.chamadas.filter((c) => c.url.indexOf('api.trello.com') !== -1);
    expect(trello.length).toBe(6);
    trello.forEach((c) => expect((c.opts && c.opts.method) || 'get').toBe('get'));
    expect(trello.some((c) => (c.url.indexOf('/checklists?') !== -1 && c.url.indexOf('&checkItems=all') !== -1))).toBe(true);
  });

  test('segunda execução enxerga o item de checklist vencido e o crítico novo', () => {
    const e = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    const agora = 'new Date("' + SEGUNDA.toISOString() + '")';
    e.rodar('executarDiario_({ agora: ' + agora + ' })');
    // agora o "Em dia" passa a atrasado e o item vencido do outro aparece como transição
    const estado = JSON.parse(e.props.ESTADO);
    estado.criticos = []; estado.checkVenc = [];
    e.props.ESTADO = JSON.stringify(estado);
    e.rodar('executarDiario_({ agora: ' + agora + ' })');
    const corpo = e.emails[1].corpo;
    expect(corpo).toContain('1 projeto ficou crítico');
    expect(corpo).toContain('Atrasado (Ana Souza)');
    expect(corpo).toContain('1 projeto com item de checklist vencido');
  });

  test('resumo semanal sai como rascunho para revisão', () => {
    const e = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    const r = e.rodar('executarSemanal_({ agora: new Date("' + SEGUNDA.toISOString() + '") })');
    expect(e.emails[0].assunto).toBe('[PMO] PMO - resumo semanal para revisão');
    expect(r.texto).toContain('Relatório do portfólio - PMO - Projetos - 16/11/2026');
    expect(r.texto).toContain('nada foi enviado a eles');
  });

  test('testarEnvio manda mensagem de teste mesmo com ENVIAR desligado', () => {
    const e = ambiente({ EMAIL_DESTINO: 'ricardo@bigbox.com.br', CHAT_WEBHOOK_PMO: WEBHOOK });
    e.rodar('testarEnvio()');
    expect(e.emails[0].assunto).toBe('[TESTE] PMO Alertas');
    expect(e.chamadas.filter((c) => c.url === WEBHOOK)).toHaveLength(1);
  });

  test('testarSemEnviar registra no log e nunca envia nem grava', () => {
    const e = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br', CHAT_WEBHOOK_PMO: WEBHOOK });
    e.sandbox.agoraTeste = SEGUNDA;
    e.rodar('testarSemEnviar()');
    expect(e.emails).toHaveLength(0);
    expect(e.chamadas.filter((c) => c.url === WEBHOOK)).toHaveLength(0);
    expect(e.props.ESTADO).toBeUndefined();
    expect(e.log.join('\n')).toContain('[SIMULAÇÃO - nada foi enviado]');
  });

  test('sem e-mail nem Chat configurados: avisa no log em vez de falhar', () => {
    const e = ambiente({ ENVIAR: 'sim' });
    e.rodar('executarDiario_({ agora: new Date("' + SEGUNDA.toISOString() + '") })');
    expect(e.log.join('\n')).toContain('nem EMAIL_DESTINO nem CHAT_WEBHOOK_PMO');
  });

  test('segredos nunca vazam: erro do Trello e log não mostram chave nem token', () => {
    const e = ambiente({ EMAIL_DESTINO: 'ricardo@bigbox.com.br' }, { statusTrello: 401 });
    let erro = null;
    try { e.rodar('executarDiario_({ simular: true, agora: new Date("' + SEGUNDA.toISOString() + '") })'); } catch (x) { erro = x; }
    expect(erro.message).toBe('O Trello respondeu 401 em boards/BOARD');
    expect(erro.message).not.toContain(SEGREDO_TOKEN);
    expect(e.log.join('\n')).not.toContain(SEGREDO_TOKEN);
    expect(e.log.join('\n')).not.toContain(SEGREDO_CHAVE);
  });

  test('sem chave/token: mensagem clara', () => {
    const e = ambiente({ TRELLO_TOKEN: '' });
    e.props.TRELLO_TOKEN = '';
    expect(() => e.rodar('executarDiario_({ simular: true, agora: new Date("' + SEGUNDA.toISOString() + '") })')).toThrow('Faltam TRELLO_KEY e TRELLO_TOKEN');
  });

  test('estado ilegível recomeça do zero sem quebrar', () => {
    const e = ambiente({ ESTADO: '{quebrado', ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    e.rodar('executarDiario_({ agora: new Date("' + SEGUNDA.toISOString() + '") })');
    expect(e.log.join('\n')).toContain('Estado ilegível');
    expect(e.emails).toHaveLength(1);
  });

  test('o estado gravado nunca passa de ~8 KB (esquece avisos antigos)', () => {
    const e = ambiente({});
    const enviados = {};
    for (let k = 0; k < 400; k++) enviados['aviso:' + k + ':' + 'x'.repeat(30)] = '2026-11-' + String(1 + (k % 28)).padStart(2, '0');
    e.sandbox.estadoGrande = { iniciado: true, enviados };
    e.rodar('gravarEstado_(estadoGrande)');
    expect(e.props.ESTADO.length).toBeLessThanOrEqual(8000);
    expect(JSON.parse(e.props.ESTADO).iniciado).toBe(true);
  });

  test('acionadores: instala os dois e reinstalar não duplica; remover limpa', () => {
    const e = ambiente({});
    e.rodar('instalarAcionadores()');
    expect(e.gatilhos.sort()).toEqual(['alertaDiario', 'alertaSemanal']);
    e.rodar('instalarAcionadores()');
    expect(e.gatilhos.sort()).toEqual(['alertaDiario', 'alertaSemanal']);
    e.rodar('removerAcionadores()');
    expect(e.gatilhos).toEqual([]);
  });

  test('o relógio chama as funções com um objeto de evento: não pode virar "simulação"', () => {
    const e = ambiente({ ENVIAR: 'sim', EMAIL_DESTINO: 'ricardo@bigbox.com.br' });
    // alertaDiario() não aceita parâmetro: o evento do relógio é ignorado
    expect(e.rodar('alertaDiario.length')).toBe(0);
    expect(e.rodar('alertaSemanal.length')).toBe(0);
  });

  test('o arquivo não contém segredos nem endereços de Chat', () => {
    const codigo = fs.readFileSync(SAIDA, 'utf8');
    expect(codigo).not.toMatch(/chat\.googleapis\.com\/v1\/spaces\/[A-Za-z0-9_-]+\/messages\?key=/);
    expect(codigo).not.toMatch(/token=[0-9a-f]{32,}/i);
    expect(codigo).not.toMatch(/ATTA[0-9a-f]{20,}/);
    expect(path.basename(SAIDA)).toBe('PMO-Alertas.gs');
  });
});
