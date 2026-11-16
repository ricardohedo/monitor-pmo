/* Monitor PMO - matriz impacto x esforço. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {
  var NIVEIS = ['alto', 'medio', 'baixo'];
  var ORDEM_COR = { vermelho: 0, amarelo: 1, verde: 2, cinza: 3 };

  // "Médio", "medio", " MÉDIO " -> "medio"
  function normalizar(txt) {
    return String(txt || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  }

  function nivel(txt) {
    var n = normalizar(txt);
    return NIVEIS.indexOf(n) !== -1 ? n : null;
  }

  function pesoPrioridade(txt, ordem) {
    var n = normalizar(txt);
    for (var i = 0; i < ordem.length; i++) if (normalizar(ordem[i]) === n) return i;
    return ordem.length; // sem prioridade vai por último
  }

  /* montarMatriz(cards, ctx, config)
     ctx: { agora, camposDef, listas: [{id,name}], incluirPausados } */
  function montarMatriz(cards, ctx, config) {
    var mc = config.matriz;
    var celulas = {};
    NIVEIS.forEach(function (i) {
      celulas[i] = {};
      NIVEIS.forEach(function (e) { celulas[i][e] = []; });
    });
    var semClassificar = [];

    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista }, config);
      if (!s) return; // NOVA DEMANDA
      if (s.cor === 'cinza' && !(ctx.incluirPausados && s.tipo === 'pausado')) return;

      var impTxt = H.valorLista(card, ctx.camposDef, mc.campoImpacto);
      var esfTxt = H.valorLista(card, ctx.camposDef, mc.campoEsforco);
      var prioridade = H.valorLista(card, ctx.camposDef, mc.campoPrioridade);
      var imp = nivel(impTxt), esf = nivel(esfTxt);

      var item = {
        id: card.id, name: card.name, url: card.url, lista: nomeLista,
        cor: s.cor, rotulo: s.rotulo, motivos: s.motivos, pausado: s.tipo === 'pausado',
        prioridade: prioridade,
        peso: pesoPrioridade(prioridade, mc.ordemPrioridade),
        impacto: impTxt, esforco: esfTxt
      };

      if (imp && esf) {
        celulas[imp][esf].push(item);
      } else {
        var falta = [];
        if (!imp) falta.push(impTxt ? mc.campoImpacto + ' (valor inválido)' : mc.campoImpacto);
        if (!esf) falta.push(esfTxt ? mc.campoEsforco + ' (valor inválido)' : mc.campoEsforco);
        item.falta = falta;
        semClassificar.push(item);
      }
    });

    function ordenar(a, b) {
      return a.peso - b.peso || ORDEM_COR[a.cor] - ORDEM_COR[b.cor] || a.name.localeCompare(b.name);
    }
    var total = 0;
    NIVEIS.forEach(function (i) {
      NIVEIS.forEach(function (e) { celulas[i][e].sort(ordenar); total += celulas[i][e].length; });
    });
    semClassificar.sort(ordenar);

    return {
      celulas: celulas,
      quadrantes: mc.quadrantes,
      semClassificar: semClassificar,
      classificados: total,
      total: total + semClassificar.length
    };
  }

  return { montarMatriz: montarMatriz, nivelMatriz: nivel };
});
