/* Monitor PMO - Relatório executivo (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var rel = null;

  t.render(function () {
    return Promise.all([U.lerItens(t), t.board('name')]).then(function (r) {
      rel = M.montarRelatorio(r[0].itens, M.config, new Date(), r[1].name);
      document.getElementById('resumo').textContent = rel.titulo;
      var box = document.getElementById('conteudo');
      box.textContent = '';
      rel.secoes.forEach(function (s) {
        var sec = U.el('div', 'sec');
        sec.appendChild(U.el('h3', null, s.titulo));
        var ul = U.el('ul');
        s.linhas.forEach(function (l) { ul.appendChild(U.el('li', null, l)); });
        sec.appendChild(ul);
        box.appendChild(sec);
      });
      box.appendChild(U.el('div', 'rodape', 'Rascunho gerado só do Trello, pelas regras do PMO. Revise antes de enviar. Nada é alterado nos cards.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
  document.getElementById('imprimir').addEventListener('click', function () { window.print(); });
  document.getElementById('copiar').addEventListener('click', function () {
    if (rel) U.copiar(rel.texto, document.getElementById('msg'), 'Relatório copiado. Cole no e-mail ou no Chat.');
  });
})();
