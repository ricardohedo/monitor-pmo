/* Monitor PMO - Tendência (tela).
   Lê os cards (somente leitura). A única escrita é o registro diário compacto no
   armazenamento do PRÓPRIO Power-Up (t.set 'board'/'shared'); nada muda em cards, etiquetas ou campos. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var CHAVE = 'monitorSerie';
  var SVG = 'http://www.w3.org/2000/svg';

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }
  function sv(tag, attrs) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function grafico(serie) {
    var W = 640, H = 190, mE = 30, mB = 22, mT = 6;
    var ultimos = serie.slice(-60);
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' });
    var area = H - mB - mT, larg = (W - mE) / Math.max(ultimos.length, 1);

    [0, 50, 100].forEach(function (v) {
      var y = mT + area - (v / 100) * area;
      svg.appendChild(sv('line', { x1: mE, x2: W, y1: y, y2: y, stroke: '#dfe1e6', 'stroke-width': 1 }));
      var tx = sv('text', { x: 2, y: y + 3, class: 'eixo' }); tx.textContent = v + '%';
      svg.appendChild(tx);
    });

    ultimos.forEach(function (p, i) {
      var total = p.v + p.a + p.g || 1, x = mE + i * larg + larg * 0.12, w = larg * 0.76, y = mT + area;
      [['g', '#4bce97', p.g], ['a', '#f5cd47', p.a], ['v', '#e2483d', p.v]].forEach(function (s) {
        var h = (s[2] / total) * area; y -= h;
        var r = sv('rect', { x: x, y: y, width: w, height: h, fill: s[1] });
        var tt = sv('title'); tt.textContent = M.diaParaISO(p.dia) + ': ' + p.v + ' críticos, ' + p.a + ' atenção, ' + p.g + ' em dia';
        r.appendChild(tt); svg.appendChild(r);
      });
      if (i === 0 || i === ultimos.length - 1) {
        var d = M.diaParaISO(p.dia), lab = sv('text', { x: x, y: H - 6, class: 'eixo' });
        lab.textContent = d.slice(8, 10) + '/' + d.slice(5, 7);
        svg.appendChild(lab);
      }
    });
    var box = el('div', 'grafico'); box.appendChild(svg);
    return box;
  }

  function legenda() {
    var l = el('div', 'leg');
    [['#e2483d', 'críticos'], ['#f5cd47', 'atenção'], ['#4bce97', 'em dia']].forEach(function (x) {
      var s = el('span'); var i = el('i'); i.style.background = x[0]; s.appendChild(i); s.appendChild(document.createTextNode(x[1])); l.appendChild(s);
    });
    return l;
  }

  function desenhar(serie, gravou, falhaGravar) {
    var box = document.getElementById('conteudo');
    box.textContent = '';
    var ul = el('ul', 'frases');
    M.resumoTendencia(serie).forEach(function (f) { ul.appendChild(el('li', null, f)); });
    box.appendChild(ul);
    if (serie.length >= 2) { box.appendChild(grafico(serie)); box.appendChild(legenda()); }
    var u = serie[serie.length - 1];
    if (u) box.appendChild(el('p', 'suave', 'Hoje: ' + u.v + ' críticos, ' + u.a + ' em atenção, ' + u.g + ' em dia (' + (M.pctEmDia(u) === null ? '-' : M.pctEmDia(u) + '%') + ').'));
    box.appendChild(el('div', 'aviso-t',
      'Como funciona: o Trello não guarda histórico. Cada vez que alguém abre esta tela ou o painel, o Monitor PMO grava um registro do dia ' +
      '(contagem de críticos, atenção e em dia) no armazenamento interno do Power-Up. Dias em que ninguém abre ficam sem registro. ' +
      'Nada é gravado em cards, etiquetas ou campos.' + (falhaGravar ? ' Atenção: não foi possível gravar o registro de hoje (' + falhaGravar + ').' : '')));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return Promise.all([
      t.cards('all'), t.lists('id', 'name'), t.board('name', 'customFields', 'members'),
      t.get('board', 'shared', CHAVE, '')
    ]).then(function (r) {
      var agora = new Date();
      var resumo = M.resumir(r[0], { agora: agora, camposDef: r[2].customFields || [], listas: r[1], membros: r[2].members || [] }, M.config);
      var serie = M.decodificar(r[3]);
      var ponto = M.pontoDoResumo(resumo, M.diaNumero(agora, M.config.tzOffsetHoras));
      var nova = M.registrar(serie, ponto);
      var mudou = M.codificar(nova) !== M.codificar(serie);

      document.getElementById('titulo').textContent = 'Tendência - ' + (r[2].name || 'Board');
      document.getElementById('sub').textContent = nova.length + (nova.length === 1 ? ' registro' : ' registros');

      if (!mudou) { desenhar(nova, false, null); return; }
      return t.set('board', 'shared', CHAVE, M.codificar(nova))
        .then(function () { desenhar(nova, true, null); })
        .catch(function (e) { desenhar(nova, false, e && e.message ? e.message : 'erro'); });
    }).catch(function (e) {
      document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
    });
  });
})();
