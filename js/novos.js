/* Monitor PMO - novos projetos: quantos foram criados e se foram criados do jeito
   certo (padrão do modelo "NOME DO PROJETO"). Funções puras, somente leitura.
   A data de criação sai do id do card. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./padrao.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P, I));
})(typeof self !== 'undefined' ? self : this, function (H, P, I) {
  var NOMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /* montarNovos(cards, ctx, config)
     ctx: { agora, camposDef, listas } -> { hoje, mes, corretosMes, ajusteMes, serie, problemas, areas, recentes, total } */
  function montarNovos(cards, ctx, config) {
    var nc = config.novos, tz = config.tzOffsetHoras;
    var agora = ctx.agora;
    var hojeK = H.chaveDia(agora, tz);
    var ref = new Date(hojeK);
    var mesAtual = ref.getUTCFullYear() * 12 + ref.getUTCMonth();

    var serie = [];
    for (var n = nc.meses - 1; n >= 0; n--) {
      var m = mesAtual - n;
      serie.push({ chave: m, rotulo: NOMES[m % 12] + '/' + Math.floor(m / 12), total: 0, corretos: 0, ajuste: 0 });
    }

    var novos = [];
    cards.forEach(function (card) {
      if (card.isTemplate || card.closed || H.contem(card.name, config.triagem.ignorar)) return;
      var criado = I.criadoEm(card.id);
      if (!criado) return;
      var k = H.chaveDia(criado, tz);
      var d = new Date(k);
      var mes = d.getUTCFullYear() * 12 + d.getUTCMonth();
      var linha = serie.filter(function (s) { return s.chave === mes; })[0];
      if (!linha) return;
      var c = P.conformidade(card, { camposDef: ctx.camposDef }, config);
      var ok = c.faltando.length === 0;
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      linha.total++; linha[ok ? 'corretos' : 'ajuste']++;
      novos.push({
        id: card.id, name: card.name, lista: lista ? lista.name : '', criadoEm: criado, k: k, mes: mes,
        ok: ok, faltando: c.faltando, area: I.valorCampo(card, ctx.camposDef, config.campoArea) || 'Sem área definida'
      });
    });

    var probl = {};
    novos.forEach(function (x) { x.faltando.forEach(function (f) { probl[f] = (probl[f] || 0) + 1; }); });
    var areas = {};
    novos.forEach(function (x) {
      var a = areas[x.area] || (areas[x.area] = { nome: x.area, total: 0, corretos: 0, ajuste: 0 });
      a.total++; a[x.ok ? 'corretos' : 'ajuste']++;
    });
    var doMes = novos.filter(function (x) { return x.mes === mesAtual; });

    return {
      total: novos.length,
      hoje: novos.filter(function (x) { return x.k === hojeK; }).length,
      mes: doMes.length,
      corretosMes: doMes.filter(function (x) { return x.ok; }).length,
      ajusteMes: doMes.filter(function (x) { return !x.ok; }).length,
      serie: serie,
      problemas: Object.keys(probl).map(function (k) { return { texto: k, qtd: probl[k] }; })
        .sort(function (a, b) { return b.qtd - a.qtd || a.texto.localeCompare(b.texto); }),
      areas: Object.keys(areas).map(function (k) { return areas[k]; })
        .sort(function (a, b) { return b.ajuste - a.ajuste || b.total - a.total || a.nome.localeCompare(b.nome); }),
      recentes: novos.sort(function (a, b) { return b.criadoEm < a.criadoEm ? -1 : b.criadoEm > a.criadoEm ? 1 : 0; }).slice(0, nc.recentes)
    };
  }

  return { montarNovos: montarNovos };
});
