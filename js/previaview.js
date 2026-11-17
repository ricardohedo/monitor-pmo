/* Monitor PMO - Prévia dos alertas (tela). Mostra, com dados reais do board, o que a rotina
   "PMO Alertas" (Google) mandaria. Nada é enviado nem gravado. Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  function bloco(box, titulo, nota, texto) {
    var sec = U.el('div', 'sec');
    var topo = U.el('div', 'linha1');
    topo.appendChild(U.el('h3', null, titulo));
    var b = U.el('button', null, 'Copiar');
    b.type = 'button';
    b.addEventListener('click', function () { U.copiar(texto, document.getElementById('msg'), titulo + ' copiado.'); });
    topo.appendChild(b);
    sec.appendChild(topo);
    if (nota) sec.appendChild(U.el('p', 'suave', nota));
    sec.appendChild(U.el('pre', 'msgbox', texto));
    box.appendChild(sec);
  }

  t.render(function () {
    return Promise.all([U.lerItens(t, true), t.board('name')]).then(function (r) {
      var x = r[0], agora = new Date();
      var dados = {
        itens: x.itens, cards: x.cards,
        ctx: { agora: agora, camposDef: x.camposDef, listas: x.listas, membros: x.membros }
      };
      var primeira = M.montarAlertas(dados, M.config, agora, {});
      var semEstado = M.formatarTexto(primeira.alertas, 'PMO - alertas do dia', agora, M.config);
      var semanal = M.montarSemanal(dados, M.config, agora, r[1].name);
      var box = document.getElementById('conteudo');
      box.textContent = '';
      document.getElementById('resumo').textContent = 'Prévia do que a rotina de alertas mandaria agora (só para o Ricardo, nada é enviado daqui).';
      bloco(box, 'Primeiro aviso (linha de base + avisos do dia)',
        'Nas execuções seguintes só saem os avisos que mudaram (críticos novos, impedimentos, itens de checklist vencidos...). Se não houver nada novo, não sai nada.',
        semEstado || 'Nenhum aviso hoje.');
      bloco(box, 'Resumo semanal (segunda-feira, para revisão)', 'Inclui um rascunho de mensagem por gestor. Nada é enviado a eles.', semanal.texto);
      box.appendChild(U.el('div', 'rodape', 'Quem envia é o script "PMO Alertas" no Google (alertas/LEIA-ME.md). Fase 1: e-mail e Chat só para você, depois de você aprovar o texto e a frequência.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
