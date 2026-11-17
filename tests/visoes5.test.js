const { montarItens, criadoEm, resumoChecklists, anexarChecklistsRest } = require('../js/itens.js');
const { montarChecklists } = require('../js/checklists.js');
const { montarNovos } = require('../js/novos.js');
const { montarLista, paraCSV } = require('../js/lista.js');
const { resumir, filtrar } = require('../js/portfolio.js');
const { montarAtuar } = require('../js/atuar.js');
const { calcularSaude } = require('../js/health.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // segunda, 16/11/2026
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-area', name: 'Área solicitante', type: 'list', options: [{ id: 'a-c', value: { text: 'Comercial' } }] },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [{ id: 'p-m', value: { text: 'Máxima' } }, { id: 'p-b', value: { text: 'Baixa' } }] }
];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const fim = (n) => ({ idCustomField: 'f-fim', value: { date: dia(n) } });
// id no formato do Trello: 8 hex de timestamp + 16 hex
const idEm = (iso, sufixo) => Math.floor(new Date(iso).getTime() / 1000).toString(16).padStart(8, '0') + (sufixo || 'a').repeat(16).slice(0, 16);

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(-1), desc: 'texto',
    customFieldItems: [fim(60)], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const ctx = { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: [{ id: 'ana', fullName: 'Ana Souza' }] };
const itens = (cards) => montarItens(cards, ctx, config);
const cl = (nome, itensCl) => ({ name: nome, checkItems: itensCl });
const it = (state, due) => ({ state, due: due === undefined ? null : due });

describe('impedimento', () => {
  const c = card('Travado', { labels: [{ name: 'Impedimento' }] });
  test('etiqueta Impedimento é motivo próprio e deixa o card amarelo', () => {
    const s = calcularSaude(c, { agora: AGORA, camposDef: DEF, nomeLista: 'Em Execução' }, config);
    expect(s.cor).toBe('amarelo');
    expect(s.motivos).toContain('Impedimento');
  });
  test('atuar: ação e pontos próprios; painel conta e filtra', () => {
    const r = montarAtuar(itens([c]), config, null);
    expect(r.comece[0].fazer).toContain('bloqueia');
    const res = resumir([c, card('Ok')], { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: [] }, config);
    expect(res.alertas.impedimento).toBe(1);
    expect(filtrar(res, { motivo: 'Impedimento' }).map(x => x.name)).toEqual(['Travado']);
    expect(filtrar(res, { motivo: 'Parado' })).toEqual([]);
  });
  test('painel: contadores de alertas', () => {
    const res = resumir([card('SP', { customFieldItems: [] }), card('Pa', { dateLastActivity: dia(-20) })],
      { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: [] }, config);
    expect(res.alertas).toEqual({ semPrazo: 1, parado: 1, impedimento: 0, ritmo: 0 });
  });
});

describe('criadoEm e resumoChecklists', () => {
  test('lê o timestamp do id do Trello', () => {
    expect(criadoEm(idEm('2026-11-10T12:00:00.000Z'))).toBe('2026-11-10T12:00:00.000Z');
    expect(criadoEm('A')).toBeNull();
    expect(criadoEm(undefined)).toBeNull();
  });
  test('conta feitos, vencidos e sem prazo; null sem checklists', () => {
    const r = resumoChecklists({ checklists: [
      cl('Plano', [it('complete'), it('incomplete', dia(-2)), it('incomplete', dia(3)), it('incomplete')]),
      cl('Vazia', [])
    ] }, AGORA, config.tzOffsetHoras);
    expect([r.total, r.feitos, r.vencidos, r.semPrazo]).toEqual([4, 1, 1, 1]);
    expect(r.listas[0]).toMatchObject({ nome: 'Plano', total: 4, vencidos: 1 });
    expect(resumoChecklists({}, AGORA, -3)).toBeNull();
    expect(resumoChecklists({ checklists: [{ name: 'X' }] }, AGORA, -3).total).toBe(0);
  });
  test('itens nos badges e vazios nas checklists = detalhes não entregues (null)', () => {
    const vazio = { badges: { checkItems: 21 }, checklists: [cl('A', []), cl('B', [])] };
    expect(resumoChecklists(vazio, AGORA, -3)).toBeNull();
    expect(montarChecklists(itens([card('Real', { badges: { checkItems: 4, checkItemsChecked: 1 }, checklists: [cl('A', [])] })])).disponivel).toBe(false);
  });
  test('item vence hoje não é vencido', () => {
    expect(resumoChecklists({ checklists: [cl('A', [it('incomplete', dia(0))])] }, AGORA, -3).vencidos).toBe(0);
  });
});

describe('anexarChecklistsRest (leitura pela API do Trello)', () => {
  const resposta = [
    { id: 'c1', name: 'Plano', idCard: 'Ruim', checkItems: [
      { id: 'i1', name: 'a', state: 'incomplete', due: dia(-5) }, { id: 'i2', name: 'b', state: 'incomplete', due: null },
      { id: 'i3', name: 'c', state: 'complete', due: dia(-9) }] },
    { id: 'c2', name: 'Validação', idCard: 'Ruim', checkItems: [{ id: 'i4', name: 'd', state: 'incomplete', due: dia(4) }] },
    { id: 'c3', name: 'Outra', idCard: 'NaoExiste', checkItems: [] }
  ];
  test('anexa por card, converte itens e conta os cards atingidos', () => {
    const cards = [card('Ruim', { checklists: [cl('Plano', [])] }), card('Boa')];
    expect(anexarChecklistsRest(cards, resposta)).toBe(1);
    expect(cards[0].checklists.map(c => c.name)).toEqual(['Plano', 'Validação']);
    expect(cards[0].checklists[0].checkItems[1]).toEqual({ id: 'i2', name: 'b', state: 'incomplete', due: null });
    expect(cards[1].checklists).toBeUndefined();
  });
  test('depois de anexar, a visão enxerga vencidos e sem prazo de verdade', () => {
    const cards = [card('Ruim', { badges: { checkItems: 4, checkItemsChecked: 1 }, checklists: [cl('Plano', [])] })];
    anexarChecklistsRest(cards, resposta);
    const r = montarChecklists(itens(cards));
    expect(r.disponivel).toBe(true);
    expect([r.total, r.feitos, r.vencidos, r.semPrazo, r.projetosComVencido]).toEqual([4, 1, 1, 1, 1]);
    expect(r.projetos[0].listas.map(l => [l.nome, l.vencidos, l.semPrazo])).toEqual([['Plano', 1, 1], ['Validação', 0, 0]]);
  });
  test('resposta vazia ou ausente não quebra', () => {
    expect(anexarChecklistsRest([card('A')], [])).toBe(0);
    expect(anexarChecklistsRest([card('A')], undefined)).toBe(0);
    expect(anexarChecklistsRest([card('A')], [{ id: 'x', name: 'n', idCard: 'A' }])).toBe(1);
  });
});

describe('montarChecklists', () => {
  test('totais, ranking por vencidos, concluídos incompletos e por fase', () => {
    const r = montarChecklists(itens([
      card('Ruim', { checklists: [cl('A', [it('incomplete', dia(-5)), it('incomplete', dia(-1)), it('complete')])] }),
      card('SemPrazo', { checklists: [cl('A', [it('incomplete'), it('incomplete'), it('complete')])] }),
      card('Boa', { checklists: [cl('A', [it('complete'), it('complete')])] }),
      card('Feito', { idList: 'l-ok', checklists: [cl('A', [it('complete'), it('incomplete', dia(-3))])] }),
      card('SemChecklist', { badges: {}, checklists: [] })
    ]));
    expect(r.disponivel).toBe(true);
    expect([r.total, r.feitos, r.pendentes, r.vencidos, r.semPrazo]).toEqual([8, 4, 4, 2, 2]);
    expect(r.projetos.map(p => p.name)).toEqual(['Ruim', 'SemPrazo', 'Boa']);
    expect([r.projetosComVencido, r.projetosSemPrazo]).toEqual([1, 1]);
    expect(r.progressoMedio).toBe(Math.round((1 / 3 + 1 / 3 + 1) / 3 * 100));
    expect(r.concluidosIncompletos.map(c => [c.name, c.feitos, c.total])).toEqual([['Feito', 1, 2]]);
    expect(r.porFase).toEqual([{ nome: 'Em Execução', projetos: 3, total: 8, feitos: 4, vencidos: 2 }]);
  });
  test('sem checklists do Trello: cai na contagem dos badges, sem vencidos', () => {
    const r = montarChecklists(itens([card('A'), card('B', { idList: 'l-ok' })]));
    expect(r.disponivel).toBe(false);
    expect(r.total).toBe(4);
    expect(r.vencidos).toBe(0);
    expect(r.concluidosIncompletos).toHaveLength(1);
  });
  test('checklists só com nomes (itens vazios) não contam como dados disponíveis', () => {
    const r = montarChecklists(itens([card('Vazio', { badges: {}, checklists: [cl('A', []), cl('B', [])] }), card('ComBadge')]));
    expect(r.disponivel).toBe(false);
    expect(r.total).toBe(4);
  });
  test('sem projetos', () => {
    const r = montarChecklists([]);
    expect([r.total, r.progressoMedio, r.projetos.length]).toEqual([0, 0, 0]);
  });
});

describe('montarNovos', () => {
  const completo = [fim(60), { idCustomField: 'f-area', idValue: 'a-c' }];
  const novos = (cards) => montarNovos(cards, ctx, config);
  test('conta hoje, mês, corretos e a ajustar; ignora modelo e id inválido', () => {
    const r = novos([
      card('Hoje', { id: idEm('2026-11-16T15:00:00.000Z', 'a'), idList: 'l-new', customFieldItems: [] }),
      card('MesOk', { id: idEm('2026-11-03T15:00:00.000Z', 'b'), customFieldItems: [] }),
      card('Antigo', { id: idEm('2026-09-10T15:00:00.000Z', 'c') }),
      card('MuitoAntigo', { id: idEm('2025-01-10T15:00:00.000Z', 'd') }),
      card('NOME DO PROJETO', { id: idEm('2026-11-02T15:00:00.000Z', 'e') }),
      card('Modelo', { id: idEm('2026-11-02T15:00:00.000Z', 'f'), isTemplate: true }),
      card('IdRuim')
    ]);
    expect(r.total).toBe(3);
    expect([r.hoje, r.mes, r.corretosMes, r.ajusteMes]).toEqual([1, 2, 0, 2]);
    expect(r.serie).toHaveLength(6);
    expect(r.serie[5]).toMatchObject({ rotulo: 'nov/2026', total: 2, ajuste: 2 });
    expect(r.serie[3]).toMatchObject({ rotulo: 'set/2026', total: 1 });
    expect(r.recentes[0].name).toBe('Hoje');
  });
  test('problemas mais comuns e áreas que precisam de ajuda', () => {
    const r = novos([
      card('A', { id: idEm('2026-11-03T15:00:00.000Z', 'a'), customFieldItems: [fim(60)] }),
      card('B', { id: idEm('2026-11-04T15:00:00.000Z', 'b'), customFieldItems: [fim(60), { idCustomField: 'f-area', idValue: 'a-c' }] })
    ]);
    expect(r.problemas[0].qtd).toBeGreaterThanOrEqual(1);
    expect(r.problemas.map(p => p.texto)).toContain('Campo "Área solicitante"');
    expect(r.areas.map(a => a.nome)).toEqual(['Comercial', 'Sem área definida']);
    expect(novos([card('Z', { id: idEm('2026-11-03T15:00:00.000Z', 'a'), customFieldItems: completo })]).serie[5].total).toBe(1);
  });
  test('sem cards', () => {
    expect(novos([]).total).toBe(0);
  });
});

describe('montarLista e CSV', () => {
  const base = () => itens([
    card('Beta', { customFieldItems: [fim(-3), { idCustomField: 'f-pri', idValue: 'p-m' }, { idCustomField: 'f-area', idValue: 'a-c' }] }),
    card('Alfa', { customFieldItems: [fim(20), { idCustomField: 'f-pri', idValue: 'p-b' }], idMembers: [] }),
    card('Gama', { customFieldItems: [], idList: 'l-ok' })
  ]);
  test('padrão: só ativos, ordenados por saúde', () => {
    const r = montarLista(base(), config);
    expect(r.linhas.map(l => l.name)).toEqual(['Alfa', 'Beta']);
    expect(r.total).toBe(2);
    expect(r.fases).toEqual(['Em Execução']);
  });
  test('filtros por status, prioridade, busca e inativos', () => {
    const it0 = base();
    expect(montarLista(it0, config, { status: 'atrasados' }).linhas.map(l => l.name)).toEqual(['Beta']);
    expect(montarLista(it0, config, { status: 'sem-responsavel' }).linhas.map(l => l.name)).toEqual(['Alfa']);
    expect(montarLista(it0, config, { status: 'criticos' }).linhas.map(l => l.name).sort()).toEqual(['Alfa', 'Beta']);
    expect(montarLista(it0, config, { status: 'sem-prazo', incluirInativos: true }).linhas.map(l => l.name)).toEqual(['Gama']);
    expect(montarLista(it0, config).prioridades).toEqual([{ valor: 'maxima', rotulo: 'Máxima' }, { valor: 'baixa', rotulo: 'Baixa' }]);
    expect(montarLista(it0, config, { prioridade: 'maxima' }).linhas.map(l => l.name)).toEqual(['Beta']);
    expect(montarLista(it0, config, { busca: 'ana' }).linhas.map(l => l.name)).toEqual(['Beta']);
    expect(montarLista(it0, config, { fase: 'Concluídos' }).linhas).toEqual([]);
    expect(montarLista(it0, config, { status: 'atencao' }).linhas).toEqual([]);
    expect(montarLista(it0, config, { incluirInativos: true }).total).toBe(3);
  });
  test('ordenação por prioridade, prazo, nome e progresso, nos dois sentidos', () => {
    const it0 = base();
    const nomes = (o) => montarLista(it0, config, {}, o).linhas.map(l => l.name);
    expect(nomes({ campo: 'prioridade', dir: 1 })).toEqual(['Beta', 'Alfa']);
    expect(nomes({ campo: 'diasPrazo', dir: 1 })).toEqual(['Beta', 'Alfa']);
    expect(nomes({ campo: 'diasPrazo', dir: -1 })).toEqual(['Alfa', 'Beta']);
    expect(nomes({ campo: 'name', dir: 1 })).toEqual(['Alfa', 'Beta']);
    expect(nomes({ campo: 'progresso', dir: 1 })).toHaveLength(2);
    expect(nomes({ campo: 'responsaveis', dir: 1 })).toEqual(['Alfa', 'Beta']);
    expect(nomes({ campo: 'area', dir: -1 })).toEqual(['Beta', 'Alfa']);
  });
  test('CSV com ponto e vírgula, aspas escapadas e linhas completas', () => {
    const it0 = itens([card('Com "aspas"; e ponto', { customFieldItems: [fim(20)] })]);
    const csv = paraCSV(montarLista(it0, config).linhas);
    const linhas = csv.split('\r\n');
    expect(linhas[0]).toBe('"Projeto";"Área";"Fase";"Prioridade";"Responsáveis";"Prazo";"Dias p/ prazo";"Progresso %";"Saúde"');
    expect(linhas[1]).toContain('"Com ""aspas""; e ponto"');
    expect(linhas[1]).toContain('"Ana Souza"');
    expect(linhas[1]).toContain('"25"');
    const comPrio = paraCSV(montarLista(base(), config).linhas);
    expect(comPrio).toContain('"Máxima"');
    expect(paraCSV([])).toBe(linhas[0]);
  });
});
