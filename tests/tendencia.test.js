const T = require('../js/tendencia.js');

const p = (dia, v, a, g, c) => ({ dia, v, a, g, c: c || 0 });

describe('dia', () => {
  test('número do dia respeita o fuso de Brasília', () => {
    expect(T.diaNumero(new Date('2026-11-16T15:00:00.000Z'), -3)).toBe(T.diaNumero(new Date('2026-11-16T05:00:00.000Z'), -3));
    // 01h UTC do dia 17 ainda é dia 16 em Brasília (22h)
    expect(T.diaNumero(new Date('2026-11-17T01:00:00.000Z'), -3)).toBe(T.diaNumero(new Date('2026-11-16T12:00:00.000Z'), -3));
    // 03h UTC do dia 17 já é dia 17 (00h em Brasília)
    expect(T.diaNumero(new Date('2026-11-17T03:00:00.000Z'), -3)).toBe(T.diaNumero(new Date('2026-11-16T12:00:00.000Z'), -3) + 1);
  });
  test('converte o número do dia em data ISO', () => {
    expect(T.diaParaISO(T.diaNumero(new Date('2026-11-16T15:00:00.000Z'), -3))).toBe('2026-11-16');
  });
});

describe('codificar e decodificar', () => {
  test('ida e volta', () => {
    const serie = [p(20000, 14, 2, 2, 4), p(20001, 10, 3, 5, 4)];
    expect(T.decodificar(T.codificar(serie))).toEqual(serie);
  });
  test('formato compacto', () => {
    expect(T.codificar([p(20000, 14, 2, 2, 4)])).toMatch(/^[0-9a-z]+\.14\.2\.2\.4$/);
  });
  test('ignora pedaços inválidos e ordena por dia', () => {
    const txt = 'lixo;' + T.codificar([p(20002, 1, 1, 1, 1)]) + ';a.b;' + T.codificar([p(20001, 2, 2, 2, 2)]) + ';x.-1.2.3.4';
    expect(T.decodificar(txt).map(x => x.dia)).toEqual([20001, 20002]);
  });
  test('texto vazio ou nulo', () => {
    expect(T.decodificar('')).toEqual([]);
    expect(T.decodificar(null)).toEqual([]);
  });
});

describe('registrar', () => {
  test('acrescenta e mantém a ordem', () => {
    const s = T.registrar([p(20002, 1, 1, 1)], p(20001, 2, 2, 2));
    expect(s.map(x => x.dia)).toEqual([20001, 20002]);
  });
  test('o mesmo dia é atualizado, não duplicado', () => {
    const s = T.registrar([p(20001, 5, 5, 5)], p(20001, 1, 2, 3));
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ v: 1, a: 2, g: 3 });
  });
  test('respeita o limite de caracteres descartando os mais antigos', () => {
    let s = [];
    for (let d = 20000; d < 20000 + 500; d++) s = T.registrar(s, p(d, 14, 2, 2, 4));
    expect(T.codificar(s).length).toBeLessThanOrEqual(T.LIMITE_CARACTERES);
    expect(s[s.length - 1].dia).toBe(20000 + 499);   // o mais novo fica
    expect(s[0].dia).toBeGreaterThan(20000);          // o mais antigo saiu
    expect(s.length).toBeGreaterThan(150);            // cabem mais de 5 meses
  });
});

describe('variação', () => {
  const serie = [p(100, 10, 5, 5), p(107, 8, 5, 7), p(130, 4, 4, 12), p(137, 2, 3, 15)];
  test('compara com o ponto mais próximo de N dias atrás, sem usar o futuro', () => {
    const v7 = T.variacao(serie, 7);
    expect(v7.dias).toBe(7);
    expect(T.pctEmDia(serie[3])).toBe(75);
    expect(T.pctEmDia(serie[2])).toBe(60);
    expect(v7.deltaEmDia).toBe(15);
    expect(v7.deltaCriticos).toBe(-2);
  });
  test('30 dias usa o ponto mais recente que seja no máximo 30 dias antes', () => {
    const v30 = T.variacao(serie, 30);
    expect(v30.dias).toBe(30);           // ponto do dia 107
    expect(v30.deltaCriticos).toBe(2 - 8);
  });
  test('sem ponto antigo o bastante, não calcula', () => {
    expect(T.variacao([p(100, 1, 1, 1), p(103, 1, 1, 1)], 7)).toBeNull();
    expect(T.variacao([p(100, 1, 1, 1)], 7)).toBeNull();
    expect(T.variacao([], 7)).toBeNull();
  });
  test('sem projetos ativos o percentual é nulo', () => {
    expect(T.pctEmDia(p(1, 0, 0, 0, 3))).toBeNull();
    expect(T.variacao([p(100, 0, 0, 0), p(110, 0, 0, 0)], 7).deltaEmDia).toBeNull();
  });
});

describe('resumoTendencia', () => {
  test('sem histórico e com um registro', () => {
    expect(T.resumoTendencia([])[0]).toMatch(/Ainda não há histórico/);
    expect(T.resumoTendencia([p(1, 1, 1, 1)])[0]).toMatch(/Primeiro registro/);
  });
  test('melhora em 7 dias', () => {
    const f = T.resumoTendencia([p(100, 10, 5, 5), p(107, 8, 5, 12)]);
    expect(f[0]).toBe('Em 7 dias: +23 pontos de projetos em dia, -2 críticos.');
  });
  test('piora e singular', () => {
    const f = T.resumoTendencia([p(100, 2, 2, 6), p(107, 3, 2, 5)]);
    expect(f[0]).toBe('Em 7 dias: -10 pontos de projetos em dia, +1 crítico.');
  });
  test('estável', () => {
    const f = T.resumoTendencia([p(100, 2, 2, 6), p(107, 2, 2, 6)]);
    expect(f[0]).toBe('Em 7 dias: projetos em dia estável, críticos sem mudança.');
  });
  test('histórico curto avisa', () => {
    expect(T.resumoTendencia([p(100, 1, 1, 1), p(102, 1, 1, 1)])[0]).toMatch(/Histórico ainda curto \(2 registros\)/);
  });
  test('inclui a comparação de 30 dias quando existe', () => {
    const f = T.resumoTendencia([p(100, 10, 5, 5), p(107, 8, 5, 7), p(130, 4, 4, 12), p(137, 2, 3, 15)]);
    expect(f).toHaveLength(2);
    expect(f[1]).toMatch(/^Em 30 dias:/);
  });
});
