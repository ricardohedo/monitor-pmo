const { montarItens } = require('../js/itens.js');
const { montarRegras } = require('../js/regras.js');
const { montarMelancia } = require('../js/melancia.js');
const { montarEscalonamento, textoEscalonamento } = require('../js/escalonamento.js');
const { montarBoletim } = require('../js/boletim.js');
const { montarFichas } = require('../js/ficha.js');
const { montarResumos } = require('../js/resumogestor.js');
const { montarDiretoria } = require('../js/diretoria.js');
const { montarRelatorio } = require('../js/relatorio.js');
const { acoesDoItem, ACOES_PADRAO } = require('../js/atuar.js');
const { montarAlertas } = require('../js/alertas.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-12-10T15:00:00.000Z'); // quinta; Natal em 15 dias (fora da janela de 14 do varejo)
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [{ id: 'p-m', value: { text: 'Máxima' } }, { id: 'p-b', value: { text: 'Baixa' } }] },
  { id: 'f-urg', name: 'Urgente', type: 'list', options: [{ id: 'u-s', value: { text: 'Sim' } }] },
  { id: 'f-imp', name: 'Impacto no negócio', type: 'list', options: [{ id: 'i-a', value: { text: 'Alto' } }] },
  { id: 'f-esf', name: 'Esforço estimado', type: 'list', options: [{ id: 'e-b', value: { text: 'Baixo' } }] }
];
const LISTAS = [{ id: 'l-exe', name: 'Em Execução' }, { id: 'l-ok', name: 'Concluídos' }];
const MEMBROS = [{ id: 'ana', fullName: 'Ana Souza' }, { id: 'beto', fullName: 'Beto Lima' }];
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const fim = (n) => ({ idCustomField: 'f-fim', value: { date: dia(n) } });
const pri = (id) => ({ idCustomField: 'f-pri', idValue: id });

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(0), desc: 'texto',
    customFieldItems: [fim(60)], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const ctx = { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: MEMBROS };
const itens = (cards) => montarItens(cards, ctx, config);

describe('atuar: acoesDoItem e ACOES_PADRAO', () => {
  test('lista todas as ações do projeto, não só a primeira', () => {
    const i = itens([card('X', { customFieldItems: [fim(-3)], idMembers: [], labels: [{ name: 'Impedimento' }] })])[0];
    const chaves = acoesDoItem(i, config).map(a => a.chave);
    expect(chaves).toEqual(expect.arrayContaining(['atrasado', 'semResponsavel', 'impedimento']));
    expect(acoesDoItem(i, config)[0].fazer).toBe(ACOES_PADRAO.atrasado);
    expect(acoesDoItem(itens([card('Ok')])[0], config)).toEqual([]);
  });
});

describe('montarRegras', () => {
  test('regras com os números reais da configuração e os projetos que caem em cada uma', () => {
    const r = montarRegras(itens([
      card('Orfao', { idMembers: [] }), card('Vencido', { customFieldItems: [fim(-4)] }), card('Perto', { customFieldItems: [fim(2)] }),
      card('SemPrazo', { customFieldItems: [] }), card('Parado', { dateLastActivity: dia(-20) }),
      card('Travado', { labels: [{ name: 'Impedimento' }] }), card('Ok'), card('Feito', { idList: 'l-ok', idMembers: [] })
    ]), config);
    const por = {}; r.regras.forEach(x => { por[x.id] = x; });
    expect(r.regras.map(x => x.id)).toEqual(['semresp', 'vencido', 'proximo', 'semprazo', 'parado', 'ritmo', 'impedimento', 'cadastro']);
    expect(por.semresp.afetados.map(a => a.name)).toEqual(['Orfao']);
    expect(por.vencido.afetados.map(a => a.name)).toEqual(['Vencido']);
    expect(por.proximo.afetados.map(a => a.name)).toEqual(['Perto']);
    expect(por.semprazo.afetados.map(a => a.name)).toEqual(['SemPrazo']);
    expect(por.parado.afetados.map(a => a.name)).toEqual(['Parado']);
    expect(por.impedimento.afetados.map(a => a.name)).toEqual(['Travado']);
    expect(por.parado.regra).toContain('mais de ' + config.diasParado + ' dias');
    expect(por.proximo.regra).toContain(config.diasPrazoProximo + ' dias');
    expect(por.cadastro.regra).toContain('Área solicitante');
    expect(por.vencido.corrigir).toBe(ACOES_PADRAO.atrasado);
    expect(por.semresp.afetados[0].responsaveis).toBe('sem responsável');
    expect(r.totalAfetados).toBe(7);
    expect(r.ativos).toBe(7);
  });
});

describe('montarMelancia', () => {
  test('verde por fora com 2+ sinais escondidos; amarelo/vermelho ou verde limpo ficam de fora', () => {
    const limpo = [fim(60), pri('p-m'), { idCustomField: 'f-imp', idValue: 'i-a' }, { idCustomField: 'f-esf', idValue: 'e-b' }];
    const cards = [
      card('Melancia', { customFieldItems: [fim(60)], badges: {} }),                       // sem prioridade, sem impacto/esforço, sem checklist, cadastro incompleto
      card('Limpo', { customFieldItems: limpo }),
      card('Amarelo', { customFieldItems: [fim(2)] }),
      card('Um sinal só', { customFieldItems: [fim(60), { idCustomField: 'f-imp', idValue: 'i-a' }, { idCustomField: 'f-esf', idValue: 'e-b' }, pri('p-m')], badges: {} })
    ];
    const it = itens(cards);
    it.find(i => i.name === 'Um sinal só').faltando = [];   // cadastro completo: só resta "sem checklist"
    const r = montarMelancia(it, config);
    expect(r.itens.map(i => i.name)).toEqual(['Melancia']);
    expect(r.itens[0].sinais.length).toBeGreaterThanOrEqual(3);
    expect(r.itens[0].sinais.join(' | ')).toContain('Sem prioridade definida');
    expect(r.totalVerdes).toBe(3);
    expect(r.pct).toBe(33);
    expect(r.semDadosChecklist).toBe(true);
  });
  test('itens de checklist sem prazo e 0% com prazo próximo contam como sinais', () => {
    const c = card('C', { badges: { checkItems: 2, checkItemsChecked: 0 }, customFieldItems: [fim(20)], checklists: [{ name: 'P', checkItems: [{ state: 'incomplete', due: null }, { state: 'incomplete', due: null }] }] });
    const r = montarMelancia(itens([c]), config);
    expect(r.itens[0].sinais.join(' | ')).toContain('2 itens de checklist sem prazo');
    expect(r.itens[0].sinais.join(' | ')).toContain('0% da checklist com prazo em até 30 dias');
    expect(r.semDadosChecklist).toBe(false);
  });
  test('sem projetos verdes', () => {
    expect(montarMelancia([], config)).toEqual({ itens: [], totalVerdes: 0, pct: 0, semDadosChecklist: true });
  });
});

describe('montarEscalonamento', () => {
  const e = (cards, agora) => montarEscalonamento(itens(cards), config, agora || AGORA);
  test('gestor, PMO e diretoria por critérios objetivos', () => {
    const r = e([
      card('Leve', { customFieldItems: [fim(2)] }),                                                  // amarelo -> gestor
      card('Atraso10', { customFieldItems: [fim(-10)] }),                                            // crítico 10d -> PMO
      card('Orfao', { idMembers: [] }),                                                              // sem responsável -> PMO
      card('Travado', { labels: [{ name: 'Impedimento' }] }),                                        // impedimento -> PMO
      card('Atraso40', { customFieldItems: [fim(-40)] }),                                            // 40d -> diretoria
      card('PrioMax', { customFieldItems: [fim(-8), pri('p-m')] }),                                  // prioridade máxima 8d -> diretoria
      card('Urgente', { customFieldItems: [fim(-1), { idCustomField: 'f-urg', idValue: 'u-s' }] }),   // urgente e crítico -> diretoria
      card('Ok'), card('Feito', { idList: 'l-ok' })
    ]);
    expect(r.diretoria.map(x => x.name)).toEqual(['Atraso40', 'PrioMax', 'Urgente']);
    expect(r.pmo.map(x => x.name).sort()).toEqual(['Atraso10', 'Orfao', 'Travado']);
    expect(r.gestor.map(x => x.name)).toEqual(['Leve']);
    expect(r.contagem).toEqual({ diretoria: 3, pmo: 3, gestor: 1 });
    expect(r.diretoria[0].motivos[0]).toContain('atraso de 40 dias');
    expect(r.diretoria[1].motivos[0]).toContain('prioridade Máxima com 8 dias de atraso');
  });
  test('projeto em risco para uma data forte próxima sobe à diretoria', () => {
    const natal = new Date('2026-12-15T15:00:00.000Z');   // Natal em 10 dias
    const dia2 = (n) => new Date(natal.getTime() + n * 86400000).toISOString();
    const ctx2 = { agora: natal, camposDef: DEF, listas: LISTAS, membros: MEMBROS };
    const c = card('Ligado', { labels: [{ name: 'Natal' }], customFieldItems: [{ idCustomField: 'f-fim', value: { date: dia2(20) } }] });
    const r = montarEscalonamento(montarItens([c], ctx2, config), config, natal);
    expect(r.diretoria.map(x => x.name)).toEqual(['Ligado']);
    expect(r.diretoria[0].motivos[0]).toContain('em risco para Natal em 10 dias');
  });
  test('crítico parado há muito tempo sobe ao PMO; verde nunca escala', () => {
    const r = e([card('Parado', { customFieldItems: [fim(-1)], dateLastActivity: dia(-20) }), card('Verde')]);
    expect(r.pmo.map(x => x.name)).toEqual(['Parado']);
    expect(r.pmo[0].motivos.join(' ')).toContain('parado há 20 dias');
    expect(r.contagem.gestor).toBe(0);
  });
  test('ficha de escalonamento: problema, impacto, opções, recomendação e decisão pedida', () => {
    const r = e([card('Atraso40', { customFieldItems: [fim(-40), pri('p-m')] })]);
    const t = textoEscalonamento(r.diretoria[0], config, AGORA);
    expect(t).toContain('ESCALONAMENTO - Atraso40');
    expect(t).toContain('Problema: atraso de 40 dias');
    expect(t).toContain('Impacto: prazo vencido há 40 dias, prioridade Máxima, 25% da checklist feita.');
    expect(t).toContain('Opções (a preencher)');
    expect(t).toContain('Decisão solicitada: definir se o projeto segue, é replanejado ou é suspenso');
    const pmo = textoEscalonamento({ name: 'X', lista: 'L', responsaveis: [], motivos: ['impedimento declarado'], nivel: 'pmo', prazo: null, diasPrazo: null, diasAtraso: 0, prioridade: '', progresso: null }, config, AGORA);
    expect(pmo).toContain('sem prazo cadastrado');
    expect(pmo).toContain('confirmar responsável e novo prazo');
    expect(pmo).toContain('sem responsável');
  });
});

describe('montarBoletim', () => {
  test('nota por pessoa com fórmula aberta, faixa e o que derruba a nota', () => {
    const r = montarBoletim(itens([
      card('A1', { customFieldItems: [fim(-5)], dateLastActivity: dia(-20) }),
      card('A2', { customFieldItems: [] }),
      card('B1', { idMembers: ['beto'] }),
      card('Orfao', { idMembers: [] })
    ]), config);
    expect(r.gestores.map(g => g.nome)).toEqual(['Ana Souza', 'Beto Lima']);   // pior nota primeiro
    const ana = r.gestores[0], beto = r.gestores[1];
    expect(ana.projetos).toBe(2);
    expect(ana.dimensoes.map(d => d.id)).toEqual(['cadastro', 'prazo', 'movimento', 'saude']);
    expect(ana.dimensoes.find(d => d.id === 'prazo').pct).toBe(0);
    expect(ana.dimensoes.find(d => d.id === 'movimento').pct).toBe(50);
    expect(ana.faixa).toBe('critico');
    expect(ana.rotuloFaixa).toBe('Crítico');
    expect(ana.derrubam[0].name).toBe('A1');
    expect(ana.derrubam[0].motivos.join(' ')).toContain('prazo vencido há 5 dias');
    expect(beto.nota).toBeGreaterThan(ana.nota);
    expect(r.semDono).toBe(1);
    expect(r.pesos).toEqual(config.boletim.pesos);
    const soma = ana.dimensoes.reduce((s, d) => s + d.pontos, 0);
    expect(ana.nota).toBe(Math.round(soma));
  });
  test('nota máxima: projeto limpo; faixas noPadrao e atencao; sem projetos', () => {
    const limpo = [fim(60), pri('p-m'), { idCustomField: 'f-imp', idValue: 'i-a' }, { idCustomField: 'f-esf', idValue: 'e-b' }];
    const c = card('Perfeito', { customFieldItems: limpo });
    const it = itens([c]);
    it[0].aderencia = 100; it[0].faltando = [];
    const b = montarBoletim(it, config).gestores[0];
    expect(b.nota).toBe(100);
    expect(b.faixa).toBe('noPadrao');
    expect(b.derrubam).toEqual([]);
    const meio = itens([card('M', { customFieldItems: [fim(60)] })]);
    meio[0].aderencia = 0;   // perde os 30 pontos do cadastro: nota 70
    expect(montarBoletim(meio, config).gestores[0].nota).toBe(70);
    expect(montarBoletim(meio, config).gestores[0].faixa).toBe('atencao');
    const ruim = itens([card('R', { customFieldItems: [] })]); ruim[0].aderencia = 0;
    expect(montarBoletim(ruim, config).gestores[0].faixa).toBe('critico');
    expect(montarBoletim([], config)).toMatchObject({ gestores: [], semDono: 0 });
  });
});

describe('montarFichas', () => {
  test('ficha completa: saúde, prazo, cadastro que falta, riscos e ações; mais grave primeiro', () => {
    const desc = '#### ***RISCOS E PREMISSAS***\n- RISCO: fornecedor atrasar | prob: alta | imp: alto | dono: Ana | resposta: plano B | revisar: 2026-12-01';
    const cards = [card('Verde'), card('Grave', { customFieldItems: [fim(-3)], idMembers: [], desc })];
    const fichas = montarFichas(itens(cards), cards, config, AGORA);
    expect(fichas.map(f => f.name)).toEqual(['Grave', 'Verde']);
    const g = fichas[0];
    expect(g.cor).toBe('vermelho');
    expect(g.motivos.length).toBeGreaterThan(0);
    expect(g.acoes).toContain(ACOES_PADRAO.atrasado);
    expect(g.acoes.some(a => a.indexOf('Preencher o campo "Área solicitante"') === 0)).toBe(true);
    expect(g.acoes.some(a => a === 'Colocar um responsável no card')).toBe(true);
    expect(g.riscos).toHaveLength(1);
    expect(g.riscos[0]).toMatchObject({ tipo: 'risco', dono: 'Ana', resposta: 'plano B' });
    expect(g.diasPrazo).toBe(-3);
    expect(new Set(g.acoes).size).toBe(g.acoes.length);
  });
  test('sem card bruto ou sem descrição não quebra; concluído fica de fora', () => {
    const f = montarFichas(itens([card('A'), card('Feito', { idList: 'l-ok' })]), [], config, AGORA);
    expect(f.map(x => x.name)).toEqual(['A']);
    expect(f[0].riscos).toEqual([]);
    expect(montarFichas([], undefined, config, AGORA)).toEqual([]);
  });
});

describe('carta de ciência no resumo por gestor', () => {
  test('com agora: prazo combinado para corrigir e carimbo de data e hora', () => {
    const r = montarResumos(itens([card('Atras', { customFieldItems: [fim(-2)] })]), config, AGORA);
    const t = r.gestores[0].texto;
    expect(t).toContain('Combinado: corrigir o que está marcado acima até 13/12.');
    expect(t).toContain('Resumo gerado em 10/12/2026 às 12:00 a partir do Trello');
    expect(t).toContain('Guia do gestor > Regras e como corrigir');
  });
  test('sem agora (uso antigo) o texto não tem carimbo; sem pendência só agradece', () => {
    const sem = montarResumos(itens([card('Atras', { customFieldItems: [fim(-2)] })]), config);
    expect(sem.gestores[0].texto).not.toContain('Resumo gerado em');
    const it = itens([card('Ok')]); it[0].faltando = [];
    const ok = montarResumos(it, config, AGORA).gestores[0].texto;
    expect(ok).toContain('Tudo em ordem');
    expect(ok).not.toContain('Combinado');
    expect(ok).toContain('Resumo gerado em');
  });
});

describe('diretoria, relatório e alertas usam o escalonamento', () => {
  const cards = () => [card('Atraso40', { customFieldItems: [fim(-40)] }), card('Ok')];
  test('painel da diretoria lista as decisões necessárias', () => {
    const d = montarDiretoria(itens(cards()), config, AGORA);
    expect(d.totalDecisoes).toBe(1);
    expect(d.decisoes[0]).toContain('Atraso40: atraso de 40 dias');
    expect(montarDiretoria(itens([card('Ok')]), config, AGORA).decisoes).toEqual([]);
  });
  test('relatório executivo ganha a seção "Decisões necessárias da diretoria"', () => {
    const r = montarRelatorio(itens(cards()), config, AGORA, 'PMO');
    const s = r.secoes.find(x => x.titulo === 'Decisões necessárias da diretoria');
    expect(s.linhas[0]).toContain('Atraso40: atraso de 40 dias');
    expect(r.texto).toContain('Decisões necessárias da diretoria');
    expect(montarRelatorio(itens([card('Ok')]), config, AGORA).secoes.map(x => x.titulo)).not.toContain('Decisões necessárias da diretoria');
  });
  test('muitas decisões: corta e resume o resto', () => {
    const muitas = []; for (let k = 0; k < 9; k++) muitas.push(card('D' + k, { customFieldItems: [fim(-40 - k)] }));
    const s = montarRelatorio(itens(muitas), config, AGORA).secoes.find(x => x.titulo === 'Decisões necessárias da diretoria');
    expect(s.linhas[s.linhas.length - 1]).toBe('... e mais 3.');
  });
  test('alerta quando um projeto acaba de subir para a diretoria (e só uma vez)', () => {
    const dados = (cs) => ({ itens: itens(cs), cards: cs, ctx });
    const base = montarAlertas(dados([card('Ok')]), config, AGORA, {}).estado;
    const r = montarAlertas(dados(cards()), config, AGORA, base);
    const a = r.alertas.find(x => x.id === 'escalonamento');
    expect(a.titulo).toBe('1 projeto subiu para decisão da diretoria');
    expect(a.linhas[0]).toContain('Atraso40 (Ana Souza): atraso de 40 dias');
    expect(montarAlertas(dados(cards()), config, AGORA, r.estado).alertas.map(x => x.id)).not.toContain('escalonamento');
  });
});
