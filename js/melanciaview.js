/* Monitor PMO - Projetos melancia (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe({ appKey: M.config.restApi.appKey, appName: M.config.restApi.appName });

  t.render(function () {
    return U.lerItens(t, true, true).then(function (x) {
      var r = M.montarMelancia(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.itens.length
        ? r.itens.length + ' de ' + r.totalVerdes + ' projetos verdes (' + r.pct + '%) têm problemas escondidos.'
        : 'Nenhum projeto verde com problema escondido.';
      box.appendChild(U.el('div', 'dica', 'Projeto melancia: verde por fora, vermelho por dentro. O semáforo olha prazo, responsável e movimento; esta tela olha o que o semáforo não vê (cadastro, prioridade, checklist). Verde só vale se estiver limpo por dentro.'));
      if (r.semDadosChecklist) box.appendChild(U.el('div', 'aviso', 'Os itens das checklists não foram lidos (falta autorizar a leitura em Planejamento PMO > Checklists): o sinal "itens sem prazo" não é avaliado.'));
      r.itens.forEach(function (i) {
        var p = U.el('div', 'proj amarelo');
        p.appendChild(U.linkCard(t, i));
        p.appendChild(U.el('span', 'suave', '  ' + i.lista + ' · ' + (i.responsaveis.join(', ') || 'sem responsável')));
        var tags = U.el('div'); i.sinais.forEach(function (s) { tags.appendChild(U.tag('amarelo', s)); }); p.appendChild(tags);
        box.appendChild(p);
      });
      box.appendChild(U.el('div', 'rodape', 'Mínimo de ' + M.config.melancia.minSinais + ' sinais para entrar na lista (config.melancia). Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
