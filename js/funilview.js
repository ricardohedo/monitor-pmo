/* Monitor PMO - Funil por lista (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarFunil(x.itens, M.config, x.listas.map(function (l) { return l.name; }));
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.totalAtivos + ' projetos ativos em ' + r.listas.length + ' listas.' +
        (r.gargalo ? ' Maior concentração de problemas: ' + r.gargalo.nome + ' (' + r.gargalo.pctProblema + '% fora do verde).' : '');
      var max = r.listas.reduce(function (m, l) { return Math.max(m, l.total); }, 1);

      box.appendChild(U.el('h2', null, 'Projetos por lista'));
      r.listas.forEach(function (l) {
        var linha = U.el('div', 'cap-linha funil');
        linha.appendChild(U.el('div', 'cap-rotulo', l.nome));
        var barra = U.el('div', 'cap-barra');
        ['vermelho', 'amarelo', 'verde'].forEach(function (c) {
          var i = U.el('i', c); i.style.width = Math.round(l[c] / max * 100) + '%'; i.style.display = 'inline-block'; i.title = c + ': ' + l[c];
          barra.appendChild(i);
        });
        var cinza = l.total - l.ativos;
        if (cinza) { var g = U.el('i', 'cinza'); g.style.width = Math.round(cinza / max * 100) + '%'; g.style.display = 'inline-block'; g.title = 'concluídos/pausados: ' + cinza; barra.appendChild(g); }
        linha.appendChild(barra);
        linha.appendChild(U.el('div', 'cap-valor', l.total + ' (' + l.ativos + ' ativos)'));
        box.appendChild(linha);
        var det = [];
        if (l.ativos) det.push(l.vermelho + ' críticos · ' + l.amarelo + ' atenção · ' + l.verde + ' em dia');
        if (l.paradoMedio !== null) det.push('parado em média ' + l.paradoMedio + 'd');
        if (det.length || l.maisParado) {
          var p = U.el('div', 'cap-det', det.join(' | '));
          if (l.maisParado && l.maisParado.dias > 7) {
            p.appendChild(document.createTextNode(' | mais parado: '));
            p.appendChild(U.linkCard(t, l.maisParado));
            p.appendChild(document.createTextNode(' (' + l.maisParado.dias + 'd)'));
          }
          box.appendChild(p);
        }
      });

      box.appendChild(U.el('h2', null, 'Tempo sem movimento (projetos ativos)'));
      var maxF = r.faixas.reduce(function (m, f) { return Math.max(m, f.n); }, 1);
      r.faixas.forEach(function (f, k) {
        var linha = U.el('div', 'cap-linha');
        linha.appendChild(U.el('div', 'cap-rotulo', f.rotulo));
        var barra = U.el('div', 'cap-barra'); var i = U.el('i', k >= 3 ? 'vermelho' : k === 2 ? 'amarelo' : 'verde');
        i.style.width = Math.round(f.n / maxF * 100) + '%'; barra.appendChild(i); linha.appendChild(barra);
        linha.appendChild(U.el('div', 'cap-valor', f.n + (f.n === 1 ? ' projeto' : ' projetos')));
        box.appendChild(linha);
      });
      box.appendChild(U.el('div', 'rodape', 'Tempo sem movimento = dias desde a última atividade do card (o Trello não guarda há quanto tempo o card está na lista). Cinza = concluídos e pausados. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
