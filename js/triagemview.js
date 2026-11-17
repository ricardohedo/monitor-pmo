/* Monitor PMO - Triagem de demandas (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return Promise.all([t.cards('all'), t.lists('id', 'name'), t.board('customFields', 'members')]).then(function (x) {
      var r = M.montarTriagem(x[0], { agora: new Date(), camposDef: x[2].customFields || [], listas: x[1], membros: x[2].members || [] }, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.total
        ? r.total + ' demanda(s): ' + r.prontas + ' pronta(s) para priorizar · ' + r.esperando + ' esperando há mais de ' + M.config.triagem.diasEspera + ' dias.'
        : 'Nenhuma demanda nas listas de entrada agora.';
      if (!r.total) box.appendChild(U.el('div', 'nada', 'Fila de entrada vazia. Quando chegar demanda em NOVA DEMANDA, Backlog ou Priorizados, ela aparece aqui com o que falta para virar projeto.'));
      r.demandas.forEach(function (d) {
        var p = U.el('div', 'proj ' + (d.pronta ? 'verde' : d.esperandoDemais ? 'vermelho' : 'amarelo'));
        var l1 = U.el('div', 'linha1');
        l1.appendChild(U.linkCard(t, d));
        l1.appendChild(U.el('span', 'suave', d.lista + (d.espera !== null ? ' · ' + d.espera + 'd sem movimento' : '')));
        p.appendChild(l1);
        var tags = U.el('div');
        if (d.pronta) tags.appendChild(U.tag('verde', 'pronta para priorizar'));
        if (d.pausado) tags.appendChild(U.tag('cinza', 'pausada'));
        if (d.quadrante) tags.appendChild(U.tag('verde', 'sugestão: ' + d.quadrante));
        if (d.esperandoDemais) tags.appendChild(U.tag('vermelho', 'esperando demais'));
        if (d.semDescricao) tags.appendChild(U.tag('amarelo', 'sem descrição'));
        d.faltando.forEach(function (f) { tags.appendChild(U.tag('amarelo', 'falta ' + f)); });
        p.appendChild(tags);
        box.appendChild(p);
      });
      box.appendChild(U.el('div', 'rodape', 'Pronta = área, impacto, esforço e prioridade preenchidos e descrição escrita. A sugestão vem da matriz impacto × esforço. Cards-modelo e instruções são ignorados. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
