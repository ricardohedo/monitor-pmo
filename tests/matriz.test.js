const { montarMatriz, nivelMatriz } = require('../js/matriz.js');
const H = require('../js/health.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z');
const op = (id, text) => ({ id, value: { text } });
const DEF = [
  { id: 'f-imp', name: 'Impacto no negócio', type: 'list', options: [op('i-a', 'Alto'), op('i-m', 'Médio'), op('i-b', 'Baixo'), op('i-x', 'Enorme')] },
  { id: 'f-esf', name: 'Esforço estimado', type: 'list', options: [op('e-a', 'Alto'), op('e-m', 'Médio'), op('e-b', 'Baixo')] },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [op('p-x', 'Máxima'), op('p-a', 'Alta'), op('p-m', 'Média'), op('p-b', 'Baixa')] }
];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
const v = (campo, id) => ({ idCustomField: campo, idValue: id, value: null });

function card(name, opcoes) {
  const { imp, esf, pri, ...over } = opcoes || {};
  const itens = [];
  if (imp) itens.push(v('f-imp', imp));
  if (esf) itens.push(v('f-esf', esf));
  if (pri) itens.push(v('f-pri', pri));
  return Object.assign({
    id: name, name, url: 'u', idList: 'l-exe', due: '2027-01-30T12:00:00.000Z', dueComplete: false,
    members: [{ id: 'm' }], labels: [], dateLastActivity: '2026-11-15T15:00:00.000Z',
    customFieldItems: itens, badges: {}
  }, over);
}
const monta = (cards, extra) => montarMatriz(cards, Object.assign({ agora: AGORA, camposDef: DEF, listas: LISTAS }, extra), config);
const nomes = (l) => l.map(i => i.name);

describe('valorLista', () => {
  test('lê o texto da opção escolhida', () => {
    expect(H.valorLista(card('a', { imp: 'i-a' }), DEF, 'Impacto no negócio')).toBe('Alto');
  });
  test('aceita opção com _id (formato da API REST)', () => {
    const def = [{ id: 'f', name: 'X', options: [{ _id: 'o1', value: { text: 'Sim' } }] }];
    expect(H.valorLista({ customFieldItems: [{ idCustomField: 'f', idValue: 'o1' }] }, def, 'X')).toBe('Sim');
  });
  test('campo vazio, inexistente ou opção removida retornam null', () => {
    expect(H.valorLista(card('a'), DEF, 'Impacto no negócio')).toBeNull();
    expect(H.valorLista(card('a', { imp: 'i-a' }), DEF, 'Campo que não existe')).toBeNull();
    expect(H.valorLista({ customFieldItems: [v('f-imp', 'sumiu')] }, DEF, 'Impacto no negócio')).toBeNull();
  });
});

describe('nível', () => {
  test('ignora acento, caixa e espaços', () => {
    expect(nivelMatriz(' MÉDIO ')).toBe('medio');
    expect(nivelMatriz('Alto')).toBe('alto');
    expect(nivelMatriz('baixo')).toBe('baixo');
  });
  test('valor desconhecido ou vazio vira null', () => {
    expect(nivelMatriz('Enorme')).toBeNull();
    expect(nivelMatriz(null)).toBeNull();
  });
});

describe('montarMatriz', () => {
  test('coloca cada card na célula impacto x esforço', () => {
    const r = monta([
      card('A', { imp: 'i-a', esf: 'e-b' }), card('B', { imp: 'i-a', esf: 'e-a' }),
      card('C', { imp: 'i-b', esf: 'e-b' }), card('D', { imp: 'i-b', esf: 'e-a' }),
      card('E', { imp: 'i-m', esf: 'e-m' })
    ]);
    expect(nomes(r.celulas.alto.baixo)).toEqual(['A']);
    expect(nomes(r.celulas.alto.alto)).toEqual(['B']);
    expect(nomes(r.celulas.baixo.baixo)).toEqual(['C']);
    expect(nomes(r.celulas.baixo.alto)).toEqual(['D']);
    expect(nomes(r.celulas.medio.medio)).toEqual(['E']);
    expect(r.classificados).toBe(5);
    expect(r.total).toBe(5);
  });
  test('expõe os nomes dos quadrantes da configuração', () => {
    const r = monta([]);
    expect(r.quadrantes['alto|baixo']).toBe('Fazer primeiro');
    expect(r.quadrantes['baixo|alto']).toBe('Reavaliar');
  });
  test('sem classificar diz exatamente o que falta', () => {
    const r = monta([
      card('Nada'), card('SoImpacto', { imp: 'i-a' }), card('SoEsforco', { esf: 'e-a' }),
      card('Invalido', { imp: 'i-x', esf: 'e-a' })
    ]);
    const falta = Object.fromEntries(r.semClassificar.map(i => [i.name, i.falta]));
    expect(falta.Nada).toEqual(['Impacto no negócio', 'Esforço estimado']);
    expect(falta.SoImpacto).toEqual(['Esforço estimado']);
    expect(falta.SoEsforco).toEqual(['Impacto no negócio']);
    expect(falta.Invalido).toEqual(['Impacto no negócio (valor inválido)']);
    expect(r.classificados).toBe(0);
    expect(r.total).toBe(4);
  });
  test('dentro da célula ordena por prioridade, depois saúde, depois nome', () => {
    const r = monta([
      card('SemPri', { imp: 'i-a', esf: 'e-b' }),
      card('Baixa', { imp: 'i-a', esf: 'e-b', pri: 'p-b' }),
      card('MaximaOk', { imp: 'i-a', esf: 'e-b', pri: 'p-x' }),
      card('AltaVermelha', { imp: 'i-a', esf: 'e-b', pri: 'p-a', members: [] }),
      card('AltaVerde', { imp: 'i-a', esf: 'e-b', pri: 'p-a' })
    ]);
    expect(nomes(r.celulas.alto.baixo)).toEqual(['MaximaOk', 'AltaVermelha', 'AltaVerde', 'Baixa', 'SemPri']);
  });
  test('cada item leva a cor de saúde e a prioridade', () => {
    const r = monta([card('X', { imp: 'i-a', esf: 'e-b', pri: 'p-x', members: [] })]);
    const i = r.celulas.alto.baixo[0];
    expect(i.cor).toBe('vermelho');
    expect(i.rotulo).toBe('Sem responsável');
    expect(i.prioridade).toBe('Máxima');
  });
  test('NOVA DEMANDA e concluídos ficam fora; pausados só quando pedido', () => {
    const base = { imp: 'i-a', esf: 'e-b' };
    const cs = [
      card('Ativo', base), card('Nova', { ...base, idList: 'l-new' }),
      card('Feito', { ...base, idList: 'l-ok' }), card('Parado', { ...base, labels: [{ name: 'Pausado' }] })
    ];
    expect(nomes(monta(cs).celulas.alto.baixo)).toEqual(['Ativo']);
    const com = monta(cs, { incluirPausados: true });
    expect(nomes(com.celulas.alto.baixo).sort()).toEqual(['Ativo', 'Parado']);
    expect(com.celulas.alto.baixo.find(i => i.name === 'Parado').pausado).toBe(true);
    expect(nomes(com.celulas.alto.baixo)).not.toContain('Feito');
  });
  test('pausado sem classificação também entra em "sem classificar" quando pedido', () => {
    const cs = [card('P', { labels: [{ name: 'Pausado' }] })];
    expect(monta(cs).total).toBe(0);
    expect(monta(cs, { incluirPausados: true }).semClassificar.length).toBe(1);
  });
  test('board sem cards e sem campos não quebra', () => {
    const r = montarMatriz([], { agora: AGORA, camposDef: [], listas: [] }, config);
    expect(r.total).toBe(0);
    expect(r.celulas.alto.baixo).toEqual([]);
  });
  test('campos inexistentes no board mandam tudo para sem classificar', () => {
    const r = montarMatriz([card('A', { imp: 'i-a', esf: 'e-b' })], { agora: AGORA, camposDef: [], listas: LISTAS }, config);
    expect(r.classificados).toBe(0);
    expect(r.semClassificar[0].falta.length).toBe(2);
  });
});
