/* Monitor PMO - projetos "melancia": verdes por fora (o semáforo diz que está tudo bem) mas com
   sinais de problema por dentro. É a checagem de que o verde é de verdade.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {

  /* montarMelancia(itens, config) -> { itens: [{ id, name, sinais, ... }], totalVerdes, pct, semDadosChecklist } */
  function montarMelancia(itens, config) {
    var mc = config.melancia;
    var verdes = itens.filter(function (i) { return i.ativo && i.cor === 'verde'; });
    var temItensChecklist = verdes.some(function (i) { return i.checklists && i.checklists.total > 0; });

    var achados = [];
    verdes.forEach(function (i) {
      var sinais = [];
      if (i.faltando.length >= mc.minFaltando) sinais.push('Cadastro incompleto (' + i.faltando.length + ' itens do padrão faltando)');
      if (!i.prioridade) sinais.push('Sem prioridade definida');
      if (!i.impacto || !i.esforco) sinais.push('Sem impacto ou esforço (não dá para priorizar)');
      if (i.total === 0 && H.contem(i.lista, config.ritmo.listas)) sinais.push('Em execução sem checklist de acompanhamento');
      if (i.checklists && i.checklists.semPrazo > 0) sinais.push(i.checklists.semPrazo + ' itens de checklist sem prazo');
      if (i.progresso !== null && i.progresso === 0 && i.diasPrazo !== null && i.diasPrazo <= 30) sinais.push('0% da checklist com prazo em até 30 dias');
      if (sinais.length >= mc.minSinais) {
        achados.push({ id: i.id, name: i.name, lista: i.lista, responsaveis: i.responsaveis, diasPrazo: i.diasPrazo, sinais: sinais });
      }
    });
    achados.sort(function (a, b) { return b.sinais.length - a.sinais.length || a.name.localeCompare(b.name); });
    return {
      itens: achados, totalVerdes: verdes.length,
      pct: verdes.length ? Math.round(achados.length / verdes.length * 100) : 0,
      semDadosChecklist: !temItensChecklist
    };
  }

  return { montarMelancia: montarMelancia };
});
