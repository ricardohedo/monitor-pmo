const { montarItens, anexarChecklistsRest } = require('../js/itens.js');
const { montarAlertas, montarSemanal, formatarTexto, limitarTexto } = require('../js/alertas.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z');   // segunda, 16/11/2026 (Black Friday em 11 dias)
const AGORA10 = new Date('2026-11-17T15:00:00.000Z'); // Black Friday em 10 dias
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-area', name: 'Área solicitante', type: 'list', options: [{ id: 'a-c', value: { text: 'Comercial' } }] }
];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
const MEMBROS = [{ id: 'ana', fullName: 'Ana Souza' }];
const dia = (n, base) => new Date((base || AGORA).getTime() + n * 86400000).toISOString();
const fim = (n, base) => ({ idCustomField: 'f-fim', value: { date: dia(n, base) } });
const idEm = (iso, s) => Math.floor(new Date(iso).getTime() / 1000).toString(16).padStart(8, '0') + (s || 'a').repeat(16).slice(0, 16);

function card(name, over, base) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(0, base), desc: 'texto',
    customFieldItems: [fim(60, base)], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
function dados(cards, agora) {
  const ctx = { agora: agora || AGORA, camposDef: DEF, listas: LISTAS, membros: MEMBROS };
  return { cards, ctx, itens: montarItens(cards, ctx, config) };
}
const roda = (cards, estado, agora) => montarAlertas(dados(cards, agora), config, agora || AGORA, estado);
const tipos = (r) => r.alertas.map(a => a.tipo);

describe('montarAlertas: primeira vez', () => {
  test('só linha de base, sem despejar os críticos de uma vez', () => {
    const r = roda([card('Atras', { customFieldItems: [fim(-5)] }), card('Ok')], {});
    expect(r.primeiraVez).toBe(true);
    expect(tipos(r)).toEqual(['baseline']);
    expect(r.alertas[0].linhas[0]).toContain('2 projetos ativos, 1 críticos');
    expect(r.estado.iniciado).toBe(true);
    expect(r.estado.criticos).toEqual(['Atras']);
  });
});

describe('montarAlertas: o que mudou', () => {
  const base = () => roda([card('Ok'), card('Atras', { customFieldItems: [fim(-5)] })], {}).estado;
  test('crítico novo avisa uma vez; sem mudança não avisa', () => {
    const e1 = base();
    const r = roda([card('Ok', { idMembers: [] }), card('Atras', { customFieldItems: [fim(-5)] })], e1);
    expect(tipos(r)).toEqual(['criticos']);
    expect(r.alertas[0].titulo).toBe('1 projeto ficou crítico');
    expect(r.alertas[0].linhas[0]).toContain('Ok (sem responsável): Sem responsável');
    expect(tipos(roda([card('Ok', { idMembers: [] }), card('Atras', { customFieldItems: [fim(-5)] })], r.estado))).toEqual([]);
  });
  test('impedimento novo', () => {
    const e1 = base();
    const r = roda([card('Ok', { labels: [{ name: 'Impedimento' }] }), card('Atras', { customFieldItems: [fim(-5)] })], e1);
    expect(tipos(r)).toEqual(['impedimento']);
    expect(r.alertas[0].linhas[0]).toContain('Ok (Ana Souza)');
    expect(r.alertas[0].titulo).toBe('1 projeto com impedimento');
  });
  test('vence amanhã e venceu ontem: cada card avisa uma vez por prazo', () => {
    const cards = () => [card('Amanha', { customFieldItems: [fim(1)] }), card('Ontem', { customFieldItems: [fim(-1)] })];
    const r1 = roda(cards(), base());
    expect(r1.alertas.map(a => a.id).sort()).toEqual(['amanha', 'criticos', 'venceu']);
    expect(r1.alertas.find(a => a.id === 'amanha').linhas[0]).toContain('Amanha (Ana Souza) - 25% da checklist');
    expect(r1.alertas.find(a => a.id === 'venceu').titulo).toBe('1 projeto venceu ontem');
    const r2 = roda(cards(), r1.estado);
    expect(tipos(r2)).toEqual([]);
  });
  test('item de checklist vencido (lido pela API) avisa na transição', () => {
    const e1 = base();
    const comItem = card('Ok', { badges: { checkItems: 2, checkItemsChecked: 0 }, checklists: [] });
    anexarChecklistsRest([comItem], [{ id: 'c1', name: 'Plano', idCard: 'Ok', checkItems: [
      { id: 'i1', name: 'a', state: 'incomplete', due: dia(-3) }, { id: 'i2', name: 'b', state: 'incomplete', due: null }] }]);
    const r = roda([comItem, card('Atras', { customFieldItems: [fim(-5)] })], e1);
    expect(tipos(r)).toEqual(['checklist']);
    expect(r.alertas[0].linhas[0]).toBe('Ok (Ana Souza): 1 item(ns) vencido(s)');
    expect(tipos(roda([comItem, card('Atras', { customFieldItems: [fim(-5)] })], r.estado))).toEqual([]);
  });
});

describe('montarAlertas: varejo e projetos novos', () => {
  test('contagem regressiva: Black Friday em 10 dias; não repete no mesmo dia', () => {
    const r1 = roda([card('Ok', {}, AGORA10)], {}, AGORA10);
    expect(tipos(r1)).toEqual(['baseline', 'varejo']);   // a data forte avisa já na primeira execução
    const v = r1.alertas[1];
    expect(v.titulo).toBe('Black Friday em 10 dias');
    expect(v.linhas[0]).toBe('7 dias úteis até 27/11/2026.');
    expect(v.linhas[1]).toContain('Nenhum projeto ligado');
    expect(tipos(roda([card('Ok', {}, AGORA10)], r1.estado, AGORA10))).toEqual([]);
  });
  test('com projetos ligados em risco, lista os riscos', () => {
    const cards = [card('Ligado', { labels: [{ name: 'Black Friday' }], customFieldItems: [fim(20, AGORA10)] }, AGORA10)];
    const a = roda(cards, {}, AGORA10).alertas.find(x => x.tipo === 'varejo');
    expect(a.linhas[1]).toBe('1 projeto em risco de 1.');
    expect(a.linhas[2]).toBe('- Ligado: prazo depois da data');
  });
  test('dias fora da lista (11) não geram aviso de varejo', () => {
    const e1 = roda([card('Ok')], {}).estado;
    expect(tipos(roda([card('Ok')], e1))).toEqual([]);
  });
  test('projeto novo incompleto (criado há até 2 dias) avisa; antigo ou completo não', () => {
    const e1 = roda([card('Ok')], {}).estado;
    const novoRuim = card('NovoRuim', { id: idEm('2026-11-16T10:00:00.000Z', 'b'), idList: 'l-new', customFieldItems: [] });
    const antigo = card('Antigo', { id: idEm('2026-11-01T10:00:00.000Z', 'c'), customFieldItems: [] });
    const r = roda([card('Ok'), novoRuim, antigo], e1);
    expect(tipos(r)).toEqual(['novos']);
    expect(r.alertas[0].titulo).toBe('1 projeto novo criado incompleto');
    expect(r.alertas[0].linhas[0]).toContain('NovoRuim: falta');
    expect(tipos(roda([card('Ok'), novoRuim, antigo], r.estado))).toEqual([]);
  });
  test('muitos itens: corta em maxLinhas e resume o resto', () => {
    const e1 = roda([], {}).estado;
    const muitos = [];
    for (let k = 0; k < 11; k++) muitos.push(card('C' + k, { customFieldItems: [fim(-3)] }));
    const r = roda(muitos, e1);
    const linhas = r.alertas[0].linhas;
    expect(linhas).toHaveLength(config.alertas.maxLinhas + 1);
    expect(linhas[linhas.length - 1]).toBe('... e mais 3.');
  });
  test('esquece avisos antigos (retenção) e mantém os recentes', () => {
    const e1 = roda([card('Ok')], {}).estado;
    e1.enviados = { 'velho:x': '2026-01-01', 'recente:y': '2026-11-10' };
    const r = roda([card('Ok')], e1);
    expect(r.estado.enviados).toEqual({ 'recente:y': '2026-11-10' });
  });
  test('estado ausente ou inválido não quebra', () => {
    expect(roda([card('Ok')], undefined).primeiraVez).toBe(true);
    expect(roda([card('Ok')], null).primeiraVez).toBe(true);
  });
});

describe('formatarTexto, limitarTexto e montarSemanal', () => {
  test('sem alertas devolve null; com alertas monta título, itens e rodapé', () => {
    expect(formatarTexto([], 'PMO', AGORA, config)).toBeNull();
    const t = formatarTexto([{ titulo: '1 projeto venceu ontem', linhas: ['A (Ana)'] }], 'PMO - alertas do dia', AGORA, config);
    expect(t.split('\n')[0]).toBe('PMO - alertas do dia - 16/11/2026');
    expect(t).toContain('* 1 projeto venceu ontem\n  A (Ana)');
    expect(t).toContain('Só leitura do Trello');
  });
  test('limitarTexto corta mensagens grandes e preserva as pequenas', () => {
    expect(limitarTexto('curto', 100)).toBe('curto');
    const longo = limitarTexto('x'.repeat(500), 100);
    expect(longo.length).toBeLessThanOrEqual(100);
    expect(longo).toContain('cortada');
  });
  test('resumo semanal: relatório + rascunhos por gestor, sem enviar a ninguém', () => {
    const s = montarSemanal(dados([card('Atras', { customFieldItems: [fim(-5)] }), card('Orfao', { idMembers: [] })]), config, AGORA, 'PMO - Projetos');
    expect(s.titulo).toBe('PMO - resumo semanal para revisão');
    expect(s.texto).toContain('Relatório do portfólio - PMO - Projetos - 16/11/2026');
    expect(s.texto).toContain('Rascunhos de mensagem por gestor (revise antes de enviar; nada foi enviado a eles)');
    expect(s.texto).toContain('Olá, Ana!');
    expect(s.texto).toContain('1 projeto sem responsável não entra');
  });
  test('semanal sem gestores', () => {
    const s = montarSemanal(dados([card('Orfao', { idMembers: [] })]), config, AGORA);
    expect(s.texto).not.toContain('Rascunhos de mensagem');
  });
});
