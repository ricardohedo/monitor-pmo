const { montarPauta } = require('../js/pauta.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // 16/11/2026 em Brasília
const op = (id, text) => ({ id, value: { text } });
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [op('p-x', 'Máxima'), op('p-a', 'Alta'), op('p-b', 'Baixa')] },
  { id: 'f-urg', name: 'Urgente', type: 'list', options: [op('u-s', 'Sim'), op('u-n', 'Não')] }
];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
const fim = (iso) => ({ idCustomField: 'f-fim', value: { date: iso } });
const lv = (campo, id) => ({ idCustomField: campo, idValue: id, value: null });

function card(name, opcoes) {
  const { prazo, pri, urg, ...over } = opcoes || {};
  const itens = [];
  itens.push(fim(prazo || '2027-06-01T12:00:00.000Z'));
  if (pri) itens.push(lv('f-pri', pri));
  if (urg) itens.push(lv('f-urg', urg));
  return Object.assign({
    id: name, name, url: 'u', desc: '', idList: 'l-exe', due: null, dueComplete: false,
    members: [{ id: 'm' }], labels: [], dateLastActivity: '2026-11-15T15:00:00.000Z',
    customFieldItems: itens, badges: {}
  }, over);
}
const pauta = (cards) => montarPauta(cards, { agora: AGORA, camposDef: DEF, listas: LISTAS }, config, 'PMO - Projetos da Área');
const sec = (p, inicio) => p.secoes.find(s => s.titulo.indexOf(inicio) === 0);
const nomes = (s) => (s ? s.linhas.map(l => l.texto.split(' - ')[0]) : []);

describe('montarPauta', () => {
  test('Decidir hoje: crítico com prioridade máxima ou urgente', () => {
    const p = pauta([
      card('CriticoMax', { prazo: '2026-11-10T12:00:00.000Z', pri: 'p-x' }),
      card('CriticoUrgente', { prazo: '2026-11-10T12:00:00.000Z', urg: 'u-s' }),
      card('CriticoBaixa', { prazo: '2026-11-10T12:00:00.000Z', pri: 'p-b' }),
      card('AmareloMax', { prazo: '2026-11-17T12:00:00.000Z', pri: 'p-x' })
    ]);
    expect(nomes(sec(p, 'Decidir hoje')).sort()).toEqual(['CriticoMax', 'CriticoUrgente']);
  });
  test('Destravar: sem responsável, parado ou ritmo baixo', () => {
    const p = pauta([
      card('SemResp', { members: [] }),
      card('Parado', { dateLastActivity: '2026-11-01T15:00:00.000Z' }),
      card('Ok')
    ]);
    expect(nomes(sec(p, 'Destravar')).sort()).toEqual(['Parado', 'SemResp']);
    expect(sec(p, 'Destravar').linhas.find(l => l.texto.startsWith('Parado')).texto).toContain('Parado 15d');
  });
  test('cada projeto aparece em uma só das três primeiras seções', () => {
    const p = pauta([card('Tudo', { prazo: '2026-11-10T12:00:00.000Z', pri: 'p-x', members: [], dateLastActivity: '2026-10-01T15:00:00.000Z' })]);
    expect(nomes(sec(p, 'Decidir hoje'))).toEqual(['Tudo']);
    expect(sec(p, 'Destravar')).toBeUndefined();
    expect(sec(p, 'Prazo')).toBeUndefined();
  });
  test('Prazo: vencidos e próximos 7 dias, mais urgente primeiro', () => {
    const p = pauta([
      card('Em7', { prazo: '2026-11-23T12:00:00.000Z' }), card('Em8', { prazo: '2026-11-24T12:00:00.000Z' }),
      card('Vencido', { prazo: '2026-11-10T12:00:00.000Z' }), card('Hoje', { prazo: '2026-11-16T12:00:00.000Z' })
    ]);
    const s = sec(p, 'Prazo');
    expect(nomes(s)).toEqual(['Vencido', 'Hoje', 'Em7']);
    expect(s.linhas[0].texto).toContain('vencido há 6 dias');
    expect(s.linhas[1].texto).toContain('vence hoje');
  });
  test('Reconhecer: 90% ou mais e ainda aberto, com mínimo de itens', () => {
    const p = pauta([
      card('Quase', { badges: { checkItems: 10, checkItemsChecked: 9 } }),
      card('Pronto', { badges: { checkItems: 10, checkItemsChecked: 10 } }),
      card('Pouco', { badges: { checkItems: 10, checkItemsChecked: 8 } }),
      card('Curto', { badges: { checkItems: 2, checkItemsChecked: 2 } })
    ]);
    expect(nomes(sec(p, 'Reconhecer'))).toEqual(['Quase']);
  });
  test('Riscos de nível alto vêm da descrição do card', () => {
    const desc = '#### ***RISCOS E PREMISSAS***\n- RISCO: Fornecedor atrasar | prob: alta | imp: alto | dono: Ana';
    const p = pauta([card('ComRisco', { desc })]);
    const s = sec(p, 'Riscos');
    expect(s.linhas[0].texto).toContain('ComRisco - Fornecedor atrasar');
    expect(s.linhas[0].texto).toContain('sem resposta');
  });
  test('Cadastro conta os projetos fora do padrão', () => {
    const p = pauta([card('A'), card('B')]);
    expect(sec(p, 'Cadastro').linhas[0].texto).toContain('2 projetos fora do padrão PMO');
  });
  test('Datas do varejo em risco: projeto crítico ou em atenção com fim até a data', () => {
    // Black Friday 27/11/2026 está a 11 dias; Natal (25/12) a 39 dias, ambos dentro de 45
    const p = pauta([
      card('Risco', { prazo: '2026-11-25T12:00:00.000Z', members: [] }),
      card('Tranquilo', { prazo: '2027-06-01T12:00:00.000Z' })
    ]);
    const s = sec(p, 'Datas do varejo');
    expect(s.linhas[0].texto).toContain('Black Friday (27/11, em 11 dias): 1 em risco - Risco');
    expect(s.linhas.some(l => l.texto.startsWith('Natal'))).toBe(true);
  });
  test('data do varejo fora da janela de 45 dias não entra', () => {
    const p = pauta([card('Risco', { prazo: '2026-11-25T12:00:00.000Z', members: [] })]);
    const s = sec(p, 'Datas do varejo');
    expect(s.linhas.some(l => l.texto.startsWith('Páscoa'))).toBe(false);
  });
  test('NOVA DEMANDA, concluídos e pausados ficam fora', () => {
    const p = pauta([
      card('Nova', { idList: 'l-new', members: [] }), card('Feito', { idList: 'l-ok', members: [] }),
      card('Pausa', { labels: [{ name: 'Pausado' }], members: [] })
    ]);
    expect(p.secoes).toEqual([]);
    expect(p.resumo).toBe('0 projetos ativos · 0 atrasados · 0 críticos');
  });
  test('limite de linhas por seção vira "e mais N"', () => {
    const muitos = Array.from({ length: 9 }, (_, i) => card('P' + i, { members: [] }));
    const s = sec(pauta(muitos), 'Destravar');
    expect(s.linhas).toHaveLength(config.pauta.limiteLista);
    expect(s.resto).toBe(3);
  });
  test('texto pronto para copiar: título, resumo, seções numeradas e rodapé', () => {
    const p = pauta([card('Vencido', { prazo: '2026-11-10T12:00:00.000Z' })]);
    expect(p.titulo).toBe('Pauta da reunião - PMO - Projetos da Área - 16/11');
    expect(p.texto.split('\n')[0]).toBe('PAUTA DA REUNIÃO - PMO - PROJETOS DA ÁREA - 16/11');
    expect(p.texto).toContain('1 projeto ativo · 1 atrasado · 1 crítico');
    expect(p.texto).toMatch(/\n1\) Prazo/);
    expect(p.texto).toContain('   - Vencido - vencido há 6 dias');
    expect(p.texto).toContain('Rascunho gerado só do Trello');
  });
  test('sem nada a tratar, a pauta diz isso', () => {
    const p = pauta([card('Ok', { badges: { checkItems: 4, checkItemsChecked: 1 } })]);
    // só o "Cadastro" (fora do padrão) pode aparecer; sem seções de decisão
    expect(sec(p, 'Decidir hoje')).toBeUndefined();
    expect(pauta([]).texto).toContain('Nada pedindo decisão nem ajuda agora');
  });
});
