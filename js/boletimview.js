/* Monitor PMO - Boletim do gestor (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var COR = { noPadrao: 'verde', atencao: 'amarelo', critico: 'vermelho' };

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarBoletim(x.itens, M.config);
      var meuNome = (x.eu && x.eu.fullName) || '';
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = r.gestores.length + ' gestor(es) avaliados' + (r.semDono ? ' · ' + r.semDono + ' projeto(s) sem responsável não pontuam para ninguém' : '') + '.';

      var f = U.el('div', 'dica');
      var nDim = r.gestores[0] ? r.gestores[0].dimensoes.length : Object.keys(r.pesos).length;
      f.textContent = 'Como a nota é calculada (igual para todos): ' + nDim + ' dimensões somam 100 pontos. ' +
        (r.gestores[0] ? r.gestores[0].dimensoes.map(function (d) { return d.rotulo + ' ' + d.peso; }).join(' · ') : '') +
        '. Faixas: no padrão a partir de ' + r.faixas.noPadrao + ', atenção a partir de ' + r.faixas.atencao + ', abaixo disso crítico.';
      box.appendChild(f);

      r.gestores.forEach(function (g) {
        var sec = U.el('div', 'proj ' + COR[g.faixa]);
        var topo = U.el('div', 'linha1');
        var nome = U.el('b', null, g.nome + (g.nome === meuNome ? ' (você)' : '') + ' - ' + g.projetos + (g.projetos === 1 ? ' projeto' : ' projetos'));
        topo.appendChild(nome);
        topo.appendChild(U.tag(COR[g.faixa], 'nota ' + g.nota + ' · ' + g.rotuloFaixa));
        sec.appendChild(topo);
        g.dimensoes.forEach(function (d) {
          var l = U.el('div', 'cap-linha');
          l.style.gridTemplateColumns = '180px 1fr 150px';
          l.appendChild(U.el('div', null, d.rotulo));
          var b = U.el('div', 'cap-barra'); var i = U.el('i', d.pct >= 85 ? 'verde' : d.pct >= 60 ? 'amarelo' : 'vermelho'); i.style.width = d.pct + '%'; b.appendChild(i); l.appendChild(b);
          l.appendChild(U.el('div', 'cap-valor', d.pct + '% · perdeu ' + d.perdidos + ' de ' + d.peso + ' pts'));
          l.title = d.regra;
          sec.appendChild(l);
        });
        if (g.derrubam.length) {
          var det = U.el('details'); det.open = g.faixa !== 'noPadrao';
          det.appendChild(U.el('summary', null, 'O que mais derruba a nota (corrija nesta ordem)'));
          g.derrubam.forEach(function (p) {
            var li = U.el('p'); li.appendChild(U.linkCard(t, p));
            li.appendChild(U.el('span', 'suave', ' - perde ' + p.perdidos + ' pts: ' + p.motivos.join('; ')));
            det.appendChild(li);
          });
          sec.appendChild(det);
        }
        box.appendChild(sec);
      });
      box.appendChild(U.el('div', 'rodape', 'Cada ponto perdido tem o nome de um projeto: não é opinião, é cálculo. Passe o mouse sobre uma barra para ver a regra. Projeto com dois responsáveis conta para os dois. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
