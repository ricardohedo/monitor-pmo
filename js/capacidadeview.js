/* Monitor PMO - Capacidade por mês (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  function linhaBarra(rotulo, pontos, max, cls, extra) {
    var l = U.el('div', 'cap-linha');
    l.appendChild(U.el('div', 'cap-rotulo', rotulo));
    var b = U.el('div', 'cap-barra'); var i = U.el('i', cls); i.style.width = Math.round(pontos / max * 100) + '%';
    b.appendChild(i); l.appendChild(b);
    l.appendChild(U.el('div', 'cap-valor', extra));
    return l;
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarCapacidade(x.itens, M.config, new Date());
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var lim = M.config.capacidade.pontosMesMax;
      document.getElementById('resumo').textContent = r.picos
        ? r.picos + (r.picos === 1 ? ' mês acima' : ' meses acima') + ' de ' + lim + ' pontos de esforço vencendo no mesmo mês.'
        : 'Nenhum mês acima de ' + lim + ' pontos de esforço vencendo.';
      if (r.atrasados.projetos) box.appendChild(linhaBarra('Atrasados', r.atrasados.pontos, r.maxPontos, 'vermelho',
        r.atrasados.projetos + ' proj. · ' + r.atrasados.pontos + ' pts'));
      r.meses.forEach(function (m) {
        box.appendChild(linhaBarra(m.rotulo, m.pontos, r.maxPontos, m.pico ? 'vermelho' : m.criticos ? 'amarelo' : 'verde',
          m.projetos + ' proj. · ' + m.pontos + ' pts'));
        var det = [];
        if (m.marcos.length) det.push('Datas fortes: ' + m.marcos.join(', '));
        if (m.pessoas.length) det.push(m.pessoas.map(function (p) { return p.nome + ' ' + p.pontos + ' pts'; }).join(' · '));
        if (m.pico) det.push('Pico: avaliar antecipar ou replanejar entregas deste mês.');
        if (det.length) box.appendChild(U.el('div', 'cap-det', det.join(' | ')));
        if (m.itens.length) {
          var p = U.el('div', 'cap-det');
          m.itens.slice(0, 5).forEach(function (i, n) { if (n) p.appendChild(document.createTextNode(' · ')); p.appendChild(U.linkCard(t, i)); });
          if (m.itens.length > 5) p.appendChild(document.createTextNode(' · e mais ' + (m.itens.length - 5)));
          box.appendChild(p);
        }
      });
      if (r.semPrazo.projetos) box.appendChild(U.el('p', 'suave', r.semPrazo.projetos + ' projetos (' + r.semPrazo.pontos + ' pts) sem prazo ficam fora dos meses: sem prazo não dá para prever a carga.'));
      box.appendChild(U.el('div', 'rodape', 'Pontos: esforço alto 3, médio 2, baixo 1 (sem classificar = 2), somados no mês do Fim planejado. Limite por mês em config.capacidade.pontosMesMax. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
