const { montarItens } = require('../js/itens.js');
const { montarCalendario } = require('../js/calendario.js');
const { montarCapacidade } = require('../js/capacidade.js');
const { montarResumos } = require('../js/resumogestor.js');
const { montarTriagem } = require('../js/triagem.js');
const { config } = require('../js/config.js');

const AGORA = new Date('2026-11-16T15:00:00.000Z'); // segunda, 16/11/2026
const DEF = [
  { id: 'f-fim', name: 'Fim planejado', type: 'date' },
  { id: 'f-esf', name: 'Esforço estimado', type: 'list', options: [
    { id: 'e-a', value: { text: 'Alto' } }, { id: 'e-b', value: { text: 'Baixo' } }] },
  { id: 'f-imp', name: 'Impacto no negócio', type: 'list', options: [
    { id: 'i-a', value: { text: 'Alto' } }, { id: 'i-b', value: { text: 'Baixo' } }] },
  { id: 'f-area', name: 'Área solicitante', type: 'list', options: [{ id: 'a-c', value: { text: 'Comercial' } }] },
  { id: 'f-pri', name: 'Prioridade', type: 'list', options: [{ id: 'p-m', value: { text: 'Máxima' } }] }
];
const LISTAS = [
  { id: 'l-exe', name: 'Em Execução' }, { id: 'l-new', name: '➕ NOVA DEMANDA — Criar aqui' },
  { id: 'l-bk', name: 'Backlog de Projetos' }, { id: 'l-pri', name: 'Priorizados(prontos para iniciar)' }, { id: 'l-ok', name: 'Concluídos' }
];
const MEMBROS = [{ id: 'ana', fullName: 'ANA SOUZA' }, { id: 'beto', fullName: 'Beto Lima' }];
const dia = (n) => new Date(AGORA.getTime() + n * 86400000).toISOString();
const fim = (n) => ({ idCustomField: 'f-fim', value: { date: dia(n) } });

function card(name, over) {
  return Object.assign({
    id: name, name, url: 'u/' + name, idList: 'l-exe', due: null, dueComplete: false,
    idMembers: ['ana'], labels: [], dateLastActivity: dia(-1), desc: 'texto',
    customFieldItems: [fim(60)], badges: { checkItems: 4, checkItemsChecked: 1 }
  }, over);
}
const ctx = { agora: AGORA, camposDef: DEF, listas: LISTAS, membros: MEMBROS };
const itens = (cards) => montarItens(cards, ctx, config);

describe('montarCalendario', () => {
  test('novembro/2026: grade de semanas completas, hoje, feriado e Black Friday', () => {
    const r = montarCalendario(itens([card('A', { customFieldItems: [fim(11)] }), card('B', { customFieldItems: [fim(11)] })]), config, AGORA);
    expect(r.titulo).toBe('novembro de 2026');
    expect(r.semanas.every(s => s.length === 7)).toBe(true);
    expect(r.semanas).toHaveLength(5);
    const dias = r.semanas.reduce((a, s) => a.concat(s), []);
    expect(dias[0].dia).toBe(1);        // 1/11/2026 é domingo
    expect(dias.filter(d => d.hoje).map(d => d.dia)).toEqual([16]);
    expect(dias.find(d => d.dia === 20 && !d.foraDoMes).feriado).toBe(true);
    const bf = dias.find(d => d.dia === 27);
    expect(bf.marcos).toEqual(['Black Friday']);
    expect(bf.prazos.map(p => p.name)).toEqual(['A', 'B']);
    expect(r.totalPrazos).toBe(2);
    expect(dias.filter(d => d.fimDeSemana).length).toBe(10);
  });
  test('navegação entre meses e virada de ano; dias fora do mês marcados', () => {
    const jan = montarCalendario([], config, AGORA, 2027, 0);
    expect(jan.anterior).toEqual({ ano: 2026, mes: 11 });
    expect(jan.proximo).toEqual({ ano: 2027, mes: 1 });
    const dez = montarCalendario([], config, AGORA, 2026, 11);
    expect(dez.proximo).toEqual({ ano: 2027, mes: 0 });
    expect(dez.semanas[0].some(d => d.foraDoMes)).toBe(true);
    expect(montarCalendario([], config, AGORA, 2026, 0).anterior).toEqual({ ano: 2025, mes: 11 });
  });
  test('prazo fora do mês não conta; concluído e sem prazo não aparecem', () => {
    const r = montarCalendario(itens([
      card('Longe', { customFieldItems: [fim(60)] }), card('Sem', { customFieldItems: [] }), card('Feito', { idList: 'l-ok', customFieldItems: [fim(5)] })
    ]), config, AGORA);
    expect(r.totalPrazos).toBe(0);
  });
});

describe('montarCapacidade', () => {
  const alto = { idCustomField: 'f-esf', idValue: 'e-a' };
  test('soma pontos por mês, pico, atrasados, sem prazo e pessoas', () => {
    const cards = [];
    for (let k = 0; k < 5; k++) cards.push(card('Dez' + k, { customFieldItems: [fim(30), alto] }));   // 16/12 -> dezembro, 15 pts
    cards.push(card('Nov', { customFieldItems: [fim(5)], idMembers: ['beto'] }));
    cards.push(card('Atras', { customFieldItems: [fim(-2), alto] }));
    cards.push(card('Sem', { customFieldItems: [] }));
    cards.push(card('Feito', { idList: 'l-ok' }));
    const r = montarCapacidade(itens(cards), config, AGORA);
    expect(r.meses).toHaveLength(6);
    expect(r.meses[0].rotulo).toBe('nov/2026');
    expect([r.meses[0].projetos, r.meses[0].pontos, r.meses[0].pico]).toEqual([1, 2, false]);
    expect(r.meses[0].marcos).toContain('Black Friday');
    const dez = r.meses[1];
    expect([dez.rotulo, dez.projetos, dez.pontos, dez.pico, dez.criticos]).toEqual(['dez/2026', 5, 15, true, 0]);
    expect(dez.pessoas).toEqual([{ nome: 'ANA SOUZA', pontos: 15 }]);
    expect(dez.marcos).toEqual(expect.arrayContaining(['Natal', 'Réveillon']));
    expect(r.atrasados).toMatchObject({ projetos: 1, pontos: 3 });
    expect(r.semPrazo).toEqual({ projetos: 1, pontos: 2 });
    expect(r.picos).toBe(1);
    expect(r.maxPontos).toBe(15);
  });
  test('sem projetos: máximo é o limite; sem responsável agrupa; crítico conta', () => {
    expect(montarCapacidade([], config, AGORA).maxPontos).toBe(config.capacidade.pontosMesMax);
    const r = montarCapacidade(itens([card('O', { idMembers: [], customFieldItems: [fim(5)] })]), config, AGORA);
    expect(r.meses[0].pessoas[0].nome).toBe('Sem responsável');
    expect(r.meses[0].criticos).toBe(1);
  });
});

describe('montarResumos', () => {
  test('um texto por gestor com ações, prazos e cadastro; ordenados por críticos', () => {
    const r = montarResumos(itens([
      card('Vencida', { customFieldItems: [fim(-3)] }),
      card('Prox', { customFieldItems: [fim(5)] }),
      card('DoBeto', { idMembers: ['beto'] }),
      card('Orfao', { idMembers: [] })
    ]), config);
    expect(r.gestores.map(g => g.nome)).toEqual(['ANA SOUZA', 'Beto Lima']);
    const ana = r.gestores[0];
    expect(ana.texto).toContain('Olá, Ana!');
    expect(ana.texto).toContain('2 projetos ativos: 1 crítico');
    expect(ana.texto).toContain('* Vencida:');
    expect(ana.texto).toContain('* Prox - em 5d');
    expect(ana.texto).toContain('cadastro incompleto');
    expect(r.semResponsavel).toBe(1);
  });
  test('gestor sem pendências recebe agradecimento', () => {
    const it = itens([card('Ok')]);
    it[0].faltando = [];
    const r = montarResumos(it, config);
    expect(r.gestores[0].texto).toContain('Tudo em ordem');
  });
  test('sem projetos', () => {
    expect(montarResumos([], config)).toEqual({ gestores: [], semResponsavel: 0 });
  });
});

describe('montarTriagem', () => {
  const triagem = (cards) => montarTriagem(cards, ctx, config);
  test('só NOVA DEMANDA, Backlog e Priorizados; ignora modelos e instruções', () => {
    const r = triagem([
      card('Nova', { idList: 'l-new' }), card('Back', { idList: 'l-bk' }), card('Pri', { idList: 'l-pri' }),
      card('NOME DO PROJETO', { idList: 'l-new' }), card('LEIA ANTES DE CRIAR', { idList: 'l-new' }),
      card('Template', { idList: 'l-bk', isTemplate: true }), card('Exec'), card('Feito', { idList: 'l-ok' })
    ]);
    expect(r.demandas.map(d => d.name).sort()).toEqual(['Back', 'Nova', 'Pri']);
  });
  test('o que falta, descrição vazia, pronta e quadrante sugerido', () => {
    const completa = [fim(60), { idCustomField: 'f-area', idValue: 'a-c' }, { idCustomField: 'f-imp', idValue: 'i-a' },
      { idCustomField: 'f-esf', idValue: 'e-b' }, { idCustomField: 'f-pri', idValue: 'p-m' }];
    const r = triagem([
      card('Pronta', { idList: 'l-bk', customFieldItems: completa }),
      card('SemDesc', { idList: 'l-bk', customFieldItems: completa, desc: '  ' }),
      card('Vazia', { idList: 'l-bk', customFieldItems: [] })
    ]);
    const por = {}; r.demandas.forEach(d => { por[d.name] = d; });
    expect(por.Pronta.pronta).toBe(true);
    expect(por.Pronta.quadrante).toBe('Fazer primeiro');
    expect(por.SemDesc.pronta).toBe(false);
    expect(por.SemDesc.semDescricao).toBe(true);
    expect(por.Vazia.faltando).toEqual(config.triagem.campos);
    expect(por.Vazia.quadrante).toBeNull();
    expect(r.prontas).toBe(1);
    expect(r.demandas[0].name).toBe('Pronta');
  });
  test('espera longa e pausado nunca é pronta; ordena por espera', () => {
    const r = triagem([
      card('Nova', { idList: 'l-new', dateLastActivity: dia(-2) }),
      card('Velha', { idList: 'l-new', dateLastActivity: dia(-30) }),
      card('Pausa', { idList: 'l-pri', labels: [{ name: 'Pausado' }] })
    ]);
    expect(r.demandas.map(d => d.name)).toEqual(['Velha', 'Nova', 'Pausa']);
    expect(r.esperando).toBe(1);
    expect(r.demandas.find(d => d.name === 'Pausa').pausado).toBe(true);
    expect(r.demandas.find(d => d.name === 'Pausa').pronta).toBe(false);
    expect(triagem([card('SemData', { idList: 'l-bk', dateLastActivity: undefined })]).demandas[0].espera).toBeNull();
  });
});
