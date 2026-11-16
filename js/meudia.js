/* Monitor PMO - "Meu dia": o que pede atenção de um gestor hoje.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {
  var ORDEM_COR = { vermelho: 0, amarelo: 1, verde: 2 };

  function idsDe(card) {
    if (card.idMembers) return card.idMembers;
    return (card.members || []).map(function (m) { return m.id; });
  }

  /* montarMeuDia(cards, ctx, config, membroId)
     ctx: { agora, camposDef, listas: [{id,name}] } */
  function montarMeuDia(cards, ctx, config, membroId) {
    var itens = [];
    cards.forEach(function (card) {
      if (idsDe(card).indexOf(membroId) === -1) return;
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista }, config);
      if (!s || s.cor === 'cinza') return; // fora do semáforo, concluído ou pausado
      var b = card.badges || {};
      itens.push({
        id: card.id, name: card.name, url: card.url, lista: nomeLista,
        cor: s.cor, rotulo: s.rotulo, motivos: s.motivos,
        prazo: s.prazo, diasPrazo: s.diasPrazo,
        progresso: b.checkItems ? (b.checkItemsChecked || 0) / b.checkItems : null
      });
    });

    function porGravidade(a, b) {
      if (ORDEM_COR[a.cor] !== ORDEM_COR[b.cor]) return ORDEM_COR[a.cor] - ORDEM_COR[b.cor];
      var da = a.diasPrazo === null ? 9999 : a.diasPrazo;
      var db = b.diasPrazo === null ? 9999 : b.diasPrazo;
      return da - db || a.name.localeCompare(b.name);
    }
    itens.sort(porGravidade);

    var porCor = { vermelho: 0, amarelo: 0, verde: 0 };
    itens.forEach(function (i) { porCor[i.cor]++; });

    var janela = (config.meuDia && config.meuDia.diasAgenda) || 14;
    var agenda = itens.filter(function (i) { return i.diasPrazo !== null && i.diasPrazo <= janela; })
      .sort(function (a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); });
    var proximo = agenda.filter(function (i) { return i.diasPrazo >= 0; })[0] || null;

    return {
      total: itens.length,
      porCor: porCor,
      itens: itens,
      agenda: agenda,
      semPrazo: itens.filter(function (i) { return i.diasPrazo === null; }),
      proximoPrazo: proximo
    };
  }

  function saudacao(agora, tzHoras) {
    var h = new Date(agora.getTime() + tzHoras * 3600000).getUTCHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /* Frase de abertura da tela. */
  function frase(resumo, nomeCompleto, agora, tzHoras) {
    var primeiro = String(nomeCompleto || '').trim().split(/\s+/)[0];
    // "LETICIA" -> "Leticia"
    primeiro = primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
    var abre = saudacao(agora, tzHoras) + (primeiro ? ', ' + primeiro : '') + '. ';
    if (!resumo.total) return abre + 'Nenhum projeto ativo sob sua responsabilidade.';
    var txt = abre + 'Você tem ' + plural(resumo.total, 'projeto ativo', 'projetos ativos') + ': ' +
      plural(resumo.porCor.vermelho, 'crítico', 'críticos') + ', ' +
      plural(resumo.porCor.amarelo, 'em atenção', 'em atenção') + ' e ' +
      plural(resumo.porCor.verde, 'em dia', 'em dia') + '.';
    if (resumo.proximoPrazo) {
      var p = resumo.proximoPrazo;
      txt += ' Próximo prazo: ' + p.name + ' (' +
        (p.diasPrazo === 0 ? 'hoje' : 'em ' + plural(p.diasPrazo, 'dia', 'dias')) + ').';
    }
    return txt;
  }

  return { montarMeuDia: montarMeuDia, fraseMeuDia: frase, saudacao: saudacao };
});
