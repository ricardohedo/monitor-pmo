const { montarMeuDia, fraseMeuDia, saudacao } = require('../js/meudia.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // 16/11/2026 12h em Brasília
const DEF = [{ id: 'f-fim', name: 'Fim planejado', type: 'date' }];
const fim = (iso) => [{ idCustomField: 'f-fim', value: { date: iso } }];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u', idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: '2026-11-15T15:00:00.000Z',
    customFieldItems: fim('2027-03-01T12:00:00.000Z'), badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const monta = (cards, id) => montarMeuDia(cards, { agora: AGORA, camposDef: DEF, listas: LISTAS }, config, id || 'ana');
const nomes = (l) => l.map(i => i.name);

describe('montarMeuDia', () => {
  test('só traz os cards do gestor', () => {
    const r = monta([card('Meu'), card('DoBeto', { idMembers: ['beto'] }), card('Dos2', { idMembers: ['ana', 'beto'] })]);
    expect(nomes(r.itens).sort()).toEqual(['Dos2', 'Meu']);
    expect(monta([card('Meu')], 'beto').total).toBe(0);
  });
  test('aceita members no lugar de idMembers', () => {
    const c = card('M'); delete c.idMembers; c.members = [{ id: 'ana' }];
    expect(monta([c]).total).toBe(1);
  });
  test('fora: NOVA DEMANDA, concluídos, pausados e card marcado como feito', () => {
    const r = monta([
      card('Ativo'), card('Nova', { idList: 'l-new' }), card('Feito', { idList: 'l-ok' }),
      card('Pausa', { labels: [{ name: 'Pausado' }] }), card('Check', { dueComplete: true })
    ]);
    expect(nomes(r.itens)).toEqual(['Ativo']);
  });
  test('ordena por gravidade, depois pelo prazo mais próximo', () => {
    const r = monta([
      card('Verde'),
      card('AmarelaTarde', { customFieldItems: fim('2026-11-19T12:00:00.000Z') }),
      card('Vencida', { customFieldItems: fim('2026-11-10T12:00:00.000Z') }),
      card('AmarelaCedo', { customFieldItems: fim('2026-11-17T12:00:00.000Z') })
    ]);
    expect(nomes(r.itens)).toEqual(['Vencida', 'AmarelaCedo', 'AmarelaTarde', 'Verde']);
    expect(r.porCor).toEqual({ vermelho: 1, amarelo: 2, verde: 1 });
  });
  test('agenda: vencidos e prazos até 14 dias, em ordem de data', () => {
    const r = monta([
      card('Longe', { customFieldItems: fim('2027-03-01T12:00:00.000Z') }),
      card('Em10', { customFieldItems: fim('2026-11-26T12:00:00.000Z') }),
      card('Em14', { customFieldItems: fim('2026-11-30T12:00:00.000Z') }),
      card('Em15', { customFieldItems: fim('2026-12-01T12:00:00.000Z') }),
      card('Vencida', { customFieldItems: fim('2026-11-10T12:00:00.000Z') }),
      card('Hoje', { customFieldItems: fim('2026-11-16T12:00:00.000Z') })
    ]);
    expect(nomes(r.agenda)).toEqual(['Vencida', 'Hoje', 'Em10', 'Em14']);
  });
  test('próximo prazo ignora os já vencidos', () => {
    const r = monta([
      card('Vencida', { customFieldItems: fim('2026-11-10T12:00:00.000Z') }),
      card('Amanha', { customFieldItems: fim('2026-11-17T12:00:00.000Z') })
    ]);
    expect(r.proximoPrazo.name).toBe('Amanha');
  });
  test('sem prazo vai para a lista própria e não entra na agenda', () => {
    const r = monta([card('SemPrazo', { customFieldItems: [] })]);
    expect(nomes(r.semPrazo)).toEqual(['SemPrazo']);
    expect(r.agenda).toEqual([]);
    expect(r.proximoPrazo).toBeNull();
  });
  test('progresso das checklists por card', () => {
    const r = monta([card('P'), card('SemCheck', { badges: {} })]);
    expect(r.itens.find(i => i.name === 'P').progresso).toBeCloseTo(0.25);
    expect(r.itens.find(i => i.name === 'SemCheck').progresso).toBeNull();
  });
  test('gestor sem cards: tudo vazio e sem erro', () => {
    const r = monta([]);
    expect(r.total).toBe(0);
    expect(r.agenda).toEqual([]);
  });
});

describe('saudação e frase', () => {
  test('saudação pelo horário de Brasília', () => {
    expect(saudacao(new Date('2026-11-16T11:00:00.000Z'), -3)).toBe('Bom dia');       // 08h
    expect(saudacao(new Date('2026-11-16T15:00:00.000Z'), -3)).toBe('Boa tarde');     // 12h
    expect(saudacao(new Date('2026-11-16T20:59:00.000Z'), -3)).toBe('Boa tarde');     // 17h59
    expect(saudacao(new Date('2026-11-16T21:00:00.000Z'), -3)).toBe('Boa noite');     // 18h
    expect(saudacao(new Date('2026-11-16T02:00:00.000Z'), -3)).toBe('Boa noite');     // 23h do dia anterior
  });
  test('frase com resumo e próximo prazo', () => {
    const r = monta([
      card('Vencida', { customFieldItems: fim('2026-11-10T12:00:00.000Z') }),
      card('Amanha', { customFieldItems: fim('2026-11-17T12:00:00.000Z') }),
      card('Ok')
    ]);
    expect(fraseMeuDia(r, 'Ricardo Hedo Nabout', AGORA, -3)).toBe(
      'Boa tarde, Ricardo. Você tem 3 projetos ativos: 1 crítico, 1 em atenção e 1 em dia. Próximo prazo: Amanha (em 1 dia).');
  });
  test('frase no singular e com prazo hoje', () => {
    const r = monta([card('Hoje', { customFieldItems: fim('2026-11-16T12:00:00.000Z') })]);
    const f = fraseMeuDia(r, 'Ana', AGORA, -3);
    expect(f).toContain('1 projeto ativo: 0 críticos, 1 em atenção e 0 em dia.');
    expect(f).toContain('Próximo prazo: Hoje (hoje).');
  });
  test('frase sem projetos e sem nome', () => {
    expect(fraseMeuDia(monta([]), '', AGORA, -3)).toBe('Boa tarde. Nenhum projeto ativo sob sua responsabilidade.');
  });
});
