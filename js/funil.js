/* Monitor PMO - funil por lista: quantos projetos há em cada fase, quão saudáveis e
   há quanto tempo estão sem movimento (onde o fluxo trava). Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {

  function rotuloFaixa(ini, fim) {
    return fim === Infinity ? 'mais de ' + (ini - 1) + ' dias' : ini === fim ? ini + ' dia' + (ini === 1 ? '' : 's') : ini + ' a ' + fim + ' dias';
  }

  /* montarFunil(itens, config, ordemListas) - ordemListas: nomes das listas na ordem do board.
     -> { listas, faixas, totalAtivos, gargalo } */
  function montarFunil(itens, config, ordemListas) {
    var limites = config.funil.faixas;
    var faixas = [];
    var ini = 0;
    limites.concat([Infinity]).forEach(function (fim) {
      faixas.push({ ini: ini, fim: fim, rotulo: rotuloFaixa(ini, fim), n: 0 });
      ini = fim + 1;
    });

    var mapa = {};
    itens.forEach(function (i) {
      var l = mapa[i.lista] || (mapa[i.lista] = {
        nome: i.lista, total: 0, ativos: 0, vermelho: 0, amarelo: 0, verde: 0, somaParado: 0, comData: 0,
        maisParado: null, faixas: faixas.map(function () { return 0; })
      });
      l.total++;
      if (!i.ativo) return;
      l.ativos++; l[i.cor]++;
      if (i.parado !== null) {
        l.somaParado += i.parado; l.comData++;
        if (!l.maisParado || i.parado > l.maisParado.dias) l.maisParado = { id: i.id, name: i.name, dias: i.parado };
        for (var k = 0; k < faixas.length; k++) {
          if (i.parado >= faixas[k].ini && i.parado <= faixas[k].fim) { l.faixas[k]++; faixas[k].n++; break; }
        }
      }
    });

    var ordem = ordemListas || [];
    var listas = Object.keys(mapa).map(function (k) {
      var l = mapa[k];
      l.paradoMedio = l.comData ? Math.round(l.somaParado / l.comData) : null;
      l.pctProblema = l.ativos ? Math.round((l.vermelho + l.amarelo) / l.ativos * 100) : 0;
      return l;
    }).sort(function (a, b) {
      var x = ordem.indexOf(a.nome), y = ordem.indexOf(b.nome);
      return (x === -1 ? 999 : x) - (y === -1 ? 999 : y) || a.nome.localeCompare(b.nome);
    });

    var candidatas = listas.filter(function (l) { return l.ativos >= 2; });
    var gargalo = candidatas.slice().sort(function (a, b) {
      return b.pctProblema - a.pctProblema || (b.paradoMedio || 0) - (a.paradoMedio || 0);
    })[0] || null;
    return {
      listas: listas, faixas: faixas, gargalo: gargalo && gargalo.pctProblema > 0 ? gargalo : null,
      totalAtivos: listas.reduce(function (s, l) { return s + l.ativos; }, 0)
    };
  }

  return { montarFunil: montarFunil };
});
