/* Monitor PMO - conquistas da área: entregas recentes e reta final.
   Conquistas da área, não de pessoas. A data da entrega é a da última atividade
   do card (o Trello não guarda a data em que foi movido para Concluídos). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {

  /* montarConquistas(itens, config) -> { entregas, retaFinal, destaque, criticos, ativos } */
  function montarConquistas(itens, config) {
    var cc = config.conquistas;
    var entregas = itens.filter(function (i) {
      return i.tipo === 'concluido' && i.parado !== null && i.parado <= cc.dias;
    }).sort(function (a, b) { return a.parado - b.parado || a.name.localeCompare(b.name); });

    var ativos = itens.filter(function (i) { return i.ativo; });
    var reta = ativos.filter(function (i) {
      return i.total >= cc.minimoItens && i.progresso >= cc.quasePronto && i.progresso < 1;
    }).sort(function (a, b) { return b.progresso - a.progresso || a.name.localeCompare(b.name); });
    var criticos = ativos.filter(function (i) { return i.cor === 'vermelho'; }).length;

    var destaque = null;
    if (entregas.length) {
      destaque = entregas.length + (entregas.length === 1 ? ' entrega' : ' entregas') + ' nos últimos ' + cc.dias + ' dias.';
    } else if (ativos.length && !criticos) {
      destaque = 'Nenhum projeto crítico no portfólio agora.';
    }
    return {
      entregas: entregas.slice(0, cc.limite), totalEntregas: entregas.length,
      retaFinal: reta.slice(0, cc.limite), totalReta: reta.length,
      destaque: destaque, criticos: criticos, ativos: ativos.length
    };
  }

  return { montarConquistas: montarConquistas };
});
