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

  /* Itens das checklists (com prazo) pela API REST do Trello, SOMENTE LEITURA, se a pessoa autorizou.
     Devolve 'ok', 'sem-autorizacao' ou 'erro: ...'. O token fica guardado pelo próprio Trello. */
  function lerChecklistsRest(t, cards) {
    var cfg = M.config.restApi;
    var api = t.getRestApi();
    return api.isAuthorized().then(function (ok) {
      if (!ok) return 'sem-autorizacao';
      return Promise.all([api.getToken(), t.board('id')]).then(function (r) {
        var url = 'https://api.trello.com/1/boards/' + r[1].id + '/checklists?checkItems=all' +
          '&checkItem_fields=name,state,due&fields=name,idCard&key=' + cfg.appKey + '&token=' + encodeURIComponent(r[0]);
        return fetch(url).then(function (resp) {
          if (!resp.ok) throw new Error('A API do Trello respondeu ' + resp.status);
          return resp.json();
        }).then(function (lista) { M.anexarChecklistsRest(cards, lista); return 'ok'; });
      });
    }).catch(function (e) { return 'erro: ' + (e && e.message ? e.message : e); });
  }

  function autorizarRest(t) {
    var cfg = M.config.restApi;
    return t.getRestApi().authorize({ scope: cfg.escopo, expiration: cfg.expiracao, name: cfg.appName });
  }

  /* Lê o board e devolve os itens prontos para as visões. Com `usarRest`, tenta completar as
     checklists pela API (somente leitura) e devolve o estado em `rest` ('ok', 'sem-autorizacao' ou 'erro: ...'). */
  function lerItens(t, comChecklists, usarRest) {
    return lerCards(t, comChecklists).then(function (cards) {
      var rest = usarRest ? lerChecklistsRest(t, cards) : Promise.resolve(null);
      return rest.then(function (estado) {
        return Promise.all([t.lists('id', 'name'), t.board('customFields', 'members'), t.member('id', 'fullName')]).then(function (r) {
          var membros = r[1].members || [];
          var itens = M.montarItens(cards, {
            agora: new Date(), camposDef: r[1].customFields || [], listas: r[0], membros: membros
          }, M.config);
          return { itens: itens, cards: cards, listas: r[0], camposDef: r[1].customFields || [],
            membros: membros, eu: r[2] || {}, rest: estado };
        });
      });
    });
  }

  function erro(e) {
    document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
  }

  M.ui = { autorizarRest: autorizarRest, lerCards: lerCards, prazoTxt: prazoTxt, el: el, dataCurta: dataCurta, textoDias: textoDias, linkCard: linkCard, kpi: kpi,
    copiar: copiar, tag: tag, lerItens: lerItens, erro: erro };
})();
