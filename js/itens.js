/* Monitor PMO - itens do portfólio: base comum das visões novas
   (carga, prazos, onde atuar, radar, conquistas, cadastro).
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./padrao.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P));
})(typeof self !== 'undefined' ? self : this, function (H, P) {

  function norm(x) {
    return String(x == null ? '' : x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function idsDe(card) {
    if (card.idMembers) return card.idMembers;
    return (card.members || []).map(function (m) { return m.id; });
  }

  function nomeDoMembro(membros, id) {
    var m = (membros || []).filter(function (x) { return x.id === id; })[0];
    return m ? (m.fullName || m.username || id) : id;
  }

  // Texto de um campo personalizado: tipo lista (opção escolhida) ou tipo texto.
  function valorCampo(card, camposDef, nome) {
    var v = H.valorLista(card, camposDef, nome);
    if (v) return v;
    var it = H.itemDoCampo(card, H.achaCampo(camposDef, nome));
    return it && it.value && it.value.text ? it.value.text : null;
  }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /* montarItens(cards, ctx, config)
     ctx: { agora, camposDef, listas: [{id,name}], membros: [{id,fullName}] }
     Devolve todos os cards que entram no semáforo (inclui concluídos e pausados,
     marcados com ativo=false). Card em NOVA DEMANDA fica de fora. */
  function montarItens(cards, ctx, config) {
    var tz = config.tzOffsetHoras;
    var out = [];
    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista }, config);
      if (!s) return;
      var ids = idsDe(card);
      var b = card.badges || {};
      var total = b.checkItems || 0;
      var feitos = b.checkItemsChecked || 0;
      var c = P.conformidade(card, { camposDef: ctx.camposDef }, config);
      out.push({
        id: card.id, name: card.name, url: card.url, lista: nomeLista,
        s: s, cor: s.cor, tipo: s.tipo || null, ativo: s.cor !== 'cinza',
        prazo: s.prazo, diasPrazo: s.diasPrazo,
        ids: ids,
        responsaveis: ids.map(function (id) { return nomeDoMembro(ctx.membros, id); }),
        total: total, feitos: feitos, progresso: total ? feitos / total : null,
        prioridade: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoPrioridade)),
        urgente: norm(H.valorLista(card, ctx.camposDef, 'Urgente')) === 'sim',
        impacto: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoImpacto)),
        esforco: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoEsforco)),
        parado: card.dateLastActivity ? H.diasEntre(ctx.agora, card.dateLastActivity, tz) : null,
        faltando: c.faltando, aderencia: c.percent,
        etiquetas: (card.labels || []).map(function (l) { return norm(l.name); }),
        area: valorCampo(card, ctx.camposDef, config.campoArea),
        anexos: b.attachments === undefined ? null : b.attachments,
        comentarios: b.comments === undefined ? null : b.comments
      });
    });
    return out;
  }

  function temMotivo(item, prefixo) {
    return item.s.motivos.some(function (m) { return m.indexOf(prefixo) === 0; });
  }

  return {
    montarItens: montarItens,
    normTexto: norm,
    valorCampo: valorCampo,
    pluralPMO: plural,
    temMotivo: temMotivo
  };
});
