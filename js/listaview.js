/* Monitor PMO - Lista de projetos (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var itens = null, ordem = { campo: 'cor', dir: 1 }, ultimo = null;

  var COLS = [['name', 'Projeto'], ['area', 'Área'], ['fase', 'Fase'], ['prioridade', 'Prioridade'],
    ['responsaveis', 'Responsáveis'], ['diasPrazo', 'Prazo'], ['progresso', 'Progresso'], ['cor', 'Saúde']];

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function filtro() {
    return {
      busca: document.getElementById('busca').value,
      fase: document.getElementById('fase').value,
      prioridade: document.getElementById('prioridade').value,
      status: document.getElementById('status').value,
      incluirInativos: document.getElementById('inativos').checked
    };
  }

  function preencher(id, valores, rotulo) {
    var sel = document.getElementById(id), atual = sel.value;
    sel.textContent = '';
    var o = U.el('option', null, rotulo); o.value = ''; sel.appendChild(o);
    valores.forEach(function (v) { var op = U.el('option', null, cap(v)); op.value = v; if (v === atual) op.selected = true; sel.appendChild(op); });
  }

  function desenhar() {
    var f = filtro();
    var base = M.montarLista(itens, M.config, { incluirInativos: f.incluirInativos }, ordem);
    preencher('fase', base.fases, 'Todas as fases');
    preencher('prioridade', base.prioridades, 'Qualquer prioridade');
    document.getElementById('fase').value = f.fase; document.getElementById('prioridade').value = f.prioridade;
    var r = M.montarLista(itens, M.config, f, ordem);
    ultimo = r;
    document.getElementById('resumo').textContent = 'Lista de projetos (' + r.linhas.length + ' de ' + r.total + ')';
    var box = document.getElementById('conteudo');
    box.textContent = '';
    if (!r.linhas.length) { box.appendChild(U.el('div', 'vazio', 'Nenhum projeto neste filtro.')); t.sizeTo('body').catch(function () {}); return; }
    var tb = U.el('table'); var cab = U.el('tr');
    COLS.forEach(function (c) {
      var th = U.el('th', 'ord', c[1] + (ordem.campo === c[0] ? (ordem.dir === 1 ? ' ↑' : ' ↓') : ''));
      th.addEventListener('click', function () { ordem = { campo: c[0], dir: ordem.campo === c[0] ? -ordem.dir : 1 }; desenhar(); });
      cab.appendChild(th);
    });
    tb.appendChild(cab);
    r.linhas.forEach(function (l) {
      var tr = U.el('tr');
      var c1 = U.el('td'); c1.appendChild(U.linkCard(t, l)); tr.appendChild(c1);
      tr.appendChild(U.el('td', null, l.area));
      tr.appendChild(U.el('td', null, l.fase));
      tr.appendChild(U.el('td', null, cap(l.prioridade)));
      tr.appendChild(U.el('td', null, l.responsaveis.join(', ') || 'Sem responsável'));
      var pz = U.el('td', null, l.prazo ? U.dataCurta(l.prazo) : 'Sem prazo');
      if (l.diasPrazo !== null) pz.appendChild(U.el('span', 'dias', U.textoDias(l.diasPrazo)));
      tr.appendChild(pz);
      tr.appendChild(U.el('td', null, l.progresso === null ? '' : Math.round(l.progresso * 100) + '%'));
      var sd = U.el('td'); sd.appendChild(U.tag(l.cor, l.rotulo)); tr.appendChild(sd);
      tb.appendChild(tr);
    });
    box.appendChild(tb);
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) { itens = x.itens; desenhar(); }).catch(U.erro);
  });
  ['busca', 'fase', 'prioridade', 'status', 'inativos'].forEach(function (id) {
    document.getElementById(id).addEventListener(id === 'busca' ? 'input' : 'change', function () { if (itens) desenhar(); });
  });
  document.getElementById('copiar').addEventListener('click', function () {
    if (ultimo) U.copiar(M.paraCSV(ultimo.linhas), document.getElementById('msg'), 'CSV copiado. Cole numa planilha (Excel/Sheets).');
  });
})();
