/* Monitor PMO - Calendário do varejo (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();

  function dataBR(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  function linha(box, i) {
    var p = U.el('div', 'proj ' + (i.motivos.length || i.cor === 'vermelho' ? 'vermelho' : i.cor === 'amarelo' ? 'amarelo' : 'verde'));
    p.appendChild(U.linkCard(t, i));
    p.appendChild(U.el('span', 'suave', '  ' + i.lista + ' · ' + U.prazoTxt(i.diasPrazo)));
    var tags = U.el('div');
    i.motivos.forEach(function (m) { tags.appendChild(U.tag('vermelho', m)); });
    if (!i.motivos.length && i.cor !== 'verde') tags.appendChild(U.tag(i.cor, 'saúde: ' + i.cor));
    if (tags.childNodes.length) p.appendChild(tags);
    box.appendChild(p);
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      var r = M.montarVarejo(x.itens, M.config, new Date());
      var box = document.getElementById('conteudo');
      box.textContent = '';
      var perto = r.datas.filter(function (d) { return d.perto; });
      document.getElementById('resumo').textContent = r.total + ' datas fortes nos próximos ' + M.config.varejo.dias + ' dias' +
        (perto.length ? ' · ' + perto.length + ' com menos de ' + M.config.varejo.avisoDiasUteis + ' dias úteis' : '') + '.';
      r.datas.forEach(function (d) {
        var topo = U.el('div', 'linha1');
        topo.appendChild(U.el('h2', null, d.nome + ' - ' + dataBR(d.chave)));
        topo.appendChild(U.tag(d.perto ? 'vermelho' : 'cinza', d.dias + ' dias · ' + d.diasUteis + ' úteis'));
        box.appendChild(topo);
        if (!d.ligados.length && !d.ate.length) {
          box.appendChild(U.el('p', 'suave', 'Nenhum projeto ligado (etiqueta "' + d.nome + '") nem com prazo até a data.'));
          return;
        }
        if (!d.perto && !d.ligados.length) {
          box.appendChild(U.el('p', 'suave', d.ate.length + (d.ate.length === 1 ? ' projeto com prazo' : ' projetos com prazo') +
            ' até a data' + (d.emRisco ? ', ' + d.emRisco + ' fora do verde' : ' (todos em dia)') + '. Detalhe aparece quando faltarem ' +
            M.config.varejo.avisoDiasUteis + ' dias úteis ou se houver projeto com a etiqueta.'));
          return;
        }
        if (d.ligados.length) { box.appendChild(U.el('p', 'suave', 'Ligados pela etiqueta:')); d.ligados.forEach(function (i) { linha(box, i); }); }
        if (d.ate.length) { box.appendChild(U.el('p', 'suave', 'Prazo marcado até a data:')); d.ate.forEach(function (i) { linha(box, i); }); }
      });
      box.appendChild(U.el('div', 'rodape', 'Dias úteis: sem sábado, domingo e feriados nacionais (ajuste em config.varejo). Para ligar um projeto a uma data, use uma etiqueta com o nome dela (ex.: Black Friday). Em risco: atrasado, sem prazo, prazo depois da data ou crítico. Só leitura.'));
      t.sizeTo('body').catch(function () {});
    }).catch(U.erro);
  });
})();
