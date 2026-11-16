const R = require('../js/roadmap.js');
const { config } = require('../js/config.js');

const k = (a, m, d) => Date.UTC(a, m - 1, d);
const AGORA = new Date('2026-11-16T15:00:00.000Z'); // 16/11/2026 12h em Brasília
const DEF = [
  { id: 'f-ini', name: 'Início planejado', type: 'date' },
  { id: 'f-fim', name: 'Fim planejado', type: 'date' }
];
const dt = (id, iso) => ({ idCustomField: id, value: { date: iso } });
const LISTAS = [
  { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' },
  { id: 'l-pri', name: 'Priorizados(prontos para iniciar)' },
  { id: 'l-exe', name: 'Em Execução' },
  { id: 'l-ok', name: 'Concluídos' }
];

function card(over, ini, fim) {
  const itens = [];
  if (ini) itens.push(dt('f-ini', ini));
  if (fim) itens.push(dt('f-fim', fim));
  return Object.assign({
    id: 'c', name: 'Projeto', url: 'u', idList: 'l-exe', due: null, dueComplete: false,
    members: [{ id: 'm' }], labels: [], dateLastActivity: '2026-11-15T15:00:00.000Z',
    customFieldItems: itens, badges: { checkItems: 10, checkItemsChecked: 4 }
  }, over);
}
const monta = (cards) => R.montarRoadmap(cards, { agora: AGORA, camposDef: DEF, listas: LISTAS }, config);

describe('datas do varejo', () => {
  test('Páscoa em vários anos', () => {
    expect(R.pascoa(2024)).toBe(k(2024, 3, 31));
    expect(R.pascoa(2025)).toBe(k(2025, 4, 20));
    expect(R.pascoa(2026)).toBe(k(2026, 4, 5));
    expect(R.pascoa(2027)).toBe(k(2027, 3, 28));
  });
  const achar = (a, nome) => R.marcosDoAno(a).find(m => m.nome === nome).chave;
  test('Carnaval é 47 dias antes da Páscoa (terça-feira)', () => {
    expect(achar(2026, 'Carnaval')).toBe(k(2026, 2, 17));
    expect(achar(2027, 'Carnaval')).toBe(k(2027, 2, 9));
    expect(new Date(achar(2027, 'Carnaval')).getUTCDay()).toBe(2);
  });
  test('Dia das Mães: 2º domingo de maio', () => {
    expect(achar(2026, 'Dia das Mães')).toBe(k(2026, 5, 10));
    expect(achar(2027, 'Dia das Mães')).toBe(k(2027, 5, 9));
  });
  test('Dia dos Pais: 2º domingo de agosto', () => {
    expect(achar(2026, 'Dia dos Pais')).toBe(k(2026, 8, 9));
    expect(achar(2027, 'Dia dos Pais')).toBe(k(2027, 8, 8));
  });
  test('Black Friday: sexta depois da 4ª quinta de novembro', () => {
    expect(achar(2025, 'Black Friday')).toBe(k(2025, 11, 28));
    expect(achar(2026, 'Black Friday')).toBe(k(2026, 11, 27));
    expect(achar(2027, 'Black Friday')).toBe(k(2027, 11, 26));
  });
  test('datas fixas', () => {
    expect(achar(2026, 'Natal')).toBe(k(2026, 12, 25));
    expect(achar(2026, 'Réveillon')).toBe(k(2026, 12, 31));
    expect(achar(2026, 'Dia dos Namorados')).toBe(k(2026, 6, 12));
    expect(achar(2026, 'Dia das Crianças')).toBe(k(2026, 10, 12));
  });
  test('marcos no período cruzando o ano, em ordem', () => {
    const m = R.marcosNoPeriodo(k(2026, 11, 1), k(2027, 4, 1));
    expect(m.map(x => x.nome)).toEqual(['Black Friday', 'Natal', 'Réveillon', 'Carnaval', 'Dia do Consumidor', 'Páscoa']);
  });
  test('período é [início, fim): fim não entra', () => {
    expect(R.marcosNoPeriodo(k(2026, 12, 25), k(2026, 12, 25))).toEqual([]);
    expect(R.marcosNoPeriodo(k(2026, 12, 25), k(2026, 12, 26)).map(x => x.nome)).toEqual(['Natal']);
  });
  test('marcos extras do usuário entram', () => {
    const m = R.marcosDoAno(2027, [{ nome: 'Inventário geral', mes: 1, dia: 15 }]);
    expect(m.find(x => x.nome === 'Inventário geral').chave).toBe(k(2027, 1, 15));
  });
});

describe('janela de tempo', () => {
  const cfg = config.roadmap;
  const hoje = k(2026, 11, 16);
  test('mostra no mínimo 15 dias atrás e 120 adiante, em meses inteiros', () => {
    const w = R.janela(hoje, [k(2026, 11, 16)], [k(2026, 11, 30)], cfg);
    expect(w.ini).toBe(k(2026, 11, 1));
    expect(w.fim).toBe(k(2027, 4, 1));
    expect(w.meses.length).toBe(5);
    expect(w.meses[0].nome).toBe('nov/26');
  });
  test('começo antigo é limitado a 120 dias atrás', () => {
    const w = R.janela(hoje, [k(2025, 1, 1)], [k(2026, 12, 1)], cfg);
    expect(w.ini).toBe(k(2026, 7, 1)); // hoje - 120d = 18/jul -> mês de julho
  });
  test('fim distante é limitado a 365 dias à frente', () => {
    const w = R.janela(hoje, [k(2026, 11, 16)], [k(2030, 1, 1)], cfg);
    expect(w.fim).toBe(k(2027, 12, 1));
  });
  test('sem datas usa só o mínimo em volta de hoje', () => {
    const w = R.janela(hoje, [], [], cfg);
    expect(w.ini).toBe(k(2026, 11, 1));
  });
});

describe('montarRoadmap', () => {
  test('posiciona a barra e calcula o progresso das checklists', () => {
    const r = monta([card({ id: 'a' }, '2026-11-16T12:00:00.000Z', '2026-11-30T12:00:00.000Z')]);
    const i = r.grupos[0].itens[0];
    expect(r.total).toBe(1);
    expect(i.progresso).toBeCloseTo(0.4);
    expect(i.left).toBeGreaterThan(0);
    expect(i.left + i.width).toBeLessThan(100);
    expect(i.cortaEsq).toBe(false);
    expect(i.cortaDir).toBe(false);
    expect(r.hojeLeft).toBeGreaterThan(i.left - 0.001);
  });
  test('a barra inclui o dia final inteiro', () => {
    const r = monta([card({}, '2026-11-16T12:00:00.000Z', '2026-11-16T12:00:00.000Z')]);
    const w = r.janela.fim - r.janela.ini;
    expect(r.grupos[0].itens[0].width).toBeCloseTo(86400000 / w * 100, 5);
  });
  test('card sem checklist fica com progresso nulo', () => {
    const r = monta([card({ badges: { checkItems: 0, checkItemsChecked: 0 } }, '2026-11-16T12:00:00.000Z', '2026-11-30T12:00:00.000Z')]);
    expect(r.grupos[0].itens[0].progresso).toBeNull();
  });
  test('sem datas vai para a lista "sem datas" dizendo o que falta', () => {
    const r = monta([
      card({ id: 'a', name: 'A' }, null, null),
      card({ id: 'b', name: 'B' }, '2026-11-16T12:00:00.000Z', null),
      card({ id: 'c', name: 'C', due: '2026-12-01T12:00:00.000Z' }, null, null)
    ]);
    const falta = Object.fromEntries(r.semDatas.map(s => [s.name, s.falta]));
    expect(falta.A).toBe('Início e fim planejados');
    expect(falta.B).toBe('Fim planejado');
    expect(falta.C).toBe('Início planejado');
    expect(r.total).toBe(0);
  });
  test('usa o vencimento do Trello quando falta o Fim planejado', () => {
    const r = monta([card({ due: '2026-12-10T12:00:00.000Z' }, '2026-11-16T12:00:00.000Z', null)]);
    expect(r.total).toBe(1);
  });
  test('fim antes do início é apontado', () => {
    const r = monta([card({}, '2026-12-10T12:00:00.000Z', '2026-11-20T12:00:00.000Z')]);
    expect(r.semDatas[0].falta).toBe('Fim anterior ao início');
  });
  test('NOVA DEMANDA, concluídos e pausados ficam fora', () => {
    const d = ['2026-11-16T12:00:00.000Z', '2026-11-30T12:00:00.000Z'];
    const r = monta([
      card({ id: 'n', idList: 'l-new' }, ...d),
      card({ id: 'o', idList: 'l-ok' }, ...d),
      card({ id: 'p', labels: [{ name: 'Pausado' }] }, ...d),
      card({ id: 'x', dueComplete: true }, ...d),
      card({ id: 'v' }, ...d)
    ]);
    expect(r.grupos.flatMap(g => g.itens).map(i => i.id)).toEqual(['v']);
    expect(r.semDatas).toEqual([]);
  });
  test('agrupa na ordem das listas do board e ordena por início', () => {
    const r = monta([
      card({ id: '1', idList: 'l-exe', name: 'Tarde' }, '2026-12-01T12:00:00.000Z', '2026-12-20T12:00:00.000Z'),
      card({ id: '2', idList: 'l-pri', name: 'Priorizado' }, '2026-11-20T12:00:00.000Z', '2026-12-05T12:00:00.000Z'),
      card({ id: '3', idList: 'l-exe', name: 'Cedo' }, '2026-11-16T12:00:00.000Z', '2026-12-05T12:00:00.000Z')
    ]);
    expect(r.grupos.map(g => g.lista)).toEqual(['Priorizados(prontos para iniciar)', 'Em Execução']);
    expect(r.grupos[1].itens.map(i => i.name)).toEqual(['Cedo', 'Tarde']);
  });
  test('barra que começa antes da janela é recortada', () => {
    const r = monta([card({}, '2025-01-01T12:00:00.000Z', '2026-12-20T12:00:00.000Z')]);
    const i = r.grupos[0].itens[0];
    expect(i.cortaEsq).toBe(true);
    expect(i.left).toBe(0);
  });
  test('barra que termina depois da janela é recortada', () => {
    const r = monta([card({}, '2026-11-16T12:00:00.000Z', '2030-01-01T12:00:00.000Z')]);
    const i = r.grupos[0].itens[0];
    expect(i.cortaDir).toBe(true);
    expect(i.left + i.width).toBeCloseTo(100, 5);
  });
  test('inclui as datas do varejo da janela, com posição em %', () => {
    const r = monta([card({}, '2026-11-16T12:00:00.000Z', '2026-11-30T12:00:00.000Z')]);
    const nomes = r.marcos.map(m => m.nome);
    expect(nomes).toEqual(expect.arrayContaining(['Black Friday', 'Natal', 'Páscoa']));
    const bf = r.marcos.find(m => m.nome === 'Black Friday');
    expect(bf.left).toBeGreaterThan(0);
    expect(bf.left).toBeLessThan(100);
    expect(r.marcos.find(m => m.nome === 'Black Friday').chave).toBe(k(2026, 11, 27));
  });
  test('board sem nenhum card não quebra', () => {
    const r = monta([]);
    expect(r.total).toBe(0);
    expect(r.grupos).toEqual([]);
    expect(r.hojeLeft).not.toBeNull();
  });
  test('dataCurta formata dd/mm', () => {
    expect(R.dataCurta(k(2026, 3, 5))).toBe('05/03');
  });
});
