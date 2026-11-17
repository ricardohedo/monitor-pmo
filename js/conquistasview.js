/* Monitor PMO - Conquistas (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  function linha(box, i, sufixo) {
    var p = U.el('p');
    p.appendChild(U.linkCard(t, i));
    p.appendChild(U.el('span', 'suave', sufixo));
    box.appendChild(p);
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarConquistas(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.destaque ? r.destaque : 'Sem conquistas para destacar ainda.';
      box.appendChild(U.el('h2', null, 'Entregas dos últimos ' + M.config.conquistas.dias + ' dias (' + r.totalEntregas + ')'));
      if (!r.entregas.length) box.appendChild(U.el('p', 'suave', 'Nenhuma entrega registrada no período.'));
      r.entregas.forEach(function (i) {
        linha(box, i, ' - ' + (i.parado === 0 ? 'hoje' : 'há ' + i.parado + 'd') + (i.responsaveis.length ? ' · ' + i.responsaveis.join(', ') : ''));
      });
      box.appendChild(U.el('h2', null, 'Reta final (' + r.totalReta + ')'));
      if (!r.retaFinal.length) box.appendChild(U.el('p', 'suave', 'Nenhum projeto na reta final agora.'));
      r.retaFinal.forEach(function (i) {
        linha(box, i, ' - ' + Math.round(i.progresso * 100) + '% da checklist, faltam ' + (i.total - i.feitos));
      });
      box.appendChild(U.el('div', 'rodape', 'Conquistas da área, não de pessoas. A data da entrega é a da última atividade do card (o Trello não guarda quando foi movido para Concluídos). Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
