/* Monitor PMO - Painel da diretoria (tela). Somente leitura; atualiza sozinho a cada 5 minutos. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var SEMAFORO = { verde: 'Portfólio saudável', amarelo: 'Portfólio em atenção', vermelho: 'Portfólio crítico' };

  function carregar() {
    return Promise.all([U.lerItens(t), t.board('name')]).then(function (r) {
      var d = M.montarDiretoria(r[0].itens, M.config, new Date());
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var topo = U.el('div', 'dir-topo ' + d.semaforo);
      topo.appendChild(U.el('div', 'dir-sem', SEMAFORO[d.semaforo]));
      topo.appendChild(U.el('div', 'dir-board', r[1].name + ' · ' + new Date().toLocaleDateString('pt-BR')));
      box.appendChild(topo);
      var g = U.el('div', 'dir-grade');
      d.numeros.forEach(function (n) {
        var c = U.el('div', 'dir-num ' + n.cor);
        c.appendChild(U.el('b', null, n.valor));
        c.appendChild(U.el('span', null, n.rotulo));
        g.appendChild(c);
      });
      box.appendChild(g);
      var f = U.el('ul', 'dir-frases');
      d.frases.forEach(function (x) { f.appendChild(U.el('li', null, x)); });
      box.appendChild(f);
      box.appendChild(U.el('div', 'rodape', 'Atualiza sozinho a cada 5 minutos. Semáforo: em dia ≥ ' + M.config.diretoria.verdeMin + '% verde, ≥ ' + M.config.diretoria.amareloMin + '% amarelo. Só leitura.'));
      document.getElementById('resumo').textContent = '';
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  }

  t.render(function () { return carregar(); });
  setInterval(carregar, 5 * 60 * 1000);
})();
