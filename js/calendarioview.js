/* Monitor PMO - Calendário mensal (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var itens = null, ref = null;
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  function desenhar() {
    var c = M.montarCalendario(itens, M.config, new Date(), ref && ref.ano, ref && ref.mes);
    ref = { ano: c.ano, mes: c.mes };
    document.getElementById('resumo').textContent = c.titulo + ' · ' + c.totalPrazos + (c.totalPrazos === 1 ? ' prazo' : ' prazos') + ' de projetos no mês';
    var box = document.getElementById('conteudo');
    box.textContent = '';
    var tb = U.el('table', 'cal');
    var cab = U.el('tr');
    DIAS.forEach(function (d) { cab.appendChild(U.el('th', null, d)); });
    tb.appendChild(cab);
    c.semanas.forEach(function (sem) {
      var tr = U.el('tr');
      sem.forEach(function (d) {
        var td = U.el('td', 'dia' + (d.foraDoMes ? ' fora' : '') + (d.hoje ? ' hoje' : '') + (d.fimDeSemana || d.feriado ? ' folga' : ''));
        td.appendChild(U.el('div', 'num', d.dia));
        d.marcos.forEach(function (m) { td.appendChild(U.el('div', 'marco', m)); });
        if (d.feriado && !d.foraDoMes) td.appendChild(U.el('div', 'feriado', 'feriado'));
        d.prazos.slice(0, 3).forEach(function (p) {
          var a = U.el('a', 'prazo ' + p.cor, p.name);
          a.title = p.name + (p.responsaveis.length ? ' · ' + p.responsaveis.join(', ') : '');
          a.addEventListener('click', function () { t.showCard(p.id); });
          td.appendChild(a);
        });
        if (d.prazos.length > 3) td.appendChild(U.el('div', 'mais', '+' + (d.prazos.length - 3) + ' prazos'));
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    box.appendChild(tb);
    box.appendChild(U.el('div', 'rodape', 'Cor da barra = saúde do projeto no dia do prazo. Etiqueta azul = data forte do varejo. Dias de folga: fim de semana e feriados nacionais (config.varejo.feriados). Só leitura.'));
    t.sizeTo('body').catch(function () {});
  }

  function mover(delta) {
    var c = M.montarCalendario(itens, M.config, new Date(), ref && ref.ano, ref && ref.mes);
    ref = delta < 0 ? c.anterior : delta > 0 ? c.proximo : null;
    desenhar();
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) { itens = x.itens; desenhar(); }).catch(U.erro);
  });
  document.getElementById('ant').addEventListener('click', function () { if (itens) mover(-1); });
  document.getElementById('hoje').addEventListener('click', function () { if (itens) mover(0); });
  document.getElementById('prox').addEventListener('click', function () { if (itens) mover(1); });
})();
