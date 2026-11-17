/* Monitor PMO - relatório executivo do portfólio, em texto pronto para copiar.
   Junta o que as outras visões já calculam. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  var C = isNode ? require('./carga.js') : root.MonitorPMO;
  var P = isNode ? require('./prazos.js') : root.MonitorPMO;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  var CD = isNode ? require('./cadastro.js') : root.MonitorPMO;
  var CQ = isNode ? require('./conquistas.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, I, C, P, V, CD, CQ);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, I, C, P, V, CD, CQ));
})(typeof self !== 'undefined' ? self : this, function (H, I, C, P, V, CD, CQ) {
  var ORDEM = { vermelho: 0, amarelo: 1, verde: 2 };

  function dataBR(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  /* montarRelatorio(itens, config, agora, nomeBoard) -> { titulo, secoes: [{titulo, linhas}], texto } */
  function montarRelatorio(itens, config, agora, nomeBoard) {
    var plural = I.pluralPMO;
    var hoje = H.chaveDia(agora, config.tzOffsetHoras);
    var ativos = itens.filter(function (i) { return i.ativo; });
    var cor = { vermelho: 0, amarelo: 0, verde: 0 };
    ativos.forEach(function (i) { cor[i.cor]++; });
    var carga = C.montarCarga(itens, config);
    var prazos = P.montarPrazos(itens, config, agora);
    var varejo = V.montarVarejo(itens, config, agora);
    var cad = CD.montarCadastro(itens);
    var conq = CQ.montarConquistas(itens, config);

    var secoes = [];
    secoes.push({ titulo: 'Situação geral', linhas: [
      plural(ativos.length, 'projeto ativo', 'projetos ativos') + ': ' + plural(cor.vermelho, 'crítico', 'críticos') + ', ' +
        cor.amarelo + ' em atenção e ' + cor.verde + ' em dia.',
      'Cadastro completo em ' + cad.completos + ' de ' + cad.total + ' (aderência média ao padrão ' + cad.aderenciaMedia + '%).'
    ] });

    var criticos = ativos.filter(function (i) { return i.cor !== 'verde'; }).sort(function (a, b) {
      return ORDEM[a.cor] - ORDEM[b.cor] || (a.diasPrazo === null ? 9999 : a.diasPrazo) - (b.diasPrazo === null ? 9999 : b.diasPrazo) || a.name.localeCompare(b.name);
    });
    if (criticos.length) {
      var lim = config.pauta.limiteLista;
      var l = criticos.slice(0, lim).map(function (i) {
        return i.name + ' (' + (i.responsaveis.join(', ') || 'sem responsável') + '): ' + i.s.motivos.slice(0, 2).join('; ');
      });
      if (criticos.length > lim) l.push('... e mais ' + (criticos.length - lim) + '.');
      secoes.push({ titulo: 'Pedem atenção', linhas: l });
    }

    var lp = [];
    if (prazos.atrasados.length) lp.push(plural(prazos.atrasados.length, 'projeto atrasado', 'projetos atrasados') + ': ' +
      prazos.atrasados.slice(0, 3).map(function (i) { return i.name; }).join(', ') + '.');
    var prox = prazos.janelas.reduce(function (a, f) { return a.concat(f.itens); }, []).slice(0, 3);
    if (prox.length) lp.push('Próximos prazos: ' + prox.map(function (i) { return i.name + ' (' + (i.diasPrazo === 0 ? 'hoje' : 'em ' + i.diasPrazo + 'd') + ')'; }).join('; ') + '.');
    if (prazos.semPrazo.length) lp.push(plural(prazos.semPrazo.length, 'projeto sem prazo cadastrado', 'projetos sem prazo cadastrado') + ' (impossível prometer entrega).');
    if (lp.length) secoes.push({ titulo: 'Prazos', linhas: lp });

    var proxData = varejo.datas[0];
    if (proxData) {
      var ligados = proxData.ligados.length + proxData.ate.length;
      secoes.push({ titulo: 'Varejo', linhas: [
        'Próxima data forte: ' + proxData.nome + ' (' + dataBR(proxData.chave) + '), em ' + proxData.dias + ' dias, ' + proxData.diasUteis + ' dias úteis.',
        ligados ? plural(ligados, 'projeto ligado ou com prazo até a data', 'projetos ligados ou com prazo até a data') + ', ' + proxData.emRisco + ' em risco.'
          : 'Nenhum projeto ligado à data nem com prazo até ela: confirme se algo precisa estar pronto para a operação de loja.'
      ] });
    }

    var lc = [];
    if (carga.sobrecarregados.length) lc.push('Sobrecarga: ' + carga.sobrecarregados.map(function (x) { return x.nome; }).join(', ') + '.');
    var orfaos = carga.linhas.filter(function (x) { return x.semDono; })[0];
    if (orfaos) lc.push(plural(orfaos.ativos, 'projeto sem responsável', 'projetos sem responsável') + '.');
    if (lc.length) secoes.push({ titulo: 'Equipe', linhas: lc });

    if (conq.totalEntregas || conq.totalReta) {
      var lq = [];
      if (conq.totalEntregas) lq.push(plural(conq.totalEntregas, 'entrega', 'entregas') + ' nos últimos ' + config.conquistas.dias + ' dias.');
      if (conq.totalReta) lq.push(plural(conq.totalReta, 'projeto', 'projetos') + ' na reta final (checklist quase completa).');
      secoes.push({ titulo: 'Entregas', linhas: lq });
    }

    var titulo = 'Relatório do portfólio' + (nomeBoard ? ' - ' + nomeBoard : '') + ' - ' + dataBR(hoje);
    var texto = [titulo].concat(secoes.map(function (s) {
      return '\n' + s.titulo + '\n' + s.linhas.map(function (x) { return '- ' + x; }).join('\n');
    })).join('\n');
    return { titulo: titulo, secoes: secoes, texto: texto };
  }

  return { montarRelatorio: montarRelatorio };
});
