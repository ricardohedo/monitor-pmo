/* Monitor PMO - consolidado do board (RF-002 painel e RF-008 relatório).
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./padrao.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P));
})(typeof self !== 'undefined' ? self : this, function (H, P) {

  var ORDEM_COR = { vermelho: 0, amarelo: 1, verde: 2, cinza: 3 };

  function nomeDe(membros, id) {
    var m = (membros || []).filter(function (x) { return x.id === id; })[0];
    return m ? (m.fullName || m.username || id) : id;
  }

  /* resumir(cards, ctx, config)
     cards: cards do board (formato t.cards('all'))
     ctx:   { agora, camposDef, listas: [{id,name}], membros: [{id,fullName}] } */
  function resumir(cards, ctx, config) {
    var porCor = { vermelho: 0, amarelo: 0, verde: 0, cinza: 0 };
    var atencao = [];
    var membrosMap = {};
    var listasMap = {};
    var semResponsavel = 0;
    var somaPadrao = 0, qtdPadrao = 0;
    var avaliados = 0;

    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, {
        agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista
      }, config);
      if (!s) return; // fora do semáforo
      avaliados++;
      porCor[s.cor]++;

      var item = {
        id: card.id, name: card.name, url: card.url, lista: nomeLista,
        cor: s.cor, rotulo: s.rotulo, motivos: s.motivos,
        diasPrazo: s.diasPrazo, prazo: s.prazo
      };

      var ids = card.idMembers || (card.members || []).map(function (m) { return m.id; });
      item.responsaveis = ids.map(function (id) { return nomeDe(ctx.membros, id); });

      if (s.cor === 'vermelho' || s.cor === 'amarelo') atencao.push(item);

      var ativo = s.cor !== 'cinza';
      if (ativo) {
        if (ids.length === 0) semResponsavel++;
        (ids.length ? ids : ['__sem__']).forEach(function (id) {
          var k = id === '__sem__' ? 'Sem responsável' : nomeDe(ctx.membros, id);
          var m = membrosMap[k] || (membrosMap[k] = { nome: k, ativos: 0, vermelhos: 0, amarelos: 0 });
          m.ativos++;
          if (s.cor === 'vermelho') m.vermelhos++;
          if (s.cor === 'amarelo') m.amarelos++;
        });
        var l = listasMap[nomeLista] || (listasMap[nomeLista] = {
          nome: nomeLista, total: 0, vermelho: 0, amarelo: 0, verde: 0 });
        l.total++;
        l[s.cor]++;

        var c = P.conformidade(card, { camposDef: ctx.camposDef }, config);
        somaPadrao += c.percent; qtdPadrao++;
      }
    });

    atencao.sort(function (a, b) {
      if (ORDEM_COR[a.cor] !== ORDEM_COR[b.cor]) return ORDEM_COR[a.cor] - ORDEM_COR[b.cor];
      var da = a.diasPrazo === null ? 9999 : a.diasPrazo;
      var db = b.diasPrazo === null ? 9999 : b.diasPrazo;
      return da - db; // mais vencido primeiro
    });

    var porMembro = Object.keys(membrosMap).map(function (k) { return membrosMap[k]; })
      .sort(function (a, b) { return b.ativos - a.ativos || a.nome.localeCompare(b.nome); });
    var porLista = Object.keys(listasMap).map(function (k) { return listasMap[k]; });

    var ativos = porCor.vermelho + porCor.amarelo + porCor.verde;
    return {
      avaliados: avaliados,
      ativos: ativos,
      porCor: porCor,
      percentEmDia: ativos ? Math.round(porCor.verde / ativos * 100) : 0,
      semResponsavel: semResponsavel,
      padraoMedio: qtdPadrao ? Math.round(somaPadrao / qtdPadrao) : null,
      atencao: atencao,
      porMembro: porMembro,
      porLista: porLista
    };
  }

  function dataBR(d) {
    var x = new Date(d);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(x.getDate()) + '/' + p(x.getMonth() + 1) + '/' + x.getFullYear();
  }

  /* Texto pronto para colar em e-mail/WhatsApp (resumo executivo). */
  function textoResumo(r, nomeBoard, agora, limite) {
    var linhas = [];
    linhas.push('Monitor PMO - ' + nomeBoard + ' (' + dataBR(agora) + ')');
    linhas.push('Projetos ativos: ' + r.ativos + ' | Em dia: ' + r.porCor.verde +
      ' (' + r.percentEmDia + '%) | Atenção: ' + r.porCor.amarelo +
      ' | Críticos: ' + r.porCor.vermelho);
    if (r.semResponsavel) linhas.push('Sem responsável: ' + r.semResponsavel);
    if (r.padraoMedio !== null) linhas.push('Aderência ao padrão PMO: ' + r.padraoMedio + '%');
    var top = r.atencao.slice(0, limite || 10);
    if (top.length) {
      linhas.push('');
      linhas.push('Requer atenção:');
      top.forEach(function (a) {
        linhas.push('- ' + a.name + ' [' + a.lista + '] ' + a.motivos.join('; '));
      });
      if (r.atencao.length > top.length) {
        linhas.push('... e mais ' + (r.atencao.length - top.length) + ' card(s).');
      }
    }
    return linhas.join('\n');
  }

  return { resumir: resumir, textoResumo: textoResumo };
});
