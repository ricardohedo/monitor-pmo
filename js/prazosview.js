/* Monitor PMO - Prazos / linha do tempo (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var r = null;

  function linha(i, atrasado) {
    var tr = U.el('tr');
    var d = U.el('td', 'dia' + (atrasado ? ' venc' : ''), U.dataCurta(i.prazo));
    d.appendChild(U.el('span', 'dias', U.textoDias(i.diasPrazo)));
    tr.appendChild(d);
    var c = U.el('td');
    c.appendChild(U.linkCard(t, i));
    c.appendChild(U.el('div', 'suave', i.lista + ' · ' + (i.responsaveis.join(', ') || 'sem responsável')));
    if (i.pouco) c.appendChild(U.tag('amarelo', 'pouco andado (' + Math.round((i.progresso || 0) * 100) + '% da checklist)'));
    if (i.varejo) c.appendChild(U.tag('vermelho', i.varejo.dias + 'd antes de ' + i.varejo.nome));
    tr.appendChild(c);
    return tr;
  }

  function bloco(box, titulo, itens, atrasado) {
    box.appendChild(U.el('h2', null, titulo + ' (' + itens.length + ')'));
    var tb = U.el('table', 'agenda'); var body = U.el('tbody');
    itens.forEach(function (i) { body.appendChild(linha(i, atrasado)); });
    tb.appendChild(body); box.appendChild(tb);
  }

  function desenhar() {
    var box = document.getElementById('conteudo');
    box.textContent = '';
    document.getElementById('resumo').textContent = r.atrasados.length + ' atrasados · ' + r.proximos + ' vencem em ' +
      M.config.prazos.dias + ' dias · ' + r.pouco.length + ' pouco andados · ' + r.semPrazo.length + ' sem prazo';
    if (r.atrasados.length) bloco(box, 'Atrasados', r.atrasados, true);
    r.janelas.forEach(function (f) { bloco(box, f.titulo, f.itens, false); });
    if (!r.atrasados.length && !r.janelas.length) box.appendChild(U.el('div', 'vazio', 'Nenhum prazo atrasado nem previsto nos próximos ' + M.config.prazos.dias + ' dias.'));
    if (r.semPrazo.length) {
      box.appendChild(U.el('h2', null, 'Sem prazo cadastrado (' + r.semPrazo.length + ')'));
      var p = U.el('p', 'suave');
      r.semPrazo.forEach(function (i, n) { if (n) p.appendChild(document.createTextNode(' · ')); p.appendChild(U.linkCard(t, i)); });
      box.appendChild(p);
    }
    box.appendChild(U.el('div', 'rodape', 'Etiqueta de varejo: o prazo cai até ' + M.config.prazos.diasVarejo + ' dias antes de uma data forte; qualquer atraso pega a operação de loja no pico. Pouco andado: prazo em até ' + M.config.prazos.diasAlerta + ' dias com menos de ' + Math.round(M.config.prazos.progressoMin * 100) + '% da checklist.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) { r = M.montarPrazos(x.itens, M.config, new Date()); desenhar(); }).catch(U.erro);
  });
  document.getElementById('copiar').addEventListener('click', function () {
    if (r) U.copiar(r.texto, document.getElementById('msg'), 'Prazos copiados.');
  });
})();
