const R = require('../js/riscos.js');
const { config } = require('../js/config.js');

const cfg = config.riscos;
const AGORA = new Date('2026-11-16T15:00:00.000Z'); // 16/11/2026 em Brasília
const SECAO = '#### ***RISCOS E PREMISSAS***\n';

describe('dataValida', () => {
  test('aceita AAAA-MM-DD e DD/MM/AAAA', () => {
    expect(R.dataValida('2026-12-10')).toBe('2026-12-10');
    expect(R.dataValida('10/12/2026')).toBe('2026-12-10');
  });
  test('recusa datas impossíveis e texto', () => {
    expect(R.dataValida('2026-02-30')).toBeNull();
    expect(R.dataValida('31/04/2026')).toBeNull();
    expect(R.dataValida('amanhã')).toBeNull();
    expect(R.dataValida('')).toBeNull();
  });
});

describe('parseRiscos', () => {
  test('lê risco completo', () => {
    const r = R.parseRiscos(SECAO + '- RISCO: Fornecedor atrasar | prob: alta | imp: alto | dono: Ana | resposta: Plano B | revisar: 2026-12-10', cfg);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ tipo: 'risco', texto: 'Fornecedor atrasar', prob: 3, imp: 3, dono: 'Ana', resposta: 'Plano B', revisar: '2026-12-10', avisos: [] });
  });
  test('lê premissa', () => {
    const r = R.parseRiscos(SECAO + '- PREMISSA: Lojas terão acesso até 01/12 | dono: Beto | revisar: 20/11/2026', cfg);
    expect(r[0]).toMatchObject({ tipo: 'premissa', texto: 'Lojas terão acesso até 01/12', dono: 'Beto', revisar: '2026-11-20' });
  });
  test('linha sem prefixo é um risco; aceita acento, caixa e números como nível', () => {
    const r = R.parseRiscos(SECAO + 'Perda de dados | PROB: Média | Impacto: 3', cfg);
    expect(r[0]).toMatchObject({ tipo: 'risco', prob: 2, imp: 3 });
  });
  test('várias linhas, com marcadores diferentes', () => {
    const r = R.parseRiscos(SECAO + '- RISCO: A | prob: baixa | imp: baixo\n* RISCO: B | prob: alta | imp: alta\n1. PREMISSA: C', cfg);
    expect(r.map(x => x.texto)).toEqual(['A', 'B', 'C']);
  });
  test('ignora o que está fora da seção', () => {
    const d = '#### ***OBJETIVO***\n- RISCO: não conta\n' + SECAO + '- RISCO: conta | prob: alta\n#### ***ESCOPO***\n- RISCO: também não';
    expect(R.parseRiscos(d, cfg).map(x => x.texto)).toEqual(['conta']);
  });
  test('"RISCOS" ou "PREMISSAS" sozinhos como título também valem', () => {
    expect(R.parseRiscos('RISCOS\n- RISCO: X', cfg)).toHaveLength(1);
    expect(R.parseRiscos('**Premissas**\n- PREMISSA: Y', cfg)).toHaveLength(1);
  });
  test('avisos para campo, nível, data e trecho inválidos', () => {
    const r = R.parseRiscos(SECAO + '- RISCO: Z | cor: azul | prob: enorme | revisar: 31/02/2026 | solto', cfg)[0];
    expect(r.avisos.join(' ')).toMatch(/campo "cor" não reconhecido/);
    expect(r.avisos.join(' ')).toMatch(/nível "enorme" não reconhecido/);
    expect(r.avisos.join(' ')).toMatch(/data "31\/02\/2026" inválida/);
    expect(r.avisos.join(' ')).toMatch(/trecho sem "campo: valor"/);
    expect(r.prob).toBeNull();
    expect(r.revisar).toBeNull();
  });
  test('texto longo é cortado', () => {
    const r = R.parseRiscos(SECAO + '- RISCO: ' + 'a'.repeat(300), cfg)[0];
    expect(r.texto.length).toBe(cfg.maxTexto);
  });
  test('nomes de campo como "constructor" não quebram', () => {
    const r = R.parseRiscos(SECAO + '- RISCO: W | constructor: x | toString: y', cfg)[0];
    expect(r.avisos).toHaveLength(2);
  });
  test('descrição vazia ou nula', () => {
    expect(R.parseRiscos('', cfg)).toEqual([]);
    expect(R.parseRiscos(null, cfg)).toEqual([]);
  });
  test('linha só com o prefixo e sem texto é ignorada', () => {
    expect(R.parseRiscos(SECAO + '- RISCO:', cfg)).toEqual([]);
  });
});

describe('riscosDoCard / níveis e pendências', () => {
  const avalia = (linha) => R.riscosDoCard(SECAO + linha, config, AGORA)[0];
  test('score e nível: alta x alto = 9 (alto), média x média = 4 (médio), baixa x baixo = 1 (baixo)', () => {
    expect(avalia('- RISCO: a | prob: alta | imp: alto | dono: x | resposta: y')).toMatchObject({ score: 9, nivel: 'alto', flags: [] });
    expect(avalia('- RISCO: a | prob: media | imp: media | dono: x | resposta: y')).toMatchObject({ score: 4, nivel: 'medio' });
    expect(avalia('- RISCO: a | prob: baixa | imp: baixo | dono: x')).toMatchObject({ score: 1, nivel: 'baixo' });
  });
  test('limites: 6 é alto e 3 é médio', () => {
    expect(avalia('- RISCO: a | prob: alta | imp: media | dono: x | resposta: y').nivel).toBe('alto');
    expect(avalia('- RISCO: a | prob: alta | imp: baixa | dono: x | resposta: y').nivel).toBe('medio');
  });
  test('sem probabilidade ou impacto fica indefinido e pendente', () => {
    const r = avalia('- RISCO: a | prob: alta | dono: x');
    expect(r.nivel).toBe('indefinido');
    expect(r.flags).toContain('falta probabilidade ou impacto');
  });
  test('médio ou alto sem resposta é pendência; baixo sem resposta não é', () => {
    expect(avalia('- RISCO: a | prob: alta | imp: alto | dono: x').flags).toContain('sem resposta');
    expect(avalia('- RISCO: a | prob: baixa | imp: baixo | dono: x').flags).not.toContain('sem resposta');
  });
  test('sem dono é pendência, inclusive em premissa', () => {
    expect(avalia('- PREMISSA: a').flags).toEqual(['sem dono']);
  });
  test('revisão vencida só quando a data já passou (hoje não vence)', () => {
    expect(avalia('- PREMISSA: a | dono: x | revisar: 2026-11-15').flags).toContain('revisão vencida');
    expect(avalia('- PREMISSA: a | dono: x | revisar: 2026-11-16').flags).not.toContain('revisão vencida');
    expect(avalia('- PREMISSA: a | dono: x | revisar: 2026-11-17').flags).toEqual([]);
  });
  test('ordena do mais grave para o menos grave', () => {
    const d = SECAO + '- RISCO: baixo | prob: baixa | imp: baixo | dono: x\n- RISCO: alto | prob: alta | imp: alto | dono: x | resposta: y';
    expect(R.riscosDoCard(d, config, AGORA).map(r => r.texto)).toEqual(['alto', 'baixo']);
  });
});

describe('registroDeRiscos', () => {
  const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' }, { id: 'l-ok', name: 'Concluídos' }];
  const card = (name, desc, over) => Object.assign({
    id: name, name, url: 'u', desc, idList: 'l-exe', due: '2027-06-01T12:00:00.000Z', dueComplete: false,
    members: [{ id: 'm' }], labels: [], dateLastActivity: '2026-11-15T15:00:00.000Z', customFieldItems: [], badges: {}
  }, over);
  const reg = (cards) => R.registroDeRiscos(cards, { agora: AGORA, camposDef: [], listas: LISTAS }, config);

  const cards = [
    card('A', SECAO + '- RISCO: grave | prob: alta | imp: alto | dono: Ana | resposta: Plano B | revisar: 2026-12-01\n- PREMISSA: acesso | dono: Ana'),
    card('B', SECAO + '- RISCO: sem plano | prob: media | imp: alta\n- RISCO: ruim | prob: x | imp: alta'),
    card('C', 'sem seção de riscos'),
    card('Feito', SECAO + '- RISCO: não conta', { idList: 'l-ok' }),
    card('Nova', SECAO + '- RISCO: não conta', { idList: 'l-new' }),
    card('Pausa', SECAO + '- RISCO: não conta', { labels: [{ name: 'Pausado' }] })
  ];
  const r = reg(cards);

  test('conta só projetos ativos', () => {
    expect(r.ativos).toBe(3);
    expect(r.comRegistro).toBe(2);
    expect(r.riscos).toBe(3);
    expect(r.premissas).toBe(1);
  });
  test('níveis, matriz e pendências', () => {
    expect(r.porNivel).toEqual({ alto: 2, medio: 0, baixo: 0, indefinido: 1 });
    expect(r.matriz[2][2]).toBe(1);      // alta x alto
    expect(r.matriz[1][2]).toBe(1);      // média x alta
    expect(r.matriz.flat().reduce((a, b) => a + b, 0)).toBe(2); // o indefinido fica fora da matriz
    expect(r.semDono).toBe(2);
    expect(r.semResposta).toBe(1);
    expect(r.incompletos).toBe(1);
    expect(r.revisaoVencida).toBe(0);
  });
  test('lista de atenção traz altos e com pendência, do pior ao menos pior', () => {
    expect(r.atencaoTotal).toBe(3);
    expect(r.atencao[0].texto).toBe('grave');
    expect(r.atencao.every(x => x.projeto)).toBe(true);
  });
  test('projetos sem registro são listados', () => {
    expect(r.semRegistroTotal).toBe(1);
    expect(r.semRegistro[0].nome).toBe('C');
  });
  test('linhas mal escritas viram aviso com o projeto', () => {
    expect(r.avisosTotal).toBe(1);
    expect(r.comAviso[0].projeto).toBe('B');
    expect(r.comAviso[0].avisos[0]).toMatch(/nível "x"/);
  });
  test('limita os itens listados ao máximo da configuração', () => {
    const muitos = Array.from({ length: 15 }, (_, i) => card('P' + String(i).padStart(2, '0'), 'nada'));
    const x = reg(muitos);
    expect(x.semRegistro).toHaveLength(config.riscos.maxItens);
    expect(x.semRegistroTotal).toBe(15);
  });
  test('board vazio não quebra', () => {
    const x = reg([]);
    expect(x.ativos).toBe(0);
    expect(x.riscos).toBe(0);
  });
  test('modelo copiável usa a seção configurada', () => {
    expect(R.MODELO_RISCOS).toContain('RISCOS E PREMISSAS');
    expect(R.parseRiscos(R.MODELO_RISCOS, cfg)).toHaveLength(2);
  });
});
