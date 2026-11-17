/* Monitor PMO - calendário mensal: prazos dos projetos e datas fortes do varejo
   numa grade de semanas. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM));
})(typeof self !== 'undefined' ? self : this, function (H, RM) {
  var DIA = 86400000;
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro'];

  function iso(chave) { return new Date(chave).toISOString().slice(0, 10); }

  /* montarCalendario(itens, config, agora, ano, mes) - mes 0-11; sem ano/mes = mês de hoje.
     -> { ano, mes, titulo, semanas: [[dia x7]], totalPrazos, anterior, proximo } */
  function montarCalendario(itens, config, agora, ano, mes) {
    var tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(agora, tz);
    var hj = new Date(hoje);
    if (ano === undefined || mes === undefined) { ano = hj.getUTCFullYear(); mes = hj.getUTCMonth(); }

    var primeiro = Date.UTC(ano, mes, 1);
    var ultimo = Date.UTC(ano, mes + 1, 0);
    var inicio = primeiro - new Date(primeiro).getUTCDay() * DIA;        // domingo anterior
    var fim = ultimo + (6 - new Date(ultimo).getUTCDay()) * DIA;         // sábado seguinte

    var fer = {};
    config.varejo.feriados.forEach(function (f) { fer[f] = true; });
    var marcos = {};
    RM.marcosNoPeriodo(inicio, fim + DIA, config.roadmap.marcosExtras).forEach(function (m) {
      (marcos[m.chave] || (marcos[m.chave] = [])).push(m.nome);
    });
    var prazos = {}, totalPrazos = 0;
    itens.filter(function (i) { return i.ativo && i.prazo; }).forEach(function (i) {
      var k = H.chaveDia(i.prazo, tz);
      (prazos[k] || (prazos[k] = [])).push({ id: i.id, name: i.name, cor: i.cor, responsaveis: i.responsaveis });
      if (k >= primeiro && k <= ultimo) totalPrazos++;
    });

    var semanas = [], sem = [];
    for (var k = inicio; k <= fim; k += DIA) {
      var d = new Date(k), dow = d.getUTCDay();
      sem.push({
        chave: k, dia: d.getUTCDate(), foraDoMes: k < primeiro || k > ultimo, hoje: k === hoje,
        fimDeSemana: dow === 0 || dow === 6, feriado: !!fer[iso(k)],
        marcos: marcos[k] || [], prazos: prazos[k] || []
      });
      if (sem.length === 7) { semanas.push(sem); sem = []; }
    }
    return {
      ano: ano, mes: mes, titulo: MESES[mes] + ' de ' + ano, semanas: semanas, totalPrazos: totalPrazos,
      anterior: mes === 0 ? { ano: ano - 1, mes: 11 } : { ano: ano, mes: mes - 1 },
      proximo: mes === 11 ? { ano: ano + 1, mes: 0 } : { ano: ano, mes: mes + 1 }
    };
  }

  return { montarCalendario: montarCalendario };
});
