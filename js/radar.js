/* Monitor PMO - radar: o que vai virar alerta nos próximos dias se ninguém mexer.
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {

  /* montarRadar(itens, config) -> { janela, total, grupos: [{dias, linhas}], porTipo, viramCriticos } */
  function montarRadar(itens, config) {
    var janela = config.radar.dias;
    var linhas = [];
    itens.forEach(function (i) {
      if (!i.ativo) return;
      function add(dias, tipo, texto) {
        if (dias >= 1 && dias <= janela) linhas.push({ dias: dias, tipo: tipo, texto: texto, item: i });
      }
      if (i.diasPrazo !== null && i.diasPrazo >= 0) {
        if (i.cor !== 'vermelho') add(i.diasPrazo + 1, 'critico', 'Prazo vence e o projeto fica crítico (vencido)');
        if (i.cor === 'verde') add(i.diasPrazo - config.diasPrazoProximo, 'atencao', 'Entra na janela de prazo próximo (atenção)');
      }
      if (i.parado !== null && i.parado <= config.diasParado) {
        add(config.diasParado + 1 - i.parado, 'parado', 'Fica parado há mais de ' + config.diasParado + ' dias sem movimentação');
      }
    });
    linhas.sort(function (a, b) { return a.dias - b.dias || a.item.name.localeCompare(b.item.name); });

    var mapa = {};
    linhas.forEach(function (l) { (mapa[l.dias] || (mapa[l.dias] = [])).push(l); });
    var grupos = Object.keys(mapa).map(Number).sort(function (a, b) { return a - b; })
      .map(function (d) { return { dias: d, linhas: mapa[d] }; });

    var porTipo = { critico: 0, atencao: 0, parado: 0 };
    var vistos = {};
    linhas.forEach(function (l) { porTipo[l.tipo]++; vistos[l.item.id] = true; });

    return { janela: janela, total: Object.keys(vistos).length, grupos: grupos, porTipo: porTipo, viramCriticos: porTipo.critico };
  }

  return { montarRadar: montarRadar };
});
