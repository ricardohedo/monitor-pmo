const { calcularSaude, calcularRitmo } = require('../js/health.js');
const { conformidade } = require('../js/padrao.js');
const { resumir, textoResumo, filtrar } = require('../js/portfolio.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z');
const DEF = [
  { id: 'f-area', name: 'Área solicitante', type: 'list' },
  { id: 'f-ini', name: 'Início planejado', type: 'date' },
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-pri', name: 'Prioridade', type: 'list' },
  { id: 'f-urg', name: 'Urgente', type: 'list' },
  { id: 'f-imp', name: 'Impacto no negócio', type: 'list' },
  { id: 'f-esf', name: 'Esforço estimado', type: 'list' }
];
const data = (id, iso) => ({ idCustomField: id, value: { date: iso } });
const lista = (id) => ({ idCustomField: id, idValue: 'opt', value: null });
const TODOS = [
  lista('f-area'), data('f-ini', '2026-11-01T12:00:00.000Z'),
  data('f-fim', '2026-12-31T12:00:00.000Z'), lista('f-pri'),
  lista('f-urg'), lista('f-imp'), lista('f-esf')
];
const DESC_OK = '#### ***OBJETIVO DO PROJETO***\nx\n#### ***ESCOPO***\ny\n#### ***OBSERVACOES***\nz';

function card(over) {
  return Object.assign({
    id: 'c1', name: 'Projeto', due: null, dueComplete: false, members: [{ id: 'm1' }],
    dateLastActivity: '2026-11-15T15:00:00.000Z', customFieldItems: TODOS,
    labels: [], desc: DESC_OK, idList: 'l-exec', badges: { checkItems: 10, checkItemsChecked: 5 }
  }, over);
}

describe('ritmo (progresso x prazo decorrido)', () => {
  // início 11/11, fim 21/11 -> 16/11 = 50% decorrido
  const itens = [data('f-ini', '2026-11-11T12:00:00.000Z'), data('f-fim', '2026-11-21T12:00:00.000Z')];
  const ctx = { agora: AGORA, camposDef: DEF, nomeLista: 'Em Execução' };

  test('50% do prazo e 10% feito: ritmo abaixo', () => {
    const r = calcularRitmo(card({ customFieldItems: itens, badges: { checkItems: 10, checkItemsChecked: 1 } }), ctx, config);
    expect(r.abaixo).toBe(true);
    expect(Math.round(r.decorrido * 100)).toBe(50);
  });
  test('diferença exatamente na tolerância (30 pontos) não alerta', () => {
    const r = calcularRitmo(card({ customFieldItems: itens, badges: { checkItems: 10, checkItemsChecked: 2 } }), ctx, config);
    expect(r.abaixo).toBe(false);
  });
  test('progresso compatível com o prazo não alerta', () => {
    const r = calcularRitmo(card({ customFieldItems: itens, badges: { checkItems: 10, checkItemsChecked: 5 } }), ctx, config);
    expect(r.abaixo).toBe(false);
  });
  test('menos de 3 itens de checklist: não avalia', () => {
    expect(calcularRitmo(card({ customFieldItems: itens, badges: { checkItems: 2, checkItemsChecked: 0 } }), ctx, config)).toBeNull();
  });
  test('lista que não é de execução: não avalia', () => {
    expect(calcularRitmo(card({ customFieldItems: itens }), { ...ctx, nomeLista: 'Backlog de Projetos' }, config)).toBeNull();
  });
  test('sem início planejado: não avalia', () => {
    expect(calcularRitmo(card({ customFieldItems: [data('f-fim', '2026-11-21T12:00:00.000Z')] }), ctx, config)).toBeNull();
  });
  test('fim antes do início (duração inválida): não avalia', () => {
    const inv = [data('f-ini', '2026-11-21T12:00:00.000Z'), data('f-fim', '2026-11-11T12:00:00.000Z')];
    expect(calcularRitmo(card({ customFieldItems: inv }), ctx, config)).toBeNull();
  });
  test('começo do prazo (menos de 20% decorrido) não alerta', () => {
    const cedo = [data('f-ini', '2026-11-15T12:00:00.000Z'), data('f-fim', '2026-12-15T12:00:00.000Z')];
    const r = calcularRitmo(card({ customFieldItems: cedo, badges: { checkItems: 10, checkItemsChecked: 0 } }), ctx, config);
    expect(r.abaixo).toBe(false);
  });
  test('prazo estourado limita o decorrido em 100%', () => {
    const velho = [data('f-ini', '2026-10-01T12:00:00.000Z'), data('f-fim', '2026-10-31T12:00:00.000Z')];
    const r = calcularRitmo(card({ customFieldItems: velho }), ctx, config);
    expect(r.decorrido).toBe(1);
  });
  test('ritmo baixo vira motivo amarelo na saúde', () => {
    const s = calcularSaude(card({ customFieldItems: itens, badges: { checkItems: 10, checkItemsChecked: 1 } }), ctx, config);
    expect(s.cor).toBe('amarelo');
    expect(s.motivos[0]).toMatch(/Ritmo baixo \(10% feito, 50% do prazo\)/);
  });
  test('ritmo desativado na configuração', () => {
    const cfg = { ...config, ritmo: { ...config.ritmo, ativo: false } };
    expect(calcularRitmo(card({ customFieldItems: itens }), ctx, cfg)).toBeNull();
  });
});

describe('padrão PMO (RF-006)', () => {
  const ctx = { camposDef: DEF };
  const CHECKS = ['Início do Projeto', 'Planejamento', 'Definição de Responsáveis',
    'Execução - Fundação', 'Validação', 'Monitoramento', 'Encerramento'].map(name => ({ name }));

  test('card completo: 100%', () => {
    const c = conformidade(card({ checklists: CHECKS }), ctx, config);
    expect(c.percent).toBe(100);
    expect(c.faltando).toEqual([]);
  });
  test('sem responsável e sem campos: lista o que falta', () => {
    const c = conformidade(card({ members: [], customFieldItems: [] }), ctx, config);
    expect(c.faltando).toContain('Responsável definido');
    expect(c.faltando).toContain('Campo "Fim planejado"');
    expect(c.percent).toBeLessThan(50);
  });
  test('descrição com placeholder do template não conta', () => {
    const c = conformidade(card({ desc: '#### ***OBJETIVO DO PROJETO***\n[Descreva o objetivo principal do projeto]\n#### ***ESCOPO***\n#### ***OBSERVACOES***' }), ctx, config);
    expect(c.faltando.join('|')).toMatch(/Descrição/);
  });
  test('campo inexistente no board conta como faltando, sem quebrar', () => {
    const c = conformidade(card(), { camposDef: [] }, config);
    expect(c.faltando).toContain('Campo "Prioridade"');
  });
  test('checklist "Execução - Apague e insira..." não vale', () => {
    const chk = CHECKS.map(x => x.name === 'Execução - Fundação' ? { name: 'Execução - Apague e insira aqui o nome do seu checklist' } : x);
    const c = conformidade(card({ checklists: chk }), ctx, config);
    expect(c.faltando.join('|')).toMatch(/Execução - \[etapa\]/);
  });
  test('checklist padrão ausente é apontada', () => {
    const c = conformidade(card({ checklists: CHECKS.filter(x => x.name !== 'Validação') }), ctx, config);
    expect(c.faltando).toContain('Checklist "Validação"');
  });
  test('sem lista de checklists do Trello: não confere checklists', () => {
    const c = conformidade(card(), ctx, config);
    expect(c.total).toBe(9); // responsável + descrição + 7 campos
  });
  test('campo de texto e de checkbox preenchidos contam', () => {
    const def = [...DEF, { id: 'f-txt', name: 'Vínculo PMO', type: 'text' }];
    const cfg = { ...config, padrao: { ...config.padrao, camposObrigatorios: ['Vínculo PMO'] } };
    const c = conformidade(card({ customFieldItems: [{ idCustomField: 'f-txt', value: { text: 'x' } }] }), { camposDef: def }, cfg);
    expect(c.faltando).not.toContain('Campo "Vínculo PMO"');
  });
});

describe('portfólio (RF-002 / RF-008)', () => {
  const listas = [{ id: 'l-exec', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
  const membros = [{ id: 'm1', fullName: 'Ana' }, { id: 'm2', fullName: 'Beto' }];
  const ctx = { agora: AGORA, camposDef: DEF, listas, membros };
  const fim = (iso) => [...TODOS.filter(i => i.idCustomField !== 'f-fim'), data('f-fim', iso)];

  const cards = [
    card({ id: 'a', name: 'Verde', members: [{ id: 'm1' }], idMembers: ['m1'] }),
    card({ id: 'b', name: 'Vencido', idMembers: ['m1'], customFieldItems: fim('2026-11-10T12:00:00.000Z') }),
    card({ id: 'c', name: 'Sem resp', members: [], idMembers: [], customFieldItems: fim('2026-12-31T12:00:00.000Z') }),
    card({ id: 'd', name: 'Amarelo', idMembers: ['m2'], customFieldItems: fim('2026-11-17T12:00:00.000Z') }),
    card({ id: 'e', name: 'Feito', idList: 'l-ok', idMembers: ['m1'] }),
    card({ id: 'f', name: 'Nova', idList: 'l-new', idMembers: [] })
  ];
  const r = resumir(cards, ctx, config);

  test('conta por cor e ignora NOVA DEMANDA', () => {
    expect(r.porCor).toEqual({ vermelho: 2, amarelo: 1, verde: 1, cinza: 1 });
    expect(r.avaliados).toBe(5);
    expect(r.ativos).toBe(4);
    expect(r.percentEmDia).toBe(25);
  });
  test('conta sem responsável entre os ativos', () => {
    expect(r.semResponsavel).toBe(1);
  });
  test('fila de atenção: vermelhos primeiro, mais vencido antes', () => {
    expect(r.atencao.map(a => a.name)).toEqual(['Vencido', 'Sem resp', 'Amarelo']);
    expect(r.atencao[0].responsaveis).toEqual(['Ana']);
  });
  test('carga por pessoa', () => {
    const ana = r.porMembro.find(m => m.nome === 'Ana');
    expect(ana).toEqual({ nome: 'Ana', ativos: 2, vermelhos: 1, amarelos: 0 });
    expect(r.porMembro.find(m => m.nome === 'Sem responsável').ativos).toBe(1);
  });
  test('resumo por lista só com cards ativos', () => {
    expect(r.porLista).toEqual([{ nome: 'Em Execução', total: 4, vermelho: 2, amarelo: 1, verde: 1 }]);
  });
  test('aderência média ao padrão PMO é calculada', () => {
    expect(r.padraoMedio).toBeGreaterThan(0);
    expect(r.padraoMedio).toBeLessThanOrEqual(100);
  });
  test('board vazio não quebra', () => {
    const v = resumir([], ctx, config);
    expect(v.ativos).toBe(0);
    expect(v.padraoMedio).toBeNull();
    expect(v.percentEmDia).toBe(0);
  });
  test('texto do resumo executivo', () => {
    const t = textoResumo(r, 'PMO - Projetos da Área', AGORA, 2);
    expect(t).toMatch(/Projetos ativos: 4/);
    expect(t).toMatch(/Críticos: 2/);
    expect(t).toMatch(/- Vencido \[Em Execução\] Vencido 6d/);
    expect(t).toMatch(/e mais 1 card/);
  });
  test('texto sem itens de atenção omite a seção', () => {
    const t = textoResumo(resumir([cards[0]], ctx, config), 'X', AGORA);
    expect(t).not.toMatch(/Requer atenção/);
  });
});

describe('filtro do painel (clique nos números)', () => {
  const listas = [{ id: 'l-exec', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
  const membros = [{ id: 'm1', fullName: 'Ana' }, { id: 'm2', fullName: 'Beto' }];
  const ctx = { agora: AGORA, camposDef: DEF, listas, membros };
  const fim = (iso) => [...TODOS.filter(i => i.idCustomField !== 'f-fim'), data('f-fim', iso)];
  const cs = [
    card({ id: 'a', name: 'Verde', idMembers: ['m1'] }),
    card({ id: 'b', name: 'Vencido', idMembers: ['m1'], customFieldItems: fim('2026-11-10T12:00:00.000Z') }),
    card({ id: 'c', name: 'Sem resp', members: [], idMembers: [], customFieldItems: fim('2026-12-31T12:00:00.000Z') }),
    card({ id: 'd', name: 'Amarelo', idMembers: ['m2'], customFieldItems: fim('2026-11-17T12:00:00.000Z') }),
    card({ id: 'e', name: 'Feito', idList: 'l-ok', idMembers: ['m1'] }),
    card({ id: 'p', name: 'Pausado', idMembers: ['m2'], labels: [{ name: 'Pausado' }] }),
    card({ id: 'f', name: 'Nova', idList: 'l-new', idMembers: [] })
  ];
  const r = resumir(cs, ctx, config);
  const nomes = (l) => l.map(i => i.name);

  test('todos traz os cards avaliados, inclusive cinza, ordenados por gravidade', () => {
    expect(nomes(r.todos)).toEqual(['Vencido', 'Sem resp', 'Amarelo', 'Verde', 'Feito', 'Pausado']);
  });
  test('cada item cinza diz se é concluído ou pausado', () => {
    expect(r.todos.find(i => i.name === 'Feito').tipo).toBe('concluido');
    expect(r.todos.find(i => i.name === 'Pausado').tipo).toBe('pausado');
  });
  test('filtro por cor', () => {
    expect(nomes(filtrar(r, { cor: 'vermelho' }))).toEqual(['Vencido', 'Sem resp']);
    expect(nomes(filtrar(r, { cor: 'cinza' }))).toEqual(['Feito', 'Pausado']);
    expect(nomes(filtrar(r, { cor: 'verde' }))).toEqual(['Verde']);
  });
  test('sem cor, concluídos e pausados ficam de fora', () => {
    expect(nomes(filtrar(r, {}))).toEqual(['Vencido', 'Sem resp', 'Amarelo', 'Verde']);
    expect(nomes(filtrar(r))).toEqual(['Vencido', 'Sem resp', 'Amarelo', 'Verde']);
  });
  test('filtro por pessoa e por pessoa + cor', () => {
    expect(nomes(filtrar(r, { pessoa: 'Ana' }))).toEqual(['Vencido', 'Verde']);
    expect(nomes(filtrar(r, { pessoa: 'Ana', cor: 'vermelho' }))).toEqual(['Vencido']);
  });
  test('filtro "Sem responsável"', () => {
    expect(nomes(filtrar(r, { pessoa: 'Sem responsável' }))).toEqual(['Sem resp']);
  });
  test('filtro por lista', () => {
    expect(nomes(filtrar(r, { lista: 'Em Execução' }))).toEqual(['Vencido', 'Sem resp', 'Amarelo', 'Verde']);
    expect(nomes(filtrar(r, { lista: 'Concluídos', cor: 'cinza' }))).toEqual(['Feito']);
    expect(filtrar(r, { lista: 'Inexistente' })).toEqual([]);
  });
  test('as contagens dos números batem com o que o clique mostra', () => {
    expect(filtrar(r, { cor: 'vermelho' }).length).toBe(r.porCor.vermelho);
    expect(filtrar(r, { cor: 'amarelo' }).length).toBe(r.porCor.amarelo);
    expect(filtrar(r, { cor: 'verde' }).length).toBe(r.porCor.verde);
    expect(filtrar(r, { cor: 'cinza' }).length).toBe(r.porCor.cinza);
    r.porMembro.forEach(m => expect(filtrar(r, { pessoa: m.nome }).length).toBe(m.ativos));
    r.porLista.forEach(l => expect(filtrar(r, { lista: l.nome }).length).toBe(l.total));
  });
});
