/* Monitor PMO - Prioridades em risco (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  function linha(box, i) {
    var p = U.el('div', 'proj ' + i.cor);
    p.appendChild(U.linkCard(t, i));
    p.appendChild(U.el('span', 'suave', '  ' + i.lista + ' · ' + (i.responsaveis.join(', ') || 'sem responsável') + ' · ' + U.prazoTxt(i.diasPrazo)));
    var tags = U.el('div');
    i.motivos.forEach(function (m, k) { tags.appendChild(U.tag(k === 0 ? i.cor : 'amarelo', m)); });
    if (i.urgente) tags.appendChild(U.tag('vermelho', 'urgente'));
    p.appendChild(tags);
    box.appendChild(p);
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarPrioridades(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var risco = r.grupos.reduce(function (n, g) { return n + g.emRisco; }, 0);
      var total = r.grupos.reduce(function (n, g) { return n + g.total; }, 0);
      document.getElementById('resumo').textContent = risco + ' de ' + total + ' projetos de prioridade máxima/alta fora do verde · ' + r.urgentes.length + ' urgente(s).';
      if (r.semPrioridade) {
        box.appendChild(U.el('div', 'aviso', r.semPrioridade + ' de ' + r.ativos + ' projetos ativos não têm prioridade definida: sem prioridade o PMO não sabe o que defender primeiro.'));
      }
      r.grupos.forEach(function (g) {
        box.appendChild(U.el('h2', null, 'Prioridade ' + g.rotulo + ' (' + g.total + ' · ' + g.emRisco + ' em risco)'));
        if (!g.itens.length) box.appendChild(U.el('p', 'suave', 'Nenhum projeto ativo com esta prioridade.'));
        g.itens.forEach(function (i) { linha(box, i); });
      });
      if (r.urgentes.length) {
        box.appendChild(U.el('h2', null, 'Marcados como urgentes (' + r.urgentes.length + ')'));
        r.urgentes.forEach(function (i) { linha(box, i); });
      }
      box.appendChild(U.el('div', 'rodape', 'Em risco = qualquer cor diferente de verde. Prioridade vem do campo "' + M.config.matriz.campoPrioridade + '". Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
