/* Monitor PMO - Escalonamento (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var r = null;

  var NIVEIS = [
    ['diretoria', 'Para decisão da diretoria', 'vermelho', 'Subiu porque passou de um limite objetivo. Cada item tem uma ficha de escalonamento pronta para copiar.'],
    ['pmo', 'Para o PMO agir', 'amarelo', 'O PMO precisa atribuir responsável, destravar ou cobrar com prazo.'],
    ['gestor', 'Com o gestor', 'verde', 'Ainda dentro do que o gestor resolve sozinho.']
  ];

  function agora() { return new Date(); }

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      r = M.montarEscalonamento(x.itens, M.config, agora());
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var ec = M.config.escalonamento;
      document.getElementById('resumo').textContent = r.contagem.diretoria + ' para a diretoria · ' + r.contagem.pmo + ' para o PMO · ' + r.contagem.gestor + ' com o gestor.';
      box.appendChild(U.el('div', 'dica', 'Critérios objetivos (sem negociação): crítico com ' + ec.pmoAtrasoDias + '+ dias de atraso, impedimento ou sem responsável sobe ao PMO; atraso de ' +
        ec.diretoriaAtrasoDias + '+ dias, prioridade máxima/alta com ' + ec.diretoriaPrioridadeAtrasoDias + '+ dias de atraso, urgente e crítico, ou em risco para data forte a ' +
        ec.diretoriaVarejoDias + ' dias sobe à diretoria.'));
      NIVEIS.forEach(function (n) {
        var lista = r[n[0]];
        box.appendChild(U.el('h2', null, n[1] + ' (' + lista.length + ')'));
        box.appendChild(U.el('p', 'suave', n[3]));
        if (!lista.length) box.appendChild(U.el('p', 'suave', 'Nada neste nível.'));
        lista.forEach(function (e) {
          var p = U.el('div', 'proj ' + n[2]);
          var l1 = U.el('div', 'linha1');
          l1.appendChild(U.linkCard(t, e));
          if (n[0] !== 'gestor') {
            var b = U.el('button', null, 'Copiar ficha'); b.type = 'button';
            b.addEventListener('click', function () { U.copiar(M.textoEscalonamento(e, M.config, agora()), document.getElementById('msg'), 'Ficha de escalonamento copiada.'); });
            l1.appendChild(b);
          }
          p.appendChild(l1);
          p.appendChild(U.el('div', 'suave', e.lista + ' · ' + (e.responsaveis.join(', ') || 'sem responsável') + (e.prioridade ? ' · prioridade ' + e.prioridade : '')));
          var tags = U.el('div'); e.motivos.forEach(function (m) { tags.appendChild(U.tag(n[2], m)); }); p.appendChild(tags);
          box.appendChild(p);
        });
      });
      box.appendChild(U.el('div', 'rodape', 'Formato da ficha: problema, impacto, opções, recomendação e decisão solicitada, em uma página. Limites em config.escalonamento. Só leitura: nada é enviado.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
