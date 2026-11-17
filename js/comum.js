/* Monitor PMO - utilitários das telas novas (somente leitura). Só roda no navegador. */
(function () {
  var M = window.MonitorPMO;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  function dataCurta(iso) {
    var x = new Date(new Date(iso).getTime() + M.config.tzOffsetHoras * 3600000);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(x.getUTCDate()) + '/' + p(x.getUTCMonth() + 1);
  }

  function textoDias(d) {
    if (d === null || d === undefined) return 'sem prazo';
    if (d < 0) return 'vencido há ' + Math.abs(d) + 'd';
    if (d === 0) return 'hoje';
    if (d === 1) return 'amanhã';
    return 'em ' + d + 'd';
  }

  function prazoTxt(d) {
    return d === null || d === undefined ? 'sem prazo' : 'prazo ' + textoDias(d);
  }

  function linkCard(t, i) {
    var a = el('a', 'card', i.name);
    a.addEventListener('click', function () { t.showCard(i.id); });
    return a;
  }

  function kpi(cor, valor, rotulo) {
    var k = el('div', 'kpi est ' + cor);
    k.appendChild(el('b', null, valor));
    k.appendChild(el('span', null, rotulo));
    return k;
  }

  function copiar(texto, msgEl, aviso) {
    function ok() { msgEl.textContent = aviso || 'Copiado.'; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { msgEl.textContent = 'Não foi possível copiar: ' + e.message; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, fallback);
    else fallback();
  }

  function tag(cor, txt) { return el('span', 'tag ' + cor, txt); }

  /* Lê os cards; com `comChecklists`, completa com as checklists se o Trello não as entregar junto. */
  function lerCards(t, comChecklists) {
    return t.cards('all').then(function (cards) {
      if (!comChecklists || !cards.length || Array.isArray(cards[0].checklists)) return cards;
      return t.cards('id', 'checklists').then(function (extra) {
        var mapa = {};
        extra.forEach(function (c) { mapa[c.id] = c.checklists; });
        cards.forEach(function (c) { if (Array.isArray(mapa[c.id])) c.checklists = mapa[c.id]; });
        return cards;
      }).catch(function () { return cards; });
    });
  }

  /* Lê o board e devolve os itens prontos para as visões. */
  function lerItens(t, comChecklists) {
    return Promise.all([
      lerCards(t, comChecklists), t.lists('id', 'name'), t.board('customFields', 'members'), t.member('id', 'fullName')
    ]).then(function (r) {
      var membros = r[2].members || [];
      var itens = M.montarItens(r[0], {
        agora: new Date(), camposDef: r[2].customFields || [], listas: r[1], membros: membros
      }, M.config);
      return { itens: itens, cards: r[0], listas: r[1], camposDef: r[2].customFields || [], membros: membros, eu: r[3] || {} };
    });
  }

  function erro(e) {
    document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
  }

  M.ui = { lerCards: lerCards, prazoTxt: prazoTxt, el: el, dataCurta: dataCurta, textoDias: textoDias, linkCard: linkCard, kpi: kpi,
    copiar: copiar, tag: tag, lerItens: lerItens, erro: erro };
})();
