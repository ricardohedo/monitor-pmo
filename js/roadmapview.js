/* Monitor PMO - Roadmap do portfólio (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var estado = { dados: null, nomeBoard: '', mostrarVarejo: true, incluirPausados: false, bruto: null };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  function posicionar(e, left, width) {
    e.style.left = left + '%';
    if (width !== undefined) e.style.width = width + '%';
  }

  function trilhaVazia() { return el('div', 'trilha'); }

  function cabecalho(d) {
    var box = el('div', 'cab');

    var meses = el('div', 'linha meses');
    meses.appendChild(el('div', 'nome'));
    var trilhaM = trilhaVazia();
    trilhaM.style.height = '22px';
    var total = d.janela.fim - d.janela.ini;
    d.janela.meses.forEach(function (m) {
      var x = el('div', 'mes', m.nome);
      posicionar(x, (m.ini - d.janela.ini) / total * 100, (m.fim - m.ini) / total * 100);
      trilhaM.appendChild(x);
    });
    meses.appendChild(trilhaM);
    box.appendChild(meses);

    var faixa = el('div', 'linha faixa-marcos');
    faixa.appendChild(el('div', 'nome'));
    var trilhaF = trilhaVazia();
    trilhaF.style.height = '34px';
    if (estado.mostrarVarejo) {
      d.marcos.forEach(function (m, i) {
        var r = el('div', 'marco-rot' + (i % 2 ? ' baixo' : ''), m.nome + ' ' + M.dataCurta(m.chave));
        r.title = m.nome + ' - ' + M.dataCurta(m.chave);
        posicionar(r, m.left);
        trilhaF.appendChild(r);
      });
    }
    faixa.appendChild(trilhaF);
    box.appendChild(faixa);
    return box;
  }

  function textoBarra(i) {
    return i.rotulo === 'Em dia' ? '' : i.rotulo;
  }

  function linhaProjeto(i) {
    var linha = el('div', 'linha');
    var nome = el('div', 'nome');
    var a = el('a', 'card', i.name);
    a.title = i.name;
    a.addEventListener('click', function () { t.showCard(i.id); });
    nome.appendChild(a);
    nome.appendChild(el('small', null, M.dataCurta(i.kIni) + ' → ' + M.dataCurta(i.kFim) +
      (i.progresso !== null ? ' · ' + Math.round(i.progresso * 100) + '% feito' : '')));
    linha.appendChild(nome);

    var trilha = trilhaVazia();
    var b = el('div', 'barra-rm ' + i.cor + (i.cortaEsq ? ' corta-esq' : '') + (i.cortaDir ? ' corta-dir' : ''));
    posicionar(b, i.left, i.width);
    b.title = i.name + '\n' + M.dataCurta(i.kIni) + ' → ' + M.dataCurta(i.kFim) +
      (i.progresso !== null ? '\n' + Math.round(i.progresso * 100) + '% das checklists' : '') +
      '\n' + i.motivos.join(' | ');
    if (i.progresso !== null) {
      var f = el('div', 'feito');
      f.style.width = Math.round(i.progresso * 100) + '%';
      b.appendChild(f);
    }
    var tx = textoBarra(i);
    if (tx) b.appendChild(el('span', null, tx));
    b.addEventListener('click', function () { t.showCard(i.id); });
    trilha.appendChild(b);
    linha.appendChild(trilha);
    return linha;
  }

  function eixo(d) {
    var e = el('div', 'eixo');
    var total = d.janela.fim - d.janela.ini;
    d.janela.meses.forEach(function (m) {
      var v = el('div', 'vlinha');
      posicionar(v, (m.ini - d.janela.ini) / total * 100);
      e.appendChild(v);
    });
    if (estado.mostrarVarejo) {
      d.marcos.forEach(function (m) {
        var v = el('div', 'vlinha marco');
        posicionar(v, m.left);
        e.appendChild(v);
      });
    }
    if (d.hojeLeft !== null) {
      var h = el('div', 'vlinha hoje');
      posicionar(h, d.hojeLeft);
      e.appendChild(h);
      var r = el('div', 'hoje-rot', 'hoje');
      posicionar(r, d.hojeLeft);
      e.appendChild(r);
    }
    return e;
  }

  function legenda() {
    var l = el('div', 'legenda');
    [['l-verde', 'em dia'], ['l-amarelo', 'atenção'], ['l-vermelho', 'crítico'], ['l-cinza', 'pausado']].forEach(function (x) {
      var s = el('span'); s.appendChild(el('i', x[0])); s.appendChild(document.createTextNode(x[1])); l.appendChild(s);
    });
    var h = el('span'); h.appendChild(el('i', 'l-hoje')); h.appendChild(document.createTextNode('hoje')); l.appendChild(h);
    var m = el('span'); m.appendChild(el('i', 'l-marco')); m.appendChild(document.createTextNode('data do varejo')); l.appendChild(m);
    l.appendChild(el('span', null, 'Parte escura = progresso das checklists. Clique numa barra para abrir o card.'));
    return l;
  }

  function semDatas(d) {
    if (!d.semDatas.length) return null;
    var box = el('div', 'semdatas');
    box.appendChild(el('h2', null, 'Sem datas, fora do roadmap (' + d.semDatas.length + ')'));
    var ul = el('ul');
    d.semDatas.forEach(function (s) {
      var li = el('li');
      var a = el('a', 'card', s.name);
      a.addEventListener('click', function () { t.showCard(s.id); });
      li.appendChild(a);
      li.appendChild(el('span', 'suave', '[' + s.lista + (s.pausado ? ', pausado' : '') + '] falta: ' + s.falta));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  function desenhar() {
    var d = estado.dados;
    var box = document.getElementById('conteudo');
    box.textContent = '';
    if (!d.total) {
      box.appendChild(el('div', 'vazio', 'Nenhum projeto ativo com Início e Fim planejados.'));
    } else {
      var rm = el('div', 'rm');
      rm.appendChild(cabecalho(d));
      d.grupos.forEach(function (g) {
        rm.appendChild(el('div', 'grupo', g.lista + ' (' + g.itens.length + ')'));
        g.itens.forEach(function (i) { rm.appendChild(linhaProjeto(i)); });
      });
      rm.appendChild(eixo(d));
      box.appendChild(rm);
      box.appendChild(legenda());
    }
    var sd = semDatas(d);
    if (sd) box.appendChild(sd);
    t.sizeTo('body').catch(function () {});
  }

  function montar() {
    var b = estado.bruto;
    estado.dados = M.montarRoadmap(b.cards, {
      agora: new Date(), camposDef: b.camposDef, listas: b.listas,
      incluirPausados: estado.incluirPausados
    }, M.config);
    document.getElementById('titulo').textContent = 'Roadmap - ' + estado.nomeBoard;
    document.getElementById('sub').textContent = estado.dados.total + ' projetos com datas';
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

  document.getElementById('varejo').addEventListener('change', function (ev) {
    estado.mostrarVarejo = ev.target.checked;
    if (estado.dados) desenhar();
  });
  document.getElementById('pausados').addEventListener('change', function (ev) {
    estado.incluirPausados = ev.target.checked;
    if (estado.bruto) montar();
  });
})();
