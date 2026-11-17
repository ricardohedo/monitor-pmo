const { montarItens } = require('../js/itens.js');
const { montarVarejo, diasUteis } = require('../js/varejo.js');
const { montarAreas } = require('../js/area.js');
const { montarHigiene } = require('../js/higiene.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // segunda, 16/11/2026
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-area', name: 'Área solicitante', type: 'list', options: [
    { id: 'a-c', value: { text: 'Comercial' } }, { id: 'a-o', value: { text: 'Operações' } }] },
  { id: 'f-txt', name: 'Outro', type: 'text' }
];
const LISTAS = [
  { id: 'l-exe', name: 'Em Execução' }, { id: 'l-rev', name: 'Em Revisão' }, { id: 'l-ok', name: 'Concluídos' }
];
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const fim = (n) => ({ idCustomField: 'f-fim', value: { date: dia(n) } });

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(-1),
    customFieldItems: [fim(60)], badges: { checkItems: 4, checkItemsChecked: 1, attachments: 0, comments: 0 }
  }, over);
}
const itens = (cards, defs) => montarItens(cards, { agora: AGORA, camposDef: defs || DEF, listas: LISTAS, membros: [] }, config);

describe('montarItens (campos novos)', () => {
  test('etiquetas, área (lista e texto), anexos e comentários', () => {
    const r = itens([card('A', { labels: [{ name: 'Black Friday' }], customFieldItems: [fim(60), { idCustomField: 'f-area', idValue: 'a-c' }] })])[0];
    expect(r.etiquetas).toEqual(['black friday']);
    expect(r.area).toBe('Comercial');
    expect(r.anexos).toBe(0);
    expect(r.comentarios).toBe(0);
    const defTexto = [{ id: 'f-area', name: 'Área solicitante', type: 'text' }];
    const t = itens([card('T', { customFieldItems: [{ idCustomField: 'f-area', value: { text: 'T.I.' } }] })], defTexto)[0];
    expect(t.area).toBe('T.I.');
  });
  test('sem badges de anexos/comentários vira null', () => {
    const r = itens([card('S', { badges: {} })])[0];
    expect(r.anexos).toBeNull();
    expect(r.comentarios).toBeNull();
    expect(r.area).toBeNull();
  });
});

describe('diasUteis', () => {
  const k = (s) => Date.parse(s + 'T00:00:00Z');
  test('conta só dias úteis, sem fim de semana nem feriado', () => {
    expect(diasUteis(k('2026-11-16'), k('2026-11-27'), [])).toBe(9);
    expect(diasUteis(k('2026-11-16'), k('2026-11-27'), ['2026-11-20'])).toBe(8);
    expect(diasUteis(k('2026-11-21'), k('2026-11-22'), [])).toBe(0);
    expect(diasUteis(k('2026-11-16'), k('2026-11-16'), [])).toBe(0);
  });
});

describe('montarVarejo', () => {
  test('Black Friday: dias, dias úteis e projetos ligados com motivos', () => {
    const r = montarVarejo(itens([
      card('Ligado', { labels: [{ name: 'Black Friday' }], customFieldItems: [fim(20)] }),
      card('LigadoSemPrazo', { labels: [{ name: 'black friday' }], customFieldItems: [] }),
      card('LigadoOk', { labels: [{ name: 'Black Friday' }], customFieldItems: [fim(8)] }),
      card('AteAData', { customFieldItems: [fim(5)] }),
      card('Longe', { customFieldItems: [fim(90)] })
    ]), config, AGORA);
    const bf = r.datas.find(d => d.nome === 'Black Friday');
    expect(bf.dias).toBe(11);
    expect(bf.diasUteis).toBe(8);
    expect(bf.perto).toBe(true);
    expect(bf.ligados.map(l => [l.name, l.motivos])).toEqual([
      ['Ligado', ['prazo depois da data']],
      ['LigadoSemPrazo', ['sem prazo']],
      ['LigadoOk', []]
    ]);
    expect(bf.ate.map(a => a.name)).toEqual(['AteAData']);
    expect(bf.emRisco).toBe(2);
  });
  test('datas ordenadas e janela limitada; concluído não entra', () => {
    const r = montarVarejo(itens([card('Feito', { idList: 'l-ok', labels: [{ name: 'Natal' }] })]), config, AGORA);
    expect(r.datas.map(d => d.nome).slice(0, 2)).toEqual(['Black Friday', 'Natal']);
    expect(r.datas.every(d => d.dias <= config.varejo.dias)).toBe(true);
    expect(r.datas.find(d => d.nome === 'Natal').ligados).toEqual([]);
    expect(r.datas.find(d => d.nome === 'Natal').perto).toBe(false);
  });
  test('crítico entra como motivo e atrasado não duplica', () => {
    const r = montarVarejo(itens([
      card('Atras', { labels: [{ name: 'Natal' }], customFieldItems: [fim(-3)] }),
      card('SemResp', { labels: [{ name: 'Natal' }], idMembers: [] })
    ]), config, AGORA);
    const nat = r.datas.find(d => d.nome === 'Natal');
    expect(nat.ligados.find(l => l.name === 'Atras').motivos).toEqual(['atrasado']);
    expect(nat.ligados.find(l => l.name === 'SemResp').motivos).toEqual(['prazo depois da data', 'crítico']);
  });
});

describe('montarAreas', () => {
  test('agrupa por área, semáforo e piores; sem área por último', () => {
    const c = (id) => ({ idCustomField: 'f-area', idValue: id });
    const r = montarAreas(itens([
      card('C1', { customFieldItems: [fim(60), c('a-c')] }),
      card('C2', { customFieldItems: [fim(-5), c('a-c')] }),
      card('O1', { customFieldItems: [fim(60), c('a-o')] }),
      card('O2', { customFieldItems: [fim(60), c('a-o')], idMembers: [] }),
      card('Livre'),
      card('Feito', { idList: 'l-ok', customFieldItems: [c('a-c')] })
    ]));
    expect(r.linhas.map(l => l.nome)).toEqual(['Comercial', 'Operações', 'Sem área definida']);
    const com = r.linhas[0];
    expect([com.ativos, com.vermelho, com.atrasados, com.semaforo]).toEqual([2, 1, 1, 'vermelho']);
    expect(com.piores.map(p => p.name)).toEqual(['C2']);
    const op = r.linhas[1];
    expect([op.semResponsavel, op.vermelho]).toEqual([1, 1]);
    expect(r.total).toBe(5);
    expect(r.linhas[2].semArea).toBe(true);
  });
  test('área verde e aderência média', () => {
    const r = montarAreas(itens([card('Ok', { customFieldItems: [fim(60), { idCustomField: 'f-area', idValue: 'a-c' }] })]));
    expect(r.linhas[0].semaforo).toBe('verde');
    expect(r.linhas[0].aderencia).toBeGreaterThan(0);
  });
  test('sem projetos', () => {
    expect(montarAreas([])).toEqual({ linhas: [], total: 0 });
  });
});

describe('montarHigiene', () => {
  test('evidência, checklist pendente, revisão sem comentário, pausado sem motivo', () => {
    const r = montarHigiene(itens([
      card('SemProva', { idList: 'l-ok', dateLastActivity: dia(-3) }),
      card('ComProva', { idList: 'l-ok', dateLastActivity: dia(-3), badges: { checkItems: 2, checkItemsChecked: 2, attachments: 1 } }),
      card('Velho', { idList: 'l-ok', dateLastActivity: dia(-90), badges: { checkItems: 0, checkItemsChecked: 0, attachments: 0 } }),
      card('Revisao', { idList: 'l-rev' }),
      card('RevisaoOk', { idList: 'l-rev', badges: { comments: 2 } }),
      card('Pausa', { labels: [{ name: 'Pausado' }] }),
      card('PausaOk', { labels: [{ name: 'Pausado' }], badges: { comments: 1 } })
    ]), config);
    const por = {};
    r.grupos.forEach(g => { por[g.id] = g.itens.map(i => i.name); });
    expect(por.evidencia).toEqual(['SemProva']);
    expect(por.checklist).toEqual(['SemProva', 'Velho'].filter(n => n === 'SemProva'));
    expect(por.revisao).toEqual(['Revisao']);
    expect(por.pausado).toEqual(['Pausa']);
    expect(r.total).toBe(4);
    expect(r.grupos.find(g => g.id === 'checklist').itens[0].detalhe).toBe('1 de 4 itens');
  });
  test('sem pendências e sem dados de anexos/comentários', () => {
    const r = montarHigiene(itens([card('A', { badges: {} }), card('C', { idList: 'l-ok', badges: {} })]), config);
    expect(r).toEqual({ grupos: [], total: 0 });
  });
});
