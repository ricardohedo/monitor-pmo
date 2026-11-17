/* Monitor PMO - Carga da equipe (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var carga = null;

  function num(n, alerta) { return U.el('td', 'num' + (alerta && n ? ' alerta' : ''), n); }

  function desenhar() {
    var box = document.getElementById('conteudo');
    box.textContent = '';
    document.getElementById('resumo').textContent = carga.total + ' projetos ativos. Limite por pessoa: ' +
      M.config.carga.wipMax + ' em execução e ' + M.config.carga.pontosMax + ' pontos de esforço.';
    if (carga.sobrecarregados.length) {
      box.appendChild(U.el('div', 'aviso', 'Sobrecarga: ' + carga.sobrecarregados.map(function (l) {
        return l.nome + ' (' + l.motivos.join('; ') + ')';
      }).join(' | ') + '. Muito projeto em paralelo costuma ser a causa do atraso.'));
    }
    if (carga.sobrecarregados.length && carga.comFolga.length) {
      box.appendChild(U.el('div', 'dica', 'Quem tem folga: ' + carga.comFolga.map(function (l) { return l.nome; }).join(', ') + '.'));
    }
    if (!carga.linhas.length) { box.appendChild(U.el('div', 'vazio', 'Nenhum projeto ativo.')); return; }
    var tb = U.el('table');
    var cab = U.el('tr');
    ['Pessoa', 'Ativos', 'Em execução', 'Pontos', 'Críticos', 'Vencidos', 'Vencem em ' + M.config.carga.diasProximo + 'd', 'Sem prazo']
      .forEach(function (h, n) { cab.appendChild(U.el('th', n ? 'num' : null, h)); });
    tb.appendChild(cab);
    carga.linhas.forEach(function (l) {
      var tr = U.el('tr', l.semDono ? 'sem' : '');
      var c = U.el('td', null, l.nome + ' ');
      if (l.sobrecarga) c.appendChild(U.tag('vermelho', 'sobrecarga'));
      tr.appendChild(c);
      var a = U.el('td', 'num', l.ativos);
      var b = U.el('i', 'barrinha'); b.style.width = Math.round(l.ativos / carga.maxAtivos * 70) + 'px';
      a.appendChild(b);
      tr.appendChild(a);
      tr.appendChild(num(l.execucao, l.execucao > M.config.carga.wipMax));
      tr.appendChild(num(l.pontos, l.pontos > M.config.carga.pontosMax));
      tr.appendChild(num(l.criticos, true));
      tr.appendChild(num(l.vencidos, true));
      tr.appendChild(num(l.proximos, false));
      tr.appendChild(num(l.semPrazo, false));
      tb.appendChild(tr);
    });
    box.appendChild(tb);
    box.appendChild(U.el('div', 'rodape', 'Espelho da divisão, não julgamento: em muitas áreas o responsável do card é o dono do projeto, não quem executa. Pontos: esforço alto 3, médio 2, baixo 1 (sem classificar = 2). Um projeto com 2 responsáveis conta para os dois.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return U.lerItens(t).then(function (r) {
      carga = M.montarCarga(r.itens, M.config);
      desenhar();
    }).catch(U.erro);
  });
  document.getElementById('copiar').addEventListener('click', function () {
    if (carga) U.copiar(carga.texto, document.getElementById('msg'), 'Resumo copiado.');
  });
})();
