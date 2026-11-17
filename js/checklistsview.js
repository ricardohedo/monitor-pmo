/* Monitor PMO - Checklists (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe({ appKey: M.config.restApi.appKey, appName: M.config.restApi.appName });
  var todos = null, fase = '', restEstado = null;

  function pct(n) { return Math.round(n * 100) + '%'; }

  function desenhar() {
    var itens = fase ? todos.filter(function (i) { return i.lista === fase; }) : todos;
    var r = M.montarChecklists(itens);
    var box = document.getElementById('conteudo');
    box.textContent = '';
    document.getElementById('resumo').textContent = r.total
      ? r.total + ' itens de checklist em ' + r.projetos.length + ' projetos ativos · ' + r.vencidos + ' vencidos · ' + r.semPrazo + ' sem prazo'
      : 'Nenhum item de checklist nos projetos ativos.';
    if (!r.disponivel) {
      var av = U.el('div', 'aviso');
      if (restEstado === 'sem-autorizacao') {
        av.appendChild(document.createTextNode('Para ver itens vencidos e sem prazo, autorize a leitura dos itens pela API do Trello (somente leitura: o Power-Up não altera nada). '));
        var b = U.el('button', 'ativo', 'Autorizar leitura');
        b.type = 'button';
        b.addEventListener('click', function () {
          U.autorizarRest(t).then(function () { carregar(); }).catch(function (e) {
            av.appendChild(U.el('div', 'suave', 'Não foi possível autorizar: ' + (e && e.message ? e.message : e)));
          });
        });
        av.appendChild(b);
      } else if (restEstado && restEstado.indexOf('erro') === 0) {
        av.appendChild(document.createTextNode('Não consegui ler os itens pela API (' + restEstado + '). Mostrando só a contagem de itens feitos.'));
      } else {
        av.appendChild(document.createTextNode('O Trello não entregou os itens das checklists: aparece só a contagem de itens feitos, sem prazo por item.'));
      }
      box.appendChild(av);
    }
    var kp = U.el('div', 'kpis');
    kp.appendChild(U.kpi('verde', r.feitos, 'Itens concluídos'));
    kp.appendChild(U.kpi('amarelo', r.pendentes, 'Itens pendentes'));
    kp.appendChild(U.kpi('vermelho', r.disponivel ? r.vencidos : '-', 'Itens vencidos (' + r.projetosComVencido + ' proj.)'));
    kp.appendChild(U.kpi('cinza', r.disponivel ? r.semPrazo : '-', 'Itens sem prazo (' + r.projetosSemPrazo + ' proj.)'));
    kp.appendChild(U.kpi('cinza', r.progressoMedio + '%', 'Progresso médio'));
    box.appendChild(kp);

    if (r.porFase.length) {
      box.appendChild(U.el('h2', null, 'Por fase'));
      var tb = U.el('table'); var cab = U.el('tr');
      ['Fase', 'Projetos', 'Itens', 'Feitos', 'Vencidos'].forEach(function (h, n) { cab.appendChild(U.el('th', n ? 'num' : null, h)); });
      tb.appendChild(cab);
      r.porFase.forEach(function (f) {
        var tr = U.el('tr'); tr.appendChild(U.el('td', null, f.nome));
        [f.projetos, f.total, f.total ? pct(f.feitos / f.total) : '-', f.vencidos].forEach(function (v, n) {
          tr.appendChild(U.el('td', 'num' + (n === 3 && v ? ' alerta' : ''), v));
        });
        tb.appendChild(tr);
      });
      box.appendChild(tb);
    }

    if (r.projetos.length) {
      box.appendChild(U.el('h2', null, 'Projetos (pior primeiro)'));
      r.projetos.forEach(function (p) {
        var d = U.el('details', 'proj ' + (p.vencidos ? 'vermelho' : p.semPrazo ? 'amarelo' : 'verde'));
        var s = U.el('summary');
        s.appendChild(U.el('b', null, p.name));
        s.appendChild(U.el('span', 'suave', '  ' + p.lista + ' · ' + p.feitos + '/' + p.total + ' (' + pct(p.progresso) + ')' +
          (r.disponivel ? ' · ' + p.vencidos + ' vencido(s) · ' + p.semPrazo + ' sem prazo' : '')));
        d.appendChild(s);
        var barra = U.el('div', 'barra'); var b = U.el('i', 'verde'); b.style.width = pct(p.progresso); barra.appendChild(b);
        d.appendChild(barra);
        p.listas.forEach(function (l) {
          d.appendChild(U.el('div', 'suave', l.nome + ': ' + l.feitos + '/' + l.total + (l.vencidos ? ' · ' + l.vencidos + ' vencido(s)' : '') + (l.semPrazo ? ' · ' + l.semPrazo + ' sem prazo' : '')));
        });
        var a = U.linkCard(t, p); a.textContent = 'Abrir o card';
        d.appendChild(a);
        box.appendChild(d);
      });
    }

    if (r.concluidosIncompletos.length) {
      box.appendChild(U.el('h2', null, 'Concluídos sem 100% da checklist (' + r.concluidosIncompletos.length + ')'));
      r.concluidosIncompletos.forEach(function (c) {
        var p = U.el('p');
        p.appendChild(U.linkCard(t, c));
        p.appendChild(U.el('span', 'suave', ' - ' + c.feitos + ' de ' + c.total + ' itens' + (c.responsaveis.length ? ' · ' + c.responsaveis.join(', ') : '')));
        box.appendChild(p);
      });
    }
    box.appendChild(U.el('div', 'rodape', 'Item vencido = pendente com prazo anterior a hoje. Item sem prazo = pendente sem data. Itens lidos pela API do Trello, somente leitura, só para quem autorizou.'));
    t.sizeTo('body').catch(function () {});
  }

  function carregar() {
    return U.lerItens(t, true, true).then(function (x) {
      todos = x.itens; restEstado = x.rest;
      var sel = document.getElementById('fase'); sel.textContent = '';
      var o = U.el('option', null, 'Todas'); o.value = ''; sel.appendChild(o);
      x.listas.forEach(function (l) {
        if (!todos.some(function (i) { return i.lista === l.name; })) return;
        var op = U.el('option', null, l.name); op.value = l.name; if (l.name === fase) op.selected = true; sel.appendChild(op);
      });
      desenhar();
    }).catch(U.erro);
  }

  t.render(function () { return carregar(); });
  document.getElementById('fase').addEventListener('change', function (ev) { fase = ev.target.value; if (todos) desenhar(); });
})();
