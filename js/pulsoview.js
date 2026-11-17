/* Monitor PMO - Pulso do quadro (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarPulso(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var lim = M.config.pulso.diasMovimento;
      document.getElementById('resumo').textContent = r.movimentados + ' de ' + r.total + ' projetos tiveram movimento nos últimos ' + lim + ' dias · ' + r.parados + ' em silêncio.';
      var kp = U.el('div', 'kpis');
      kp.appendChild(U.kpi('verde', r.movimentados, 'Mexidos em ' + lim + ' dias'));
      kp.appendChild(U.kpi(r.parados ? 'amarelo' : 'verde', r.parados, 'Em silêncio'));
      if (r.semDados) kp.appendChild(U.kpi('cinza', r.semDados, 'Sem data de atividade'));
      box.appendChild(kp);

      r.grupos.forEach(function (g) {
        box.appendChild(U.el('h2', null, g.titulo + ' (' + g.itens.length + ')'));
        g.itens.forEach(function (i) {
          var p = U.el('div', 'proj ' + (g.id === 'muito' ? 'vermelho' : g.id === 'parado' ? 'amarelo' : 'verde'));
          p.appendChild(U.linkCard(t, i));
          p.appendChild(U.el('span', 'suave', '  ' + i.lista + ' · ' + (i.responsaveis.join(', ') || 'sem responsável') + ' · ' + (i.parado === 0 ? 'hoje' : i.parado + 'd sem movimento')));
          box.appendChild(p);
        });
      });

      if (r.porPessoa.length) {
        box.appendChild(U.el('h2', null, 'Silêncio por pessoa'));
        var tb = U.el('table'); var cab = U.el('tr');
        ['Pessoa', 'Projetos', 'Parado em média', 'Em silêncio', 'Mais parado'].forEach(function (h, n) { cab.appendChild(U.el('th', n && n < 4 ? 'num' : null, h)); });
        tb.appendChild(cab);
        r.porPessoa.forEach(function (p) {
          var tr = U.el('tr', p.semDono ? 'sem' : '');
          tr.appendChild(U.el('td', null, p.nome));
          tr.appendChild(U.el('td', 'num', p.projetos));
          tr.appendChild(U.el('td', 'num', p.paradoMedio + 'd'));
          tr.appendChild(U.el('td', 'num' + (p.parados ? ' alerta' : ''), p.parados));
          var c = U.el('td'); c.appendChild(U.linkCard(t, p.maisParado)); c.appendChild(U.el('span', 'dias', p.maisParado.dias + 'd')); tr.appendChild(c);
          tb.appendChild(tr);
        });
        box.appendChild(tb);
      }
      box.appendChild(U.el('div', 'rodape', 'Movimento = última atividade do card no Trello (comentário, mudança de campo, marcação de item, movimentação). Silêncio não é culpa: pode ser projeto em espera. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
