/* Monitor PMO - mapa de calor pessoa x fase: onde cada pessoa concentra projetos e
   onde estão os críticos. Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var SEM = 'Sem responsável';
  var GRAVE = { vermelho: 3, amarelo: 2, verde: 1 };

  /* montarMapa(itens, ordemListas) -> { colunas, linhas: [{ nome, semDono, celulas, total, criticos }], totais } */
  function montarMapa(itens, ordemListas) {
    var ativos = itens.filter(function (i) { return i.ativo; });
    var ordem = ordemListas || [];
    var colunas = [];
    ativos.forEach(function (i) { if (colunas.indexOf(i.lista) === -1) colunas.push(i.lista); });
    colunas.sort(function (a, b) {
      var x = ordem.indexOf(a), y = ordem.indexOf(b);
      return (x === -1 ? 999 : x) - (y === -1 ? 999 : y) || a.localeCompare(b);
    });

    var pessoas = {};
    ativos.forEach(function (i) {
      (i.responsaveis.length ? i.responsaveis : [SEM]).forEach(function (nome) {
        var p = pessoas[nome] || (pessoas[nome] = { nome: nome, semDono: nome === SEM, mapa: {}, total: 0, criticos: 0 });
        var c = p.mapa[i.lista] || (p.mapa[i.lista] = { n: 0, cor: 'verde', itens: [] });
        c.n++; c.itens.push({ id: i.id, name: i.name, cor: i.cor });
        if (GRAVE[i.cor] > GRAVE[c.cor]) c.cor = i.cor;
        p.total++;
        if (i.cor === 'vermelho') p.criticos++;
      });
    });

    var linhas = Object.keys(pessoas).map(function (k) {
      var p = pessoas[k];
      return {
        nome: p.nome, semDono: p.semDono, total: p.total, criticos: p.criticos,
        celulas: colunas.map(function (c) { return p.mapa[c] || { n: 0, cor: null, itens: [] }; })
      };
    }).sort(function (a, b) {
      return (a.semDono ? 1 : 0) - (b.semDono ? 1 : 0) || b.total - a.total || a.nome.localeCompare(b.nome);
    });

    var totais = colunas.map(function (c) {
      return ativos.filter(function (i) { return i.lista === c; }).length;
    });
    return { colunas: colunas, linhas: linhas, totais: totais };
  }

  return { montarMapa: montarMapa };
});
