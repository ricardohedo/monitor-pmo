/* Monitor PMO - calendário do varejo: quanto tempo útil falta para cada data forte
   (Black Friday, Natal, Páscoa...) e quais projetos ficam em risco para ela.
   Funções puras, somente leitura.
   Projeto "ligado" a uma data = etiqueta com o nome da data (ex.: "Black Friday"). */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM, I));
})(typeof self !== 'undefined' ? self : this, function (H, RM, I) {
  var DIA = 86400000;

  function iso(chave) { return new Date(chave).toISOString().slice(0, 10); }

  /* Dias úteis entre duas chaves de dia (exclui o primeiro, inclui o último). */
  function diasUteis(deChave, ateChave, feriados) {
    var fer = {};
    (feriados || []).forEach(function (f) { fer[f] = true; });
    var n = 0;
    for (var k = deChave + DIA; k <= ateChave; k += DIA) {
      var d = new Date(k).getUTCDay();
      if (d !== 0 && d !== 6 && !fer[iso(k)]) n++;
    }
    return n;
  }

  /* montarVarejo(itens, config, agora) -> { datas: [...], total } */
  function montarVarejo(itens, config, agora) {
    var vc = config.varejo, tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(agora, tz);
    var ativos = itens.filter(function (i) { return i.ativo; });
    var marcos = RM.marcosNoPeriodo(hoje, hoje + (vc.dias + 1) * DIA, config.roadmap.marcosExtras);

    var datas = marcos.map(function (m) {
      var dias = Math.round((m.chave - hoje) / DIA);
      var du = diasUteis(hoje, m.chave, vc.feriados);
      var nome = I.normTexto(m.nome);

      function info(i) {
        var motivos = [];
        if (i.diasPrazo !== null && i.diasPrazo < 0) motivos.push('atrasado');
        if (i.diasPrazo === null) motivos.push('sem prazo');
        else if (i.diasPrazo > dias) motivos.push('prazo depois da data');
        if (i.cor === 'vermelho' && motivos.indexOf('atrasado') === -1) motivos.push('crítico');
        return { id: i.id, name: i.name, lista: i.lista, cor: i.cor, diasPrazo: i.diasPrazo,
          responsaveis: i.responsaveis, motivos: motivos };
      }
      var ligados = ativos.filter(function (i) { return i.etiquetas.indexOf(nome) !== -1; }).map(info);
      var ids = {};
      ligados.forEach(function (l) { ids[l.id] = true; });
      // Projetos sem etiqueta, mas com prazo marcado até a data: entram na conta da data.
      var ate = ativos.filter(function (i) {
        return !ids[i.id] && i.diasPrazo !== null && i.diasPrazo >= 0 && i.diasPrazo <= dias;
      }).map(info);
      function risco(l) { return l.motivos.length > 0 || l.cor !== 'verde'; }
      ligados.sort(function (a, b) { return b.motivos.length - a.motivos.length || a.name.localeCompare(b.name); });
      ate.sort(function (a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); });
      return {
        nome: m.nome, chave: m.chave, dias: dias, diasUteis: du,
        perto: du <= vc.avisoDiasUteis,
        ligados: ligados, ate: ate,
        emRisco: ligados.filter(risco).length + ate.filter(risco).length
      };
    });
    return { datas: datas, total: datas.length };
  }

  return { montarVarejo: montarVarejo, diasUteis: diasUteis };
});
