const { montarItens } = require('../js/itens.js');
const { montarCarga } = require('../js/carga.js');
const { montarPrazos } = require('../js/prazos.js');
const { montarAtuar } = require('../js/atuar.js');
const { montarRadar } = require('../js/radar.js');
const { montarConquistas } = require('../js/conquistas.js');
const { montarCadastro } = require('../js/cadastro.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // 16/11/2026 12h em Brasília
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-esf', name: 'Esforço estimado', type: 'list', options: [
    { id: 'e-a', value: { text: 'Alto' } }, { id: 'e-b', value: { text: 'Baixo' } }] },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [{ id: 'p-m', value: { text: 'Máxima' } }] }
];
const LISTAS = [
  { id: 'l-exe', name: 'Em Execução' }, { id: 'l-bk', name: 'Backlog de Projetos' },
  { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }
];
const MEMBROS = [{ id: 'ana', fullName: 'ANA SOUZA' }, { id: 'beto', fullName: 'Beto Lima' }];
const fim = (iso) => ({ idCustomField: 'f-fim', value: { date: iso } });
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(-1),
    customFieldItems: [fim(dia(60))], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const itens = (cards) => montarItens(cards, { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: MEMBROS }, config);

describe('montarItens', () => {
  test('exclui NOVA DEMANDA e marca concluídos como inativos', () => {
    const r = itens([card('A'), card('N', { idList: 'l-new' }), card('C', { idList: 'l-ok' })]);
    expect(r.map(i => i.name)).toEqual(['A', 'C']);
    expect(r[0].ativo).toBe(true);
    expect(r[1].ativo).toBe(false);
    expect(r[1].tipo).toBe('concluido');
  });
  test('nomes, progresso, parado e campos de lista', () => {
    const r = itens([card('A', {
      dateLastActivity: dia(-9), customFieldItems: [fim(dia(60)),
        { idCustomField: 'f-esf', idValue: 'e-a' }, { idCustomField: 'f-pri', idValue: 'p-m' }]
    })])[0];
    expect(r.responsaveis).toEqual(['ANA SOUZA']);
    expect(r.progresso).toBe(0.25);
    expect(r.parado).toBe(9);
    expect(r.esforco).toBe('alto');
    expect(r.prioridade).toBe('maxima');
    expect(r.faltando.length).toBeGreaterThan(0);
  });
  test('aceita members; sem checklist = progresso nulo', () => {
    const c = card('M', { badges: {} }); delete c.idMembers; c.members = [{ id: 'beto' }];
    const r = itens([c])[0];
    expect(r.responsaveis).toEqual(['Beto Lima']);
    expect(r.progresso).toBeNull();
  });
});

describe('montarCarga', () => {
  const alto = [{ idCustomField: 'f-esf', idValue: 'e-a' }];
  test('sobrecarga por WIP e por pontos; folga e sem responsável por último', () => {
    const cards = [];
    for (let k = 0; k < 4; k++) cards.push(card('X' + k, { customFieldItems: [fim(dia(60))].concat(alto) }));
    cards.push(card('B1', { idMembers: ['beto'], customFieldItems: [fim(dia(60)), { idCustomField: 'f-esf', idValue: 'e-b' }] }));
    cards.push(card('Orfao', { idMembers: [] }));
    const r = montarCarga(itens(cards), config);
    expect(r.linhas.map(l => l.nome)).toEqual(['ANA SOUZA', 'Beto Lima', 'Sem responsável']);
    const ana = r.linhas[0];
    expect(ana.execucao).toBe(4);
    expect(ana.pontos).toBe(12);
    expect(ana.sobrecarga).toBe(true);
    expect(ana.motivos).toHaveLength(2);
    expect(r.comFolga.map(l => l.nome)).toEqual(['Beto Lima']);
    expect(r.linhas[2].semDono).toBe(true);
    expect(r.linhas[2].sobrecarga).toBe(false);
    expect(r.texto).toContain('SOBRECARGA');
    expect(r.texto).toContain('Sugestão');
  });
  test('conta vencidos, próximos e sem prazo; Backlog não é execução; concluído não conta', () => {
    const r = montarCarga(itens([
      card('V', { customFieldItems: [fim(dia(-3))] }),
      card('P', { customFieldItems: [fim(dia(4))] }),
      card('S', { customFieldItems: [], idList: 'l-bk' }),
      card('C', { idList: 'l-ok' })
    ]), config);
    const l = r.linhas[0];
    expect([l.ativos, l.vencidos, l.proximos, l.semPrazo, l.execucao]).toEqual([3, 1, 1, 1, 2]);
    expect(r.total).toBe(3);
    expect(r.texto).not.toContain('Sugestão');
  });
  test('sem projetos', () => {
    const r = montarCarga([], config);
    expect(r.linhas).toEqual([]);
    expect(r.maxAtivos).toBe(1);
  });
});

describe('montarPrazos', () => {
  test('atrasados, janelas, sem prazo e pouco andado', () => {
    const r = montarPrazos(itens([
      card('Atras', { customFieldItems: [fim(dia(-5))] }),
      card('Hoje', { customFieldItems: [fim(dia(0))] }),
      card('Sem', { customFieldItems: [] }),
      card('D10', { customFieldItems: [fim(dia(10))], badges: { checkItems: 10, checkItemsChecked: 8 } }),
      card('D12pouco', { customFieldItems: [fim(dia(12))] }),
      card('D25', { customFieldItems: [fim(dia(25))] }),
      card('Longe', { customFieldItems: [fim(dia(90))] }),
      card('Feito', { idList: 'l-ok' })
    ]), config, AGORA);
    expect(r.atrasados.map(i => i.name)).toEqual(['Atras']);
    expect(r.janelas.map(j => [j.titulo, j.itens.map(i => i.name)])).toEqual([
      ['Hoje', ['Hoje']], ['8 a 14 dias', ['D10', 'D12pouco']], ['15 a 30 dias', ['D25']]
    ]);
    expect(r.semPrazo.map(i => i.name)).toEqual(['Sem']);
    expect(r.pouco.map(i => i.name)).toEqual(['Hoje', 'D12pouco']);
    expect(r.proximos).toBe(4);
    expect(r.texto).toContain('Atrasados:');
  });
  test('avisa prazo colado na Black Friday (27/11/2026)', () => {
    const r = montarPrazos(itens([card('Perto', { customFieldItems: [fim('2026-11-24T12:00:00.000Z')] })]), config, AGORA);
    expect(r.janelas[0].itens[0].varejo).toEqual({ nome: 'Black Friday', dias: 3 });
    expect(r.texto).toContain('3d antes de Black Friday');
  });
  test('prazo depois da data do varejo não avisa', () => {
    const r = montarPrazos(itens([card('Depois', { customFieldItems: [fim('2026-11-29T12:00:00.000Z')] })]), config, AGORA);
    expect(r.janelas[0].itens[0].varejo).toBeNull();
  });
});

describe('montarAtuar', () => {
  test('ordena por pontuação; prioridade máxima pesa; filtra por membro', () => {
    const cards = [
      card('Vencida', { customFieldItems: [fim(dia(-10))] }),
      card('VencidaMax', { customFieldItems: [fim(dia(-10)), { idCustomField: 'f-pri', idValue: 'p-m' }] }),
      card('Orfao', { idMembers: [] }),
      card('Beto', { idMembers: ['beto'], customFieldItems: [fim(dia(-1))] }),
      card('Ok')
    ];
    const todos = montarAtuar(itens(cards), config, null);
    expect(todos.comece.map(x => x.item.name)).toEqual(['VencidaMax', 'Vencida', 'Beto']);
    expect(todos.depois.map(x => x.item.name)).toEqual(['Orfao']);
    expect(todos.semAtencao).toBe(1);
    expect(todos.comece[0].fazer).toContain('Fim planejado');
    const meus = montarAtuar(itens(cards), config, 'beto');
    expect(meus.total).toBe(1);
    expect(meus.comece[0].item.name).toBe('Beto');
  });
  test('resto, em risco e vitórias rápidas', () => {
    const muitos = [];
    for (let k = 0; k < 10; k++) muitos.push(card('V' + k, { customFieldItems: [fim(dia(-1 - k))] }));
    expect(montarAtuar(itens(muitos), config, null).resto).toBe(2);
    const r = montarAtuar(itens([
      card('Risco', { customFieldItems: [fim(dia(10))] }),
      card('Quase', { customFieldItems: [fim(dia(60))], badges: { checkItems: 10, checkItemsChecked: 9 } })
    ]), config, null);
    expect(r.emRisco.map(i => i.name)).toEqual(['Risco']);
    expect(r.vitorias.map(i => i.name)).toEqual(['Quase']);
  });
  test('urgente soma pontos e ação de parado/sem prazo/ritmo', () => {
    const urg = [{ id: 'f-urg', name: 'Urgente', type: 'list', options: [{ id: 'u-s', value: { text: 'Sim' } }] }];
    const it = montarItens([
      card('U', { customFieldItems: [fim(dia(-1)), { idCustomField: 'f-urg', idValue: 'u-s' }] }),
      card('N', { customFieldItems: [fim(dia(-1))] }),
      card('P', { dateLastActivity: dia(-20) }),
      card('SP', { customFieldItems: [] })
    ], { agora: AGORA, camposDef: DEF.concat(urg), listas: LISTAS, membros: MEMBROS }, config);
    const r = montarAtuar(it, config, null);
    expect(r.comece.map(x => x.item.name)).toEqual(['U', 'N', 'P']);
    expect(r.depois[0].fazer).toContain('Início planejado');
    expect(r.comece[2].fazer).toContain('Comente');
  });
});

describe('montarRadar', () => {
  const r0 = (nome, over) => card(nome, Object.assign({ dateLastActivity: dia(0) }, over));
  test('prevê prazo vencendo, janela de atenção e parado', () => {
    const r = montarRadar(itens([
      r0('Amanha', { customFieldItems: [fim(dia(1))] }),
      r0('Verde5', { customFieldItems: [fim(dia(5))] }),
      r0('Para', { dateLastActivity: dia(-6) }),
      r0('Longe', { customFieldItems: [fim(dia(60))] }),
      r0('Vermelho', { customFieldItems: [fim(dia(-2))] }),
      r0('Feito', { idList: 'l-ok' })
    ]), config);
    const achata = r.grupos.map(g => [g.dias, g.linhas.map(l => l.item.name + ':' + l.tipo)]);
    expect(achata).toEqual([
      [2, ['Amanha:critico', 'Para:parado', 'Verde5:atencao']],
      [6, ['Verde5:critico']]
    ]);
    expect(r.total).toBe(3);
    expect(r.viramCriticos).toBe(2);
  });
  test('amarelo não repete aviso de atenção; vermelho não vira crítico de novo', () => {
    const r = montarRadar(itens([r0('Amar', { customFieldItems: [fim(dia(2))] }), r0('Verm', { customFieldItems: [fim(dia(-4))] })]), config);
    expect(r.grupos.map(g => g.linhas.map(l => l.tipo))).toEqual([['critico']]);
  });
});

describe('montarConquistas', () => {
  test('entregas recentes e reta final', () => {
    const r = montarConquistas(itens([
      card('Entregue', { idList: 'l-ok', dateLastActivity: dia(-3) }),
      card('Antigo', { idList: 'l-ok', dateLastActivity: dia(-90) }),
      card('Reta', { badges: { checkItems: 10, checkItemsChecked: 9 } }),
      card('Meio')
    ]), config);
    expect(r.entregas.map(i => i.name)).toEqual(['Entregue']);
    expect(r.retaFinal.map(i => i.name)).toEqual(['Reta']);
    expect(r.destaque).toContain('1 entrega');
  });
  test('destaque sem entregas: nenhum crítico; com crítico: sem destaque', () => {
    expect(montarConquistas(itens([card('A')]), config).destaque).toContain('Nenhum projeto crítico');
    expect(montarConquistas(itens([card('V', { customFieldItems: [fim(dia(-1))] })]), config).destaque).toBeNull();
  });
  test('plural em entregas', () => {
    const r = montarConquistas(itens([
      card('A', { idList: 'l-ok', dateLastActivity: dia(-1) }), card('B', { idList: 'l-ok', dateLastActivity: dia(-2) })
    ]), config);
    expect(r.destaque).toContain('2 entregas');
  });
});

describe('montarCadastro', () => {
  test('agrupa por responsável, conta campos e gera cobrança', () => {
    const r = montarCadastro(itens([card('Incompleto'), card('Orfao', { idMembers: [] })]));
    expect(r.gestores.map(g => g.nome)).toEqual(['ANA SOUZA', 'Sem responsável']);
    expect(r.gestores[0].texto).toContain('Ana, faltam dados');
    expect(r.gestores[0].texto).toContain('- Incompleto:');
    expect(r.gestores[1].texto).toContain('PMO precisa atribuir');
    expect(r.campos.find(c => c.campo === 'Responsável').qtd).toBe(1);
    expect(r.total).toBe(2);
    expect(r.completos).toBe(0);
    expect(r.texto).toContain('\n\n');
  });
  test('ignora concluídos; portfólio sem pendência', () => {
    const r = montarCadastro(itens([card('C', { idList: 'l-ok' })]));
    expect(r.gestores).toEqual([]);
    expect(r.aderenciaMedia).toBe(100);
  });
});
