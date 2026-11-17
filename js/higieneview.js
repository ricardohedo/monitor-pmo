/* Monitor PMO - Higiene do quadro (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarHigiene(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.total
        ? r.total + ' registro(s) que não se sustentam em ' + r.grupos.length + ' categoria(s).'
        : 'Quadro em ordem: nada para arrumar nestas regras.';
      r.grupos.forEach(function (g) {
        box.appendChild(U.el('h2', null, g.titulo + ' (' + g.itens.length + ')'));
        box.appendChild(U.el('p', 'suave', 'O que fazer: ' + g.acao));
        g.itens.forEach(function (i) {
          var p = U.el('div', 'proj amarelo');
          p.appendChild(U.linkCard(t, i));
          p.appendChild(U.el('span', 'suave', '  ' + i.lista + (i.responsaveis.length ? ' · ' + i.responsaveis.join(', ') : '') + (i.detalhe ? ' · ' + i.detalhe : '')));
          box.appendChild(p);
        });
      });
      box.appendChild(U.el('div', 'rodape', 'Evidência: entrega dos últimos ' + M.config.higiene.diasEvidencia + ' dias precisa de ' + M.config.higiene.minimoAnexos + ' anexo(s) no card. A data da entrega é a da última atividade. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
