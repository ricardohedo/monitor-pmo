/* Monitor PMO - higiene do quadro: o que está registrado de forma que não se sustenta.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {

  /* montarHigiene(itens, config) -> { grupos: [{ id, titulo, acao, itens }], total } */
  function montarHigiene(itens, config) {
    var hc = config.higiene;
    var concluidos = itens.filter(function (i) { return i.tipo === 'concluido'; });

    var defs = [
      { id: 'evidencia', titulo: 'Concluídos sem evidência (últimos ' + hc.diasEvidencia + ' dias)',
        acao: 'Anexe no card o que comprova a entrega (documento, print ou link) ou volte o card para a lista certa.',
        itens: concluidos.filter(function (i) {
          return i.anexos !== null && i.parado !== null && i.parado <= hc.diasEvidencia && i.anexos < hc.minimoAnexos;
        }) },
      { id: 'checklist', titulo: 'Concluídos com checklist pendente',
        acao: 'Marque o que falta na checklist ou volte o card para Em Execução.',
        itens: concluidos.filter(function (i) { return i.total > 0 && i.feitos < i.total; }) },
      { id: 'revisao', titulo: 'Em revisão sem comentário',
        acao: 'Comente no card o que está em revisão e o que falta.',
        itens: itens.filter(function (i) {
          return i.ativo && i.comentarios === 0 && H.contem(i.lista, hc.listaRevisao);
        }) },
      { id: 'pausado', titulo: 'Pausados sem motivo registrado',
        acao: 'Registre num comentário o motivo da pausa e quando volta.',
        itens: itens.filter(function (i) { return i.tipo === 'pausado' && i.comentarios === 0; }) }
    ];
    var grupos = defs.map(function (g) {
      g.itens = g.itens.map(function (i) {
        return { id: i.id, name: i.name, lista: i.lista, responsaveis: i.responsaveis,
          detalhe: g.id === 'checklist' ? i.feitos + ' de ' + i.total + ' itens' : '' };
      }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      return g;
    }).filter(function (g) { return g.itens.length; });
    var total = grupos.reduce(function (s, g) { return s + g.itens.length; }, 0);
    return { grupos: grupos, total: total };
  }

  return { montarHigiene: montarHigiene };
});
