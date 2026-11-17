/* Monitor PMO - prioridades em risco: os projetos de prioridade máxima/alta (e os
   urgentes) que não estão em dia, e quantos projetos nem têm prioridade definida.
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var ORDEM = { vermelho: 0, amarelo: 1, verde: 2 };

  function info(i) {
    return { id: i.id, name: i.name, lista: i.lista, cor: i.cor, motivos: i.s.motivos, responsaveis: i.responsaveis,
      diasPrazo: i.diasPrazo, urgente: i.urgente };
  }
  function ordenar(a, b) {
    return ORDEM[a.cor] - ORDEM[b.cor] || (a.diasPrazo === null ? 9999 : a.diasPrazo) - (b.diasPrazo === null ? 9999 : b.diasPrazo) || a.name.localeCompare(b.name);
  }

  /* montarPrioridades(itens, config)
     -> { grupos: [{ nivel, rotulo, total, emRisco, itens }], urgentes, semPrioridade, ativos } */
  function montarPrioridades(itens, config) {
    var pc = config.prioridades;
    var ativos = itens.filter(function (i) { return i.ativo; });

    var grupos = pc.niveis.map(function (nivel) {
      var doNivel = ativos.filter(function (i) { return i.prioridade === nivel; }).map(info).sort(ordenar);
      return {
        nivel: nivel, rotulo: pc.rotulos[nivel] || nivel, total: doNivel.length,
        emRisco: doNivel.filter(function (i) { return i.cor !== 'verde'; }).length, itens: doNivel
      };
    });
    var urgentes = ativos.filter(function (i) { return i.urgente; }).map(info).sort(ordenar);
    return {
      grupos: grupos, urgentes: urgentes, ativos: ativos.length,
      semPrioridade: ativos.filter(function (i) { return !i.prioridade; }).length
    };
  }

  return { montarPrioridades: montarPrioridades };
});
