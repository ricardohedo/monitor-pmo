/* Monitor PMO - linha do tempo de prazos: atrasados, a vencer e sem prazo,
   com aviso quando o prazo cai colado numa data forte do varejo.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM));
})(typeof self !== 'undefined' ? self : this, function (H, RM) {
  var DIA = 86400000;

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /* montarPrazos(itens, config, agora) -> { atrasados, janelas, semPrazo, pouco, proximos, total, texto } */
  function montarPrazos(itens, config, agora) {
    var pc = config.prazos, tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(agora, tz);
    var ativos = itens.filter(function (i) { return i.ativo; });
    var marcos = RM.marcosNoPeriodo(hoje, hoje + (pc.dias + pc.diasVarejo + 1) * DIA, config.roadmap.marcosExtras);

    function anota(i) {
      var k = i.prazo ? H.chaveDia(i.prazo, tz) : null;
      var pouco = i.diasPrazo !== null && i.diasPrazo >= 0 && i.diasPrazo <= pc.diasAlerta &&
        i.progresso !== null && i.progresso < pc.progressoMin;
      var varejo = null;
      if (k !== null) {
        marcos.forEach(function (m) {
          var d = Math.round((m.chave - k) / DIA);
          if (!varejo && d >= 0 && d <= pc.diasVarejo) varejo = { nome: m.nome, dias: d };
        });
      }
      return {
        id: i.id, name: i.name, lista: i.lista, cor: i.cor, prazo: i.prazo, diasPrazo: i.diasPrazo,
        responsaveis: i.responsaveis, progresso: i.progresso, pouco: pouco, varejo: varejo
      };
    }
    function porPrazo(a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); }

    var comPrazo = ativos.filter(function (i) { return i.diasPrazo !== null; }).map(anota);
    var atrasados = comPrazo.filter(function (i) { return i.diasPrazo < 0; }).sort(porPrazo);

    var janelas = [
      { titulo: 'Hoje', de: 0, ate: 0 },
      { titulo: 'Próximos 7 dias', de: 1, ate: 7 },
      { titulo: '8 a 14 dias', de: 8, ate: 14 },
      { titulo: '15 a ' + pc.dias + ' dias', de: 15, ate: pc.dias }
    ].filter(function (f) { return f.de <= pc.dias; }).map(function (f) {
      f.ate = Math.min(f.ate, pc.dias);
      f.itens = comPrazo.filter(function (i) { return i.diasPrazo >= f.de && i.diasPrazo <= f.ate; }).sort(porPrazo);
      return f;
    }).filter(function (f) { return f.itens.length; });

    var semPrazo = ativos.filter(function (i) { return i.diasPrazo === null; })
      .map(function (i) { return { id: i.id, name: i.name, lista: i.lista, responsaveis: i.responsaveis }; });
    var proximos = comPrazo.filter(function (i) { return i.diasPrazo >= 0 && i.diasPrazo <= pc.dias; });
    var pouco = proximos.filter(function (i) { return i.pouco; });

    var txt = ['Prazos - ' + plural(atrasados.length, 'atrasado', 'atrasados') + ', ' +
      proximos.length + ' vencem em ' + pc.dias + ' dias, ' + semPrazo.length + ' sem prazo.'];
    function linha(i) {
      var quando = i.diasPrazo < 0 ? 'vencido há ' + Math.abs(i.diasPrazo) + 'd' : i.diasPrazo === 0 ? 'vence hoje' : 'em ' + i.diasPrazo + 'd';
      return '- ' + i.name + ' (' + (i.responsaveis.join(', ') || 'sem responsável') + ') - ' + quando +
        (i.pouco ? ' - pouco andado' : '') + (i.varejo ? ' - ' + i.varejo.dias + 'd antes de ' + i.varejo.nome : '');
    }
    if (atrasados.length) { txt.push('Atrasados:'); atrasados.forEach(function (i) { txt.push(linha(i)); }); }
    janelas.forEach(function (f) { txt.push(f.titulo + ':'); f.itens.forEach(function (i) { txt.push(linha(i)); }); });

    return {
      atrasados: atrasados, janelas: janelas, semPrazo: semPrazo, pouco: pouco,
      proximos: proximos.length, total: ativos.length, texto: txt.join('\n')
    };
  }

  return { montarPrazos: montarPrazos };
});
