/* Monitor PMO - Novos projetos (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  function dataBR(iso) {
    var x = new Date(new Date(iso).getTime() + M.config.tzOffsetHoras * 3600000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(x.getUTCDate()) + '/' + p(x.getUTCMonth() + 1) + '/' + x.getUTCFullYear();
  }

  t.render(function () {
    return U.lerItens(t, true).then(function (x) {
      var r = M.montarNovos(x.cards, { agora: new Date(), camposDef: x.camposDef, listas: x.listas }, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.mes
        ? r.mes + ' projeto(s) criado(s) neste mês: ' + r.corretosMes + ' certo(s) e ' + r.ajusteMes + ' para ajustar.'
        : 'Nenhum projeto criado neste mês.';
      var kp = U.el('div', 'kpis');
      kp.appendChild(U.kpi('cinza', r.hoje, 'Criados hoje'));
      kp.appendChild(U.kpi('cinza', r.mes, 'Novos este mês'));
      kp.appendChild(U.kpi('verde', r.corretosMes, 'Criados corretamente'));
      kp.appendChild(U.kpi(r.ajusteMes ? 'vermelho' : 'cinza', r.ajusteMes, 'Precisam de ajuste'));
      box.appendChild(kp);

      box.appendChild(U.el('h2', null, 'Evolução mensal (últimos ' + M.config.novos.meses + ' meses)'));
      var max = r.serie.reduce(function (m, s) { return Math.max(m, s.total); }, 1);
      r.serie.forEach(function (s) {
        var l = U.el('div', 'cap-linha');
        l.appendChild(U.el('div', 'cap-rotulo', s.rotulo));
        var b = U.el('div', 'cap-barra');
        var a = U.el('i', 'verde'); a.style.width = Math.round(s.corretos / max * 100) + '%'; a.style.display = 'inline-block';
        var c = U.el('i', 'vermelho'); c.style.width = Math.round(s.ajuste / max * 100) + '%'; c.style.display = 'inline-block';
        b.appendChild(a); b.appendChild(c); l.appendChild(b);
        l.appendChild(U.el('div', 'cap-valor', s.total + ' (' + s.corretos + ' certos · ' + s.ajuste + ' ajustar)'));
        box.appendChild(l);
      });

      if (r.problemas.length) {
        box.appendChild(U.el('h2', null, 'Problemas mais recorrentes (onde orientar)'));
        r.problemas.slice(0, 8).forEach(function (p) {
          var d = U.el('div', 'suave', p.qtd + '× ' + p.texto); box.appendChild(d);
        });
      }
      if (r.areas.length) {
        box.appendChild(U.el('h2', null, 'Por área'));
        var tb = U.el('table'); var cab = U.el('tr');
        ['Área', 'Criados', 'Certos', 'Ajustar'].forEach(function (h, n) { cab.appendChild(U.el('th', n ? 'num' : null, h)); });
        tb.appendChild(cab);
        r.areas.forEach(function (a) {
          var tr = U.el('tr'); tr.appendChild(U.el('td', null, a.nome));
          [a.total, a.corretos, a.ajuste].forEach(function (v, n) { tr.appendChild(U.el('td', 'num' + (n === 2 && v ? ' alerta' : ''), v)); });
          tb.appendChild(tr);
        });
        box.appendChild(tb);
      }
      if (r.recentes.length) {
        box.appendChild(U.el('h2', null, 'Criados recentemente'));
        r.recentes.forEach(function (n) {
          var p = U.el('div', 'proj ' + (n.ok ? 'verde' : 'amarelo'));
          p.appendChild(U.linkCard(t, n));
          p.appendChild(U.el('span', 'suave', '  ' + n.lista + ' · criado em ' + dataBR(n.criadoEm)));
          if (!n.ok) { var tags = U.el('div'); n.faltando.slice(0, 6).forEach(function (f) { tags.appendChild(U.tag('amarelo', f)); }); p.appendChild(tags); }
          box.appendChild(p);
        });
      }
      box.appendChild(U.el('div', 'rodape', 'Data de criação lida do identificador do card. "Correto" = nenhum item do padrão PMO faltando (campos, descrição e, quando o Trello entrega, as checklists padrão). Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
