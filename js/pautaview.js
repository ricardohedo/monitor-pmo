/* Monitor PMO - Pauta da reunião (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var pauta = null;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  function copiar(texto) {
    var msg = document.getElementById('msg');
    function ok() { msg.textContent = 'Pauta copiada. Cole no e-mail, na ata ou no Chat.'; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { msg.textContent = 'Não foi possível copiar: ' + e.message; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, fallback);
    else fallback();
  }

  function desenhar() {
    document.getElementById('titulo').textContent = pauta.titulo;
    document.getElementById('resumo').textContent = pauta.resumo;
    var box = document.getElementById('conteudo');
    box.textContent = '';
    if (!pauta.secoes.length) {
      box.appendChild(el('div', 'nada', 'Nada pedindo decisão nem ajuda agora. Boa reunião para olhar o que vem pela frente.'));
    }
    pauta.secoes.forEach(function (s, n) {
      var sec = el('div', 'sec');
      sec.appendChild(el('h3', null, (n + 1) + ') ' + s.titulo));
      var ul = el('ul');
      s.linhas.forEach(function (l) {
        var li = el('li');
        if (l.id) {
          var corte = l.texto.indexOf(' - ');
          var a = el('a', 'card', corte > 0 ? l.texto.slice(0, corte) : l.texto);
          a.addEventListener('click', function () { t.showCard(l.id); });
          li.appendChild(a);
          if (corte > 0) li.appendChild(document.createTextNode(l.texto.slice(corte)));
        } else {
          li.textContent = l.texto;
        }
        ul.appendChild(li);
      });
      if (s.resto) ul.appendChild(el('li', 'resto', '... e mais ' + s.resto));
      sec.appendChild(ul);
      box.appendChild(sec);
    });
    box.appendChild(el('div', 'rodape', 'Rascunho gerado só do Trello, pelas regras do PMO. Revise antes de usar. Nada é alterado nos cards.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return Promise.all([t.cards('all'), t.lists('id', 'name'), t.board('name', 'customFields')]).then(function (r) {
      pauta = M.montarPauta(r[0], { agora: new Date(), camposDef: r[2].customFields || [], listas: r[1] }, M.config, r[2].name);
      desenhar();
    }).catch(function (e) {
      document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
    });
  });

  document.getElementById('copiar').addEventListener('click', function () {
    if (pauta) copiar(pauta.texto);
  });
})();
