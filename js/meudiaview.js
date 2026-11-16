/* Monitor PMO - "Meu dia" (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var estado = { bruto: null, membros: [], eu: null, gestorId: null };

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
    if (d === null) return '';
    if (d < 0) return 'vencido há ' + Math.abs(d) + 'd';
    if (d === 0) return 'hoje';
    return 'em ' + d + 'd';
  }

  function kpi(cor, valor, rotulo) {
    var k = el('div', 'kpi est ' + cor);
    k.appendChild(el('b', null, valor));
    k.appendChild(el('span', null, rotulo));
    return k;
  }

  function linkCard(i) {
    var a = el('a', 'card', i.name);
    a.addEventListener('click', function () { t.showCard(i.id); });
    return a;
  }

  function agenda(r) {
    if (!r.agenda.length) return null;
    var box = el('div');
    box.appendChild(el('h2', null, 'Agenda de prazos (vencidos e próximos ' + M.config.meuDia.diasAgenda + ' dias)'));
    var tb = el('table', 'agenda');
    var body = el('tbody');
    r.agenda.forEach(function (i) {
      var tr = el('tr');
      var d = el('td', 'dia' + (i.diasPrazo < 0 ? ' venc' : ''), dataCurta(i.prazo));
      d.appendChild(el('span', 'dias', textoDias(i.diasPrazo)));
      tr.appendChild(d);
      var c = el('td'); c.appendChild(linkCard(i)); c.appendChild(el('div', 'suave', i.lista));
      tr.appendChild(c);
      body.appendChild(tr);
    });
    tb.appendChild(body);
    box.appendChild(tb);
    return box;
  }

  function projetos(r) {
    var box = el('div');
    box.appendChild(el('h2', null, 'Meus projetos (' + r.total + ')'));
    r.itens.forEach(function (i) {
      var p = el('div', 'proj ' + i.cor);
      var l1 = el('div', 'linha1');
      l1.appendChild(linkCard(i));
      l1.appendChild(el('span', 'suave', i.lista));
      p.appendChild(l1);
      var tags = el('div');
      i.motivos.forEach(function (m, k) { tags.appendChild(el('span', 'tag ' + (k === 0 ? i.cor : 'amarelo'), m)); });
      p.appendChild(tags);
      if (i.progresso !== null) {
        var pr = el('div', 'prog'); var b = el('i');
        b.style.width = Math.round(i.progresso * 100) + '%';
        pr.appendChild(b); pr.title = Math.round(i.progresso * 100) + '% das checklists';
        p.appendChild(pr);
      }
      box.appendChild(p);
    });
    return box;
  }

  function desenhar() {
    var b = estado.bruto;
    var agora = new Date();
    var r = M.montarMeuDia(b.cards, { agora: agora, camposDef: b.camposDef, listas: b.listas },
      M.config, estado.gestorId);
    var gestor = estado.membros.filter(function (m) { return m.id === estado.gestorId; })[0];
    var nome = gestor ? (gestor.fullName || gestor.username) : '';
    document.getElementById('frase').textContent = M.fraseMeuDia(r, nome, agora, M.config.tzOffsetHoras);

    var box = document.getElementById('conteudo');
    box.textContent = '';
    if (!r.total) {
      box.appendChild(el('div', 'vazio', 'Nada por aqui. Cards só aparecem quando a pessoa é responsável por eles.'));
    } else {
      var kp = el('div', 'kpis');
      kp.appendChild(kpi('vermelho', r.porCor.vermelho, 'Críticos'));
      kp.appendChild(kpi('amarelo', r.porCor.amarelo, 'Atenção'));
      kp.appendChild(kpi('verde', r.porCor.verde, 'Em dia'));
      box.appendChild(kp);
      var ag = agenda(r);
      if (ag) box.appendChild(ag);
      box.appendChild(projetos(r));
    }
    t.sizeTo('body').catch(function () {});
  }

  function preencherSeletor() {
    var sel = document.getElementById('gestor');
    sel.textContent = '';
    estado.membros.forEach(function (m) {
      var o = el('option', null, m.fullName || m.username);
      o.value = m.id;
      if (m.id === estado.gestorId) o.selected = true;
      sel.appendChild(o);
    });
  }

  t.render(function () {
    return Promise.all([
      t.cards('all'),
      t.lists('id', 'name'),
      t.board('customFields', 'members'),
      t.member('id', 'fullName')
    ]).then(function (r) {
      estado.bruto = { cards: r[0], listas: r[1], camposDef: r[2].customFields || [] };
      estado.membros = r[2].members || [];
      estado.eu = r[3] || {};
      var ehMembro = estado.membros.some(function (m) { return m.id === estado.eu.id; });
      estado.gestorId = estado.gestorId || (ehMembro ? estado.eu.id : (estado.membros[0] || {}).id);
      preencherSeletor();
      desenhar();
    }).catch(function (e) {
      document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
    });
  });

  document.getElementById('gestor').addEventListener('change', function (ev) {
    estado.gestorId = ev.target.value;
    if (estado.bruto) desenhar();
  });
})();
