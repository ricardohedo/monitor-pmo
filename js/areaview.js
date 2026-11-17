/* Monitor PMO - Por área solicitante (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarAreas(x.itens);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.total + ' projetos ativos em ' + r.linhas.length + ' área(s).';
      if (!r.linhas.length) { box.appendChild(U.el('div', 'vazio', 'Nenhum projeto ativo.')); return; }
      var tb = U.el('table');
      var cab = U.el('tr');
      ['Área', 'Ativos', 'Críticos', 'Atenção', 'Em dia', 'Atrasados', 'Sem prazo', 'Sem resp.', 'Padrão'].forEach(function (h, n) {
        cab.appendChild(U.el('th', n ? 'num' : null, h));
      });
      tb.appendChild(cab);
      r.linhas.forEach(function (a) {
        var tr = U.el('tr', a.semArea ? 'sem' : '');
        var c = U.el('td', null, a.nome + ' ');
        c.appendChild(U.tag(a.semaforo, a.semaforo === 'vermelho' ? 'crítica' : a.semaforo === 'amarelo' ? 'atenção' : 'em dia'));
        tr.appendChild(c);
        [[a.ativos, false], [a.vermelho, true], [a.amarelo, false], [a.verde, false], [a.atrasados, true],
          [a.semPrazo, false], [a.semResponsavel, true]].forEach(function (v) {
          tr.appendChild(U.el('td', 'num' + (v[1] && v[0] ? ' alerta' : ''), v[0]));
        });
        tr.appendChild(U.el('td', 'num', a.aderencia + '%'));
        tb.appendChild(tr);
      });
      box.appendChild(tb);
      r.linhas.filter(function (a) { return a.piores.length; }).forEach(function (a) {
        box.appendChild(U.el('h2', null, 'Críticos em ' + a.nome));
        a.piores.forEach(function (p) {
          var li = U.el('p');
          li.appendChild(U.linkCard(t, p));
          li.appendChild(U.el('span', 'suave', ' - ' + U.prazoTxt(p.diasPrazo)));
          box.appendChild(li);
        });
      });
      box.appendChild(U.el('div', 'rodape', 'Área vem do campo "' + M.config.campoArea + '". Padrão = aderência média ao cadastro padrão do PMO. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
