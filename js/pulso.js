/* Monitor PMO - pulso do quadro: quais projetos foram mexidos recentemente e quais
   estão em silêncio, por faixa de tempo e por pessoa. Funções puras, somente leitura.
   "Movimento" = última atividade do card no Trello. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var SEM = 'Sem responsável';

  /* montarPulso(itens, config) -> { grupos, movimentados, parados, semDados, porPessoa, total } */
  function montarPulso(itens, config) {
    var lim = config.pulso.diasMovimento;
    var ativos = itens.filter(function (i) { return i.ativo; });
    var comData = ativos.filter(function (i) { return i.parado !== null; });

    var defs = [
      { id: 'hoje', titulo: 'Hoje', ok: function (d) { return d === 0; } },
      { id: 'ontem', titulo: 'Ontem', ok: function (d) { return d === 1; } },
      { id: 'semana', titulo: 'Nos últimos ' + lim + ' dias', ok: function (d) { return d >= 2 && d <= lim; } },
      { id: 'parado', titulo: 'Em silêncio (mais de ' + lim + ' dias)', ok: function (d) { return d > lim && d <= 14; } },
      { id: 'muito', titulo: 'Em silêncio há mais de 14 dias', ok: function (d) { return d > 14; } }
    ];
    var grupos = defs.map(function (g) {
      var lista = comData.filter(function (i) { return g.ok(i.parado); })
        .sort(function (a, b) { return a.parado - b.parado || a.name.localeCompare(b.name); })
        .map(function (i) { return { id: i.id, name: i.name, lista: i.lista, parado: i.parado, responsaveis: i.responsaveis, cor: i.cor }; });
      return { id: g.id, titulo: g.titulo, itens: lista };
    }).filter(function (g) { return g.itens.length; });

    var pessoas = {};
    comData.forEach(function (i) {
      (i.responsaveis.length ? i.responsaveis : [SEM]).forEach(function (nome) {
        var p = pessoas[nome] || (pessoas[nome] = { nome: nome, semDono: nome === SEM, projetos: 0, soma: 0, maisParado: null, parados: 0 });
        p.projetos++; p.soma += i.parado;
        if (i.parado > lim) p.parados++;
        if (!p.maisParado || i.parado > p.maisParado.dias) p.maisParado = { id: i.id, name: i.name, dias: i.parado };
      });
    });
    var porPessoa = Object.keys(pessoas).map(function (k) {
      var p = pessoas[k]; p.paradoMedio = Math.round(p.soma / p.projetos); return p;
    }).sort(function (a, b) {
      return (a.semDono ? 1 : 0) - (b.semDono ? 1 : 0) || b.paradoMedio - a.paradoMedio || a.nome.localeCompare(b.nome);
    });

    return {
      grupos: grupos, total: ativos.length, semDados: ativos.length - comData.length,
      movimentados: comData.filter(function (i) { return i.parado <= lim; }).length,
      parados: comData.filter(function (i) { return i.parado > lim; }).length,
      porPessoa: porPessoa
    };
  }

  return { montarPulso: montarPulso };
});
