/* Monitor PMO - Regras e como corrigir (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarRegras(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = 'As regras do jogo, com os números reais. ' + r.totalAfetados + ' de ' + r.ativos + ' projetos ativos têm pelo menos uma pendência hoje.';
      box.appendChild(U.el('div', 'dica', 'Estas são exatamente as regras que pintam o semáforo e geram os alertas. Os limites estão escritos aqui e valem para todos. Se um projeto aparece em alguma regra abaixo, a ação é do responsável.'));
      r.regras.forEach(function (g) {
        var sec = U.el('div', 'proj ' + g.cor);
        var topo = U.el('div', 'linha1');
        topo.appendChild(U.el('b', null, g.titulo));
        topo.appendChild(U.tag(g.afetados.length ? g.cor : 'verde', g.afetados.length ? g.afetados.length + (g.afetados.length === 1 ? ' projeto agora' : ' projetos agora') : 'ninguém agora'));
        sec.appendChild(topo);
        sec.appendChild(U.el('p', null, 'Regra: ' + g.regra));
        sec.appendChild(U.el('p', null, 'Como corrigir: ' + g.corrigir));
        sec.appendChild(U.el('p', 'suave', 'Quem resolve: ' + g.quem));
        if (g.afetados.length) {
          var d = U.el('details'); d.appendChild(U.el('summary', null, 'Ver os projetos'));
          g.afetados.forEach(function (a) {
            var p = U.el('p'); p.appendChild(U.linkCard(t, a)); p.appendChild(U.el('span', 'suave', ' - ' + a.responsaveis)); d.appendChild(p);
          });
          sec.appendChild(d);
        }
        box.appendChild(sec);
      });
      box.appendChild(U.el('div', 'rodape', 'Limites em js/config.js. Quando uma regra muda, esta tela muda junto: ela é gerada da mesma configuração do semáforo. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
