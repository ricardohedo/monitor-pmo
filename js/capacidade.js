/* Monitor PMO - capacidade por mês: quanto esforço vence em cada mês, para ver
   o amontoado antes de uma data forte do varejo. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM));
})(typeof self !== 'undefined' ? self : this, function (H, RM) {
  var NOMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function pontosDe(i, cc) {
    var p = cc.pesoEsforco[i.esforco];
    return p === undefined ? cc.pesoSemEsforco : p;
  }

  /* montarCapacidade(itens, config, agora)
     -> { meses: [...], atrasados, semPrazo, maxPontos, picos } */
  function montarCapacidade(itens, config, agora) {
    var kc = config.capacidade, cc = config.carga, tz = config.tzOffsetHoras;
    var hoje = new Date(H.chaveDia(agora, tz));
    var ativos = itens.filter(function (i) { return i.ativo; });

    var meses = [];
    for (var n = 0; n < kc.meses; n++) {
      var d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + n, 1));
      var ini = d.getTime(), fim = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      meses.push({
        chave: d.getUTCFullYear() + '-' + (d.getUTCMonth() < 9 ? '0' : '') + (d.getUTCMonth() + 1),
        rotulo: NOMES[d.getUTCMonth()] + '/' + d.getUTCFullYear(), ini: ini, fim: fim,
        marcos: RM.marcosNoPeriodo(ini, fim, config.roadmap.marcosExtras).map(function (m) { return m.nome; }),
        projetos: 0, pontos: 0, criticos: 0, itens: [], pessoas: {}
      });
    }
    var atrasados = { projetos: 0, pontos: 0, itens: [] };
    var semPrazo = { projetos: 0, pontos: 0 };

    ativos.forEach(function (i) {
      var p = pontosDe(i, cc);
      var info = { id: i.id, name: i.name, pontos: p, cor: i.cor };
      if (i.diasPrazo === null) { semPrazo.projetos++; semPrazo.pontos += p; return; }
      if (i.diasPrazo < 0) { atrasados.projetos++; atrasados.pontos += p; atrasados.itens.push(info); return; }
      var k = H.chaveDia(i.prazo, tz);
      var m = meses.filter(function (x) { return k >= x.ini && k < x.fim; })[0];
      if (!m) return;
      m.projetos++; m.pontos += p; m.itens.push(info);
      if (i.cor === 'vermelho') m.criticos++;
      (i.responsaveis.length ? i.responsaveis : ['Sem responsável']).forEach(function (nome) {
        m.pessoas[nome] = (m.pessoas[nome] || 0) + p;
      });
    });

    meses.forEach(function (m) {
      m.pico = m.pontos > kc.pontosMesMax;
      m.pessoas = Object.keys(m.pessoas).map(function (nome) { return { nome: nome, pontos: m.pessoas[nome] }; })
        .sort(function (a, b) { return b.pontos - a.pontos || a.nome.localeCompare(b.nome); });
      m.itens.sort(function (a, b) { return b.pontos - a.pontos || a.name.localeCompare(b.name); });
    });
    return {
      meses: meses, atrasados: atrasados, semPrazo: semPrazo,
      maxPontos: Math.max(kc.pontosMesMax, meses.reduce(function (mx, m) { return Math.max(mx, m.pontos); }, 0)),
      picos: meses.filter(function (m) { return m.pico; }).length
    };
  }

  return { montarCapacidade: montarCapacidade };
});
