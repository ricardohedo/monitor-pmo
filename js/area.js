/* Monitor PMO - resumo por área solicitante (Comercial, Operações, T.I....).
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var SEM = 'Sem área definida';

  /* montarAreas(itens) -> { linhas, total } */
  function montarAreas(itens) {
    var mapa = {};
    itens.filter(function (i) { return i.ativo; }).forEach(function (i) {
      var nome = i.area || SEM;
      var a = mapa[nome] || (mapa[nome] = {
        nome: nome, semArea: nome === SEM, ativos: 0, vermelho: 0, amarelo: 0, verde: 0,
        atrasados: 0, semPrazo: 0, semResponsavel: 0, somaAderencia: 0, piores: []
      });
      a.ativos++;
      a[i.cor]++;
      if (i.diasPrazo === null) a.semPrazo++;
      else if (i.diasPrazo < 0) a.atrasados++;
      if (!i.ids.length) a.semResponsavel++;
      a.somaAderencia += i.aderencia;
      if (i.cor === 'vermelho') a.piores.push({ id: i.id, name: i.name, diasPrazo: i.diasPrazo });
    });
    var linhas = Object.keys(mapa).map(function (k) {
      var a = mapa[k];
      a.aderencia = Math.round(a.somaAderencia / a.ativos);
      a.semaforo = a.vermelho ? 'vermelho' : a.amarelo ? 'amarelo' : 'verde';
      a.piores.sort(function (x, y) {
        return (x.diasPrazo === null ? 9999 : x.diasPrazo) - (y.diasPrazo === null ? 9999 : y.diasPrazo);
      });
      a.piores = a.piores.slice(0, 5);
      return a;
    }).sort(function (a, b) {
      return (a.semArea ? 1 : 0) - (b.semArea ? 1 : 0) || b.vermelho - a.vermelho || b.ativos - a.ativos || a.nome.localeCompare(b.nome);
    });
    return { linhas: linhas, total: linhas.reduce(function (s, a) { return s + a.ativos; }, 0) };
  }

  return { montarAreas: montarAreas };
});
