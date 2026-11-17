/* Monitor PMO - Metas do PMO (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  var COR = { cumprida: 'verde', 'em andamento': 'amarelo', vencida: 'vermelho', 'sem data': 'cinza' };

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarMetas(x.itens, M.config, new Date());
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var cumpridas = r.metas.filter(function (m) { return m.estado === 'cumprida'; }).length;
      document.getElementById('resumo').textContent = cumpridas + ' de ' + r.metas.length + ' metas cumpridas.';
      r.metas.forEach(function (m) {
        var sec = U.el('div', 'sec');
        var topo = U.el('div', 'linha1');
        topo.appendChild(U.el('h3', null, m.nome));
        if (m.invalida) { topo.appendChild(U.tag('vermelho', m.invalida)); sec.appendChild(topo); box.appendChild(sec); return; }
        topo.appendChild(U.tag(COR[m.estado], m.estado));
        sec.appendChild(topo);
        var barra = U.el('div', 'barra'); var b = U.el('i', COR[m.estado] === 'cinza' ? '' : COR[m.estado]);
        b.style.width = m.pct + '%'; barra.appendChild(b); sec.appendChild(barra);
        var info = m.atingidos + ' de ' + m.total + ' (' + m.pct + '%)';
        if (m.dias !== null) info += ' · ' + (m.dias < 0 ? 'prazo da meta venceu há ' + Math.abs(m.dias) + 'd' : m.dias === 0 ? 'prazo da meta é hoje' : 'faltam ' + m.dias + ' dias (' + m.diasUteis + ' úteis)');
        if (m.porSemana) info += ' · fechar ' + m.porSemana + ' por semana';
        sec.appendChild(U.el('p', 'suave', info));
        if (m.faltam.length) {
          var p = U.el('p', 'suave', 'Falta: ');
          m.faltam.slice(0, 6).forEach(function (i, n) { if (n) p.appendChild(document.createTextNode(' · ')); p.appendChild(U.linkCard(t, i)); });
          if (m.faltam.length > 6) p.appendChild(document.createTextNode(' · e mais ' + (m.faltam.length - 6)));
          sec.appendChild(p);
        }
        box.appendChild(sec);
      });
      box.appendChild(U.el('div', 'rodape', 'Metas e datas ficam em config.metas.missoes (js/config.js). Data pode ser uma data do varejo (próxima ocorrência), "semana" ou AAAA-MM-DD. Metas da área, não de pessoas. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
