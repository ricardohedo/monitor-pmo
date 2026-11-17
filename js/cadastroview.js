/* Monitor PMO - Saneamento do cadastro (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var r = null;

  function desenhar() {
    var box = document.getElementById('conteudo');
    box.textContent = '';
    document.getElementById('resumo').textContent = r.completos + ' de ' + r.total + ' projetos ativos com cadastro completo · aderência média ao padrão ' + r.aderenciaMedia + '%.';
    if (!r.gestores.length) { box.appendChild(U.el('div', 'nada', 'Cadastro em ordem: nada a cobrar.')); return; }
    if (r.campos.length) {
      box.appendChild(U.el('p', 'suave', 'O que mais falta: ' + r.campos.slice(0, 5).map(function (c) { return c.campo + ' (' + c.qtd + ')'; }).join(' · ')));
    }
    r.gestores.forEach(function (g) {
      var sec = U.el('div', 'sec');
      var topo = U.el('div', 'linha1');
      topo.appendChild(U.el('h3', null, g.nome + ' - ' + g.projetos.length + (g.projetos.length === 1 ? ' projeto' : ' projetos')));
      var b = U.el('button', null, 'Copiar cobrança');
      b.type = 'button';
      b.addEventListener('click', function () { U.copiar(g.texto, document.getElementById('msg'), 'Cobrança de ' + g.nome + ' copiada.'); });
      topo.appendChild(b);
      sec.appendChild(topo);
      g.projetos.forEach(function (p) {
        var li = U.el('div', 'proj amarelo');
        li.appendChild(U.linkCard(t, p));
        li.appendChild(U.el('div', 'suave', p.lista));
        p.falta.forEach(function (x) { li.appendChild(U.tag('amarelo', x)); });
        sec.appendChild(li);
      });
      box.appendChild(sec);
    });
    box.appendChild(U.el('div', 'rodape', 'Texto de cobrança pronto para colar no Chat ou e-mail. Só leitura: nada é alterado nos cards.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) { r = M.montarCadastro(x.itens); desenhar(); }).catch(U.erro);
  });
  document.getElementById('copiar').addEventListener('click', function () {
    if (r) U.copiar(r.texto, document.getElementById('msg'), 'Todas as cobranças copiadas.');
  });
})();
