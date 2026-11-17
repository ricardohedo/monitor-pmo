const { montarItens } = require('../js/itens.js');
const { montarMetas } = require('../js/metas.js');
const { montarRelatorio } = require('../js/relatorio.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // segunda, 16/11/2026
const DEF = [{ id: 'f-fim', name: 'Fim planejado', type: 'date' }];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-ok', name: 'Concluídos' }];
const MEMBROS = [{ id: 'ana', fullName: 'Ana Souza' }];
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const fim = (n) => ({ idCustomField: 'f-fim', value: { date: dia(n) } });

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(0),
    customFieldItems: [fim(60)], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const itens = (cards) => montarItens(cards, { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: MEMBROS }, config);
const cfg = (missoes) => Object.assign({}, config, { metas: { missoes } });

describe('montarMetas', () => {
  test('sem atraso até sexta: progresso, faltam e ritmo por semana', () => {
    const r = montarMetas(itens([card('Ok'), card('Atras1', { customFieldItems: [fim(-3)] }), card('Atras2', { customFieldItems: [fim(-1)] })]),
      cfg([{ nome: 'Zerar', tipo: 'sem_atraso', data: 'semana' }]), AGORA);
    const m = r.metas[0];
    expect([m.atingidos, m.total, m.pct, m.dias, m.estado]).toEqual([1, 3, 33, 4, 'em andamento']);
    expect(m.faltam.map(f => f.name)).toEqual(['Atras1', 'Atras2']);
    expect(m.porSemana).toBe(2);
    expect(m.diasUteis).toBe(3); // 20/11 é feriado
  });
  test('data por nome do varejo e por ISO; vencida e cumprida', () => {
    const r = montarMetas(itens([card('A', { idMembers: [] })]), cfg([
      { nome: 'Natal', tipo: 'com_responsavel', data: 'Natal' },
      { nome: 'Passado', tipo: 'com_responsavel', data: '2026-11-01' },
      { nome: 'Prazo', tipo: 'com_prazo', data: '2026-12-01' }
    ]), AGORA);
    expect(r.metas[0].dias).toBe(39);
    expect(r.metas[0].estado).toBe('em andamento');
    expect(r.metas[1].estado).toBe('vencida');
    expect(r.metas[2].estado).toBe('cumprida');
    expect(r.metas[2].pct).toBe(100);
  });
  test('sexta: hoje sendo sexta conta 0 dias; data desconhecida; tipo inválido; cadastro completo', () => {
    const sexta = new Date('2026-11-20T15:00:00.000Z');
    const it = montarItens([card('A')], { agora: sexta, camposDef: DEF, listas: LISTAS, membros: MEMBROS }, config);
    const r = montarMetas(it, cfg([
      { nome: 'S', tipo: 'sem_atraso', data: 'semana' },
      { nome: 'X', tipo: 'com_prazo', data: 'Data que não existe' },
      { nome: 'Y', tipo: 'nao_existe', data: 'Natal' },
      { nome: 'Cad', tipo: 'cadastro_completo', data: 'Páscoa' }
    ]), sexta);
    expect(r.metas[0].dias).toBe(0);
    expect(r.metas[1].estado).toBe('cumprida');
    expect(r.metas[1].dias).toBeNull();
    expect(r.metas[2].invalida).toContain('tipo desconhecido');
    expect(r.metas[3].pct).toBe(0);
    expect(r.metas[3].estado).toBe('em andamento');
  });
  test('sem data e não cumprida; portfólio vazio conta como 100%', () => {
    const a = montarMetas(itens([card('A', { idMembers: [] })]), cfg([{ nome: 'X', tipo: 'com_responsavel', data: 'Inexistente' }]), AGORA);
    expect(a.metas[0].estado).toBe('sem data');
    const b = montarMetas([], cfg([{ nome: 'X', tipo: 'com_prazo', data: 'Natal' }]), AGORA);
    expect(b.metas[0].pct).toBe(100);
  });
});

describe('montarRelatorio', () => {
  test('monta seções e texto com os números do portfólio', () => {
    const r = montarRelatorio(itens([
      card('Critico', { customFieldItems: [fim(-5)] }),
      card('Orfao', { idMembers: [] }),
      card('Prox', { customFieldItems: [fim(20)] }),
      card('Feito', { idList: 'l-ok', dateLastActivity: dia(-2) })
    ]), config, AGORA, 'PMO - Projetos');
    const por = {};
    r.secoes.forEach(s => { por[s.titulo] = s.linhas.join(' | '); });
    expect(r.titulo).toBe('Relatório do portfólio - PMO - Projetos - 16/11/2026');
    expect(por['Situação geral']).toContain('3 projetos ativos: 2 críticos');
    expect(por['Pedem atenção']).toContain('Critico (Ana Souza)');
    expect(por['Pedem atenção']).toContain('Orfao (sem responsável)');
    expect(por['Prazos']).toContain('1 projeto atrasado: Critico');
    expect(por['Prazos']).toContain('Prox (em 20d)');
    expect(por['Varejo']).toContain('Black Friday (27/11/2026)');
    expect(por['Varejo']).toContain('Nenhum projeto ligado');
    expect(por['Equipe']).toContain('1 projeto sem responsável');
    expect(por['Entregas']).toContain('1 entrega');
    expect(r.texto).toContain('\nSituação geral\n- ');
  });
  test('portfólio saudável: sem seção de atenção; título sem nome do board; limite da lista', () => {
    const ok = montarRelatorio(itens([card('Ok')]), config, AGORA);
    expect(ok.titulo).toBe('Relatório do portfólio - 16/11/2026');
    expect(ok.secoes.map(s => s.titulo)).not.toContain('Pedem atenção');
    const muitos = [];
    for (let k = 0; k < 9; k++) muitos.push(card('C' + k, { customFieldItems: [fim(-1 - k)] }));
    const r = montarRelatorio(itens(muitos), config, AGORA);
    const at = r.secoes.find(s => s.titulo === 'Pedem atenção').linhas;
    expect(at).toHaveLength(config.pauta.limiteLista + 1);
    expect(at[at.length - 1]).toContain('e mais 3');
  });
  test('varejo ligado e sobrecarga aparecem', () => {
    const cards = [];
    for (let k = 0; k < 5; k++) cards.push(card('P' + k, { labels: k === 0 ? [{ name: 'Black Friday' }] : [] }));
    const r = montarRelatorio(itens(cards), config, AGORA);
    const por = {};
    r.secoes.forEach(s => { por[s.titulo] = s.linhas.join(' | '); });
    expect(por['Varejo']).toContain('1 projeto ligado');
    expect(por['Equipe']).toContain('Sobrecarga: Ana Souza');
  });
});
