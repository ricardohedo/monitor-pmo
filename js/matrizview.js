/* Monitor PMO - Matriz impacto x esforço (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var estado = { dados: null, bruto: null, nomeBoard: '', incluirPausados: false };

  var NIVEIS = [['alto', 'Alto'], ['medio', 'Médio'], ['baixo', 'Baixo']];
  var CLASSE_QUADRANTE = {
    'alto|baixo': 'q-fazer', 'alto|alto': 'q-planejar', 'baixo|baixo': 'q-vitoria', 'baixo|alto': 'q-reavaliar'
  };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  function classePrioridade(p) {
    var n = String(p || '').toLowerCase();
    return n.indexOf('m') === 0 && n.indexOf('x') !== -1 ? 'max' : n === 'alta' ? 'alta' : '';
  }

  function itemDaCelula(i) {
    var li = el('div', 'it');
    var d = el('span', 'dot ' + i.cor);
    d.title = i.motivos.join(' | ');
    li.appendChild(d);
    var corpo = el('div');
    var a = el('a', 'card', i.name);
    a.title = i.name + '\n' + i.motivos.join(' | ');
    a.addEventListener('click', function () { t.showCard(i.id); });
    corpo.appendChild(a);
    if (i.prioridade) corpo.appendChild(el('span', 'pri ' + classePrioridade(i.prioridade), i.prioridade));
    li.appendChild(corpo);
    return li;
  }

  function celula(d, imp, esf) {
    var chave = imp + '|' + esf;
    var itens = d.celulas[imp][esf];
    var c = el('div', 'cel ' + (CLASSE_QUADRANTE[chave] || ''));
    var tit = el('div', 'tit');
    tit.appendChild(el('b', null, d.quadrantes[chave] || ''));
    tit.appendChild(el('span', null, String(itens.length)));
    c.appendChild(tit);
    var box = el('div', 'itens');
    if (!itens.length) box.appendChild(el('div', 'vazio-cel', 'nenhum projeto'));
    itens.forEach(function (i) { box.appendChild(itemDaCelula(i)); });
    c.appendChild(box);
    return c;
  }

  function grade(d) {
    var g = el('div', 'mx');
    g.appendChild(el('div'));
    NIVEIS.slice().reverse().forEach(function (e) { g.appendChild(el('div', 'cab', 'Esforço ' + e[1].toLowerCase())); });
    NIVEIS.forEach(function (i) {
      g.appendChild(el('div', 'cab lado', 'Impacto ' + i[1].toLowerCase()));
      // colunas: esforço baixo, médio, alto
      ['baixo', 'medio', 'alto'].forEach(function (e) { g.appendChild(celula(d, i[0], e)); });
    });
    return g;
  }

  function legenda() {
    var l = el('div', 'legenda');
    [['verde', 'em dia'], ['amarelo', 'atenção'], ['vermelho', 'crítico'], ['cinza', 'pausado']].forEach(function (x) {
      var s = el('span'); s.appendChild(el('i', 'd ' + x[0])); s.appendChild(document.createTextNode(x[1])); l.appendChild(s);
    });
    l.appendChild(el('span', null, 'Ponto = saúde do projeto. Dentro de cada quadrante, os mais prioritários aparecem primeiro.'));
    return l;
  }

  function semClassificar(d) {
    if (!d.semClassificar.length) return null;
    var box = el('div', 'semclass');
    box.appendChild(el('h2', null, 'Sem classificar (' + d.semClassificar.length + ')'));
    var ul = el('ul');
    d.semClassificar.forEach(function (i) {
      var li = el('li');
      var a = el('a', 'card', i.name);
      a.addEventListener('click', function () { t.showCard(i.id); });
      li.appendChild(a);
      li.appendChild(el('span', 'suave', '[' + i.lista + (i.pausado ? ', pausado' : '') + '] falta: ' + i.falta.join(' e ')));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  function desenhar() {
    var d = estado.dados;
    var box = document.getElementById('conteudo');
    box.textContent = '';
    box.appendChild(grade(d));
    box.appendChild(legenda());
    var sc = semClassificar(d);
    if (sc) box.appendChild(sc);
    t.sizeTo('body').catch(function () {});
  }

  function montar() {
    var b = estado.bruto;
    estado.dados = M.montarMatriz(b.cards, {
      agora: new Date(), camposDef: b.camposDef, listas: b.listas, incluirPausados: estado.incluirPausados
    }, M.config);
    document.getElementById('titulo').textContent = 'Matriz impacto × esforço - ' + estado.nomeBoard;
    document.getElementById('sub').textContent = estado.dados.classificados + ' classificados de ' + estado.dados.total;
    desenhar();
  }

  t.render(function () {
    return Promise.all([
      t.cards('all'),
      t.lists('id', 'name'),
      t.board('name', 'customFields')
    ]).then(function (r) {
      estado.nomeBoard = r[2].name || 'Board';
      estado.bruto = { cards: r[0], listas: r[1], camposDef: r[2].customFields || [] };
      montar();
    }).catch(function (e) {
      document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
    });
  });

  document.getElementById('pausados').addEventListener('change', function (ev) {
    estado.incluirPausados = ev.target.checked;
    if (estado.bruto) montar();
  });
})();
