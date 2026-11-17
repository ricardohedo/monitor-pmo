/* Monitor PMO - metas do PMO: missões com data (ex.: "todo projeto com responsável
   até o Natal"), com progresso calculado ao vivo. Funções puras, somente leitura.
   Metas e datas ficam em config.metas.missoes. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM, I, V);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM, I, V));
})(typeof self !== 'undefined' ? self : this, function (H, RM, I, V) {
  var DIA = 86400000;

  var REGRAS = {
    com_responsavel: function (i) { return i.ids.length > 0; },
    com_prazo: function (i) { return i.diasPrazo !== null; },
    sem_atraso: function (i) { return !(i.diasPrazo !== null && i.diasPrazo < 0); },
    cadastro_completo: function (i) { return i.faltando.length === 0 && i.ids.length > 0; }
  };

  /* Data-alvo: nome de data do varejo (próxima ocorrência), "semana" (próxima sexta) ou AAAA-MM-DD. */
  function resolverData(txt, hoje, extras) {
    var t = String(txt || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return Date.parse(t + 'T00:00:00Z');
    if (I.normTexto(t) === 'semana') {
      var dow = new Date(hoje).getUTCDay();
      return hoje + ((5 - dow + 7) % 7) * DIA;
    }
    var alvo = I.normTexto(t);
    var m = RM.marcosNoPeriodo(hoje, hoje + 800 * DIA, extras).filter(function (x) { return I.normTexto(x.nome) === alvo; })[0];
    return m ? m.chave : null;
  }

  /* montarMetas(itens, config, agora) -> { metas: [...] } */
  function montarMetas(itens, config, agora) {
    var tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(agora, tz);
    var ativos = itens.filter(function (i) { return i.ativo; });

    var metas = (config.metas.missoes || []).map(function (ms) {
      var regra = REGRAS[ms.tipo];
      var alvo = resolverData(ms.data, hoje, config.roadmap.marcosExtras);
      if (!regra) return { nome: ms.nome, invalida: 'tipo desconhecido: ' + ms.tipo };
      var ok = ativos.filter(regra);
      var faltam = ativos.filter(function (i) { return !regra(i); })
        .map(function (i) { return { id: i.id, name: i.name, responsaveis: i.responsaveis, lista: i.lista }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      var pct = ativos.length ? Math.round(ok.length / ativos.length * 100) : 100;
      var dias = alvo === null ? null : Math.round((alvo - hoje) / DIA);
      var du = alvo === null ? null : V.diasUteis(hoje, alvo, config.varejo.feriados);
      var estado = pct === 100 ? 'cumprida' : dias === null ? 'sem data' : dias < 0 ? 'vencida' : 'em andamento';
      var porSemana = null;
      if (estado === 'em andamento') porSemana = Math.ceil(faltam.length / Math.max(1, Math.ceil(dias / 7)));
      return {
        nome: ms.nome, tipo: ms.tipo, total: ativos.length, atingidos: ok.length, pct: pct,
        dias: dias, diasUteis: du, estado: estado, porSemana: porSemana, faltam: faltam
      };
    });
    return { metas: metas };
  }

  return { montarMetas: montarMetas };
});
