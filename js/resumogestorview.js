/* Monitor PMO - Resumo por gestor (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var r = null;

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      r = M.montarResumos(x.itens, M.config, new Date());
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.gestores.length + ' gestor(es) com projeto ativo' +
        (r.semResponsavel ? ' · ' + r.semResponsavel + ' projeto(s) sem responsável ficam de fora' : '') + '.';
      r.gestores.forEach(function (g) {
        var sec = U.el('div', 'sec');
        var topo = U.el('div', 'linha1');
        topo.appendChild(U.el('h3', null, g.nome + ' - ' + g.ativos + (g.ativos === 1 ? ' projeto' : ' projetos') +
          (g.criticos ? ' (' + g.criticos + ' crítico' + (g.criticos === 1 ? '' : 's') + ')' : '')));
        var b = U.el('button', null, 'Copiar mensagem');
        b.type = 'button';
        b.addEventListener('click', function () { U.copiar(g.texto, document.getElementById('msg'), 'Mensagem de ' + g.nome + ' copiada. Cole no Chat.'); });
        topo.appendChild(b);
        sec.appendChild(topo);
        sec.appendChild(U.el('pre', 'msgbox', g.texto));
        box.appendChild(sec);
      });
      if (!r.gestores.length) box.appendChild(U.el('div', 'vazio', 'Nenhum projeto ativo com responsável.'));
      box.appendChild(U.el('div', 'rodape', 'Rascunho gerado só do Trello. Revise antes de enviar: nada é enviado nem alterado pelo Power-Up.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
  document.getElementById('copiar').addEventListener('click', function () {
    if (r) U.copiar(r.gestores.map(function (g) { return g.texto; }).join('\n\n'), document.getElementById('msg'), 'Todas as mensagens copiadas.');
  });
})();
