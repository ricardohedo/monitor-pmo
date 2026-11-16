const { calcularSaude, obterPrazo, diasEntre } = require('../js/health.js');
const { config } = require('../js/config.js');

// "Hoje" = 2026-11-16 12:00 em Brasília (15:00Z)
const AGORA = new Date('2026-11-16T15:00:00.000Z');
const DEF = [{ id: 'f-fim', name: 'Fim planejado', type: 'date' }];
const resp = [{ id: 'm1' }];
const ativo = '2026-11-15T15:00:00.000Z'; // movimentado ontem

function card(over) {
  return Object.assign({
    due: null, dueComplete: false, members: resp,
    dateLastActivity: ativo, customFieldItems: [], labels: []
  }, over);
}
function fim(iso) {
  return [{ idCustomField: 'f-fim', value: { date: iso } }];
}
function saude(c, ctx) {
  return calcularSaude(c, Object.assign(
    { agora: AGORA, camposDef: DEF, nomeLista: 'Em Execução' }, ctx), config);
}

describe('RF-001 semáforo: prazo', () => {
  test('vencido ontem fica vermelho', () => {
    const s = saude(card({ customFieldItems: fim('2026-11-15T12:00:00.000Z') }));
    expect(s.cor).toBe('vermelho');
    expect(s.rotulo).toBe('Vencido 1d');
  });
  test('vencido há 6 dias fica vermelho', () => {
    const s = saude(card({ customFieldItems: fim('2026-11-10T12:00:00.000Z') }));
    expect(s.cor).toBe('vermelho');
    expect(s.rotulo).toBe('Vencido 6d');
  });
  test('vence hoje fica amarelo', () => {
    const s = saude(card({ customFieldItems: fim('2026-11-16T12:00:00.000Z') }));
    expect(s.cor).toBe('amarelo');
    expect(s.rotulo).toBe('Vence hoje');
  });
  test('vence em 3 dias (limite) fica amarelo', () => {
    const s = saude(card({ customFieldItems: fim('2026-11-19T12:00:00.000Z') }));
    expect(s.cor).toBe('amarelo');
    expect(s.rotulo).toBe('Vence em 3d');
  });
  test('vence em 4 dias fica verde', () => {
    const s = saude(card({ customFieldItems: fim('2026-11-20T12:00:00.000Z') }));
    expect(s.cor).toBe('verde');
    expect(s.rotulo).toBe('Em dia');
  });
  test('sem prazo fica amarelo', () => {
    const s = saude(card());
    expect(s.cor).toBe('amarelo');
    expect(s.rotulo).toBe('Sem prazo');
  });
  test('prazo inválido não quebra e não gera alerta de prazo', () => {
    const s = saude(card({ due: 'lixo' }));
    expect(s.cor).toBe('verde');
  });
  test('fuso: 22h de Brasília no dia 16 ainda é "hoje"', () => {
    const s = calcularSaude(
      card({ customFieldItems: fim('2026-11-16T12:00:00.000Z') }),
      { agora: new Date('2026-11-17T01:00:00.000Z'), camposDef: DEF, nomeLista: 'Em Execução' },
      config);
    expect(s.rotulo).toBe('Vence hoje');
  });
  test('fuso: 00h05 de Brasília no dia 17 já é vencido', () => {
    const s = calcularSaude(
      card({ customFieldItems: fim('2026-11-16T12:00:00.000Z') }),
      { agora: new Date('2026-11-17T03:05:00.000Z'), camposDef: DEF, nomeLista: 'Em Execução' },
      config);
    expect(s.cor).toBe('vermelho');
    expect(s.rotulo).toBe('Vencido 1d');
  });
});

describe('RF-001 semáforo: origem do prazo', () => {
  test('campo "Fim planejado" tem prioridade sobre o vencimento do Trello', () => {
    const p = obterPrazo(card({
      due: '2026-11-01T12:00:00.000Z',
      customFieldItems: fim('2026-12-01T12:00:00.000Z')
    }), DEF, 'Fim planejado');
    expect(p).toBe('2026-12-01T12:00:00.000Z');
  });
  test('sem o campo, usa o vencimento do Trello', () => {
    expect(obterPrazo(card({ due: '2026-11-01T12:00:00.000Z' }), DEF, 'Fim planejado'))
      .toBe('2026-11-01T12:00:00.000Z');
  });
  test('nome do campo ignora maiúsculas e espaços', () => {
    const p = obterPrazo(card({ customFieldItems: fim('2026-12-01T12:00:00.000Z') }),
      DEF, '  fim PLANEJADO ');
    expect(p).toBe('2026-12-01T12:00:00.000Z');
  });
  test('sem campo e sem vencimento retorna null', () => {
    expect(obterPrazo(card(), DEF, 'Fim planejado')).toBeNull();
  });
});

describe('RF-001 semáforo: responsável', () => {
  const ok = fim('2026-12-30T12:00:00.000Z');
  test('sem membros fica vermelho', () => {
    const s = saude(card({ members: [], customFieldItems: ok }));
    expect(s.cor).toBe('vermelho');
    expect(s.rotulo).toBe('Sem responsável');
  });
  test('aceita idMembers no lugar de members', () => {
    const c = card({ customFieldItems: ok });
    delete c.members; c.idMembers = [];
    expect(saude(c).cor).toBe('vermelho');
    c.idMembers = ['m1'];
    expect(saude(c).cor).toBe('verde');
  });
  test('sem nenhuma informação de membros conta como sem responsável', () => {
    const c = card({ customFieldItems: ok });
    delete c.members;
    expect(saude(c).rotulo).toBe('Sem responsável');
  });
});

describe('RF-001 semáforo: dias parado', () => {
  const ok = fim('2026-12-30T12:00:00.000Z');
  test('parado exatamente 7 dias ainda é verde', () => {
    const s = saude(card({ customFieldItems: ok, dateLastActivity: '2026-11-09T15:00:00.000Z' }));
    expect(s.cor).toBe('verde');
  });
  test('parado 8 dias fica amarelo', () => {
    const s = saude(card({ customFieldItems: ok, dateLastActivity: '2026-11-08T15:00:00.000Z' }));
    expect(s.cor).toBe('amarelo');
    expect(s.rotulo).toBe('Parado 8d');
  });
  test('sem data de atividade não gera alerta', () => {
    const s = saude(card({ customFieldItems: ok, dateLastActivity: undefined }));
    expect(s.cor).toBe('verde');
  });
});

describe('RF-001 semáforo: combinações e exceções', () => {
  test('vermelho prevalece sobre amarelo e vem primeiro nos motivos', () => {
    const s = saude(card({
      members: [], dateLastActivity: '2026-10-01T15:00:00.000Z',
      customFieldItems: fim('2026-11-17T12:00:00.000Z')
    }));
    expect(s.cor).toBe('vermelho');
    expect(s.rotulo).toBe('Sem responsável');
    expect(s.motivos).toEqual(expect.arrayContaining(['Vence em 1d', 'Sem responsável']));
    expect(s.motivos[0]).toBe('Sem responsável');
    expect(s.motivos.length).toBe(3);
  });
  test('card concluído (dueComplete) fica cinza mesmo vencido e sem responsável', () => {
    const s = saude(card({ dueComplete: true, members: [], due: '2020-01-01T12:00:00.000Z' }));
    expect(s.cor).toBe('cinza');
    expect(s.rotulo).toBe('Concluído');
  });
  test('card na lista Concluídos fica cinza', () => {
    expect(saude(card({ members: [] }), { nomeLista: 'Concluídos' }).cor).toBe('cinza');
  });
  test('etiqueta Pausado deixa o card cinza', () => {
    const s = saude(card({ members: [], labels: [{ name: 'Pausado' }] }));
    expect(s.cor).toBe('cinza');
    expect(s.rotulo).toBe('Pausado');
  });
  test('cards da lista NOVA DEMANDA ficam fora do semáforo', () => {
    expect(saude(card(), { nomeLista: '➕ NOVA DEMANDA — Criar aqui' })).toBeNull();
  });
  test('lista desconhecida (vazia) ainda calcula a saúde', () => {
    expect(saude(card(), { nomeLista: '' }).cor).toBe('amarelo');
  });
});

describe('diasEntre', () => {
  test('datas inválidas retornam null', () => {
    expect(diasEntre('x', AGORA, -3)).toBeNull();
    expect(diasEntre(AGORA, undefined, -3)).toBeNull();
  });
  test('mesmo dia civil retorna 0', () => {
    expect(diasEntre('2026-11-16T03:00:00.000Z', '2026-11-17T02:59:00.000Z', -3)).toBe(0);
  });
});
