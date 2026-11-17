/* Monitor PMO - Mapa pessoa x fase (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarMapa(x.itens, x.listas.map(function (l) { return l.name; }));
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.linhas.length + ' linha(s) x ' + r.colunas.length + ' fase(s). Clique numa célula para ver os projetos.';
      if (!r.linhas.length) { box.appendChild(U.el('div', 'vazio', 'Nenhum projeto ativo.')); return; }
      var detalhe = U.el('div', 'detalhe-mapa');
      var tb = U.el('table', 'mapa');
      var cab = U.el('tr'); cab.appendChild(U.el('th', null, 'Pessoa'));
      r.colunas.forEach(function (c) { cab.appendChild(U.el('th', 'num', c)); });
      cab.appendChild(U.el('th', 'num', 'Total'));
      tb.appendChild(cab);
      r.linhas.forEach(function (l) {
        var tr = U.el('tr', l.semDono ? 'sem' : '');
        tr.appendChild(U.el('td', null, l.nome));
        l.celulas.forEach(function (c, k) {
          var td = U.el('td', 'cel ' + (c.cor || 'vazia'), c.n || '');
          if (c.n) {
            td.title = c.itens.map(function (i) { return i.name; }).join('\n');
            td.addEventListener('click', function () {
              detalhe.textContent = '';
              detalhe.appendChild(U.el('h2', null, l.nome + ' · ' + r.colunas[k]));
              c.itens.forEach(function (i) { var p = U.el('p'); p.appendChild(U.linkCard(t, i)); p.appendChild(U.tag(i.cor, i.cor === 'vermelho' ? 'crítico' : i.cor === 'amarelo' ? 'atenção' : 'em dia')); detalhe.appendChild(p); });
              t.sizeTo('body').catch(function () {});
            });
          }
          tr.appendChild(td);
        });
        tr.appendChild(U.el('td', 'num', l.total + (l.criticos ? ' (' + l.criticos + ' crít.)' : '')));
        tb.appendChild(tr);
      });
      var tot = U.el('tr', 'total'); tot.appendChild(U.el('td', null, 'Total'));
      r.totais.forEach(function (n) { tot.appendChild(U.el('td', 'num', n)); });
      tot.appendChild(U.el('td', 'num', ''));
      tb.appendChild(tot);
      box.appendChild(tb);
      box.appendChild(detalhe);
      box.appendChild(U.el('div', 'rodape', 'Cor da célula = pior saúde entre os projetos dela (vermelho crítico, amarelo atenção, verde em dia). Projeto com dois responsáveis aparece nos dois. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
