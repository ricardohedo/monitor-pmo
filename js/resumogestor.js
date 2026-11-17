/* Monitor PMO - resumo por gestor: mensagem semanal pronta para colar no Chat.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var A = isNode ? require('./atuar.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(A, I, H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(A, I, H));
})(typeof self !== 'undefined' ? self : this, function (A, I, H) {

  function primeiroNome(n) {
    var p = String(n || '').trim().split(/\s+/)[0] || '';
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }

  function quando(d) {
    return d < 0 ? 'vencido há ' + Math.abs(d) + 'd' : d === 0 ? 'hoje' : d === 1 ? 'amanhã' : 'em ' + d + 'd';
  }

  function dataHoraBR(agora, tz) {
    var d = new Date(agora.getTime() + tz * 3600000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' às ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
  }

  function dataBRCurta(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1);
  }

  /* montarResumos(itens, config, agora) -> { gestores: [{ id, nome, ativos, criticos, texto }], semResponsavel }
     Com `agora`, o texto vira uma "carta de ciência": prazo combinado para corrigir e carimbo de data/hora. */
  function montarResumos(itens, config, agora) {
    var rc = config.resumo;
    var ativos = itens.filter(function (i) { return i.ativo; });
    var pessoas = {};
    ativos.forEach(function (i) {
      i.ids.forEach(function (id, n) { if (!pessoas[id]) pessoas[id] = i.responsaveis[n] || id; });
    });

    var gestores = Object.keys(pessoas).map(function (id) {
      var nome = pessoas[id];
      var meus = ativos.filter(function (i) { return i.ids.indexOf(id) !== -1; });
      var cor = { vermelho: 0, amarelo: 0, verde: 0 };
      meus.forEach(function (i) { cor[i.cor]++; });
      var acoes = A.montarAtuar(itens, config, id).comece.slice(0, rc.limiteAcoes);
      var prazos = meus.filter(function (i) { return i.diasPrazo !== null && i.diasPrazo <= rc.diasPrazo; })
        .sort(function (a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); });
      var faltaCad = meus.filter(function (i) { return i.faltando.length > 0; }).length;

      var linhas = ['Olá, ' + primeiroNome(nome) + '! Resumo da semana dos seus projetos:'];
      linhas.push('- ' + I.pluralPMO(meus.length, 'projeto ativo', 'projetos ativos') + ': ' +
        I.pluralPMO(cor.vermelho, 'crítico', 'críticos') + ', ' + cor.amarelo + ' em atenção, ' + cor.verde + ' em dia.');
      if (acoes.length) {
        linhas.push('- Para olhar primeiro:');
        acoes.forEach(function (a) { linhas.push('  * ' + a.item.name + ': ' + a.fazer); });
      }
      if (prazos.length) {
        linhas.push('- Prazos (até ' + rc.diasPrazo + ' dias):');
        prazos.slice(0, 5).forEach(function (i) { linhas.push('  * ' + i.name + ' - ' + quando(i.diasPrazo)); });
      }
      if (faltaCad) linhas.push('- ' + I.pluralPMO(faltaCad, 'projeto com cadastro incompleto', 'projetos com cadastro incompleto') + ' (campos do padrão PMO).');
      if (!acoes.length && !prazos.length && !faltaCad) linhas.push('- Tudo em ordem. Obrigado!');
      else if (agora) {
        var limite = H.chaveDia(agora, config.tzOffsetHoras) + rc.prazoCorrecaoDias * 86400000;
        linhas.push('- Combinado: corrigir o que está marcado acima até ' + dataBRCurta(limite) + '.');
      }
      if (agora) {
        linhas.push('(Resumo gerado em ' + dataHoraBR(agora, config.tzOffsetHoras) + ' a partir do Trello. As regras e como corrigir cada ponto estão em Guia do gestor > Regras e como corrigir.)');
      }
      return { id: id, nome: nome, ativos: meus.length, criticos: cor.vermelho, texto: linhas.join('\n') };
    }).sort(function (a, b) { return b.criticos - a.criticos || b.ativos - a.ativos || a.nome.localeCompare(b.nome); });

    return { gestores: gestores, semResponsavel: ativos.filter(function (i) { return !i.ids.length; }).length };
  }

  return { montarResumos: montarResumos };
});
