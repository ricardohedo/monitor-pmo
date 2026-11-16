/* Monitor PMO - painel do board (RF-002 + RF-008). Somente leitura. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var estado = { resumo: null, nomeBoard: '', aba: 'atencao', agora: new Date() };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  function kpi(cor, valor, rotulo) {
    var d = el('div', 'kpi ' + cor);
    d.appendChild(el('b', null, valor));
    d.appendChild(el('span', null, rotulo));
    return d;
  }

  function tabela(colunas, linhas) {
    var tb = el('table');
    var tr = el('tr');
    colunas.forEach(function (c) { tr.appendChild(el('th', c.num ? 'num' : null, c.nome)); });
    var th = el('thead'); th.appendChild(tr); tb.appendChild(th);
    var body = el('tbody');
    linhas.forEach(function (l) { body.appendChild(l); });
    tb.appendChild(body);
    return tb;
  }

  function celula(conteudo, num) {
    var td = el('td', num ? 'num' : null);
    if (conteudo && conteudo.nodeType) td.appendChild(conteudo);
    else td.textContent = conteudo === undefined || conteudo === null ? '' : conteudo;
    return td;
  }

  function abaAtencao(r) {
    if (!r.atencao.length) return el('div', 'vazio', 'Nenhum card pede atenção. Tudo em dia.');
    var linhas = r.atencao.map(function (a) {
      var tr = el('tr');
      var link = el('a', 'card', a.name);
      link.addEventListener('click', function () { t.showCard(a.id); });
      var c1 = el('div'); c1.appendChild(link);
      c1.appendChild(el('div', 'suave', a.lista + (a.responsaveis.length ? ' · ' + a.responsaveis.join(', ') : '')));
      tr.appendChild(celula(c1));
      var tags = el('div');
      a.motivos.forEach(function (m, i) {
        // os primeiros motivos têm a cor do card; o restante é amarelo
        tags.appendChild(el('span', 'tag ' + (i === 0 ? a.cor : 'amarelo'), m));
      });
      tr.appendChild(celula(tags));
      return tr;
    });
    return tabela([{ nome: 'Card' }, { nome: 'Motivos' }], linhas);
  }

  function abaPessoas(r) {
    var linhas = r.porMembro.map(function (m) {
      var tr = el('tr');
      tr.appendChild(celula(m.nome));
      tr.appendChild(celula(m.ativos, true));
      tr.appendChild(celula(m.vermelhos || '-', true));
      tr.appendChild(celula(m.amarelos || '-', true));
      return tr;
    });
    return tabela([{ nome: 'Responsável' }, { nome: 'Ativos', num: true },
      { nome: 'Críticos', num: true }, { nome: 'Atenção', num: true }], linhas);
  }

  function abaListas(r) {
    var linhas = r.porLista.map(function (l) {
      var tr = el('tr');
      tr.appendChild(celula(l.nome));
      tr.appendChild(celula(l.total, true));
      tr.appendChild(celula(l.vermelho || '-', true));
      tr.appendChild(celula(l.amarelo || '-', true));
      tr.appendChild(celula(l.verde || '-', true));
      return tr;
    });
    return tabela([{ nome: 'Lista' }, { nome: 'Cards', num: true }, { nome: 'Críticos', num: true },
      { nome: 'Atenção', num: true }, { nome: 'Em dia', num: true }], linhas);
  }

  function desenhar() {
    var r = estado.resumo;
    var box = document.getElementById('conteudo');
    box.textContent = '';

    var kp = el('div', 'kpis');
    kp.appendChild(kpi('vermelho', r.porCor.vermelho, 'Críticos'));
    kp.appendChild(kpi('amarelo', r.porCor.amarelo, 'Atenção'));
    kp.appendChild(kpi('verde', r.porCor.verde, 'Em dia (' + r.percentEmDia + '%)'));
    kp.appendChild(kpi('cinza', r.porCor.cinza, 'Concluídos/pausados'));
    box.appendChild(kp);

    var barra = el('div', 'barra');
    ['vermelho', 'amarelo', 'verde'].forEach(function (c) {
      var i = el('i', c);
      i.style.width = (r.ativos ? r.porCor[c] / r.ativos * 100 : 0) + '%';
      barra.appendChild(i);
    });
    box.appendChild(barra);

    var info = [];
    if (r.semResponsavel) info.push(r.semResponsavel + ' card(s) ativo(s) sem responsável');
    if (r.padraoMedio !== null) info.push('Aderência ao padrão PMO: ' + r.padraoMedio + '%');
    if (info.length) box.appendChild(el('div', 'aviso', info.join('  ·  ')));

    var abas = el('div', 'abas');
    [['atencao', 'Requer atenção (' + r.atencao.length + ')'],
     ['pessoas', 'Por pessoa'], ['listas', 'Por lista']].forEach(function (a) {
      var b = el('button', a[0] === estado.aba ? 'ativo' : '', a[1]);
      b.type = 'button';
      b.addEventListener('click', function () { estado.aba = a[0]; desenhar(); });
      abas.appendChild(b);
    });
    box.appendChild(abas);

    box.appendChild(estado.aba === 'atencao' ? abaAtencao(r)
      : estado.aba === 'pessoas' ? abaPessoas(r) : abaListas(r));
    t.sizeTo('body').catch(function () {});
  }

  function copiar() {
    var texto = M.textoResumo(estado.resumo, estado.nomeBoard, estado.agora, 10);
    var btn = document.getElementById('copiar');
    function ok() { btn.textContent = 'Copiado!'; setTimeout(function () { btn.textContent = 'Copiar resumo'; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (err) { btn.textContent = 'Não foi possível copiar (' + err.message + ')'; }
      document.body.removeChild(ta);
    }
  }

  t.render(function () {
    return Promise.all([
      t.cards('all'),
      t.lists('id', 'name'),
      t.board('name', 'customFields', 'members')
    ]).then(function (r) {
      var cards = r[0], listas = r[1], b = r[2];
      estado.agora = new Date();
      estado.nomeBoard = b.name || 'Board';
      estado.resumo = M.resumir(cards, {
        agora: estado.agora, camposDef: b.customFields || [],
        listas: listas, membros: b.members || []
      }, M.config);
      document.getElementById('titulo').textContent = 'Monitor PMO - ' + estado.nomeBoard;
      document.getElementById('sub').textContent = estado.resumo.avaliados + ' cards avaliados';
      desenhar();
    }).catch(function (e) {
      document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
    });
  });

  document.getElementById('copiar').addEventListener('click', function () {
    if (estado.resumo) copiar();
  });
})();
