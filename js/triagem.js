/* Monitor PMO - triagem de demandas: o que falta para uma demanda nova (ou do
   backlog) virar projeto pronto para priorizar. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, I));
})(typeof self !== 'undefined' ? self : this, function (H, I) {

  /* montarTriagem(cards, ctx, config)
     ctx: { agora, camposDef, listas: [{id,name}], membros }
     -> { demandas: [...], prontas, esperando, total } */
  function montarTriagem(cards, ctx, config) {
    var tc = config.triagem, tz = config.tzOffsetHoras;
    var listasAlvo = tc.listas.concat(tc.incluirNovaDemanda ? config.listasIgnoradas : []);
    var demandas = [];

    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      if (!H.contem(nomeLista, listasAlvo)) return;
      if (card.isTemplate || H.contem(card.name, tc.ignorar)) return;
      var pausado = (card.labels || []).some(function (l) { return H.contem(l.name, config.etiquetasPausado); });

      var faltando = tc.campos.filter(function (nome) { return !I.valorCampo(card, ctx.camposDef, nome); });
      var semDescricao = !String(card.desc || '').trim();
      var impacto = I.normTexto(H.valorLista(card, ctx.camposDef, config.matriz.campoImpacto));
      var esforco = I.normTexto(H.valorLista(card, ctx.camposDef, config.matriz.campoEsforco));
      var espera = card.dateLastActivity ? H.diasEntre(ctx.agora, card.dateLastActivity, tz) : null;
      var quad = impacto && esforco ? config.matriz.quadrantes[impacto + '|' + esforco] || null : null;

      demandas.push({
        id: card.id, name: card.name, lista: nomeLista, pausado: pausado,
        faltando: faltando, semDescricao: semDescricao, espera: espera,
        esperandoDemais: espera !== null && espera > tc.diasEspera,
        quadrante: quad,
        pronta: !pausado && faltando.length === 0 && !semDescricao
      });
    });

    demandas.sort(function (a, b) {
      return (a.pronta ? 0 : 1) - (b.pronta ? 0 : 1) || (b.espera || 0) - (a.espera || 0) || a.name.localeCompare(b.name);
    });
    return {
      demandas: demandas, total: demandas.length,
      prontas: demandas.filter(function (d) { return d.pronta; }).length,
      esperando: demandas.filter(function (d) { return d.esperandoDemais; }).length
    };
  }

  return { montarTriagem: montarTriagem };
});
