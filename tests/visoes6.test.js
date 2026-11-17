const { montarItens } = require('../js/itens.js');
const { montarFunil } = require('../js/funil.js');
const { montarMapa } = require('../js/mapa.js');
const { montarPulso } = require('../js/pulso.js');
const { montarPrioridades } = require('../js/prioridades.js');
const { montarDiretoria } = require('../js/diretoria.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // segunda, 16/11/2026
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [
    { id: 'p-m', value: { text: 'Máxima' } }, { id: 'p-a', value: { text: 'Alta' } }, { id: 'p-b', value: { text: 'Baixa' } }] },
  { id: 'f-urg', name: 'Urgente', type: 'list', options: [{ id: 'u-s', value: { text: 'Sim' } }] }
];
const LISTAS = [
  { id: 'l-pri', name: 'Priorizados' }, { id: 'l-exe', name: 'Em Execução' }, { id: 'l-rev', name: 'Em Revisão' }, { id: 'l-ok', name: 'Concluídos' }
];
const MEMBROS = [{ id: 'ana', fullName: 'Ana Souza' }, { id: 'beto', fullName: 'Beto Lima' }];
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const fim = (n) => ({ idCustomField: 'f-fim', value: { date: dia(n) } });

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(-1), desc: 'texto',
    customFieldItems: [fim(60)], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const itens = (cards) => montarItens(cards, { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: MEMBROS }, config);
const ORDEM = ['Priorizados', 'Em Execução', 'Em Revisão', 'Concluídos'];

describe('montarFunil', () => {
  test('por lista na ordem do board: totais, saúde, parado médio, mais parado e faixas', () => {
    const r = montarFunil(itens([
      card('A', { dateLastActivity: dia(-2) }),
      card('B', { dateLastActivity: dia(-20), customFieldItems: [fim(-3)] }),
      card('C', { dateLastActivity: dia(-9) }),
      card('P', { idList: 'l-pri', dateLastActivity: dia(0) }),
      card('Feito', { idList: 'l-ok', dateLastActivity: dia(-60) })
    ]), config, ORDEM);
    expect(r.listas.map(l => l.nome)).toEqual(['Priorizados', 'Em Execução', 'Concluídos']);
    const exe = r.listas[1];
    expect([exe.total, exe.ativos, exe.vermelho, exe.paradoMedio]).toEqual([3, 3, 1, 10]);
    expect(exe.maisParado).toEqual({ id: 'B', name: 'B', dias: 20 });
    expect(r.faixas.map(f => f.rotulo)).toEqual(['0 a 3 dias', '4 a 7 dias', '8 a 14 dias', '15 a 30 dias', 'mais de 30 dias']);
    expect(exe.faixas).toEqual([1, 0, 1, 1, 0]);
    expect(r.faixas.map(f => f.n)).toEqual([2, 0, 1, 1, 0]);
    expect(r.listas[2].ativos).toBe(0);
    expect(r.totalAtivos).toBe(4);
  });
  test('gargalo: lista com mais projetos com problema (mínimo 2 ativos); sem problema = null', () => {
    const ruim = montarFunil(itens([
      card('A', { customFieldItems: [fim(-3)] }), card('B', { customFieldItems: [fim(-1)] }), card('C', { idList: 'l-pri' })
    ]), config, ORDEM);
    expect(ruim.gargalo.nome).toBe('Em Execução');
    const bom = montarFunil(itens([card('A'), card('B')]), config, ORDEM);
    expect(bom.gargalo).toBeNull();
  });
  test('lista fora da ordem vai para o fim; sem ordem informada ordena por nome', () => {
    const r = montarFunil(itens([card('A'), card('P', { idList: 'l-pri' })]), config, ['Em Execução']);
    expect(r.listas.map(l => l.nome)).toEqual(['Em Execução', 'Priorizados']);
    expect(montarFunil(itens([card('A'), card('P', { idList: 'l-pri' })]), config).listas.map(l => l.nome)).toEqual(['Em Execução', 'Priorizados']);
    expect(montarFunil([], config, []).listas).toEqual([]);
  });
  test('card sem data de atividade não entra nas faixas', () => {
    const r = montarFunil(itens([card('S', { dateLastActivity: undefined })]), config, ORDEM);
    expect(r.listas[0].paradoMedio).toBeNull();
    expect(r.listas[0].maisParado).toBeNull();
  });
});

describe('montarMapa', () => {
  test('pessoa x fase com a pior cor da célula; sem responsável por último', () => {
    const r = montarMapa(itens([
      card('A'), card('B', { customFieldItems: [fim(-2)] }), card('C', { idList: 'l-pri' }),
      card('D', { idMembers: ['beto'] }), card('Orfao', { idMembers: [] }), card('Feito', { idList: 'l-ok' })
    ]), ORDEM);
    expect(r.colunas).toEqual(['Priorizados', 'Em Execução']);
    expect(r.linhas.map(l => l.nome)).toEqual(['Ana Souza', 'Beto Lima', 'Sem responsável']);
    const ana = r.linhas[0];
    expect([ana.total, ana.criticos]).toEqual([3, 1]);
    expect(ana.celulas.map(c => [c.n, c.cor])).toEqual([[1, 'verde'], [2, 'vermelho']]);
    expect(r.linhas[1].celulas[0]).toEqual({ n: 0, cor: null, itens: [] });
    expect(r.linhas[2].semDono).toBe(true);
    expect(r.totais).toEqual([1, 4]);
  });
  test('projeto com dois responsáveis conta para os dois; sem projetos', () => {
    const r = montarMapa(itens([card('Dupla', { idMembers: ['ana', 'beto'] })]), ORDEM);
    expect(r.linhas.map(l => l.total)).toEqual([1, 1]);
    expect(montarMapa([], [])).toEqual({ colunas: [], linhas: [], totais: [] });
  });
});

describe('montarPulso', () => {
  test('agrupa por tempo sem movimento e conta movimentados e parados', () => {
    const r = montarPulso(itens([
      card('Hoje', { dateLastActivity: dia(0) }), card('Ontem', { dateLastActivity: dia(-1) }),
      card('Semana', { dateLastActivity: dia(-5) }), card('Silencio', { dateLastActivity: dia(-10) }),
      card('Muito', { dateLastActivity: dia(-30) }), card('Sem', { dateLastActivity: undefined }),
      card('Feito', { idList: 'l-ok', dateLastActivity: dia(-90) })
    ]), config);
    expect(r.grupos.map(g => [g.id, g.itens.map(i => i.name)])).toEqual([
      ['hoje', ['Hoje']], ['ontem', ['Ontem']], ['semana', ['Semana']], ['parado', ['Silencio']], ['muito', ['Muito']]
    ]);
    expect([r.total, r.movimentados, r.parados, r.semDados]).toEqual([6, 3, 2, 1]);
  });
  test('silêncio por pessoa: médio, mais parado e sem responsável por último', () => {
    const r = montarPulso(itens([
      card('A', { dateLastActivity: dia(-2) }), card('B', { dateLastActivity: dia(-12) }),
      card('C', { idMembers: ['beto'], dateLastActivity: dia(-30) }), card('O', { idMembers: [], dateLastActivity: dia(-50) })
    ]), config);
    expect(r.porPessoa.map(p => p.nome)).toEqual(['Beto Lima', 'Ana Souza', 'Sem responsável']);
    const ana = r.porPessoa[1];
    expect([ana.projetos, ana.paradoMedio, ana.parados, ana.maisParado.name]).toEqual([2, 7, 1, 'B']);
    expect(montarPulso([], config)).toMatchObject({ grupos: [], total: 0, porPessoa: [] });
  });
});

describe('montarPrioridades', () => {
  const pri = (id) => ({ idCustomField: 'f-pri', idValue: id });
  test('máxima e alta com risco, urgentes e sem prioridade', () => {
    const r = montarPrioridades(itens([
      card('MaxOk', { customFieldItems: [fim(60), pri('p-m')] }),
      card('MaxAtrasada', { customFieldItems: [fim(-5), pri('p-m')] }),
      card('AltaAmarela', { customFieldItems: [fim(2), pri('p-a')] }),
      card('Baixa', { customFieldItems: [fim(60), pri('p-b')] }),
      card('Urgente', { customFieldItems: [fim(60), { idCustomField: 'f-urg', idValue: 'u-s' }] }),
      card('Feito', { idList: 'l-ok', customFieldItems: [pri('p-m')] })
    ]), config);
    expect(r.grupos.map(g => [g.rotulo, g.total, g.emRisco])).toEqual([['Máxima', 2, 1], ['Alta', 1, 1]]);
    expect(r.grupos[0].itens.map(i => i.name)).toEqual(['MaxAtrasada', 'MaxOk']);
    expect(r.urgentes.map(i => i.name)).toEqual(['Urgente']);
    expect(r.semPrioridade).toBe(1);
    expect(r.ativos).toBe(5);
  });
  test('sem projetos', () => {
    expect(montarPrioridades([], config)).toMatchObject({ urgentes: [], semPrioridade: 0, ativos: 0 });
  });
});

describe('montarDiretoria', () => {
  const dir = (cards) => montarDiretoria(itens(cards), config, AGORA);
  test('portfólio saudável: semáforo verde e sem alertas', () => {
    const r = dir([card('A', { customFieldItems: [fim(60)] }), card('B', { customFieldItems: [fim(60)] })]);
    expect(r.semaforo).toBe('verde');
    expect(r.pctEmDia).toBe(100);
    expect(r.numeros.find(n => n.chave === 'ativos').valor).toBe(2);
    expect(r.numeros.find(n => n.chave === 'criticos').cor).toBe('verde');
  });
  test('problemas: semáforo vermelho, frases e números', () => {
    const r = dir([
      card('Atras', { customFieldItems: [fim(-3)] }), card('Orfao', { idMembers: [], customFieldItems: [fim(3)] }),
      card('SemPrazo', { customFieldItems: [] }), card('Ok'), card('Feito', { idList: 'l-ok', dateLastActivity: dia(-3) })
    ]);
    expect(r.semaforo).toBe('vermelho');
    expect(r.pctEmDia).toBe(25);
    const n = (k) => r.numeros.find(x => x.chave === k).valor;
    expect([n('ativos'), n('criticos'), n('atrasados'), n('semresp'), n('proximos'), n('entregas')]).toEqual([4, 2, 1, 1, 1, 1]);
    expect(r.frases.length).toBeLessThanOrEqual(4);
    expect(r.frases[0]).toContain('2 projetos críticos de 4');
    expect(r.frases.join(' ')).toContain('Black Friday em 11 dias');
  });
  test('semáforo amarelo, singular e portfólio vazio', () => {
    const cards = [];
    for (let k = 0; k < 5; k++) cards.push(card('V' + k));
    for (let k = 0; k < 4; k++) cards.push(card('P' + k, { customFieldItems: [fim(2)] }));
    expect(dir(cards).semaforo).toBe('amarelo');
    const um = dir([card('Atras', { customFieldItems: [fim(-3)] })]);
    expect(um.frases[0]).toContain('1 projeto crítico de 1');
    const vazio = dir([]);
    expect(vazio.pctEmDia).toBe(100);
    expect(vazio.frases.join(' ')).toContain('Black Friday');
  });
  test('sem alertas relevantes quando a data forte está longe', () => {
    const longe = montarDiretoria(itens([card('A')]), config, new Date('2027-06-20T15:00:00.000Z'));
    expect(longe.frases).toEqual(['Portfólio sem alertas relevantes.']);
  });
});
