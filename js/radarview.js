/* Monitor PMO - Radar (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarRadar(x.itens, M.config);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.total
        ? r.total + (r.total === 1 ? ' projeto vai' : ' projetos vão') + ' cair em alerta nos próximos ' + r.janela + ' dias se ninguém mexer' +
          (r.viramCriticos ? ' (' + r.viramCriticos + ' viram críticos por prazo)' : '') + '.'
        : 'Nada vai cair em alerta nos próximos ' + r.janela + ' dias.';
      r.grupos.forEach(function (g) {
        box.appendChild(U.el('h2', null, g.dias === 1 ? 'Amanhã' : 'Em ' + g.dias + ' dias'));
        g.linhas.forEach(function (l) {
          var p = U.el('div', 'proj ' + (l.tipo === 'critico' ? 'vermelho' : 'amarelo'));
          p.appendChild(U.linkCard(t, l.item));
          p.appendChild(U.el('div', 'suave', l.texto + ' · ' + l.item.lista));
          box.appendChild(p);
        });
      });
      box.appendChild(U.el('div', 'rodape', 'Previsão com os números de hoje. Comentar, marcar item da checklist ou ajustar o prazo tira o projeto da lista. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
